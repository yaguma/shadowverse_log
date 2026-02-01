import type { ApiResponse } from '../types';
import { logger } from '../utils/logger';

/**
 * 【機能概要】: Backend APIとの通信を行うHTTPクライアント
 * 【実装方針】: Fetch APIを使用してGET, POST, DELETEリクエストを送信し、統一的なエラーハンドリングを提供
 * 【テスト対応】: TC-API-001〜TC-API-006の全6ケースを通すための実装
 * 【改善内容】: タイムアウト(30秒)、リトライ機構(3回、指数バックオフ)、レスポンスキャッシュを追加
 * 【TASK-0040】: 認証トークンヘッダー付加機能を追加
 * 🔵 信頼性レベル: Backend API仕様とテストケース定義に基づいた実装
 */

// 【認証トークン取得関数】: TASK-0040 - 認証フロー実装 🔵
// 【設計理由】: AuthContextとの疎結合を維持するため、関数を注入する設計
type AuthTokenGetter = () => string | null;
let authTokenGetter: AuthTokenGetter | null = null;

/**
 * 【機能概要】: 認証トークン取得関数を設定
 * 【TASK-0040】: 認証フロー実装
 * @param getter - トークン取得関数（nullで解除）
 */
export function setAuthTokenGetter(getter: AuthTokenGetter | null): void {
  authTokenGetter = getter;
}

// 【環境変数設定】: APIのベースURLを環境変数から取得（デフォルト値あり） 🔵
// 【設定理由】: 開発環境と本番環境で異なるAPIエンドポイントを使用するため
// 【セキュリティ】: 本番環境ではHTTPS URLを環境変数で設定すること
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// 【定数定義】: タイムアウトとリトライ設定 🔵
const DEFAULT_TIMEOUT_MS = 30000; // 30秒
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000; // 1秒

// 【キャッシュ設定】: エンドポイントごとのキャッシュTTL（ミリ秒） 🔵
// デッキマスター: 1時間、統計データ: 5分、対戦履歴: キャッシュなし
// 【TASK-0004】: シーズン一覧エンドポイントを追加
const CACHE_TTL: Record<string, number> = {
  '/deck-masters': 60 * 60 * 1000, // 1時間
  '/my-decks': 60 * 60 * 1000, // 1時間
  '/statistics': 5 * 60 * 1000, // 5分
  '/statistics/seasons': 5 * 60 * 1000, // 5分（シーズン一覧）
};

// 【キャッシュストア】: メモリ内キャッシュ 🔵
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const cache = new Map<string, CacheEntry<unknown>>();

/**
 * 【ヘルパー関数】: キャッシュからデータを取得
 * @param key - キャッシュキー
 * @param ttl - キャッシュの有効期限（ミリ秒）
 * @returns キャッシュデータまたはnull
 */
function getFromCache<T>(key: string, ttl: number): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < ttl) {
    return entry.data as T;
  }
  cache.delete(key);
  return null;
}

/**
 * 【ヘルパー関数】: キャッシュにデータを保存
 * @param key - キャッシュキー
 * @param data - キャッシュするデータ
 */
function setToCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * 【ヘルパー関数】: キャッシュをクリア
 * @param prefix - クリアするキャッシュキーのプレフィックス（省略時は全てクリア）
 */
export function clearCache(prefix?: string): void {
  if (prefix) {
    for (const key of cache.keys()) {
      if (key.startsWith(prefix)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
}

/**
 * 【ヘルパー関数】: タイムアウト付きfetch 🔵
 * @param url - リクエストURL
 * @param options - fetchオプション
 * @param timeoutMs - タイムアウト時間（ミリ秒）
 * @returns Promise<Response>
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 【ヘルパー関数】: 指数バックオフで待機 🔵
 * @param attempt - 現在の試行回数（0ベース）
 * @returns Promise<void>
 */
async function exponentialBackoff(attempt: number): Promise<void> {
  const delay = INITIAL_RETRY_DELAY_MS * 2 ** attempt;
  await new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * 【ヘルパー関数】: リトライ可能なエラーかどうかを判定 🔵
 * @param error - エラーオブジェクト
 * @param response - レスポンスオブジェクト（存在する場合）
 * @returns boolean
 */
function isRetryableError(error: unknown, response?: Response): boolean {
  // AbortError（タイムアウト）はリトライ対象
  if (error instanceof Error && error.name === 'AbortError') {
    return true;
  }
  // ネットワークエラーはリトライ対象
  if (error instanceof TypeError) {
    return true;
  }
  // 5xxサーバーエラーはリトライ対象
  if (response && response.status >= 500) {
    return true;
  }
  return false;
}

/**
 * 【ヘルパー関数】: エラーオブジェクトから適切なエラーメッセージを抽出
 * 【再利用性】: API ClientとZustand Storeの両方で使用可能
 * 【単一責任】: エラーメッセージの正規化のみを担当
 * 【改善理由】: error instanceof Error ? error.message : 'Unknown error' パターンの重複を削減
 * 🔵 信頼性レベル: TypeScript型システムとベストプラクティスに基づく
 *
 * @param error - 捕捉されたエラーオブジェクト（unknown型）
 * @param defaultMessage - エラーが不明な場合のデフォルトメッセージ
 * @returns エラーメッセージ文字列
 */
export function extractErrorMessage(error: unknown, defaultMessage = 'Unknown error'): string {
  // 【型ガード】: Error型かどうかを判定し、安全にメッセージを取得
  if (error instanceof Error) {
    return error.message;
  }

  // 【フォールバック】: Error型でない場合はデフォルトメッセージを返す
  // 【ケース例】: throw 'string error' や throw { code: 123 } など
  return defaultMessage;
}

/**
 * API Clientクラス
 * 【機能概要】: Backend APIへのHTTPリクエストを統一的に処理
 * 【実装方針】: シンプルなクラス設計で、メソッドごとにHTTPメソッドを分離
 * 【追加機能】: タイムアウト(30秒)、リトライ機構(3回、指数バックオフ)、レスポンスキャッシュ
 * 🔵 信頼性レベル: 要件定義書のAPI Client仕様に準拠
 */
class ApiClient {
  /**
   * 【機能概要】: 共通のHTTPリクエスト処理（リトライ機構付き）
   * 【実装方針】: fetch APIを使用し、レスポンスをApiResponse<T>型にパース
   * 【エラーハンドリング】: ネットワークエラー、APIエラー、サーバーエラーを適切に処理
   * 【リトライ】: ネットワークエラー、タイムアウト、5xxエラー時に最大3回リトライ
   * 【テスト対応】: TC-API-001, TC-API-004, TC-API-005, TC-API-006を通すための実装
   * 🔵 信頼性レベル: テストケース定義に基づいた実装
   *
   * @param endpoint - APIエンドポイント（例: /battle-logs）
   * @param options - fetchのオプション（method, body, headersなど）
   * @returns Promise<T> - レスポンスデータ（ApiResponse<T>のdataフィールド）
   * @throws Error - ネットワークエラー、APIエラー、サーバーエラー時
   */
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        // 【認証トークン取得】: TASK-0040 - 認証フロー実装 🔵
        // 【設計理由】: authTokenGetterが設定されている場合のみトークンを取得
        const token = authTokenGetter ? authTokenGetter() : null;

        // 【リクエスト送信】: タイムアウト付きfetchでリクエストを送信 🔵
        // 【ヘッダー設定】: Content-Typeをapplication/jsonに設定
        // 【認証ヘッダー】: トークンがある場合はCF-Access-JWT-Assertionヘッダーを付加
        const response = await fetchWithTimeout(
          `${API_BASE_URL}${endpoint}`,
          {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'CF-Access-JWT-Assertion': token } : {}),
              ...options?.headers,
            },
          },
          DEFAULT_TIMEOUT_MS
        );

        // 【レスポンス解析】: JSONとしてレスポンスをパース 🔵
        const data: ApiResponse<T> = await response.json();

        // 【エラーチェック】: レスポンスのokフラグとsuccessフラグを確認 🔵
        // 【TC-API-004, TC-API-006対応】: APIエラー時は適切なエラーメッセージを投げる
        if (!response.ok || !data.success) {
          // 【リトライ判定】: 5xxエラーの場合はリトライ 🔵
          if (isRetryableError(null, response) && attempt < MAX_RETRIES - 1) {
            await exponentialBackoff(attempt);
            continue;
          }
          // 【エラーメッセージ抽出】: Backend APIから返されたエラーメッセージを使用 🔵
          throw new Error(data.error?.message || 'API request failed');
        }

        // 【正常レスポンス返却】: dataフィールドを返す 🔵
        // 【TC-API-001, TC-API-002, TC-API-003対応】: 正常時はdataフィールドを返す
        return data.data as T;
      } catch (error) {
        lastError = error;

        // 【リトライ判定】: リトライ可能なエラーかつ最終試行でない場合はリトライ 🔵
        if (isRetryableError(error) && attempt < MAX_RETRIES - 1) {
          logger.warn(
            `API request failed (attempt ${attempt + 1}/${MAX_RETRIES}), retrying...`,
            error
          );
          await exponentialBackoff(attempt);
          continue;
        }

        // 【エラーハンドリング】: fetchのエラー（ネットワークエラー等）を捕捉 🔵
        // 【TC-API-005対応】: ネットワークエラー時は適切なエラーを投げる
        // 【デバッグ用】: エラー内容をコンソールに出力（開発環境のみ）
        logger.error('API Error:', error);

        // 【エラー再スロー】: エラーをそのまま投げて呼び出し元に伝える 🔵
        throw error;
      }
    }

    // 【フォールバック】: 全リトライ失敗後は最後のエラーをスロー 🔵
    throw lastError;
  }

  /**
   * 【機能概要】: GETリクエストを送信（キャッシュ機能付き）
   * 【実装方針】: キャッシュ対象のエンドポイントはキャッシュを優先、それ以外はrequestメソッドを呼び出す
   * 【キャッシュ】: デッキマスター(1時間)、統計データ(5分)、対戦履歴(キャッシュなし)
   * 【テスト対応】: TC-API-001を通すための実装
   * 🔵 信頼性レベル: テストケース定義に基づいた実装
   *
   * @param endpoint - APIエンドポイント（例: /battle-logs）
   * @returns Promise<T> - レスポンスデータ
   */
  async get<T>(endpoint: string): Promise<T> {
    // 【キャッシュ確認】: キャッシュTTLが設定されているエンドポイントはキャッシュを確認 🔵
    const ttl = CACHE_TTL[endpoint];
    if (ttl) {
      const cachedData = getFromCache<T>(endpoint, ttl);
      if (cachedData !== null) {
        return cachedData;
      }
    }

    // 【GETリクエスト実行】: requestメソッドにendpointのみを渡す 🔵
    // 【HTTPメソッド】: デフォルトでGETメソッドが使用される
    const result = await this.request<T>(endpoint);

    // 【キャッシュ保存】: キャッシュTTLが設定されているエンドポイントはキャッシュに保存 🔵
    if (ttl) {
      setToCache(endpoint, result);
    }

    return result;
  }

  /**
   * 【機能概要】: POSTリクエストを送信
   * 【実装方針】: requestメソッドを呼び出し、HTTPメソッドをPOSTに指定、bodyをJSON化
   * 【テスト対応】: TC-API-002を通すための実装
   * 🔵 信頼性レベル: テストケース定義に基づいた実装
   *
   * @param endpoint - APIエンドポイント（例: /battle-logs）
   * @param body - リクエストボディ（JSON化される）
   * @returns Promise<T> - レスポンスデータ
   */
  async post<T>(endpoint: string, body: unknown): Promise<T> {
    // 【POSTリクエスト実行】: requestメソッドにmethod: 'POST'とbodyを渡す 🔵
    // 【ボディJSON化】: JSON.stringify()でボディをJSON形式に変換
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * 【機能概要】: PUTリクエストを送信
   * 【実装方針】: requestメソッドを呼び出し、HTTPメソッドをPUTに指定、bodyをJSON化
   * 【TASK-0004】: デッキ種別更新用にPUTメソッドを追加
   * 🔵 信頼性レベル: 既存POSTメソッドパターンに基づいた実装
   *
   * @param endpoint - APIエンドポイント（例: /deck-masters/:id）
   * @param body - リクエストボディ（JSON化される）
   * @returns Promise<T> - レスポンスデータ
   */
  async put<T>(endpoint: string, body: unknown): Promise<T> {
    // 【PUTリクエスト実行】: requestメソッドにmethod: 'PUT'とbodyを渡す 🔵
    // 【ボディJSON化】: JSON.stringify()でボディをJSON形式に変換
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  /**
   * 【機能概要】: DELETEリクエストを送信
   * 【実装方針】: requestメソッドを呼び出し、HTTPメソッドをDELETEに指定
   * 【テスト対応】: TC-API-003を通すための実装
   * 🔵 信頼性レベル: テストケース定義に基づいた実装
   *
   * @param endpoint - APIエンドポイント（例: /battle-logs/:id）
   * @returns Promise<T> - レスポンスデータ
   */
  async del<T>(endpoint: string): Promise<T> {
    // 【DELETEリクエスト実行】: requestメソッドにmethod: 'DELETE'を渡す 🔵
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

// 【インスタンス作成】: ApiClientのシングルトンインスタンスをエクスポート 🔵
// 【使用方法】: import { apiClient } from './client'; で使用可能
export const apiClient = new ApiClient();

import type { ApiResponse } from '../types';

/**
 * 【機能概要】: Backend APIとの通信を行うHTTPクライアント
 * 【実装方針】: Fetch APIを使用してGET, POST, DELETEリクエストを送信し、統一的なエラーハンドリングを提供
 * 【テスト対応】: TC-API-001〜TC-API-006の全6ケースを通すための実装
 * 【改善内容】: エラーメッセージ抽出ロジックを共通化し、DRY原則を適用
 * 🔵 信頼性レベル: Backend API仕様とテストケース定義に基づいた実装
 */

// 【環境変数設定】: APIのベースURLを環境変数から取得（デフォルト値あり） 🔵
// 【設定理由】: 開発環境と本番環境で異なるAPIエンドポイントを使用するため
// 【セキュリティ】: 本番環境ではHTTPS URLを環境変数で設定すること
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7071/api';

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
 * 🔵 信頼性レベル: 要件定義書のAPI Client仕様に準拠
 */
class ApiClient {
  /**
   * 【機能概要】: 共通のHTTPリクエスト処理
   * 【実装方針】: fetch APIを使用し、レスポンスをApiResponse<T>型にパース
   * 【エラーハンドリング】: ネットワークエラー、APIエラー、サーバーエラーを適切に処理
   * 【テスト対応】: TC-API-001, TC-API-004, TC-API-005, TC-API-006を通すための実装
   * 🔵 信頼性レベル: テストケース定義に基づいた実装
   *
   * @param endpoint - APIエンドポイント（例: /battle-logs）
   * @param options - fetchのオプション（method, body, headersなど）
   * @returns Promise<T> - レスポンスデータ（ApiResponse<T>のdataフィールド）
   * @throws Error - ネットワークエラー、APIエラー、サーバーエラー時
   */
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      // 【リクエスト送信】: API_BASE_URL + endpointにリクエストを送信 🔵
      // 【ヘッダー設定】: Content-Typeをapplication/jsonに設定
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      // 【レスポンス解析】: JSONとしてレスポンスをパース 🔵
      const data: ApiResponse<T> = await response.json();

      // 【エラーチェック】: レスポンスのokフラグとsuccessフラグを確認 🔵
      // 【TC-API-004, TC-API-006対応】: APIエラー時は適切なエラーメッセージを投げる
      if (!response.ok || !data.success) {
        // 【エラーメッセージ抽出】: Backend APIから返されたエラーメッセージを使用 🔵
        throw new Error(data.error?.message || 'API request failed');
      }

      // 【正常レスポンス返却】: dataフィールドを返す 🔵
      // 【TC-API-001, TC-API-002, TC-API-003対応】: 正常時はdataフィールドを返す
      return data.data as T;
    } catch (error) {
      // 【エラーハンドリング】: fetchのエラー（ネットワークエラー等）を捕捉 🔵
      // 【TC-API-005対応】: ネットワークエラー時は適切なエラーを投げる
      // 【デバッグ用】: エラー内容をコンソールに出力
      console.error('API Error:', error);

      // 【エラー再スロー】: エラーをそのまま投げて呼び出し元に伝える 🔵
      throw error;
    }
  }

  /**
   * 【機能概要】: GETリクエストを送信
   * 【実装方針】: requestメソッドを呼び出し、HTTPメソッドを指定しない（デフォルトでGET）
   * 【テスト対応】: TC-API-001を通すための実装
   * 🔵 信頼性レベル: テストケース定義に基づいた実装
   *
   * @param endpoint - APIエンドポイント（例: /battle-logs）
   * @returns Promise<T> - レスポンスデータ
   */
  async get<T>(endpoint: string): Promise<T> {
    // 【GETリクエスト実行】: requestメソッドにendpointのみを渡す 🔵
    // 【HTTPメソッド】: デフォルトでGETメソッドが使用される
    return this.request<T>(endpoint);
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

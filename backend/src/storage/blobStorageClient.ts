/**
 * BlobStorageClient - Azure Blob Storage アクセスクライアント
 *
 * 【機能概要】: Azure Blob Storage への読み書きを抽象化し、JSON形式のデータファイルを
 * 安全・確実に操作するクライアントクラス
 *
 * 【実装方針】: TDD Greenフェーズとして、テストを通すために必要最小限の機能を実装
 * リファクタリングは次のフェーズで実施
 *
 * 【テスト対応】: backend/tests/storage/blobStorageClient.test.ts の11件のテストケースを通す
 * - TC-001〜006: 正常系（コンストラクタ、読み込み、保存）
 * - TC-101〜104: 異常系（エラーハンドリング）
 * - TC-201: 境界値（空配列）
 *
 * 🔵 信頼性レベル: 青信号（REQ-602, EDGE-001, EDGE-002 より）
 */

import { BlobServiceClient, type ContainerClient } from '@azure/storage-blob';
import type { BattleLog, DeckMaster, MyDeck } from '../types';

/**
 * 【クラス定義】: BlobStorageClient
 * 【責務】: Azure Blob Storage へのデータアクセスを抽象化
 * 【設計パターン】: リポジトリパターンの基盤クラス
 * 🔵 信頼性レベル: 青信号（architecture.md Lines 205-234 より）
 */
export class BlobStorageClient {
  // 【プライベートフィールド】: ContainerClient インスタンス
  // 【用途】: Blob Storage のコンテナへのアクセスを管理
  // 🔵 信頼性レベル: 青信号
  private containerClient: ContainerClient;

  // 【リトライ設定】: 最大リトライ回数
  // 【理由】: EDGE-001, EDGE-002 要件に従い、ネットワークエラー時に3回リトライ
  // 🔵 信頼性レベル: 青信号（EDGE-001, EDGE-002 より）
  private maxRetries = 3;

  // 【リトライ設定】: 初回リトライまでの待機時間（ミリ秒）
  // 【理由】: 指数バックオフの基準値として使用（1秒 → 2秒 → 4秒）
  // 🔵 信頼性レベル: 青信号（EDGE-001 より）
  private retryDelayMs = 1000;

  /**
   * 【コンストラクタ】: BlobStorageClient インスタンスを初期化
   *
   * 【機能概要】: Azure Storage の接続文字列とコンテナ名を受け取り、
   * BlobServiceClient と ContainerClient を初期化する
   *
   * 【実装方針】: 最小限の初期化処理のみ実装。エラーハンドリングは Azure SDK に委譲
   *
   * 【テスト対応】: TC-001（コンストラクタの正常動作）を通すための実装
   *
   * 🔵 信頼性レベル: 青信号（REQ-602 より）
   *
   * @param connectionString - Azure Storage 接続文字列
   * @param containerName - Blob コンテナ名
   */
  constructor(connectionString: string, containerName: string) {
    // 【初期化処理】: BlobServiceClient を接続文字列から生成
    // 【エラー処理】: 不正な接続文字列の場合は SDK が例外をスロー（TC-101 対応）
    // 🔵 信頼性レベル: 青信号
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

    // 【コンテナクライアント取得】: 指定されたコンテナへのアクセスを確立
    // 【エラー処理】: 空文字列の場合は SDK が例外をスロー（TC-204 対応）
    // 🔵 信頼性レベル: 青信号
    this.containerClient = blobServiceClient.getContainerClient(containerName);
  }

  /**
   * 【パブリックメソッド】: 対戦履歴を取得
   *
   * 【機能概要】: Blob Storage から battle-logs.json を読み込み、BattleLog[] として返す
   *
   * 【実装方針】: readJsonFile() メソッドを使用してファイルを読み込む
   *
   * 【テスト対応】: TC-002（getBattleLogs の正常動作）、TC-201（空配列）を通すための実装
   *
   * 🔵 信頼性レベル: 青信号（REQ-602 より）
   *
   * @returns Promise<BattleLog[]> - 対戦履歴の配列
   */
  async getBattleLogs(): Promise<BattleLog[]> {
    // 【ファイル読み込み】: battle-logs.json を読み込んで BattleLog[] として返す
    // 【エラー処理】: ファイルが存在しない場合は readJsonFile() が例外をスロー（TC-102 対応）
    // 🔵 信頼性レベル: 青信号
    return this.readJsonFile<BattleLog[]>('battle-logs.json');
  }

  /**
   * 【パブリックメソッド】: デッキマスターデータを取得
   *
   * 【機能概要】: Blob Storage から deck-master.json を読み込み、DeckMaster[] として返す
   *
   * 【実装方針】: readJsonFile() メソッドを使用してファイルを読み込む
   *
   * 【テスト対応】: TC-003（getDeckMasters の正常動作）を通すための実装
   *
   * 🔵 信頼性レベル: 青信号（blob-storage-design.md Lines 116-131 より）
   *
   * @returns Promise<DeckMaster[]> - デッキマスターの配列
   */
  async getDeckMasters(): Promise<DeckMaster[]> {
    // 【ファイル読み込み】: deck-master.json を読み込んで DeckMaster[] として返す
    // 🔵 信頼性レベル: 青信号
    return this.readJsonFile<DeckMaster[]>('deck-master.json');
  }

  /**
   * 【パブリックメソッド】: マイデッキデータを取得
   *
   * 【機能概要】: Blob Storage から my-decks.json を読み込み、MyDeck[] として返す
   *
   * 【実装方針】: readJsonFile() メソッドを使用してファイルを読み込む
   *
   * 【テスト対応】: TC-004（getMyDecks の正常動作）を通すための実装
   *
   * 🔵 信頼性レベル: 青信号（blob-storage-design.md Lines 150-161 より）
   *
   * @returns Promise<MyDeck[]> - マイデッキの配列
   */
  async getMyDecks(): Promise<MyDeck[]> {
    // 【ファイル読み込み】: my-decks.json を読み込んで MyDeck[] として返す
    // 🔵 信頼性レベル: 青信号
    return this.readJsonFile<MyDeck[]>('my-decks.json');
  }

  /**
   * 【パブリックメソッド】: 対戦履歴を保存
   *
   * 【機能概要】: BattleLog[] を JSON 形式で Blob Storage に保存
   *
   * 【実装方針】: writeJsonFile() メソッドを使用してファイルを書き込む
   *
   * 【テスト対応】: TC-005（saveBattleLogs の正常動作）を通すための実装
   *
   * 🔵 信頼性レベル: 青信号（REQ-602 より）
   *
   * @param battleLogs - 保存する対戦履歴の配列
   * @returns Promise<void>
   */
  async saveBattleLogs(battleLogs: BattleLog[]): Promise<void> {
    // 【ファイル書き込み】: battleLogs を battle-logs.json に保存
    // 🔵 信頼性レベル: 青信号
    return this.writeJsonFile('battle-logs.json', battleLogs);
  }

  /**
   * 【パブリックメソッド】: マイデッキを保存
   *
   * 【機能概要】: MyDeck[] を JSON 形式で Blob Storage に保存
   *
   * 【実装方針】: writeJsonFile() メソッドを使用してファイルを書き込む
   *
   * 【テスト対応】: TC-006（saveMyDecks の正常動作）を通すための実装
   *
   * 🟡 信頼性レベル: 黄信号（blob-storage-design.md からの妥当な推測）
   *
   * @param myDecks - 保存するマイデッキの配列
   * @returns Promise<void>
   */
  async saveMyDecks(myDecks: MyDeck[]): Promise<void> {
    // 【ファイル書き込み】: myDecks を my-decks.json に保存
    // 🟡 信頼性レベル: 黄信号
    return this.writeJsonFile('my-decks.json', myDecks);
  }

  /**
   * 【プライベートメソッド】: JSON ファイルを読み込む（汎用）
   *
   * 【機能概要】: Blob Storage から指定されたファイルをダウンロードし、JSON としてパースして返す
   *
   * 【実装方針】: リトライ機構を実装（3回、指数バックオフ）。エラー時は詳細なメッセージを返す
   *
   * 【テスト対応】:
   * - TC-002, TC-003, TC-004: 正常な読み込み
   * - TC-102: ファイルが存在しない場合のエラー
   * - TC-103: ネットワークエラー時のリトライ
   * - TC-104: JSON パースエラー
   *
   * 🔵 信頼性レベル: 青信号（EDGE-001, EDGE-002 より）
   *
   * @param blobName - 読み込むファイル名（例: 'battle-logs.json'）
   * @returns Promise<T> - パースされた JSON データ
   */
  private async readJsonFile<T>(blobName: string): Promise<T> {
    // 【エラー保持】: リトライループで発生した最後のエラーを保持
    // 【理由】: 全リトライ失敗時に最後のエラーメッセージを返すため
    // 🔵 信頼性レベル: 青信号
    let lastError: Error | null = null;

    // 【リトライループ】: 最大3回リトライ（初回 + リトライ3回 = 計4回実行）
    // 【理由】: EDGE-001 要件に従い、一時的なネットワークエラーに対応
    // 🔵 信頼性レベル: 青信号（EDGE-001 より）
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        // 【Blob クライアント取得】: 指定されたファイルの Blob クライアントを取得
        // 🔵 信頼性レベル: 青信号
        const blobClient = this.containerClient.getBlobClient(blobName);

        // 【ファイルダウンロード】: Blob Storage からファイルをダウンロード
        // 【エラーケース】: ファイルが存在しない場合は BlobNotFoundError がスロー（TC-102 対応）
        // 🔵 信頼性レベル: 青信号
        const downloadResponse = await blobClient.download();

        // 【ストリーム確認】: ダウンロードしたストリームが存在するか確認
        // 【エラーケース】: ストリームが null の場合はエラーをスロー
        // 🟡 信頼性レベル: 黄信号（SDK の動作からの妥当な推測）
        if (!downloadResponse.readableStreamBody) {
          throw new Error(`Failed to download blob: ${blobName}`);
        }

        // 【ストリームを文字列に変換】: ReadableStream を文字列に変換
        // 🔵 信頼性レベル: 青信号
        const content = await this.streamToString(downloadResponse.readableStreamBody);

        // 【JSON パース】: 文字列を JSON としてパース
        // 【エラーケース】: 不正な JSON の場合は SyntaxError がスロー（TC-104 対応）
        // 🔵 信頼性レベル: 青信号
        return JSON.parse(content) as T;
      } catch (error) {
        // 【エラー保持】: 発生したエラーを保持
        lastError = error as Error;

        // 【エラーログ】: リトライ回数とエラー内容をコンソールに出力
        // 【理由】: デバッグとトラブルシューティングのため
        // 🔵 信頼性レベル: 青信号
        console.error(`Attempt ${attempt + 1} failed for ${blobName}:`, error);

        // 【リトライ判定】: 最終試行でない場合は待機してリトライ
        // 【理由】: EDGE-001 要件に従い、指数バックオフでリトライ
        // 🔵 信頼性レベル: 青信号（EDGE-001 より）
        if (attempt < this.maxRetries - 1) {
          // 【指数バックオフ】: リトライ回数に応じて待機時間を増加（1秒 → 2秒 → 4秒）
          // 【計算式】: delay = retryDelayMs * 2^attempt
          // 🔵 信頼性レベル: 青信号（EDGE-001 より）
          const delay = this.retryDelayMs * 2 ** attempt;
          await this.sleep(delay);
        }
      }
    }

    // 【最終エラー】: 全リトライが失敗した場合、詳細なエラーメッセージをスロー
    // 【エラーメッセージ】: ファイル名、リトライ回数、元のエラーメッセージを含む
    // 🔵 信頼性レベル: 青信号（EDGE-001, EDGE-002 より）
    throw new Error(
      `Failed to read ${blobName} after ${this.maxRetries} attempts: ${lastError?.message}`
    );
  }

  /**
   * 【プライベートメソッド】: JSON ファイルを書き込む（汎用）
   *
   * 【機能概要】: データを JSON 形式にシリアライズし、Blob Storage にアップロード
   *
   * 【実装方針】: リトライ機構を実装（3回、指数バックオフ）。Content-Type を application/json に設定
   *
   * 【テスト対応】:
   * - TC-005, TC-006: 正常な書き込み
   * - TC-201: 空配列の書き込み
   *
   * 🔵 信頼性レベル: 青信号（REQ-602, EDGE-001 より）
   *
   * @param blobName - 書き込むファイル名（例: 'battle-logs.json'）
   * @param data - 書き込むデータ
   * @returns Promise<void>
   */
  private async writeJsonFile<T>(blobName: string, data: T): Promise<void> {
    // 【エラー保持】: リトライループで発生した最後のエラーを保持
    // 🔵 信頼性レベル: 青信号
    let lastError: Error | null = null;

    // 【リトライループ】: 最大3回リトライ
    // 🔵 信頼性レベル: 青信号（EDGE-001 より）
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        // 【Block Blob クライアント取得】: 書き込み用の Block Blob クライアントを取得
        // 🔵 信頼性レベル: 青信号
        const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

        // 【JSON シリアライズ】: データを整形された JSON 文字列に変換
        // 【フォーマット】: インデント2スペースで整形（可読性のため）
        // 🔵 信頼性レベル: 青信号（REQ-602 より）
        const content = JSON.stringify(data, null, 2);

        // 【ファイルアップロード】: JSON 文字列を Blob Storage にアップロード
        // 【Content-Type 設定】: application/json を設定（REQ-602 要件）
        // 🔵 信頼性レベル: 青信号（REQ-602 より）
        await blockBlobClient.upload(content, content.length, {
          blobHTTPHeaders: { blobContentType: 'application/json' },
        });

        // 【正常終了】: アップロード成功時は return
        // 🔵 信頼性レベル: 青信号
        return;
      } catch (error) {
        // 【エラー保持】: 発生したエラーを保持
        lastError = error as Error;

        // 【エラーログ】: リトライ回数とエラー内容をコンソールに出力
        // 🔵 信頼性レベル: 青信号
        console.error(`Attempt ${attempt + 1} failed for ${blobName}:`, error);

        // 【リトライ判定】: 最終試行でない場合は待機してリトライ
        // 🔵 信頼性レベル: 青信号（EDGE-001 より）
        if (attempt < this.maxRetries - 1) {
          // 【指数バックオフ】: リトライ回数に応じて待機時間を増加
          // 🔵 信頼性レベル: 青信号（EDGE-001 より）
          const delay = this.retryDelayMs * 2 ** attempt;
          await this.sleep(delay);
        }
      }
    }

    // 【最終エラー】: 全リトライが失敗した場合、詳細なエラーメッセージをスロー
    // 🔵 信頼性レベル: 青信号（EDGE-001, EDGE-002 より）
    throw new Error(
      `Failed to write ${blobName} after ${this.maxRetries} attempts: ${lastError?.message}`
    );
  }

  /**
   * 【プライベートメソッド】: ReadableStream を文字列に変換
   *
   * 【機能概要】: Node.js の ReadableStream を文字列に変換する
   *
   * 【実装方針】: ストリームのチャンクを結合し、UTF-8 文字列として返す
   *
   * 【テスト対応】: TC-002, TC-003, TC-004 で間接的にテストされる
   *
   * 🔵 信頼性レベル: 青信号（標準的な Node.js ストリーム処理）
   *
   * @param readableStream - Node.js ReadableStream
   * @returns Promise<string> - 変換された文字列
   */
  private async streamToString(readableStream: NodeJS.ReadableStream): Promise<string> {
    // 【Promise による非同期処理】: ストリームの読み込みを Promise でラップ
    // 🔵 信頼性レベル: 青信号
    return new Promise((resolve, reject) => {
      // 【チャンク配列】: ストリームから受け取ったデータの断片を保持
      // 🔵 信頼性レベル: 青信号
      const chunks: Buffer[] = [];

      // 【data イベント】: ストリームからデータを受信するたびに実行
      // 【処理内容】: 受信したチャンクを Buffer に変換して配列に追加
      // 🔵 信頼性レベル: 青信号
      readableStream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));

      // 【end イベント】: ストリームの読み込みが完了したときに実行
      // 【処理内容】: すべてのチャンクを結合し、UTF-8 文字列として resolve
      // 🔵 信頼性レベル: 青信号
      readableStream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));

      // 【error イベント】: ストリームの読み込み中にエラーが発生した場合に実行
      // 【処理内容】: エラーを reject
      // 🔵 信頼性レベル: 青信号
      readableStream.on('error', reject);
    });
  }

  /**
   * 【プライベートメソッド】: 指定ミリ秒待機
   *
   * 【機能概要】: 指定されたミリ秒だけ処理を待機する
   *
   * 【実装方針】: setTimeout を Promise でラップして async/await 対応
   *
   * 【テスト対応】: TC-103 で間接的にテストされる（リトライ時の待機）
   *
   * 🔵 信頼性レベル: 青信号（標準的な非同期待機処理）
   *
   * @param ms - 待機時間（ミリ秒）
   * @returns Promise<void>
   */
  private sleep(ms: number): Promise<void> {
    // 【非同期待機】: setTimeout を Promise でラップ
    // 🔵 信頼性レベル: 青信号
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

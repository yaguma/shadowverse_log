/**
 * DeckMasterService - デッキマスタービジネスロジックサービス
 *
 * Blob Storageからデッキマスター情報を取得し、キャッシュ機能とソート機能を提供します。
 *
 * @remarks
 * このサービスは以下の主要機能を提供します:
 * - デッキマスター一覧の取得（昇順/降順ソート対応）
 * - キャッシュによるパフォーマンス最適化（TTL: 5分）
 * - キャッシュの手動クリア機能
 *
 * @example
 * ```typescript
 * const blobClient = new BlobStorageClient(connectionString, containerName);
 * const service = new DeckMasterService(blobClient);
 *
 * // デッキマスター一覧取得（昇順）
 * const decksAsc = await service.getDeckMasters('asc');
 *
 * // デッキマスター一覧取得（降順）
 * const decksDesc = await service.getDeckMasters('desc');
 *
 * // キャッシュをクリアして最新データを取得
 * service.clearCache();
 * const freshDecks = await service.getDeckMasters();
 * ```
 */

import type { BlobStorageClient } from '../storage/blobStorageClient';
import type { DeckMaster } from '../types';

/**
 * DeckMasterService クラス
 *
 * デッキマスターの取得・キャッシュ管理を担当するサービスクラス。
 * Blob Storageからのデータ取得を最小限に抑えるためのキャッシュ機構を実装しています。
 *
 * @remarks
 * キャッシュのライフサイクル:
 * 1. 初回呼び出し時: Blob Storageから取得 → キャッシュに保存
 * 2. キャッシュ有効期間内: キャッシュから取得（Blob Storage呼び出しなし）
 * 3. キャッシュ期限切れ: Blob Storageから再取得 → キャッシュ更新
 * 4. clearCache()呼び出し: キャッシュを破棄 → 次回は再取得
 */
export class DeckMasterService {
  /**
   * キャッシュオブジェクト
   *
   * @remarks
   * - data: キャッシュされたデッキマスターデータ（未ソート状態）
   * - timestamp: キャッシュ作成時のタイムスタンプ（Date.now()のミリ秒）
   * - null: キャッシュが存在しない状態（初期状態またはクリア後）
   *
   * @private
   */
  private cache: { data: DeckMaster[]; timestamp: number } | null = null;

  /**
   * キャッシュの有効期限（TTL: Time To Live）
   *
   * @remarks
   * - デフォルト: 5分（300,000ミリ秒）
   * - キャッシュ作成からこの時間が経過すると、次回取得時に再取得される
   * - デッキマスターデータは頻繁に変更されないため、5分間のキャッシュが適切
   *
   * @default 300000
   * @private
   */
  private readonly cacheTTL = 5 * 60 * 1000; // 5分

  /**
   * コンストラクタ
   *
   * @param blobClient - BlobStorageClient インスタンス（デッキマスターデータの取得元）
   *
   * @example
   * ```typescript
   * const blobClient = new BlobStorageClient(connectionString, containerName);
   * const service = new DeckMasterService(blobClient);
   * ```
   */
  constructor(private readonly blobClient: BlobStorageClient) {}

  /**
   * デッキマスター一覧を取得（キャッシュ付き）
   *
   * @remarks
   * 【機能概要】:
   * - キャッシュが有効な場合はキャッシュから取得し、無効な場合はBlob Storageから取得します
   * - 取得したデータは指定されたソート順で返却されます
   *
   * 【キャッシュ戦略】:
   * - キャッシュヒット: キャッシュ作成から5分以内 → キャッシュから取得（高速）
   * - キャッシュミス: キャッシュが存在しないまたは期限切れ → Blob Storageから取得
   *
   * 【パフォーマンス】:
   * - キャッシュヒット時: O(n log n) - ソート処理のみ
   * - キャッシュミス時: O(n log n) + Blob Storage I/O
   *
   * 【エラーハンドリング】:
   * - Blob Storage接続エラー時は、エラーをそのまま上位層に伝播します
   * - キャッシュが無効な場合でも、エラーは発生しません（null チェックで対応）
   *
   * @param sortOrder - ソート順（'asc': 昇順、'desc': 降順）デフォルト: 'asc'
   * @returns ソート済みのデッキマスター一覧（Promise）
   * @throws Error - Blob Storage接続エラー時
   *
   * @example
   * ```typescript
   * // 昇順で取得（sortOrderフィールドの昇順）
   * const decksAsc = await service.getDeckMasters('asc');
   * // => [{ sortOrder: 1, ... }, { sortOrder: 2, ... }, ...]
   *
   * // 降順で取得（sortOrderフィールドの降順）
   * const decksDesc = await service.getDeckMasters('desc');
   * // => [{ sortOrder: 3, ... }, { sortOrder: 2, ... }, ...]
   *
   * // デフォルト（昇順）
   * const decks = await service.getDeckMasters();
   * ```
   */
  async getDeckMasters(sortOrder: 'asc' | 'desc' = 'asc'): Promise<readonly DeckMaster[]> {
    const now = Date.now();

    // 【キャッシュチェック】: キャッシュが存在し、有効期限内かを確認
    if (this.cache && now - this.cache.timestamp < this.cacheTTL) {
      // 【キャッシュヒット】: キャッシュからソートして返却（Blob Storage呼び出しなし）
      return this.sortDeckMasters(this.cache.data, sortOrder);
    }

    // 【キャッシュミス】: Blob Storageから取得
    const deckMasters = await this.blobClient.getDeckMasters();

    // 【キャッシュ更新】: 取得したデータをキャッシュに保存
    this.cache = {
      data: deckMasters,
      timestamp: now,
    };

    // 【ソートして返却】: 指定されたソート順で返却
    return this.sortDeckMasters(deckMasters, sortOrder);
  }

  /**
   * デッキマスターをソート
   *
   * @remarks
   * 【ソートアルゴリズム】:
   * - Array.prototype.sort()による安定ソート
   * - sortOrderフィールドの数値を基準にソート
   * - 元の配列は変更せず、新しいソート済み配列を返却（不変性の維持）
   *
   * 【計算量】:
   * - 時間計算量: O(n log n) - JavaScript の sort() は Timsort
   * - 空間計算量: O(n) - スプレッド演算子による配列コピー
   *
   * @param deckMasters - ソート対象のデッキマスター配列
   * @param sortOrder - ソート順（'asc': 昇順、'desc': 降順）
   * @returns ソートされたデッキマスター配列（元の配列は変更されない）
   * @private
   */
  private sortDeckMasters(
    deckMasters: DeckMaster[],
    sortOrder: 'asc' | 'desc'
  ): readonly DeckMaster[] {
    // 【不変性の維持】: スプレッド演算子で配列をコピーしてからソート
    return [...deckMasters].sort((a, b) => {
      // 【昇順ソート】: a.sortOrder - b.sortOrder
      if (sortOrder === 'asc') {
        return a.sortOrder - b.sortOrder;
      }
      // 【降順ソート】: b.sortOrder - a.sortOrder
      return b.sortOrder - a.sortOrder;
    });
  }

  /**
   * キャッシュをクリア
   *
   * @remarks
   * 【機能概要】:
   * - キャッシュをnullにリセットします
   * - 次回のgetDeckMasters()呼び出し時に、Blob Storageから再取得されます
   *
   * 【ユースケース】:
   * - デッキマスターデータが更新された直後に最新データを取得したい場合
   * - テストコードでキャッシュをリセットしたい場合
   * - メモリ使用量を削減したい場合（キャッシュの破棄）
   *
   * @example
   * ```typescript
   * // キャッシュをクリアして最新データを取得
   * service.clearCache();
   * const freshData = await service.getDeckMasters();
   *
   * // デッキマスター更新後のリフレッシュ
   * await updateDeckMasterInBlobStorage(...);
   * service.clearCache(); // 古いキャッシュを破棄
   * const updatedDecks = await service.getDeckMasters();
   * ```
   */
  clearCache(): void {
    this.cache = null;
  }
}

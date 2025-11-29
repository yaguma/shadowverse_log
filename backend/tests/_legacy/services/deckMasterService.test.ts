/**
 * DeckMasterService のテストスイート
 *
 * テストフレームワーク: Jest 29.7.0 + ts-jest
 * テスト対象: backend/src/services/deckMasterService.ts
 *
 * 🔵 テストケース定義書: docs/implements/shadowverse-battle-log/TASK-0009/shadowverse-battle-log-testcases.md
 * 🔵 要件定義書: docs/implements/shadowverse-battle-log/TASK-0009/shadowverse-battle-log-requirements.md
 */

import { DeckMasterService } from '../../src/services/deckMasterService';
import type { BlobStorageClient } from '../../src/storage/blobStorageClient';
import type { DeckMaster } from '../../src/types';

// BlobStorageClient のモック
jest.mock('../../src/storage/blobStorageClient');

describe('DeckMasterService', () => {
  let service: DeckMasterService;
  let mockBlobClient: jest.Mocked<BlobStorageClient>;

  // モックデータ
  const mockDeckMasters: DeckMaster[] = [
    { id: '1', className: 'ウィッチ', deckName: '土スペルウィッチ', sortOrder: 3 },
    { id: '2', className: 'ロイヤル', deckName: 'ミッドレンジロイヤル', sortOrder: 1 },
    { id: '3', className: 'ネクロマンサー', deckName: '進化ネクロ', sortOrder: 2 },
  ];

  // =============================================================================
  // テスト環境のセットアップとクリーンアップ
  // =============================================================================

  beforeEach(() => {
    // 【テスト前準備】: 各テスト実行前にモックをリセットし、一貫したテスト条件を保証
    // 【環境初期化】: 前のテストの影響を受けないよう、モックの状態をクリーンにリセット
    jest.clearAllMocks();

    // BlobStorageClient のモックインスタンスを作成
    mockBlobClient = {
      getDeckMasters: jest.fn(),
    } as unknown as jest.Mocked<BlobStorageClient>;

    // DeckMasterService インスタンスを作成（モックされた BlobStorageClient を使用）
    service = new DeckMasterService(mockBlobClient);
  });

  afterEach(() => {
    // 【テスト後処理】: テスト実行後にモックをクリーンアップ
    // 【状態復元】: 次のテストに影響しないよう、モックの状態を復元
    jest.restoreAllMocks();
  });

  // =============================================================================
  // 正常系テストケース（基本的な動作）
  // =============================================================================

  describe('getDeckMasters', () => {
    // TC-001: デッキマスター一覧取得（正常系）
    test('デッキマスター一覧が取得できる', async () => {
      // 【テスト目的】: getDeckMasters() メソッドが正常に動作することを確認
      // 【期待される動作】: BlobStorageClientからデータを取得し、デフォルトで昇順ソートされる
      // 🔵 信頼性レベル: 青信号（requirements.md AC-002、AC-005より）

      // 【テストデータ準備】: 3件のデッキマスター（順不同）
      mockBlobClient.getDeckMasters.mockResolvedValue(mockDeckMasters);

      // 【実際の処理実行】: getDeckMasters() を呼び出し
      const result = await service.getDeckMasters();

      // 【結果検証】: 取得とソートが正しく行われている
      expect(result).toBeDefined(); // 【確認内容】: 結果が返却される 🔵
      expect(result).toHaveLength(3); // 【確認内容】: 3件取得される 🔵
      expect(mockBlobClient.getDeckMasters).toHaveBeenCalledTimes(1); // 【確認内容】: BlobStorageClientが1回呼ばれる 🔵
      expect(result[0]?.sortOrder).toBe(1); // 【確認内容】: 昇順ソート（1番目） 🔵
      expect(result[1]?.sortOrder).toBe(2); // 【確認内容】: 昇順ソート（2番目） 🔵
      expect(result[2]?.sortOrder).toBe(3); // 【確認内容】: 昇順ソート（3番目） 🔵
    });

    // TC-002: ソート機能（昇順）
    test('sortOrder=ascでソートされる', async () => {
      // 【テスト目的】: 明示的に昇順ソートを指定した場合の動作を確認
      // 【期待される動作】: sortOrderフィールドの昇順にソートされる
      // 🔵 信頼性レベル: 青信号（requirements.md AC-003より）

      // 【テストデータ準備】: 順不同のデッキマスター
      mockBlobClient.getDeckMasters.mockResolvedValue(mockDeckMasters);

      // 【実際の処理実行】: 明示的に'asc'を指定
      const result = await service.getDeckMasters('asc');

      // 【結果検証】: 昇順にソートされている
      expect(result).toHaveLength(3); // 【確認内容】: 3件取得される 🔵
      expect(result[0]?.sortOrder).toBe(1); // 【確認内容】: 最小値が先頭 🔵
      expect(result[1]?.sortOrder).toBe(2); // 【確認内容】: 中間値が2番目 🔵
      expect(result[2]?.sortOrder).toBe(3); // 【確認内容】: 最大値が最後 🔵
      expect(result[0]?.id).toBe('2'); // 【確認内容】: ID順も正しい 🔵
      expect(result[1]?.id).toBe('3'); // 【確認内容】: ID順も正しい 🔵
      expect(result[2]?.id).toBe('1'); // 【確認内容】: ID順も正しい 🔵
    });

    // TC-003: ソート機能（降順）
    test('sortOrder=descでソートされる', async () => {
      // 【テスト目的】: 降順ソートの動作を確認
      // 【期待される動作】: sortOrderフィールドの降順にソートされる
      // 🔵 信頼性レベル: 青信号（requirements.md AC-004より）

      // 【テストデータ準備】: 順不同のデッキマスター
      mockBlobClient.getDeckMasters.mockResolvedValue(mockDeckMasters);

      // 【実際の処理実行】: 明示的に'desc'を指定
      const result = await service.getDeckMasters('desc');

      // 【結果検証】: 降順にソートされている
      expect(result).toHaveLength(3); // 【確認内容】: 3件取得される 🔵
      expect(result[0]?.sortOrder).toBe(3); // 【確認内容】: 最大値が先頭 🔵
      expect(result[1]?.sortOrder).toBe(2); // 【確認内容】: 中間値が2番目 🔵
      expect(result[2]?.sortOrder).toBe(1); // 【確認内容】: 最小値が最後 🔵
      expect(result[0]?.id).toBe('1'); // 【確認内容】: ID順も正しい 🔵
      expect(result[1]?.id).toBe('3'); // 【確認内容】: ID順も正しい 🔵
      expect(result[2]?.id).toBe('2'); // 【確認内容】: ID順も正しい 🔵
    });

    // TC-004: キャッシュ機構（ヒット）
    test('キャッシュが5分間有効', async () => {
      // 【テスト目的】: キャッシュ機構の動作を確認
      // 【期待される動作】: 5分以内の再取得時にBlobStorageClientが呼ばれない
      // 🔵 信頼性レベル: 青信号（requirements.md AC-006、AC-007より）

      // 【テストデータ準備】: 3件のデッキマスター
      mockBlobClient.getDeckMasters.mockResolvedValue(mockDeckMasters);

      // 【実際の処理実行】: 1回目の取得（キャッシュに保存）
      const result1 = await service.getDeckMasters();
      expect(mockBlobClient.getDeckMasters).toHaveBeenCalledTimes(1); // 【確認内容】: 1回目は呼ばれる 🔵

      // 【実際の処理実行】: 2回目の取得（キャッシュから取得）
      const result2 = await service.getDeckMasters();

      // 【結果検証】: キャッシュが使用されている
      expect(mockBlobClient.getDeckMasters).toHaveBeenCalledTimes(1); // 【確認内容】: 2回目は呼ばれない（キャッシュヒット） 🔵
      expect(result1).toEqual(result2); // 【確認内容】: 同じ結果が返される 🔵
      expect(result2).toHaveLength(3); // 【確認内容】: データが正しい 🔵
    });

    // TC-005: キャッシュクリア後の再取得
    test('キャッシュクリア後は再取得される', async () => {
      // 【テスト目的】: clearCache() メソッドの動作を確認
      // 【期待される動作】: キャッシュクリア後にBlobStorageClientから再取得される
      // 🔵 信頼性レベル: 青信号（requirements.md AC-008より）

      // 【テストデータ準備】: 3件のデッキマスター
      mockBlobClient.getDeckMasters.mockResolvedValue(mockDeckMasters);

      // 【実際の処理実行】: 1回目の取得（キャッシュに保存）
      const result1 = await service.getDeckMasters();
      expect(mockBlobClient.getDeckMasters).toHaveBeenCalledTimes(1); // 【確認内容】: 1回目は呼ばれる 🔵

      // 【実際の処理実行】: キャッシュクリア
      service.clearCache();

      // 【実際の処理実行】: 2回目の取得（再取得）
      const result2 = await service.getDeckMasters();

      // 【結果検証】: キャッシュがクリアされ、再取得されている
      expect(mockBlobClient.getDeckMasters).toHaveBeenCalledTimes(2); // 【確認内容】: 2回目も呼ばれる（キャッシュクリア後） 🔵
      expect(result1).toEqual(result2); // 【確認内容】: 同じデータが取得される 🔵
      expect(result2).toHaveLength(3); // 【確認内容】: データが正しい 🔵
    });

    // =============================================================================
    // 異常系テストケース（エラーハンドリング）
    // =============================================================================

    // TC-101: Blob Storage接続エラー（異常系）
    test('Blob Storage接続エラー時にエラーをスローする', async () => {
      // 【テスト目的】: エラーハンドリングの動作を確認
      // 【期待される動作】: BlobStorageClientのエラーが適切に伝播される
      // 🟡 信頼性レベル: 黄信号（一般的なエラーハンドリング要件から）

      // 【テストデータ準備】: Blob Storageエラー
      const storageError = new Error('Blob Storage connection failed');
      mockBlobClient.getDeckMasters.mockRejectedValue(storageError);

      // 【実際の処理実行 & 結果検証】: エラーがスローされる
      await expect(service.getDeckMasters()).rejects.toThrow('Blob Storage connection failed'); // 【確認内容】: エラーメッセージが一致 🔵
      expect(mockBlobClient.getDeckMasters).toHaveBeenCalledTimes(1); // 【確認内容】: BlobStorageClientが呼ばれる 🔵
    });
  });
});

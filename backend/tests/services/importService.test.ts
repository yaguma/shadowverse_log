/**
 * ImportService のテストスイート
 *
 * テストフレームワーク: Jest 29.7.0 + ts-jest
 * テスト対象: backend/src/services/importService.ts
 *
 * テストケース定義書: docs/implements/shadowverse-battle-log/TASK-0012/testcases.md
 * 要件定義書: docs/implements/shadowverse-battle-log/TASK-0012/requirements.md
 *
 * テストケース総数: 37件
 */

import { ImportService } from '../../src/services/importService';
import { BlobStorageClient } from '../../src/storage/blobStorageClient';
import type { BattleLog } from '../../src/types';

// BlobStorageClient のモック
jest.mock('../../src/storage/blobStorageClient');

describe('ImportService', () => {
  let service: ImportService;
  let mockBlobClient: jest.Mocked<BlobStorageClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    // BlobStorageClient のモックインスタンスを作成
    mockBlobClient = new BlobStorageClient('', '') as jest.Mocked<BlobStorageClient>;
    mockBlobClient.getBattleLogs = jest.fn().mockResolvedValue([]);
    mockBlobClient.saveBattleLogs = jest.fn().mockResolvedValue(undefined);

    // ImportService インスタンスを作成
    service = new ImportService(mockBlobClient);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // =============================================================================
  // 1. importFromJson - 正常系
  // =============================================================================

  describe('importFromJson - 正常系', () => {
    // TC-JSON-001: 正常なJSONインポート (単一データ)
    test('[TC-JSON-001] should import a single valid battle log from JSON', async () => {
      const existingLogs: BattleLog[] = [];
      mockBlobClient.getBattleLogs.mockResolvedValue(existingLogs);
      mockBlobClient.saveBattleLogs.mockResolvedValue();

      const jsonData = JSON.stringify([
        {
          date: '2025-01-24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AA',
          myDeckId: 'ロイヤル',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'ネクロ',
        },
      ]);

      const result = await service.importFromJson(jsonData);

      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(0);
      expect(mockBlobClient.saveBattleLogs).toHaveBeenCalledTimes(1);
    });

    // TC-JSON-002: 複数件のJSONインポート
    test('[TC-JSON-002] should import multiple battle logs from JSON', async () => {
      mockBlobClient.getBattleLogs.mockResolvedValue([]);

      const jsonData = JSON.stringify([
        {
          date: '2025-01-24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AA',
          myDeckId: 'ロイヤル',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'ネクロ',
        },
        {
          date: '2025-01-23',
          battleType: '対戦台',
          rank: '-',
          group: '-',
          myDeckId: 'ウィッチ',
          turn: '後攻',
          result: '負け',
          opponentDeckId: 'ドラゴン',
        },
        {
          date: '2025-01-22',
          battleType: 'ロビー大会',
          rank: '-',
          group: '-',
          myDeckId: 'ビショップ',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'ヴァンパイア',
        },
      ]);

      const result = await service.importFromJson(jsonData);

      expect(result.imported).toBe(3);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(0);
      expect(mockBlobClient.saveBattleLogs).toHaveBeenCalledTimes(1);
    });

    // TC-JSON-003: ID付きJSONインポート (既存ID指定)
    test('[TC-JSON-003] should import JSON with custom ID', async () => {
      mockBlobClient.getBattleLogs.mockResolvedValue([]);

      const jsonData = JSON.stringify([
        {
          id: 'log_custom_001',
          date: '2025-01-24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AA',
          myDeckId: 'ロイヤル',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'ネクロ',
        },
      ]);

      const result = await service.importFromJson(jsonData);

      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(0);

      const savedLogs = mockBlobClient.saveBattleLogs.mock.calls[0]?.[0];
      expect(savedLogs).toBeDefined();
      expect(savedLogs?.[0]?.id).toBe('log_custom_001');
    });

    // TC-JSON-004: 空配列のJSONインポート
    test('[TC-JSON-004] should handle empty JSON array without errors', async () => {
      mockBlobClient.getBattleLogs.mockResolvedValue([]);

      const jsonData = JSON.stringify([]);

      const result = await service.importFromJson(jsonData);

      expect(result.imported).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(0);
      expect(mockBlobClient.saveBattleLogs).not.toHaveBeenCalled();
    });

    // TC-JSON-005: すべてのランク・グループパターン
    test('[TC-JSON-005] should import all rank and group combinations', async () => {
      mockBlobClient.getBattleLogs.mockResolvedValue([]);

      const jsonData = JSON.stringify([
        {
          date: '2025-01-24',
          battleType: 'ランクマッチ',
          rank: 'サファイア',
          group: 'A',
          myDeckId: 'ロイヤル',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'ネクロ',
        },
        {
          date: '2025-01-24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AA',
          myDeckId: 'ロイヤル',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'ネクロ',
        },
        {
          date: '2025-01-24',
          battleType: 'ランクマッチ',
          rank: 'ルビー',
          group: 'AAA',
          myDeckId: 'ロイヤル',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'ネクロ',
        },
        {
          date: '2025-01-24',
          battleType: 'ランクマッチ',
          rank: 'トパーズ',
          group: 'Master',
          myDeckId: 'ロイヤル',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'ネクロ',
        },
        {
          date: '2025-01-24',
          battleType: '対戦台',
          rank: '-',
          group: '-',
          myDeckId: 'ロイヤル',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'ネクロ',
        },
      ]);

      const result = await service.importFromJson(jsonData);

      expect(result.imported).toBe(5);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(0);
    });
  });

  // =============================================================================
  // 2. importFromJson - 異常系
  // =============================================================================

  describe('importFromJson - 異常系', () => {
    // TC-JSON-ERR-001: 不正なJSON形式
    test('[TC-JSON-ERR-001] should throw error for invalid JSON format', async () => {
      const invalidJson = '{ invalid json }';

      await expect(service.importFromJson(invalidJson)).rejects.toThrow('無効なJSON形式です');
    });

    // TC-JSON-ERR-002: 配列でないJSON形式
    test('[TC-JSON-ERR-002] should throw error when JSON is not an array', async () => {
      const invalidJson = JSON.stringify({
        date: '2025-01-24',
        battleType: 'ランクマッチ',
      });

      await expect(service.importFromJson(invalidJson)).rejects.toThrow(
        'JSONデータは配列である必要があります'
      );
    });

    // TC-JSON-ERR-003: バリデーションエラー（未来日付）
    test('[TC-JSON-ERR-003] should detect future date validation error', async () => {
      mockBlobClient.getBattleLogs.mockResolvedValue([]);

      const jsonData = JSON.stringify([
        {
          date: '2026-12-31',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AA',
          myDeckId: 'ロイヤル',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'ネクロ',
        },
      ]);

      const result = await service.importFromJson(jsonData);

      expect(result.imported).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(1);
      expect(result.details.errorDetails).toContainEqual(
        expect.objectContaining({
          line: 1,
          field: 'date',
          error: '未来の日付は入力できません',
        })
      );
    });

    // TC-JSON-ERR-004: バリデーションエラー（不正な対戦タイプ）
    test('[TC-JSON-ERR-004] should detect invalid battle type', async () => {
      mockBlobClient.getBattleLogs.mockResolvedValue([]);

      const jsonData = JSON.stringify([
        {
          date: '2025-01-24',
          battleType: '不正な対戦タイプ',
          rank: 'ダイアモンド',
          group: 'AA',
          myDeckId: 'ロイヤル',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'ネクロ',
        },
      ]);

      const result = await service.importFromJson(jsonData);

      expect(result.imported).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(1);
      expect(result.details.errorDetails).toContainEqual(
        expect.objectContaining({
          line: 1,
          field: 'battleType',
        })
      );
    });

    // TC-JSON-ERR-005: バリデーションエラー（空文字列のデッキID）
    test('[TC-JSON-ERR-005] should detect empty deck ID', async () => {
      mockBlobClient.getBattleLogs.mockResolvedValue([]);

      const jsonData = JSON.stringify([
        {
          date: '2025-01-24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AA',
          myDeckId: '',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'ネクロ',
        },
      ]);

      const result = await service.importFromJson(jsonData);

      expect(result.imported).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(1);
      expect(result.details.errorDetails).toContainEqual(
        expect.objectContaining({
          line: 1,
          field: 'myDeckId',
        })
      );
    });

    // TC-JSON-ERR-006: 複数フィールドのバリデーションエラー
    test('[TC-JSON-ERR-006] should detect multiple field validation errors', async () => {
      mockBlobClient.getBattleLogs.mockResolvedValue([]);

      const jsonData = JSON.stringify([
        {
          date: '2026-12-31',
          battleType: '不正',
          rank: '不正',
          group: '不正',
          myDeckId: '',
          turn: '不正',
          result: '不正',
          opponentDeckId: '',
        },
      ]);

      const result = await service.importFromJson(jsonData);

      expect(result.imported).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(1);
      expect(result.details.errorDetails).toBeDefined();
      expect(result.details.errorDetails?.length).toBeGreaterThan(0);
    });
  });

  // =============================================================================
  // 3. importFromJson - 重複チェック
  // =============================================================================

  describe('importFromJson - 重複チェック', () => {
    // TC-JSON-DUP-001: 重複IDのスキップ（単一）
    test('[TC-JSON-DUP-001] should skip duplicate ID (single)', async () => {
      const existingLogs: BattleLog[] = [
        {
          id: 'log_existing_001',
          date: '2025/01/20',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AA',
          myDeckId: 'ロイヤル',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'ネクロ',
        },
      ];
      mockBlobClient.getBattleLogs.mockResolvedValue(existingLogs);

      const jsonData = JSON.stringify([
        {
          id: 'log_existing_001',
          date: '2025-01-24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AA',
          myDeckId: 'ロイヤル',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'ネクロ',
        },
      ]);

      const result = await service.importFromJson(jsonData);

      expect(result.imported).toBe(0);
      expect(result.skipped).toBe(1);
      expect(result.errors).toBe(0);
      expect(result.details.skippedIds).toContain('log_existing_001');
    });

    // TC-JSON-DUP-002: 重複IDのスキップ（複数）
    test('[TC-JSON-DUP-002] should skip multiple duplicate IDs', async () => {
      const existingLogs: BattleLog[] = [
        {
          id: 'log_001',
          date: '2025/01/20',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AA',
          myDeckId: 'ロイヤル',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'ネクロ',
        },
        {
          id: 'log_002',
          date: '2025/01/21',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AA',
          myDeckId: 'ロイヤル',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'ネクロ',
        },
      ];
      mockBlobClient.getBattleLogs.mockResolvedValue(existingLogs);

      const jsonData = JSON.stringify([
        {
          id: 'log_001',
          date: '2025-01-24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AA',
          myDeckId: 'ロイヤル',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'ネクロ',
        },
        {
          id: 'log_002',
          date: '2025-01-24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AA',
          myDeckId: 'ロイヤル',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'ネクロ',
        },
      ]);

      const result = await service.importFromJson(jsonData);

      expect(result.imported).toBe(0);
      expect(result.skipped).toBe(2);
      expect(result.errors).toBe(0);
      expect(result.details.skippedIds).toEqual(expect.arrayContaining(['log_001', 'log_002']));
    });

    // TC-JSON-DUP-003: 一部重複、一部正常
    test('[TC-JSON-DUP-003] should import valid logs and skip duplicates', async () => {
      const existingLogs: BattleLog[] = [
        {
          id: 'log_001',
          date: '2025/01/20',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AA',
          myDeckId: 'ロイヤル',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'ネクロ',
        },
      ];
      mockBlobClient.getBattleLogs.mockResolvedValue(existingLogs);

      const jsonData = JSON.stringify([
        {
          id: 'log_001',
          date: '2025-01-24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AA',
          myDeckId: 'ロイヤル',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'ネクロ',
        },
        {
          id: 'log_new_001',
          date: '2025-01-24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AA',
          myDeckId: 'ウィッチ',
          turn: '後攻',
          result: '負け',
          opponentDeckId: 'ドラゴン',
        },
      ]);

      const result = await service.importFromJson(jsonData);

      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(1);
      expect(result.errors).toBe(0);
      expect(result.details.skippedIds).toContain('log_001');
    });
  });

  // =============================================================================
  // 4. importFromCsv - 正常系
  // =============================================================================

  describe('importFromCsv - 正常系', () => {
    // TC-CSV-001: 正常なCSVインポート (単一データ)
    test('[TC-CSV-001] should import a single valid battle log from CSV', async () => {
      mockBlobClient.getBattleLogs.mockResolvedValue([]);

      const csvData =
        'date,battleType,rank,group,myDeckId,turn,result,opponentDeckId\n2025-01-24,ランクマッチ,ダイアモンド,AA,ロイヤル,先攻,勝ち,ネクロ';

      const result = await service.importFromCsv(csvData);

      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(0);
    });

    // TC-CSV-002: 複数行のCSVインポート
    test('[TC-CSV-002] should import multiple rows from CSV', async () => {
      mockBlobClient.getBattleLogs.mockResolvedValue([]);

      const csvData =
        'date,battleType,rank,group,myDeckId,turn,result,opponentDeckId\n' +
        '2025-01-24,ランクマッチ,ダイアモンド,AA,ロイヤル,先攻,勝ち,ネクロ\n' +
        '2025-01-23,対戦台,-,-,ウィッチ,後攻,負け,ドラゴン\n' +
        '2025-01-22,ロビー大会,-,-,ビショップ,先攻,勝ち,ヴァンパイア';

      const result = await service.importFromCsv(csvData);

      expect(result.imported).toBe(3);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(0);
    });

    // TC-CSV-003: ヘッダーのみのCSV（データ行なし）
    test('[TC-CSV-003] should handle CSV with header only', async () => {
      mockBlobClient.getBattleLogs.mockResolvedValue([]);

      const csvData = 'date,battleType,rank,group,myDeckId,turn,result,opponentDeckId';

      const result = await service.importFromCsv(csvData);

      expect(result.imported).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(0);
    });

    // TC-CSV-004: ヘッダー順序が異なるCSV
    test('[TC-CSV-004] should import CSV with different header order', async () => {
      mockBlobClient.getBattleLogs.mockResolvedValue([]);

      const csvData =
        'battleType,date,myDeckId,opponentDeckId,rank,group,turn,result\n' +
        'ランクマッチ,2025-01-24,ロイヤル,ネクロ,ダイアモンド,AA,先攻,勝ち';

      const result = await service.importFromCsv(csvData);

      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(0);
    });

    // TC-CSV-005: IDカラムを含むCSV
    test('[TC-CSV-005] should import CSV with ID column', async () => {
      mockBlobClient.getBattleLogs.mockResolvedValue([]);

      const csvData =
        'id,date,battleType,rank,group,myDeckId,turn,result,opponentDeckId\n' +
        'log_custom_001,2025-01-24,ランクマッチ,ダイアモンド,AA,ロイヤル,先攻,勝ち,ネクロ';

      const result = await service.importFromCsv(csvData);

      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(0);

      const savedLogs = mockBlobClient.saveBattleLogs.mock.calls[0]?.[0];
      expect(savedLogs).toBeDefined();
      expect(savedLogs?.[0]?.id).toBe('log_custom_001');
    });
  });

  // =============================================================================
  // 5. importFromCsv - 異常系
  // =============================================================================

  describe('importFromCsv - 異常系', () => {
    // TC-CSV-ERR-001: 空のCSVデータ
    test('[TC-CSV-ERR-001] should throw error for empty CSV', async () => {
      const emptyCsv = '';

      await expect(service.importFromCsv(emptyCsv)).rejects.toThrow('CSVデータが空です');
    });

    // TC-CSV-ERR-002: 必須ヘッダー不足
    test('[TC-CSV-ERR-002] should throw error for missing required headers', async () => {
      const csvData = 'date,battleType,rank\n2025-01-24,ランクマッチ,ダイアモンド';

      await expect(service.importFromCsv(csvData)).rejects.toThrow('必須ヘッダーが不足しています');
    });

    // TC-CSV-ERR-003: カラム数不一致
    test('[TC-CSV-ERR-003] should detect column count mismatch', async () => {
      mockBlobClient.getBattleLogs.mockResolvedValue([]);

      const csvData =
        'date,battleType,rank,group,myDeckId,turn,result,opponentDeckId\n' +
        '2025-01-24,ランクマッチ,ダイアモンド';

      const result = await service.importFromCsv(csvData);

      expect(result.imported).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(1);
      expect(result.details.errorDetails).toContainEqual(
        expect.objectContaining({
          line: 2,
          field: 'columns',
        })
      );
    });

    // TC-CSV-ERR-004: バリデーションエラー（未来日付）
    test('[TC-CSV-ERR-004] should detect future date in CSV', async () => {
      mockBlobClient.getBattleLogs.mockResolvedValue([]);

      const csvData =
        'date,battleType,rank,group,myDeckId,turn,result,opponentDeckId\n' +
        '2026-12-31,ランクマッチ,ダイアモンド,AA,ロイヤル,先攻,勝ち,ネクロ';

      const result = await service.importFromCsv(csvData);

      expect(result.imported).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(1);
      expect(result.details.errorDetails).toContainEqual(
        expect.objectContaining({
          line: 2,
          field: 'date',
          error: '未来の日付は入力できません',
        })
      );
    });

    // TC-CSV-ERR-005: 複数行のバリデーションエラー
    test('[TC-CSV-ERR-005] should detect validation errors in multiple rows', async () => {
      mockBlobClient.getBattleLogs.mockResolvedValue([]);

      const csvData =
        'date,battleType,rank,group,myDeckId,turn,result,opponentDeckId\n' +
        '2026-12-31,ランクマッチ,ダイアモンド,AA,ロイヤル,先攻,勝ち,ネクロ\n' +
        '2025-01-24,不正な対戦タイプ,ダイアモンド,AA,ロイヤル,先攻,勝ち,ネクロ\n' +
        '2025-01-23,ランクマッチ,ダイアモンド,AA,,先攻,勝ち,ネクロ';

      const result = await service.importFromCsv(csvData);

      expect(result.imported).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(3);
      expect(result.details.errorDetails).toBeDefined();
      expect(result.details.errorDetails?.length).toBe(3);
    });
  });

  // =============================================================================
  // 6. 重複チェック（CSV）
  // =============================================================================

  describe('importFromCsv - 重複チェック', () => {
    // TC-CSV-DUP-001: CSV重複IDのスキップ
    test('[TC-CSV-DUP-001] should skip duplicate ID in CSV', async () => {
      const existingLogs: BattleLog[] = [
        {
          id: 'log_001',
          date: '2025/01/20',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AA',
          myDeckId: 'ロイヤル',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'ネクロ',
        },
      ];
      mockBlobClient.getBattleLogs.mockResolvedValue(existingLogs);

      const csvData =
        'id,date,battleType,rank,group,myDeckId,turn,result,opponentDeckId\n' +
        'log_001,2025-01-24,ランクマッチ,ダイアモンド,AA,ロイヤル,先攻,勝ち,ネクロ';

      const result = await service.importFromCsv(csvData);

      expect(result.imported).toBe(0);
      expect(result.skipped).toBe(1);
      expect(result.errors).toBe(0);
      expect(result.details.skippedIds).toContain('log_001');
    });
  });

  // =============================================================================
  // 7. 複合エラーケース
  // =============================================================================

  describe('複合エラーケース', () => {
    // TC-MIX-001: 重複ID + バリデーションエラー + 正常データ
    test('[TC-MIX-001] should handle mixed duplicate, error, and valid data in JSON', async () => {
      const existingLogs: BattleLog[] = [
        {
          id: 'log_001',
          date: '2025/01/20',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AA',
          myDeckId: 'ロイヤル',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'ネクロ',
        },
      ];
      mockBlobClient.getBattleLogs.mockResolvedValue(existingLogs);

      const jsonData = JSON.stringify([
        {
          id: 'log_001',
          date: '2025-01-24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AA',
          myDeckId: 'ロイヤル',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'ネクロ',
        },
        {
          date: '2026-12-31',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AA',
          myDeckId: 'ウィッチ',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'ドラゴン',
        },
        {
          date: '2025-01-23',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AA',
          myDeckId: 'ビショップ',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'ヴァンパイア',
        },
      ]);

      const result = await service.importFromJson(jsonData);

      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(1);
      expect(result.errors).toBe(1);
      expect(result.details.skippedIds).toContain('log_001');
      expect(result.details.errorDetails).toBeDefined();
    });

    // TC-MIX-002: CSV複合エラー
    test('[TC-MIX-002] should handle mixed errors in CSV', async () => {
      const existingLogs: BattleLog[] = [
        {
          id: 'log_001',
          date: '2025/01/20',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AA',
          myDeckId: 'ロイヤル',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'ネクロ',
        },
      ];
      mockBlobClient.getBattleLogs.mockResolvedValue(existingLogs);

      const csvData =
        'id,date,battleType,rank,group,myDeckId,turn,result,opponentDeckId\n' +
        'log_001,2025-01-24,ランクマッチ,ダイアモンド,AA,ロイヤル,先攻,勝ち,ネクロ\n' +
        'log_002,2026-12-31,ランクマッチ,ダイアモンド,AA,ウィッチ,先攻,勝ち,ドラゴン\n' +
        'log_003,2025-01-23,ランクマッチ,ダイアモンド,AA,ビショップ,先攻,勝ち,ヴァンパイア';

      const result = await service.importFromCsv(csvData);

      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(1);
      expect(result.errors).toBe(1);
      expect(result.details.skippedIds).toContain('log_001');
      expect(result.details.errorDetails).toContainEqual(
        expect.objectContaining({
          line: 3,
          field: 'date',
        })
      );
    });
  });

  // =============================================================================
  // 8. パフォーマンステスト
  // =============================================================================

  describe('パフォーマンステスト', () => {
    // TC-PERF-001: 100件のデータインポート
    test('[TC-PERF-001] should import 100 records within 2000ms', async () => {
      mockBlobClient.getBattleLogs.mockResolvedValue([]);

      const logs = Array.from({ length: 100 }, () => ({
        date: '2025-01-24',
        battleType: 'ランクマッチ',
        rank: 'ダイアモンド',
        group: 'AA',
        myDeckId: 'ロイヤル',
        turn: '先攻',
        result: '勝ち',
        opponentDeckId: 'ネクロ',
      }));

      const jsonData = JSON.stringify(logs);

      const startTime = Date.now();
      const result = await service.importFromJson(jsonData);
      const endTime = Date.now();

      expect(result.imported).toBe(100);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(0);
      expect(endTime - startTime).toBeLessThan(2000);
    }, 3000);

    // TC-PERF-002: 1000件のデータインポート
    test('[TC-PERF-002] should import 1000 records without timeout', async () => {
      mockBlobClient.getBattleLogs.mockResolvedValue([]);

      const logs = Array.from({ length: 1000 }, () => ({
        date: '2025-01-24',
        battleType: 'ランクマッチ',
        rank: 'ダイアモンド',
        group: 'AA',
        myDeckId: 'ロイヤル',
        turn: '先攻',
        result: '勝ち',
        opponentDeckId: 'ネクロ',
      }));

      const jsonData = JSON.stringify(logs);

      const result = await service.importFromJson(jsonData);

      expect(result.imported).toBe(1000);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(0);
    }, 10000);
  });

  // =============================================================================
  // 9. Blob Storageエラー
  // =============================================================================

  describe('Blob Storageエラー', () => {
    // TC-STORAGE-001: Blob Storage接続エラー
    test('[TC-STORAGE-001] should handle Blob Storage connection error', async () => {
      mockBlobClient.getBattleLogs.mockRejectedValue(new Error('Connection failed'));

      const jsonData = JSON.stringify([
        {
          date: '2025-01-24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AA',
          myDeckId: 'ロイヤル',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'ネクロ',
        },
      ]);

      await expect(service.importFromJson(jsonData)).rejects.toThrow(
        'Blob Storageへの接続に失敗しました'
      );
    });

    // TC-STORAGE-002: Blob Storage保存エラー
    test('[TC-STORAGE-002] should handle Blob Storage save error', async () => {
      mockBlobClient.getBattleLogs.mockResolvedValue([]);
      mockBlobClient.saveBattleLogs.mockRejectedValue(new Error('Save failed'));

      const jsonData = JSON.stringify([
        {
          date: '2025-01-24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AA',
          myDeckId: 'ロイヤル',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'ネクロ',
        },
      ]);

      await expect(service.importFromJson(jsonData)).rejects.toThrow(
        '対戦履歴の保存に失敗しました'
      );
    });
  });
});

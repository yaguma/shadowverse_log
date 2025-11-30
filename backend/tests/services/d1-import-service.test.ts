/**
 * D1ImportService テスト
 * TASK-0031: インポートAPI実装
 *
 * @description D1データベースを使用したインポートサービスのテスト
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { D1ImportService } from '../../src/services/d1-import-service';
import type { Database } from '../../src/db';

describe('D1ImportService', () => {
  let service: D1ImportService;
  let mockDb: Database;

  beforeEach(() => {
    mockDb = {} as unknown as Database;
    service = new D1ImportService(mockDb);
  });

  // ===========================================
  // TC-013: 正常系: JSON形式のデータをインポートできる
  // ===========================================
  describe('TC-013: 正常系: JSON形式のデータをインポートできる', () => {
    it('有効なJSON（3件）をインポートしてimported: 3, skipped: 0を返す', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoNothing: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'log_1' }]),
          }),
        }),
      });
      mockDb = {
        insert: mockInsert,
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as unknown as Database;
      service = new D1ImportService(mockDb);

      const jsonData = JSON.stringify([
        {
          date: '2025-01-24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_001',
        },
        {
          date: '2025-01-24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '後攻',
          result: '負け',
          opponentDeckId: 'deck_master_002',
        },
        {
          date: '2025-01-25',
          battleType: '対戦台',
          rank: '-',
          group: '-',
          myDeckId: 'deck_002',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_003',
        },
      ]);

      const result = await service.importFromJson(jsonData);

      expect(result.imported).toBe(3);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(0);
    });
  });

  // ===========================================
  // TC-014: 正常系: 重複IDはスキップされる
  // ===========================================
  describe('TC-014: 正常系: 重複IDはスキップされる', () => {
    it('重複IDを含むJSONでimported: 2, skipped: 1を返す', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoNothing: vi.fn().mockReturnValue({
            returning: vi
              .fn()
              .mockResolvedValueOnce([{ id: 'log_1' }])
              .mockResolvedValueOnce([]) // 重複でスキップ
              .mockResolvedValueOnce([{ id: 'log_3' }]),
          }),
        }),
      });
      mockDb = {
        insert: mockInsert,
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ id: 'existing_id' }]),
          }),
        }),
      } as unknown as Database;
      service = new D1ImportService(mockDb);

      const jsonData = JSON.stringify([
        {
          id: 'log_1',
          date: '2025-01-24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_001',
        },
        {
          id: 'existing_id', // 既存ID
          date: '2025-01-24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '後攻',
          result: '負け',
          opponentDeckId: 'deck_master_002',
        },
        {
          id: 'log_3',
          date: '2025-01-25',
          battleType: '対戦台',
          rank: '-',
          group: '-',
          myDeckId: 'deck_002',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_003',
        },
      ]);

      const result = await service.importFromJson(jsonData);

      expect(result.imported).toBe(2);
      expect(result.skipped).toBe(1);
    });
  });

  // ===========================================
  // TC-015: 正常系: IDなしのレコードは自動生成される
  // ===========================================
  describe('TC-015: 正常系: IDなしのレコードは自動生成される', () => {
    it('ID省略のJSONでIDが自動生成されてインポートされる', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoNothing: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'auto_generated_id' }]),
          }),
        }),
      });
      mockDb = {
        insert: mockInsert,
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as unknown as Database;
      service = new D1ImportService(mockDb);

      const jsonData = JSON.stringify([
        {
          date: '2025-01-24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_001',
        },
      ]);

      const result = await service.importFromJson(jsonData);

      expect(result.imported).toBe(1);
    });
  });

  // ===========================================
  // TC-016: 異常系: バリデーションエラーのレコードはカウントされる
  // ===========================================
  describe('TC-016: 異常系: バリデーションエラーのレコードはカウントされる', () => {
    it('不正データ含むJSONでerrors > 0を返す', async () => {
      mockDb = {
        insert: vi.fn(),
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as unknown as Database;
      service = new D1ImportService(mockDb);

      const jsonData = JSON.stringify([
        {
          date: '2025-01-24',
          battleType: '不正な対戦タイプ', // 不正値
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_001',
        },
      ]);

      const result = await service.importFromJson(jsonData);

      expect(result.errors).toBeGreaterThan(0);
    });
  });

  // ===========================================
  // TC-017: 正常系: 空配列でも成功
  // ===========================================
  describe('TC-017: 正常系: 空配列でも成功', () => {
    it('空配列でimported: 0, skipped: 0を返す', async () => {
      mockDb = {
        insert: vi.fn(),
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as unknown as Database;
      service = new D1ImportService(mockDb);

      const jsonData = '[]';

      const result = await service.importFromJson(jsonData);

      expect(result.imported).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(0);
    });
  });

  // ===========================================
  // TC-018: 正常系: CSV形式のデータをインポートできる
  // ===========================================
  describe('TC-018: 正常系: CSV形式のデータをインポートできる', () => {
    it('有効なCSV（3件）をインポートしてimported: 3, skipped: 0を返す', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoNothing: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'log_1' }]),
          }),
        }),
      });
      mockDb = {
        insert: mockInsert,
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as unknown as Database;
      service = new D1ImportService(mockDb);

      const csvData = `date,battleType,rank,group,myDeckId,turn,result,opponentDeckId
2025-01-24,ランクマッチ,ダイアモンド,AAA,deck_001,先攻,勝ち,deck_master_001
2025-01-24,ランクマッチ,ダイアモンド,AAA,deck_001,後攻,負け,deck_master_002
2025-01-25,対戦台,-,-,deck_002,先攻,勝ち,deck_master_003`;

      const result = await service.importFromCsv(csvData);

      expect(result.imported).toBe(3);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(0);
    });
  });

  // ===========================================
  // TC-019: 正常系: CSV重複IDはスキップされる
  // ===========================================
  describe('TC-019: 正常系: CSV重複IDはスキップされる', () => {
    it('重複IDを含むCSVでimported: 2, skipped: 1を返す', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoNothing: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'log_1' }]),
          }),
        }),
      });
      mockDb = {
        insert: mockInsert,
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ id: 'existing_id' }]),
          }),
        }),
      } as unknown as Database;
      service = new D1ImportService(mockDb);

      const csvData = `id,date,battleType,rank,group,myDeckId,turn,result,opponentDeckId
log_1,2025-01-24,ランクマッチ,ダイアモンド,AAA,deck_001,先攻,勝ち,deck_master_001
existing_id,2025-01-24,ランクマッチ,ダイアモンド,AAA,deck_001,後攻,負け,deck_master_002
log_3,2025-01-25,対戦台,-,-,deck_002,先攻,勝ち,deck_master_003`;

      const result = await service.importFromCsv(csvData);

      expect(result.imported).toBe(2);
      expect(result.skipped).toBe(1);
    });
  });

  // ===========================================
  // TC-020: 異常系: CSVバリデーションエラーのレコードはカウントされる
  // ===========================================
  describe('TC-020: 異常系: CSVバリデーションエラーのレコードはカウントされる', () => {
    it('未来日付含むCSVでerrors > 0を返す', async () => {
      mockDb = {
        insert: vi.fn(),
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as unknown as Database;
      service = new D1ImportService(mockDb);

      const futureDate = '2099-12-31';
      const csvData = `date,battleType,rank,group,myDeckId,turn,result,opponentDeckId
${futureDate},ランクマッチ,ダイアモンド,AAA,deck_001,先攻,勝ち,deck_master_001`;

      const result = await service.importFromCsv(csvData);

      expect(result.errors).toBeGreaterThan(0);
    });
  });

  // ===========================================
  // TC-021: 異常系: 未来日付はエラー
  // ===========================================
  describe('TC-021: 異常系: 未来日付はエラー', () => {
    it('未来の日付でエラー詳細に日付エラーが含まれる', async () => {
      mockDb = {
        insert: vi.fn(),
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as unknown as Database;
      service = new D1ImportService(mockDb);

      const futureDate = '2099-12-31';
      const jsonData = JSON.stringify([
        {
          date: futureDate,
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_001',
        },
      ]);

      const result = await service.importFromJson(jsonData);

      expect(result.errors).toBe(1);
      expect(result.details?.errorDetails).toBeDefined();
      expect(result.details?.errorDetails?.[0].field).toBe('date');
    });
  });

  // ===========================================
  // TC-022: 異常系: 不正な対戦タイプはエラー
  // ===========================================
  describe('TC-022: 異常系: 不正な対戦タイプはエラー', () => {
    it('不正な対戦タイプでエラー詳細に対戦タイプエラーが含まれる', async () => {
      mockDb = {
        insert: vi.fn(),
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as unknown as Database;
      service = new D1ImportService(mockDb);

      const jsonData = JSON.stringify([
        {
          date: '2025-01-24',
          battleType: '不正な対戦タイプ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_001',
        },
      ]);

      const result = await service.importFromJson(jsonData);

      expect(result.errors).toBe(1);
      expect(result.details?.errorDetails).toBeDefined();
      expect(result.details?.errorDetails?.[0].field).toBe('battleType');
    });
  });

  // ===========================================
  // TC-023: 異常系: 必須フィールド未入力はエラー
  // ===========================================
  describe('TC-023: 異常系: 必須フィールド未入力はエラー', () => {
    it('myDeckId省略でエラー詳細に必須エラーが含まれる', async () => {
      mockDb = {
        insert: vi.fn(),
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as unknown as Database;
      service = new D1ImportService(mockDb);

      const jsonData = JSON.stringify([
        {
          date: '2025-01-24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          // myDeckId省略
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_001',
        },
      ]);

      const result = await service.importFromJson(jsonData);

      expect(result.errors).toBe(1);
      expect(result.details?.errorDetails).toBeDefined();
      expect(result.details?.errorDetails?.[0].field).toBe('myDeckId');
    });
  });

  // ===========================================
  // TC-024: 異常系: 日付形式不正はエラー
  // ===========================================
  describe('TC-024: 異常系: 日付形式不正はエラー', () => {
    it('日付形式不正でエラー詳細に日付形式エラーが含まれる', async () => {
      mockDb = {
        insert: vi.fn(),
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as unknown as Database;
      service = new D1ImportService(mockDb);

      const jsonData = JSON.stringify([
        {
          date: '2025/01/24', // 不正な形式
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_001',
        },
      ]);

      const result = await service.importFromJson(jsonData);

      expect(result.errors).toBe(1);
      expect(result.details?.errorDetails).toBeDefined();
      expect(result.details?.errorDetails?.[0].field).toBe('date');
    });
  });
});

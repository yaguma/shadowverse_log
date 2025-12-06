/**
 * TASK-0025-3: マイグレーションスクリプトのテスト
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DatabaseContext } from '../../src/db';
import {
  type JsonDataSource,
  type MigrationOptions,
  migrateJsonToD1,
} from '../../src/migration/migrate-json-to-d1';
import type { LegacyBattleLog, LegacyDeckMaster, LegacyMyDeck } from '../../src/migration/schema-mapping';

describe('migrateJsonToD1', () => {
  // モックリポジトリ
  const createMockRepositories = () => ({
    deckMaster: {
      create: vi.fn().mockResolvedValue({ id: 'created-deck' }),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    battleLogs: {
      create: vi.fn().mockResolvedValue({ id: 'created-battle' }),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    myDecks: {
      create: vi.fn().mockResolvedValue({ id: 'created-mydeck' }),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  });

  let mockContext: DatabaseContext;
  let mockRepositories: ReturnType<typeof createMockRepositories>;

  beforeEach(() => {
    mockRepositories = createMockRepositories();
    mockContext = {
      db: {} as DatabaseContext['db'],
      repositories: mockRepositories as unknown as DatabaseContext['repositories'],
    };
  });

  const sampleDeckMaster: LegacyDeckMaster[] = [
    { id: '1', className: 'ウィッチ', deckName: '土スペルウィッチ', sortOrder: 1 },
    { id: '2', className: 'ロイヤル', deckName: 'ミッドレンジロイヤル', sortOrder: 2 },
  ];

  const sampleBattleLogs: LegacyBattleLog[] = [
    {
      id: '1',
      date: '2025/08/07',
      battleType: 'ランクマッチ',
      rank: 'サファイア',
      group: 'A',
      myDeckId: '1',
      turn: '後攻',
      result: 'WIN',
      opponentDeckId: '3',
    },
  ];

  const sampleMyDecks: LegacyMyDeck[] = [
    {
      id: '1',
      deckId: '1',
      deckCode: '3.1.3.1.3.1',
      deckName: '秘術オデンスペル',
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  describe('successful migration', () => {
    it('should migrate deck_master data in dry run mode', async () => {
      const dataSource: JsonDataSource = {
        localData: {
          deckMaster: sampleDeckMaster,
          battleLogs: [],
          myDecks: [],
        },
      };

      const options: MigrationOptions = {
        dryRun: true,
        onProgress: vi.fn(),
      };

      const result = await migrateJsonToD1(mockContext, dataSource, options);

      expect(result.deckMaster.imported).toBe(2);
      expect(result.deckMaster.skipped).toBe(0);
      expect(result.deckMaster.errors).toHaveLength(0);
      // ドライランなのでcreateは呼ばれない
      expect(mockRepositories.deckMaster.create).not.toHaveBeenCalled();
    });

    it('should migrate deck_master data in normal mode', async () => {
      const dataSource: JsonDataSource = {
        localData: {
          deckMaster: sampleDeckMaster,
          battleLogs: [],
          myDecks: [],
        },
      };

      const options: MigrationOptions = {
        dryRun: false,
        onProgress: vi.fn(),
      };

      const result = await migrateJsonToD1(mockContext, dataSource, options);

      expect(result.deckMaster.imported).toBe(2);
      expect(mockRepositories.deckMaster.create).toHaveBeenCalledTimes(2);
    });

    it('should migrate battle_logs data', async () => {
      const dataSource: JsonDataSource = {
        localData: {
          deckMaster: [],
          battleLogs: sampleBattleLogs,
          myDecks: [],
        },
      };

      const options: MigrationOptions = {
        dryRun: true,
        onProgress: vi.fn(),
      };

      const result = await migrateJsonToD1(mockContext, dataSource, options);

      expect(result.battleLogs.imported).toBe(1);
      expect(result.battleLogs.skipped).toBe(0);
    });

    it('should migrate my_decks data', async () => {
      const dataSource: JsonDataSource = {
        localData: {
          deckMaster: [],
          battleLogs: [],
          myDecks: sampleMyDecks,
        },
      };

      const options: MigrationOptions = {
        dryRun: true,
        onProgress: vi.fn(),
      };

      const result = await migrateJsonToD1(mockContext, dataSource, options);

      expect(result.myDecks.imported).toBe(1);
      expect(result.myDecks.skipped).toBe(0);
    });

    it('should migrate all data types together', async () => {
      const dataSource: JsonDataSource = {
        localData: {
          deckMaster: sampleDeckMaster,
          battleLogs: sampleBattleLogs,
          myDecks: sampleMyDecks,
        },
      };

      const options: MigrationOptions = {
        dryRun: true,
        onProgress: vi.fn(),
      };

      const result = await migrateJsonToD1(mockContext, dataSource, options);

      expect(result.deckMaster.imported).toBe(2);
      expect(result.battleLogs.imported).toBe(1);
      expect(result.myDecks.imported).toBe(1);
      expect(result.totalTime).toBeGreaterThanOrEqual(0);
      expect(result.completedAt).toBeTruthy();
    });

    it('should use provided userId for user-specific tables', async () => {
      const dataSource: JsonDataSource = {
        localData: {
          deckMaster: [],
          battleLogs: sampleBattleLogs,
          myDecks: sampleMyDecks,
        },
      };

      const options: MigrationOptions = {
        dryRun: false,
        userId: 'test-user-123',
        onProgress: vi.fn(),
      };

      await migrateJsonToD1(mockContext, dataSource, options);

      // battleLogsのcreateが呼ばれた時の引数を検証
      expect(mockRepositories.battleLogs.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'test-user-123' })
      );
      expect(mockRepositories.myDecks.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'test-user-123' })
      );
    });
  });

  describe('error handling', () => {
    it('should skip invalid deck_master data', async () => {
      const invalidData = [
        { id: '1' }, // missing required fields
        { id: 123, className: 'test', deckName: 'test', sortOrder: 1 }, // wrong type
      ];

      const dataSource: JsonDataSource = {
        localData: {
          deckMaster: invalidData as unknown as LegacyDeckMaster[],
          battleLogs: [],
          myDecks: [],
        },
      };

      const options: MigrationOptions = {
        dryRun: true,
        onProgress: vi.fn(),
      };

      const result = await migrateJsonToD1(mockContext, dataSource, options);

      expect(result.deckMaster.imported).toBe(0);
      expect(result.deckMaster.skipped).toBe(2);
      expect(result.deckMaster.errors).toHaveLength(2);
    });

    it('should skip invalid battle_logs data', async () => {
      const invalidData = [
        { id: '1' }, // missing required fields
      ];

      const dataSource: JsonDataSource = {
        localData: {
          deckMaster: [],
          battleLogs: invalidData as unknown as LegacyBattleLog[],
          myDecks: [],
        },
      };

      const options: MigrationOptions = {
        dryRun: true,
        onProgress: vi.fn(),
      };

      const result = await migrateJsonToD1(mockContext, dataSource, options);

      expect(result.battleLogs.imported).toBe(0);
      expect(result.battleLogs.skipped).toBe(1);
      expect(result.battleLogs.errors).toHaveLength(1);
    });

    it('should handle repository create errors gracefully', async () => {
      mockRepositories.deckMaster.create.mockRejectedValueOnce(
        new Error('Database error')
      );

      const dataSource: JsonDataSource = {
        localData: {
          deckMaster: sampleDeckMaster,
          battleLogs: [],
          myDecks: [],
        },
      };

      const options: MigrationOptions = {
        dryRun: false,
        onProgress: vi.fn(),
      };

      const result = await migrateJsonToD1(mockContext, dataSource, options);

      // 最初のレコードはエラー、2番目は成功
      expect(result.deckMaster.imported).toBe(1);
      expect(result.deckMaster.skipped).toBe(1);
      expect(result.deckMaster.errors).toHaveLength(1);
      expect(result.deckMaster.errors[0]).toContain('Database error');
    });
  });

  describe('R2 bucket data source', () => {
    it('should load data from R2 bucket', async () => {
      const mockR2Object = {
        text: vi.fn().mockResolvedValue(JSON.stringify(sampleDeckMaster)),
      };
      const mockR2Bucket = {
        get: vi.fn().mockResolvedValue(mockR2Object),
      };

      const dataSource: JsonDataSource = {
        r2Bucket: mockR2Bucket as unknown as JsonDataSource['r2Bucket'],
      };

      const options: MigrationOptions = {
        dryRun: true,
        onProgress: vi.fn(),
      };

      const result = await migrateJsonToD1(mockContext, dataSource, options);

      expect(mockR2Bucket.get).toHaveBeenCalledWith('legacy/deck-master.json');
      expect(result.deckMaster.imported).toBe(2);
    });

    it('should throw error when R2 file not found', async () => {
      const mockR2Bucket = {
        get: vi.fn().mockResolvedValue(null),
      };

      const dataSource: JsonDataSource = {
        r2Bucket: mockR2Bucket as unknown as JsonDataSource['r2Bucket'],
      };

      const options: MigrationOptions = {
        dryRun: true,
        onProgress: vi.fn(),
      };

      await expect(
        migrateJsonToD1(mockContext, dataSource, options)
      ).rejects.toThrow('deck-master.json not found in R2');
    });
  });

  describe('progress callback', () => {
    it('should call onProgress callback during migration', async () => {
      const onProgress = vi.fn();

      const dataSource: JsonDataSource = {
        localData: {
          deckMaster: sampleDeckMaster,
          battleLogs: sampleBattleLogs,
          myDecks: sampleMyDecks,
        },
      };

      const options: MigrationOptions = {
        dryRun: true,
        onProgress,
      };

      await migrateJsonToD1(mockContext, dataSource, options);

      // 各フェーズで進捗コールバックが呼ばれることを確認
      expect(onProgress).toHaveBeenCalledWith('Migrating deck_master...');
      expect(onProgress).toHaveBeenCalledWith('Migrating battle_logs...');
      expect(onProgress).toHaveBeenCalledWith('Migrating my_decks...');
      expect(onProgress).toHaveBeenCalledWith(
        expect.stringMatching(/Migration completed in \d+ms/)
      );
    });
  });

  describe('batch processing', () => {
    it('should process data in batches', async () => {
      // 150件のデータを作成（バッチサイズ100でテスト）
      const largeDeckMasterData: LegacyDeckMaster[] = Array.from(
        { length: 150 },
        (_, i) => ({
          id: String(i + 1),
          className: 'ウィッチ',
          deckName: `デッキ${i + 1}`,
          sortOrder: i + 1,
        })
      );

      const dataSource: JsonDataSource = {
        localData: {
          deckMaster: largeDeckMasterData,
          battleLogs: [],
          myDecks: [],
        },
      };

      const onProgress = vi.fn();
      const options: MigrationOptions = {
        dryRun: true,
        batchSize: 100,
        onProgress,
      };

      const result = await migrateJsonToD1(mockContext, dataSource, options);

      expect(result.deckMaster.imported).toBe(150);
      // 進捗が複数回呼ばれることを確認（バッチ処理の証拠）
      expect(onProgress).toHaveBeenCalledWith('deck_master: processed 100/150');
      expect(onProgress).toHaveBeenCalledWith('deck_master: processed 150/150');
    });
  });

  describe('empty data handling', () => {
    it('should handle empty data source gracefully', async () => {
      const dataSource: JsonDataSource = {
        localData: {
          deckMaster: [],
          battleLogs: [],
          myDecks: [],
        },
      };

      const options: MigrationOptions = {
        dryRun: true,
        onProgress: vi.fn(),
      };

      const result = await migrateJsonToD1(mockContext, dataSource, options);

      expect(result.deckMaster.imported).toBe(0);
      expect(result.battleLogs.imported).toBe(0);
      expect(result.myDecks.imported).toBe(0);
      expect(result.deckMaster.errors).toHaveLength(0);
    });

    it('should handle undefined local data', async () => {
      const dataSource: JsonDataSource = {
        localData: {},
      };

      const options: MigrationOptions = {
        dryRun: true,
        onProgress: vi.fn(),
      };

      const result = await migrateJsonToD1(mockContext, dataSource, options);

      expect(result.deckMaster.imported).toBe(0);
      expect(result.battleLogs.imported).toBe(0);
      expect(result.myDecks.imported).toBe(0);
    });
  });
});

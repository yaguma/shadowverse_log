/**
 * BattleLogsRepository のテスト
 * TASK-0024-3: BattleLogs リポジトリのテスト実装
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BattleLogsRepository } from '../../../src/db/repositories/battle-logs-repository';
import type { Database } from '../../../src/db';
import type { BattleLog } from '../../../src/db/schema';

// モックUUID
vi.stubGlobal('crypto', {
  randomUUID: () => 'test-uuid-1234',
});

describe('BattleLogsRepository', () => {
  let repository: BattleLogsRepository;
  let mockDb: Database;

  // テスト用のモックデータ
  const mockBattleLog: BattleLog = {
    id: 'test-id',
    userId: 'user-1',
    date: '2025-11-26',
    battleType: 'ranked',
    rank: 'master',
    groupName: 'GroupA',
    myDeckId: 'deck-1',
    turn: 'first',
    result: 'win',
    opponentDeckId: 'opponent-deck-1',
    season: null,
    createdAt: '2025-11-26T00:00:00Z',
    updatedAt: '2025-11-26T00:00:00Z',
  };

  // チェーン可能なモックオブジェクトを作成
  const createChainMock = (finalResult: unknown = []) => ({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue(finalResult),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue({ changes: 1 }),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  });

  beforeEach(() => {
    mockDb = createChainMock() as unknown as Database;
    repository = new BattleLogsRepository(mockDb);
  });

  describe('findById', () => {
    it('should return battle log by id', async () => {
      const chainMock = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockBattleLog]),
            }),
          }),
        }),
      };
      const db = chainMock as unknown as Database;
      const repo = new BattleLogsRepository(db);

      const result = await repo.findById('test-id');
      expect(result).toEqual(mockBattleLog);
    });

    it('should return null when battle log not found', async () => {
      const chainMock = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      };
      const db = chainMock as unknown as Database;
      const repo = new BattleLogsRepository(db);

      const result = await repo.findById('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all battle logs with default pagination', async () => {
      const mockDataWithDeckNames = [{
        ...mockBattleLog,
        myDeckName: 'My Deck',
        opponentDeckName: 'Opponent Deck',
      }];
      const chainMock = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    offset: vi.fn().mockResolvedValue(mockDataWithDeckNames),
                  }),
                }),
              }),
            }),
          }),
        }),
      };
      const db = chainMock as unknown as Database;
      const repo = new BattleLogsRepository(db);

      const result = await repo.findAll();
      expect(result).toEqual(mockDataWithDeckNames);
    });

    it('should respect custom limit and offset', async () => {
      const mockLimitFn = vi.fn().mockReturnValue({
        offset: vi.fn().mockResolvedValue([]),
      });
      const chainMock = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: mockLimitFn,
                }),
              }),
            }),
          }),
        }),
      };
      const db = chainMock as unknown as Database;
      const repo = new BattleLogsRepository(db);

      await repo.findAll(10, 5);
      expect(mockLimitFn).toHaveBeenCalledWith(10);
    });
  });

  describe('create', () => {
    it('should create a new battle log', async () => {
      const newBattleLogData = {
        id: 'test-uuid-1234',
        userId: 'user-1',
        date: '2025-11-26',
        battleType: 'ranked',
        rank: 'master',
        groupName: 'GroupA',
        myDeckId: 'deck-1',
        turn: 'first',
        result: 'win',
        opponentDeckId: 'opponent-deck-1',
      };

      // create呼び出し後にfindByIdが呼ばれるので、両方をモック
      let insertCalled = false;
      const chainMock = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockImplementation(() => {
                // insert後の findById 呼び出し
                return Promise.resolve([
                  {
                    ...newBattleLogData,
                    season: null,
                    createdAt: '2025-11-26T00:00:00Z',
                    updatedAt: '2025-11-26T00:00:00Z',
                  },
                ]);
              }),
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockImplementation(() => {
            insertCalled = true;
            return Promise.resolve({ changes: 1 });
          }),
        }),
      };
      const db = chainMock as unknown as Database;
      const repo = new BattleLogsRepository(db);

      const result = await repo.create(newBattleLogData);

      expect(result.id).toBe('test-uuid-1234');
      expect(result.userId).toBe('user-1');
      expect(result.battleType).toBe('ranked');
      expect(insertCalled).toBe(true);
    });
  });

  describe('update', () => {
    it('should update an existing battle log', async () => {
      const updatedData = { result: 'lose' };
      let updateCalled = false;

      const chainMock = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockImplementation(() => {
                // 最初はexisting、次はupdated後のデータ
                if (updateCalled) {
                  return Promise.resolve([{ ...mockBattleLog, result: 'lose' }]);
                }
                return Promise.resolve([mockBattleLog]);
              }),
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockImplementation(() => {
              updateCalled = true;
              return Promise.resolve({ changes: 1 });
            }),
          }),
        }),
      };
      const db = chainMock as unknown as Database;
      const repo = new BattleLogsRepository(db);

      const result = await repo.update('test-id', updatedData);

      expect(result?.result).toBe('lose');
      expect(updateCalled).toBe(true);
    });

    it('should return null when battle log not found', async () => {
      const chainMock = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      };
      const db = chainMock as unknown as Database;
      const repo = new BattleLogsRepository(db);

      const result = await repo.update('non-existent', { result: 'lose' });
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete an existing battle log', async () => {
      let findCalled = false;
      const chainMock = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockImplementation(() => {
                if (!findCalled) {
                  findCalled = true;
                  return Promise.resolve([mockBattleLog]);
                }
                return Promise.resolve([]);
              }),
            }),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({ changes: 1 }),
        }),
      };
      const db = chainMock as unknown as Database;
      const repo = new BattleLogsRepository(db);

      const result = await repo.delete('test-id');
      expect(result).toBe(true);
    });

    it('should return false when battle log not found', async () => {
      const chainMock = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      };
      const db = chainMock as unknown as Database;
      const repo = new BattleLogsRepository(db);

      const result = await repo.delete('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('findByUserId', () => {
    it('should return battle logs by user id', async () => {
      const mockData = [mockBattleLog];
      const chainMock = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  offset: vi.fn().mockResolvedValue(mockData),
                }),
              }),
            }),
          }),
        }),
      };
      const db = chainMock as unknown as Database;
      const repo = new BattleLogsRepository(db);

      const result = await repo.findByUserId('user-1');
      expect(result).toEqual(mockData);
    });

    it('should apply pagination options', async () => {
      const mockLimitFn = vi.fn().mockReturnValue({
        offset: vi.fn().mockResolvedValue([]),
      });
      const chainMock = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: mockLimitFn,
              }),
            }),
          }),
        }),
      };
      const db = chainMock as unknown as Database;
      const repo = new BattleLogsRepository(db);

      await repo.findByUserId('user-1', { limit: 20, offset: 10 });
      expect(mockLimitFn).toHaveBeenCalledWith(20);
    });
  });

  describe('findByDateRange', () => {
    it('should return battle logs within date range', async () => {
      const mockData = [mockBattleLog];
      const chainMock = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(mockData),
            }),
          }),
        }),
      };
      const db = chainMock as unknown as Database;
      const repo = new BattleLogsRepository(db);

      const result = await repo.findByDateRange('2025-11-01', '2025-11-30');
      expect(result).toEqual(mockData);
    });

    it('should filter by user id when provided', async () => {
      const mockWhereFn = vi.fn().mockReturnValue({
        orderBy: vi.fn().mockResolvedValue([mockBattleLog]),
      });
      const chainMock = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: mockWhereFn,
          }),
        }),
      };
      const db = chainMock as unknown as Database;
      const repo = new BattleLogsRepository(db);

      await repo.findByDateRange('2025-11-01', '2025-11-30', 'user-1');
      expect(mockWhereFn).toHaveBeenCalled();
    });
  });

  describe('count', () => {
    it('should return total count', async () => {
      const mockData = [mockBattleLog, { ...mockBattleLog, id: 'test-2' }];
      const chainMock = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockResolvedValue(mockData),
        }),
      };
      const db = chainMock as unknown as Database;
      const repo = new BattleLogsRepository(db);

      const result = await repo.count();
      expect(result).toBe(2);
    });

    it('should filter by user id when provided', async () => {
      const mockWhereFn = vi.fn().mockResolvedValue([mockBattleLog]);
      const chainMock = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: mockWhereFn,
          }),
        }),
      };
      const db = chainMock as unknown as Database;
      const repo = new BattleLogsRepository(db);

      const result = await repo.count('user-1');
      expect(result).toBe(1);
    });
  });

  describe('countByResult', () => {
    it('should count wins correctly', async () => {
      const mockData = [mockBattleLog, { ...mockBattleLog, id: 'test-2' }];
      const chainMock = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockData),
          }),
        }),
      };
      const db = chainMock as unknown as Database;
      const repo = new BattleLogsRepository(db);

      const result = await repo.countByResult('win');
      expect(result).toBe(2);
    });

    it('should filter by user id when provided', async () => {
      const mockWhereFn = vi.fn().mockResolvedValue([mockBattleLog]);
      const chainMock = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: mockWhereFn,
          }),
        }),
      };
      const db = chainMock as unknown as Database;
      const repo = new BattleLogsRepository(db);

      const result = await repo.countByResult('win', 'user-1');
      expect(result).toBe(1);
    });
  });

  /**
   * TASK-0025: シーズン一覧取得のテスト
   */
  describe('getSeasonsList', () => {
    it('should return seasons in descending order', async () => {
      const mockData = [{ season: 5 }, { season: 3 }, { season: 1 }];
      const chainMock = {
        selectDistinct: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockData),
          }),
        }),
      };
      const db = chainMock as unknown as Database;
      const repo = new BattleLogsRepository(db);

      const result = await repo.getSeasonsList();
      expect(result).toEqual([5, 3, 1]);
    });

    it('should filter out null seasons', async () => {
      const mockData = [{ season: 5 }, { season: null }, { season: 3 }];
      const chainMock = {
        selectDistinct: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockData),
          }),
        }),
      };
      const db = chainMock as unknown as Database;
      const repo = new BattleLogsRepository(db);

      const result = await repo.getSeasonsList();
      expect(result).toEqual([5, 3]);
    });

    it('should return empty array when no battle logs exist', async () => {
      const chainMock = {
        selectDistinct: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([]),
          }),
        }),
      };
      const db = chainMock as unknown as Database;
      const repo = new BattleLogsRepository(db);

      const result = await repo.getSeasonsList();
      expect(result).toEqual([]);
    });

    it('should return empty array when all seasons are null', async () => {
      const mockData = [{ season: null }, { season: null }];
      const chainMock = {
        selectDistinct: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockData),
          }),
        }),
      };
      const db = chainMock as unknown as Database;
      const repo = new BattleLogsRepository(db);

      const result = await repo.getSeasonsList();
      expect(result).toEqual([]);
    });
  });
});

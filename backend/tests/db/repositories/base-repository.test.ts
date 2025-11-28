/**
 * BaseRepository インターフェースのテスト
 * TASK-0024-1: リポジトリパターン基盤テスト
 */
import { describe, expect, it } from 'vitest';
import {
  type BaseRepository,
  type PaginatedResult,
  type PaginationOptions,
  createPaginatedResult,
} from '../../../src/db/repositories/base-repository';

describe('BaseRepository Interface', () => {
  describe('type definitions', () => {
    it('should define required interface methods', () => {
      // インターフェースの存在確認（コンパイル時チェック）
      const _checkInterface = (): BaseRepository<
        { id: string; name: string },
        { name: string }
      > => {
        return {
          findById: async () => null,
          findAll: async () => [],
          create: async () => ({ id: '1', name: 'test' }),
          update: async () => null,
          delete: async () => false,
        };
      };

      // 型チェックが通ればOK
      expect(typeof _checkInterface).toBe('function');
    });

    it('should define PaginationOptions type', () => {
      const options: PaginationOptions = {
        limit: 10,
        offset: 0,
      };

      expect(options.limit).toBe(10);
      expect(options.offset).toBe(0);
    });

    it('should define PaginatedResult type', () => {
      const result: PaginatedResult<{ id: string }> = {
        data: [{ id: '1' }],
        total: 100,
        limit: 10,
        offset: 0,
        hasNext: true,
      };

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(100);
      expect(result.hasNext).toBe(true);
    });
  });

  describe('createPaginatedResult helper', () => {
    it('should create paginated result with correct hasNext when more data available', () => {
      const data = [{ id: '1' }, { id: '2' }, { id: '3' }];
      const result = createPaginatedResult(data, 100, { limit: 10, offset: 0 });

      expect(result.data).toEqual(data);
      expect(result.total).toBe(100);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
      expect(result.hasNext).toBe(true);
    });

    it('should create paginated result with hasNext false when no more data', () => {
      const data = [{ id: '1' }, { id: '2' }];
      const result = createPaginatedResult(data, 2, { limit: 10, offset: 0 });

      expect(result.hasNext).toBe(false);
    });

    it('should handle offset correctly for hasNext calculation', () => {
      const data = [{ id: '8' }, { id: '9' }, { id: '10' }];
      const result = createPaginatedResult(data, 10, { limit: 10, offset: 7 });

      expect(result.hasNext).toBe(false);
    });

    it('should return hasNext true when exactly at boundary', () => {
      const data = [{ id: '1' }, { id: '2' }];
      // offset: 0, data.length: 2, total: 3 -> hasNext = 0 + 2 < 3 = true
      const result = createPaginatedResult(data, 3, { limit: 2, offset: 0 });

      expect(result.hasNext).toBe(true);
    });

    it('should handle empty data array', () => {
      const result = createPaginatedResult([], 0, { limit: 10, offset: 0 });

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.hasNext).toBe(false);
    });
  });
});

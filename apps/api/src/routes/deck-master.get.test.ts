/**
 * DeckMaster API - GET（使用履歴付き）テスト
 * TASK-0005: DeckMaster API - GET（使用履歴付き）実装
 *
 * @description GET /api/deck-master エンドポイントのテスト
 * 🔵 信頼性レベル: 青信号（api-endpoints.md 2.1より）
 */

import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { D1Database } from '@cloudflare/workers-types';

// モック用の型定義
type MockDeckMaster = {
  id: string;
  className: string;
  deckName: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string | null;
};

type MockDeckMasterWithUsage = MockDeckMaster & {
  usageCount: number;
  lastUsedDate: string | null;
};

// リポジトリのモック関数
const mockFindAll = vi.fn();
const mockFindAllWithUsage = vi.fn();

// リポジトリクラスのモック
vi.mock('../db/repositories/deck-master-repository', () => ({
  DeckMasterRepository: class {
    findAll = mockFindAll;
    findAllWithUsage = mockFindAllWithUsage;
  },
}));

// createDbのモック
vi.mock('../db', () => ({
  createDb: vi.fn().mockReturnValue({}),
}));

// ルートのインポート（モック後）
import deckMasterRoutes from './deck-master';

describe('GET /api/deck-master', () => {
  const mockEnv = {
    DB: {} as D1Database,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('正常系', () => {
    it('includeUsage=falseでsortOrder順に取得できること', async () => {
      // テストデータ
      const mockData: MockDeckMaster[] = [
        {
          id: 'dm-001',
          className: 'エルフ',
          deckName: 'アグロエルフ',
          sortOrder: 1,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: null,
        },
        {
          id: 'dm-002',
          className: 'ロイヤル',
          deckName: '連携ロイヤル',
          sortOrder: 2,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: null,
        },
      ];

      mockFindAll.mockResolvedValueOnce(mockData);

      const app = new Hono();
      app.route('/api/deck-master', deckMasterRoutes);

      const response = await app.request('/api/deck-master?includeUsage=false', {}, mockEnv);

      expect(response.status).toBe(200);
      const json = await response.json();

      expect(json.success).toBe(true);
      expect(json.data.deckMasters).toHaveLength(2);
      expect(json.data.deckMasters[0].sortOrder).toBe(1);
      expect(json.data.deckMasters[1].sortOrder).toBe(2);
      // usageCount と lastUsedDate が含まれないことを確認
      expect(json.data.deckMasters[0].usageCount).toBeUndefined();
      expect(json.data.deckMasters[0].lastUsedDate).toBeUndefined();
    });

    it('includeUsage=trueでlastUsedDate降順に取得できること', async () => {
      // テストデータ（lastUsedDate降順）
      const mockData: MockDeckMasterWithUsage[] = [
        {
          id: 'dm-002',
          className: 'ロイヤル',
          deckName: '連携ロイヤル',
          sortOrder: 2,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: null,
          usageCount: 15,
          lastUsedDate: '2024-01-25',
        },
        {
          id: 'dm-001',
          className: 'エルフ',
          deckName: 'アグロエルフ',
          sortOrder: 1,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: null,
          usageCount: 8,
          lastUsedDate: '2024-01-20',
        },
      ];

      mockFindAllWithUsage.mockResolvedValueOnce(mockData);

      const app = new Hono();
      app.route('/api/deck-master', deckMasterRoutes);

      const response = await app.request('/api/deck-master?includeUsage=true', {}, mockEnv);

      expect(response.status).toBe(200);
      const json = await response.json();

      expect(json.success).toBe(true);
      expect(json.data.deckMasters).toHaveLength(2);
      // lastUsedDate降順で並んでいること
      expect(json.data.deckMasters[0].lastUsedDate).toBe('2024-01-25');
      expect(json.data.deckMasters[1].lastUsedDate).toBe('2024-01-20');
      // usageCount と lastUsedDate が含まれること
      expect(json.data.deckMasters[0].usageCount).toBe(15);
      expect(json.data.deckMasters[1].usageCount).toBe(8);
    });

    it('パラメータなしでデフォルト動作（includeUsage=false）すること', async () => {
      const mockData: MockDeckMaster[] = [
        {
          id: 'dm-001',
          className: 'エルフ',
          deckName: 'アグロエルフ',
          sortOrder: 1,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: null,
        },
      ];

      mockFindAll.mockResolvedValueOnce(mockData);

      const app = new Hono();
      app.route('/api/deck-master', deckMasterRoutes);

      const response = await app.request('/api/deck-master', {}, mockEnv);

      expect(response.status).toBe(200);
      const json = await response.json();

      expect(json.success).toBe(true);
      expect(mockFindAll).toHaveBeenCalled();
      expect(mockFindAllWithUsage).not.toHaveBeenCalled();
    });
  });

  describe('境界値・異常系', () => {
    it('データ0件時に空配列を返すこと', async () => {
      mockFindAll.mockResolvedValueOnce([]);

      const app = new Hono();
      app.route('/api/deck-master', deckMasterRoutes);

      const response = await app.request('/api/deck-master', {}, mockEnv);

      expect(response.status).toBe(200);
      const json = await response.json();

      expect(json.success).toBe(true);
      expect(json.data.deckMasters).toEqual([]);
      expect(json.meta.count).toBe(0);
    });

    it('対戦履歴0件時はsortOrder順にフォールバックすること', async () => {
      // 使用履歴がないデータ（lastUsedDate=null）はsortOrder順
      const mockData: MockDeckMasterWithUsage[] = [
        {
          id: 'dm-001',
          className: 'エルフ',
          deckName: 'アグロエルフ',
          sortOrder: 1,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: null,
          usageCount: 0,
          lastUsedDate: null,
        },
        {
          id: 'dm-002',
          className: 'ロイヤル',
          deckName: '連携ロイヤル',
          sortOrder: 2,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: null,
          usageCount: 0,
          lastUsedDate: null,
        },
      ];

      mockFindAllWithUsage.mockResolvedValueOnce(mockData);

      const app = new Hono();
      app.route('/api/deck-master', deckMasterRoutes);

      const response = await app.request('/api/deck-master?includeUsage=true', {}, mockEnv);

      expect(response.status).toBe(200);
      const json = await response.json();

      expect(json.success).toBe(true);
      expect(json.data.deckMasters).toHaveLength(2);
      // sortOrder順に並んでいること
      expect(json.data.deckMasters[0].sortOrder).toBe(1);
      expect(json.data.deckMasters[1].sortOrder).toBe(2);
      // usageCount=0, lastUsedDate=null
      expect(json.data.deckMasters[0].usageCount).toBe(0);
      expect(json.data.deckMasters[0].lastUsedDate).toBeNull();
    });

    it('無効なincludeUsage値はfalseとして処理すること', async () => {
      const mockData: MockDeckMaster[] = [
        {
          id: 'dm-001',
          className: 'エルフ',
          deckName: 'アグロエルフ',
          sortOrder: 1,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: null,
        },
      ];

      mockFindAll.mockResolvedValueOnce(mockData);

      const app = new Hono();
      app.route('/api/deck-master', deckMasterRoutes);

      const response = await app.request('/api/deck-master?includeUsage=invalid', {}, mockEnv);

      expect(response.status).toBe(200);
      const json = await response.json();

      expect(json.success).toBe(true);
      // invalid値はfalseとして扱われるため、findAllが呼ばれる
      expect(mockFindAll).toHaveBeenCalled();
      expect(mockFindAllWithUsage).not.toHaveBeenCalled();
    });
  });

  describe('メタ情報', () => {
    it('メタ情報にタイムスタンプとcountが含まれること', async () => {
      const mockData: MockDeckMaster[] = [
        {
          id: 'dm-001',
          className: 'エルフ',
          deckName: 'アグロエルフ',
          sortOrder: 1,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: null,
        },
        {
          id: 'dm-002',
          className: 'ロイヤル',
          deckName: '連携ロイヤル',
          sortOrder: 2,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: null,
        },
      ];

      mockFindAll.mockResolvedValueOnce(mockData);

      const app = new Hono();
      app.route('/api/deck-master', deckMasterRoutes);

      const response = await app.request('/api/deck-master', {}, mockEnv);

      const json = await response.json();

      expect(json.meta).toBeDefined();
      expect(json.meta.timestamp).toBeDefined();
      expect(json.meta.count).toBe(2);
    });
  });
});

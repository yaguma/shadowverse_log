/**
 * MyDecks API - DELETE テスト
 * TASK-0016: MyDeck API - DELETE 実装
 *
 * @description DELETE /api/my-decks/:id エンドポイントのテスト
 * 信頼性レベル: 青信号（api-endpoints.md 3.3より、REQ-EXT-108, REQ-EXT-402）
 */

import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { D1Database } from '@cloudflare/workers-types';

// テスト用のUUID
const TEST_UUID = '550e8400-e29b-41d4-a716-446655440001';
const NON_EXISTENT_UUID = '550e8400-e29b-41d4-a716-446655440099';

// モック用の型定義
type MockMyDeck = {
  id: string;
  userId: string | null;
  deckCode: string | null;
  deckName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
};

// リポジトリのモック関数
const mockFindById = vi.fn();
const mockDelete = vi.fn();
const mockCountReferences = vi.fn();

// リポジトリクラスのモック
vi.mock('../db/repositories/my-decks-repository', () => ({
  MyDecksRepository: class {
    findById = mockFindById;
    delete = mockDelete;
    countReferences = mockCountReferences;
  },
}));

// createDbのモック
vi.mock('../db', () => ({
  createDb: vi.fn().mockReturnValue({}),
}));

// ルートのインポート（モック後）
import myDecksRoute from './my-decks';

describe('DELETE /api/my-decks/:id', () => {
  const mockEnv = {
    DB: {} as D1Database,
  };

  const mockMyDeck: MockMyDeck = {
    id: TEST_UUID,
    userId: null,
    deckCode: 'abc123',
    deckName: 'テスト用デッキ',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('正常系', () => {
    it('参照なしで204 No Contentを返すこと', async () => {
      mockFindById.mockResolvedValueOnce(mockMyDeck);
      mockCountReferences.mockResolvedValueOnce(0);
      mockDelete.mockResolvedValueOnce(true);

      const app = new Hono();
      app.route('/api/my-decks', myDecksRoute);

      const response = await app.request(
        `/api/my-decks/${TEST_UUID}`,
        {
          method: 'DELETE',
        },
        mockEnv
      );

      expect(response.status).toBe(204);
      // 204 No Contentはボディなし
      const body = await response.text();
      expect(body).toBe('');
    });

    it('削除後に一覧から消えること（削除が呼ばれること）', async () => {
      mockFindById.mockResolvedValueOnce(mockMyDeck);
      mockCountReferences.mockResolvedValueOnce(0);
      mockDelete.mockResolvedValueOnce(true);

      const app = new Hono();
      app.route('/api/my-decks', myDecksRoute);

      const response = await app.request(
        `/api/my-decks/${TEST_UUID}`,
        {
          method: 'DELETE',
        },
        mockEnv
      );

      expect(response.status).toBe(204);
      expect(mockDelete).toHaveBeenCalledWith(TEST_UUID);
    });
  });

  describe('エラー系', () => {
    it('参照ありで409 Conflictを返すこと', async () => {
      mockFindById.mockResolvedValueOnce(mockMyDeck);
      mockCountReferences.mockResolvedValueOnce(5);

      const app = new Hono();
      app.route('/api/my-decks', myDecksRoute);

      const response = await app.request(
        `/api/my-decks/${TEST_UUID}`,
        {
          method: 'DELETE',
        },
        mockEnv
      );

      expect(response.status).toBe(409);
      const json = await response.json();

      expect(json.success).toBe(false);
      expect(json.error.code).toBe('DELETE_CONSTRAINT_ERROR');
      expect(json.error.message).toBe('このデッキは対戦履歴で使用されているため削除できません');
      expect(json.error.details.referencedBy).toBe('battle_logs');
      expect(json.error.details.count).toBe(5);
    });

    it('存在しないIDで404 Not Foundを返すこと', async () => {
      mockFindById.mockResolvedValueOnce(null);

      const app = new Hono();
      app.route('/api/my-decks', myDecksRoute);

      const response = await app.request(
        `/api/my-decks/${NON_EXISTENT_UUID}`,
        {
          method: 'DELETE',
        },
        mockEnv
      );

      expect(response.status).toBe(404);
      const json = await response.json();

      expect(json.success).toBe(false);
      expect(json.error.code).toBe('MY_DECK_NOT_FOUND');
      expect(json.error.message).toContain('見つかりません');
    });

    it('無効なUUID形式で400 Bad Requestを返すこと', async () => {
      const app = new Hono();
      app.route('/api/my-decks', myDecksRoute);

      const response = await app.request(
        '/api/my-decks/invalid-uuid-format',
        {
          method: 'DELETE',
        },
        mockEnv
      );

      expect(response.status).toBe(400);
      const json = await response.json();

      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('409エラーに参照件数が含まれること', async () => {
      const usageCount = 25;
      mockFindById.mockResolvedValueOnce(mockMyDeck);
      mockCountReferences.mockResolvedValueOnce(usageCount);

      const app = new Hono();
      app.route('/api/my-decks', myDecksRoute);

      const response = await app.request(
        `/api/my-decks/${TEST_UUID}`,
        {
          method: 'DELETE',
        },
        mockEnv
      );

      expect(response.status).toBe(409);
      const json = await response.json();

      expect(json.error.details).toBeDefined();
      expect(json.error.details.count).toBe(usageCount);
    });

    it('削除処理に失敗した場合500 Internal Server Errorを返すこと', async () => {
      mockFindById.mockResolvedValueOnce(mockMyDeck);
      mockCountReferences.mockResolvedValueOnce(0);
      mockDelete.mockResolvedValueOnce(false);

      const app = new Hono();
      app.route('/api/my-decks', myDecksRoute);

      const response = await app.request(
        `/api/my-decks/${TEST_UUID}`,
        {
          method: 'DELETE',
        },
        mockEnv
      );

      expect(response.status).toBe(500);
      const json = await response.json();

      expect(json.success).toBe(false);
      expect(json.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('メタ情報', () => {
    it('エラーレスポンスにメタ情報が含まれること', async () => {
      mockFindById.mockResolvedValueOnce(null);

      const app = new Hono();
      app.route('/api/my-decks', myDecksRoute);

      const response = await app.request(
        `/api/my-decks/${NON_EXISTENT_UUID}`,
        {
          method: 'DELETE',
        },
        mockEnv
      );

      const json = await response.json();

      expect(json.meta).toBeDefined();
      expect(json.meta.timestamp).toBeDefined();
    });
  });
});

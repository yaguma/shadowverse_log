/**
 * DeckMaster PUT API Tests
 * TASK-0007: DeckMaster API - PUT 実装
 *
 * @description PUT /api/deck-master/:id エンドポイントのテスト
 */

import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { D1Database } from '@cloudflare/workers-types';

// テスト対象のルートをインポート
import deckMaster from './deck-master';

// データベースモック
const mockDb = {
  prepare: vi.fn().mockReturnThis(),
  bind: vi.fn().mockReturnThis(),
  all: vi.fn(),
  run: vi.fn(),
  first: vi.fn(),
};

// DeckMasterRepositoryのモック関数
const mockFindById = vi.fn();
const mockFindAll = vi.fn();
const mockUpdate = vi.fn();

// createDb関数のモック
vi.mock('../db', () => ({
  createDb: vi.fn(() => ({
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            offset: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({ rowsAffected: 1 }),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue({}),
    }),
  })),
}));

// DeckMasterRepositoryのモック（クラスとして正しく動作するよう修正）
vi.mock('../db/repositories/deck-master-repository', () => {
  return {
    DeckMasterRepository: class MockDeckMasterRepository {
      findById = mockFindById;
      findAll = mockFindAll;
      update = mockUpdate;
    },
  };
});

describe('DeckMaster PUT API', () => {
  const mockEnv = {
    DB: mockDb as unknown as D1Database,
  };

  // テスト用のサンプルデータ
  const sampleDeckMaster = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    className: 'ウィッチ',
    deckName: '元のデッキ名',
    sortOrder: 5,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // デフォルトで既存レコードを返す
    mockFindById.mockResolvedValue(sampleDeckMaster);
    mockFindAll.mockResolvedValue([]);
    mockUpdate.mockResolvedValue({
      ...sampleDeckMaster,
      deckName: '新しいデッキ名',
      updatedAt: '2024-01-15T10:30:00.000Z',
    });
  });

  describe('正常系', () => {
    it('正常更新で200 OKを返すこと', async () => {
      const app = new Hono();
      app.route('/api/deck-master', deckMaster);

      const response = await app.request(
        `/api/deck-master/${sampleDeckMaster.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deckName: '新しいデッキ名' }),
        },
        mockEnv
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.deckName).toBe('新しいデッキ名');
    });

    it('updated_atが更新されること', async () => {
      const app = new Hono();
      app.route('/api/deck-master', deckMaster);

      const response = await app.request(
        `/api/deck-master/${sampleDeckMaster.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deckName: '更新後の名前' }),
        },
        mockEnv
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      // updated_atが元の時刻より後の時刻になっていることを確認
      const originalUpdatedAt = new Date(sampleDeckMaster.updatedAt);
      const newUpdatedAt = new Date(data.data.updatedAt);
      expect(newUpdatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('classNameは更新されないこと', async () => {
      const app = new Hono();
      app.route('/api/deck-master', deckMaster);

      // classNameを含むリクエストを送信
      const response = await app.request(
        `/api/deck-master/${sampleDeckMaster.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deckName: '新しいデッキ名',
            className: 'ドラゴン', // 別のクラスを指定
          }),
        },
        mockEnv
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      // classNameは元のまま
      expect(data.data.className).toBe('ウィッチ');
    });
  });

  describe('エラー系', () => {
    it('deckName空でValidationErrorを返すこと', async () => {
      const app = new Hono();
      app.route('/api/deck-master', deckMaster);

      const response = await app.request(
        `/api/deck-master/${sampleDeckMaster.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deckName: '' }),
        },
        mockEnv
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('deckName51文字でValidationErrorを返すこと', async () => {
      const app = new Hono();
      app.route('/api/deck-master', deckMaster);

      const longDeckName = 'a'.repeat(51);
      const response = await app.request(
        `/api/deck-master/${sampleDeckMaster.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deckName: longDeckName }),
        },
        mockEnv
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('存在しないIDで404 Not Foundを返すこと', async () => {
      // findByIdがnullを返す場合
      mockFindById.mockResolvedValue(null);

      const app = new Hono();
      app.route('/api/deck-master', deckMaster);

      // 有効なUUID形式だが存在しないID
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440001';
      const response = await app.request(
        `/api/deck-master/${nonExistentId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deckName: '新しいデッキ名' }),
        },
        mockEnv
      );

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('リクエストボディなしでValidationErrorを返すこと', async () => {
      const app = new Hono();
      app.route('/api/deck-master', deckMaster);

      const response = await app.request(
        `/api/deck-master/${sampleDeckMaster.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          // body無し
        },
        mockEnv
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('無効なUUID形式で400 Bad Requestを返すこと', async () => {
      const app = new Hono();
      app.route('/api/deck-master', deckMaster);

      const response = await app.request(
        '/api/deck-master/invalid-uuid-format',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deckName: '新しいデッキ名' }),
        },
        mockEnv
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });
});

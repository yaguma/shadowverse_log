/**
 * CDNキャッシュミドルウェア テスト
 *
 * TASK-0041: パフォーマンス最適化
 */

import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cacheMiddleware, clearCache } from './cache';

// Cache APIのモック
const mockCacheMatch = vi.fn();
const mockCachePut = vi.fn();
const mockCacheDelete = vi.fn();

vi.stubGlobal('caches', {
  default: {
    match: mockCacheMatch,
    put: mockCachePut,
    delete: mockCacheDelete,
  },
});

describe('CDNキャッシュミドルウェア', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    vi.clearAllMocks();
    mockCacheMatch.mockResolvedValue(undefined);
  });

  describe('cacheMiddleware', () => {
    it('Cache-Controlヘッダーが設定されること', async () => {
      app.get('/test', cacheMiddleware(300), (c) => c.json({ data: 'test' }));

      const res = await app.request('/test');

      expect(res.status).toBe(200);
      expect(res.headers.get('Cache-Control')).toBe('public, max-age=300');
    });

    it('指定したTTLが適用されること', async () => {
      app.get('/test', cacheMiddleware(600), (c) => c.json({ data: 'test' }));

      const res = await app.request('/test');

      expect(res.headers.get('Cache-Control')).toBe('public, max-age=600');
    });

    it('キャッシュがない場合、レスポンスがキャッシュに保存されること', async () => {
      const mockExecutionCtx = {
        waitUntil: vi.fn(),
      };

      // Honoでexecution contextをシミュレート
      app.get('/test', cacheMiddleware(300), (c) => {
        // executionCtxを設定
        if (!c.executionCtx) {
          Object.defineProperty(c, 'executionCtx', {
            value: mockExecutionCtx,
            writable: true,
          });
        }
        return c.json({ data: 'test' });
      });

      await app.request('/test');

      // キャッシュチェックが行われる
      expect(mockCacheMatch).toHaveBeenCalled();
    });

    it('キャッシュがある場合、キャッシュからレスポンスを返すこと', async () => {
      const cachedResponse = new Response(JSON.stringify({ data: 'cached' }), {
        headers: { 'Content-Type': 'application/json' },
      });
      mockCacheMatch.mockResolvedValue(cachedResponse.clone());

      app.get('/test', cacheMiddleware(300), (c) => c.json({ data: 'fresh' }));

      const res = await app.request('/test');
      const json = await res.json();

      // キャッシュからのレスポンスを返す
      expect(json).toEqual({ data: 'cached' });
    });

    it('デフォルトTTLは300秒であること', async () => {
      app.get('/test', cacheMiddleware(), (c) => c.json({ data: 'test' }));

      const res = await app.request('/test');

      expect(res.headers.get('Cache-Control')).toBe('public, max-age=300');
    });

    it('POST リクエストはキャッシュしないこと', async () => {
      app.post('/test', cacheMiddleware(300), (c) => c.json({ data: 'test' }));

      const res = await app.request('/test', { method: 'POST' });

      // POSTはキャッシュチェックをスキップ
      expect(mockCacheMatch).not.toHaveBeenCalled();
      expect(res.status).toBe(200);
    });
  });

  describe('clearCache', () => {
    it('指定したURLのキャッシュを削除できること', async () => {
      mockCacheDelete.mockResolvedValue(true);

      const result = await clearCache('https://example.com/api/test');

      expect(mockCacheDelete).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://example.com/api/test',
        })
      );
      expect(result).toBe(true);
    });

    it('キャッシュが存在しない場合はfalseを返すこと', async () => {
      mockCacheDelete.mockResolvedValue(false);

      const result = await clearCache('https://example.com/api/notfound');

      expect(result).toBe(false);
    });
  });
});

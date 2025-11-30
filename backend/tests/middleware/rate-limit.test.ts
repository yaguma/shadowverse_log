/**
 * Rate Limit Middleware Tests
 * TASK-0032: APIテスト・最適化
 *
 * @description レート制限ミドルウェアのテスト
 * 🔵 信頼性レベル: 青信号（cloudflare-migration-phase2-part3-ii.md より）
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { rateLimit, createRateLimitStore } from '../../src/middleware/rate-limit';

describe('Rate Limit Middleware', () => {
  let app: Hono;
  let store: ReturnType<typeof createRateLimitStore>;

  beforeEach(() => {
    store = createRateLimitStore();
    app = new Hono();
    app.use('*', rateLimit({ limit: 3, windowMs: 60000, store }));
    app.get('/test', (c) => c.json({ success: true }));
  });

  describe('基本動作', () => {
    it('リクエストが制限内であれば通過する', async () => {
      const request = new Request('http://localhost/test', {
        headers: { 'CF-Connecting-IP': '192.168.1.1' },
      });

      const response = await app.fetch(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('制限を超えると429エラーを返す', async () => {
      const ip = '192.168.1.2';

      // 3回のリクエストは成功
      for (let i = 0; i < 3; i++) {
        const request = new Request('http://localhost/test', {
          headers: { 'CF-Connecting-IP': ip },
        });
        const response = await app.fetch(request);
        expect(response.status).toBe(200);
      }

      // 4回目は429
      const request = new Request('http://localhost/test', {
        headers: { 'CF-Connecting-IP': ip },
      });
      const response = await app.fetch(request);

      expect(response.status).toBe(429);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('異なるIPは別々にカウントされる', async () => {
      // IP1で3回リクエスト
      for (let i = 0; i < 3; i++) {
        const request = new Request('http://localhost/test', {
          headers: { 'CF-Connecting-IP': '192.168.1.3' },
        });
        await app.fetch(request);
      }

      // IP2は新規なので通過できる
      const request = new Request('http://localhost/test', {
        headers: { 'CF-Connecting-IP': '192.168.1.4' },
      });
      const response = await app.fetch(request);

      expect(response.status).toBe(200);
    });
  });

  describe('レスポンス形式', () => {
    it('429エラーのレスポンス形式が正しい', async () => {
      const ip = '192.168.1.5';

      // 制限を超える
      for (let i = 0; i < 4; i++) {
        const request = new Request('http://localhost/test', {
          headers: { 'CF-Connecting-IP': ip },
        });
        await app.fetch(request);
      }

      const request = new Request('http://localhost/test', {
        headers: { 'CF-Connecting-IP': ip },
      });
      const response = await app.fetch(request);
      const data = await response.json();

      expect(data).toHaveProperty('success', false);
      expect(data).toHaveProperty('error');
      expect(data.error).toHaveProperty('code', 'RATE_LIMIT_EXCEEDED');
      expect(data.error).toHaveProperty('message');
      expect(data).toHaveProperty('meta');
      expect(data.meta).toHaveProperty('timestamp');
      expect(data.meta).toHaveProperty('requestId');
    });
  });

  describe('ウィンドウリセット', () => {
    it('ウィンドウ期間後にカウントがリセットされる', async () => {
      // 短いウィンドウでテスト
      const shortStore = createRateLimitStore();
      const shortApp = new Hono();
      shortApp.use('*', rateLimit({ limit: 1, windowMs: 100, store: shortStore }));
      shortApp.get('/test', (c) => c.json({ success: true }));

      const ip = '192.168.1.6';

      // 1回目は成功
      const request1 = new Request('http://localhost/test', {
        headers: { 'CF-Connecting-IP': ip },
      });
      const response1 = await shortApp.fetch(request1);
      expect(response1.status).toBe(200);

      // 2回目は429
      const request2 = new Request('http://localhost/test', {
        headers: { 'CF-Connecting-IP': ip },
      });
      const response2 = await shortApp.fetch(request2);
      expect(response2.status).toBe(429);

      // 150ms待機
      await new Promise((resolve) => setTimeout(resolve, 150));

      // リセット後は成功
      const request3 = new Request('http://localhost/test', {
        headers: { 'CF-Connecting-IP': ip },
      });
      const response3 = await shortApp.fetch(request3);
      expect(response3.status).toBe(200);
    });
  });

  describe('IPアドレス取得', () => {
    it('CF-Connecting-IPがない場合はunknownとして扱う', async () => {
      const request = new Request('http://localhost/test');
      const response = await app.fetch(request);

      expect(response.status).toBe(200);
    });

    it('X-Forwarded-ForヘッダーからもIPを取得できる', async () => {
      const storeWithXFF = createRateLimitStore();
      const appWithXFF = new Hono();
      appWithXFF.use('*', rateLimit({ limit: 2, windowMs: 60000, store: storeWithXFF }));
      appWithXFF.get('/test', (c) => c.json({ success: true }));

      const ip = '10.0.0.1';

      // X-Forwarded-Forで2回リクエスト
      for (let i = 0; i < 2; i++) {
        const request = new Request('http://localhost/test', {
          headers: { 'X-Forwarded-For': ip },
        });
        await appWithXFF.fetch(request);
      }

      // 3回目は429
      const request = new Request('http://localhost/test', {
        headers: { 'X-Forwarded-For': ip },
      });
      const response = await appWithXFF.fetch(request);

      expect(response.status).toBe(429);
    });
  });
});

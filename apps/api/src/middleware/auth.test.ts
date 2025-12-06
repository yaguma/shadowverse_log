/**
 * Auth Middleware Tests
 * TASK-0039: Cloudflare Access 認証設定
 *
 * @description 認証ミドルウェアの単体テスト
 */

import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authMiddleware, getAuthUser, getUserEmail, getUserId } from './auth';

// JWTモック（jose のモック）
vi.mock('jose', () => ({
  jwtVerify: vi.fn(),
  createRemoteJWKSet: vi.fn(() => vi.fn()),
}));

// joseモジュールのインポート（モックを型安全に使用するため）
// biome-ignore lint/correctness/noUnusedImports: createRemoteJWKSet is used in vi.mock setup
import { createRemoteJWKSet, jwtVerify } from 'jose';

describe('Auth Middleware', () => {
  const mockEnv = {
    CF_ACCESS_TEAM_DOMAIN: 'test-team.cloudflareaccess.com',
    CF_ACCESS_AUD: 'test-aud-12345',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authMiddleware', () => {
    it('トークンなしの場合401エラーを返すこと', async () => {
      const app = new Hono<{ Bindings: typeof mockEnv }>();
      app.use('/api/*', authMiddleware());
      app.get('/api/test', (c) => c.json({ success: true }));

      const response = await app.request('/api/test', {}, mockEnv);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
      expect(data.error.message).toBe('認証トークンが必要です');
    });

    it('スキップパスの場合は認証をスキップすること', async () => {
      const app = new Hono<{ Bindings: typeof mockEnv }>();
      app.use(
        '/api/*',
        authMiddleware({
          skipPaths: ['/api/health'],
        })
      );
      app.get('/api/health', (c) => c.json({ success: true, data: 'healthy' }));

      const response = await app.request('/api/health', {}, mockEnv);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('正規表現パターンでスキップすること', async () => {
      const app = new Hono<{ Bindings: typeof mockEnv }>();
      app.use(
        '/api/*',
        authMiddleware({
          skipPaths: [/^\/api\/public\//],
        })
      );
      app.get('/api/public/info', (c) => c.json({ success: true }));

      const response = await app.request('/api/public/info', {}, mockEnv);

      expect(response.status).toBe(200);
    });

    it('有効なトークンの場合にユーザー情報をコンテキストに設定すること', async () => {
      const mockPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        aud: 'test-aud-12345',
        iss: 'https://test-team.cloudflareaccess.com',
      };

      vi.mocked(jwtVerify).mockResolvedValueOnce({
        payload: mockPayload,
        protectedHeader: { alg: 'RS256' },
      } as never);

      const app = new Hono<{ Bindings: typeof mockEnv }>();
      app.use('/api/*', authMiddleware());
      app.get('/api/test', (c) => {
        return c.json({
          userId: c.get('userId'),
          userEmail: c.get('userEmail'),
        });
      });

      const response = await app.request(
        '/api/test',
        {
          headers: {
            'CF-Access-JWT-Assertion': 'valid-token',
          },
        },
        mockEnv
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.userId).toBe('user-123');
      expect(data.userEmail).toBe('test@example.com');
    });

    it('無効なトークンの場合401エラーを返すこと', async () => {
      vi.mocked(jwtVerify).mockRejectedValueOnce(new Error('signature verification failed'));

      const app = new Hono<{ Bindings: typeof mockEnv }>();
      app.use('/api/*', authMiddleware());
      app.get('/api/test', (c) => c.json({ success: true }));

      const response = await app.request(
        '/api/test',
        {
          headers: {
            'CF-Access-JWT-Assertion': 'invalid-token',
          },
        },
        mockEnv
      );

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_SIGNATURE');
    });

    it('期限切れトークンの場合適切なエラーコードを返すこと', async () => {
      vi.mocked(jwtVerify).mockRejectedValueOnce(new Error('token expired'));

      const app = new Hono<{ Bindings: typeof mockEnv }>();
      app.use('/api/*', authMiddleware());
      app.get('/api/test', (c) => c.json({ success: true }));

      const response = await app.request(
        '/api/test',
        {
          headers: {
            'CF-Access-JWT-Assertion': 'expired-token',
          },
        },
        mockEnv
      );

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error.code).toBe('TOKEN_EXPIRED');
      expect(data.error.message).toBe('認証トークンの有効期限が切れています');
    });

    it('audience不一致の場合適切なエラーコードを返すこと', async () => {
      vi.mocked(jwtVerify).mockRejectedValueOnce(new Error('audience mismatch'));

      const app = new Hono<{ Bindings: typeof mockEnv }>();
      app.use('/api/*', authMiddleware());
      app.get('/api/test', (c) => c.json({ success: true }));

      const response = await app.request(
        '/api/test',
        {
          headers: {
            'CF-Access-JWT-Assertion': 'wrong-audience-token',
          },
        },
        mockEnv
      );

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error.code).toBe('INVALID_AUDIENCE');
    });

    it('環境変数未設定の場合500エラーを返すこと', async () => {
      const app = new Hono<{ Bindings: Record<string, unknown> }>();
      app.use('/api/*', authMiddleware());
      app.get('/api/test', (c) => c.json({ success: true }));

      const response = await app.request(
        '/api/test',
        {
          headers: {
            'CF-Access-JWT-Assertion': 'some-token',
          },
        },
        {} // 空の環境変数
      );

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error.code).toBe('AUTH_CONFIG_ERROR');
    });

    it('subクレームがない場合401エラーを返すこと', async () => {
      vi.mocked(jwtVerify).mockResolvedValueOnce({
        payload: { email: 'test@example.com' }, // subがない
        protectedHeader: { alg: 'RS256' },
      } as never);

      const app = new Hono<{ Bindings: typeof mockEnv }>();
      app.use('/api/*', authMiddleware());
      app.get('/api/test', (c) => c.json({ success: true }));

      const response = await app.request(
        '/api/test',
        {
          headers: {
            'CF-Access-JWT-Assertion': 'token-without-sub',
          },
        },
        mockEnv
      );

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error.code).toBe('INVALID_TOKEN');
      expect(data.error.message).toBe('認証トークンにユーザーIDが含まれていません');
    });
  });

  describe('Helper Functions', () => {
    describe('getUserId', () => {
      it('コンテキストからユーザーIDを取得できること', async () => {
        const mockPayload = {
          sub: 'user-456',
          email: 'helper@example.com',
        };

        vi.mocked(jwtVerify).mockResolvedValueOnce({
          payload: mockPayload,
          protectedHeader: { alg: 'RS256' },
        } as never);

        const app = new Hono<{ Bindings: typeof mockEnv }>();
        app.use('/api/*', authMiddleware());
        app.get('/api/test', (c) => {
          const userId = getUserId(c);
          return c.json({ userId });
        });

        const response = await app.request(
          '/api/test',
          {
            headers: {
              'CF-Access-JWT-Assertion': 'valid-token',
            },
          },
          mockEnv
        );

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.userId).toBe('user-456');
      });

      it('ユーザーIDが設定されていない場合エラーをスローすること', () => {
        const mockContext = {
          get: vi.fn().mockReturnValue(undefined),
        };

        expect(() => getUserId(mockContext as never)).toThrow(
          'User ID not found in context. Ensure authMiddleware is applied.'
        );
      });
    });

    describe('getUserEmail', () => {
      it('コンテキストからユーザーメールを取得できること', async () => {
        const mockPayload = {
          sub: 'user-789',
          email: 'email@example.com',
        };

        vi.mocked(jwtVerify).mockResolvedValueOnce({
          payload: mockPayload,
          protectedHeader: { alg: 'RS256' },
        } as never);

        const app = new Hono<{ Bindings: typeof mockEnv }>();
        app.use('/api/*', authMiddleware());
        app.get('/api/test', (c) => {
          const email = getUserEmail(c);
          return c.json({ email });
        });

        const response = await app.request(
          '/api/test',
          {
            headers: {
              'CF-Access-JWT-Assertion': 'valid-token',
            },
          },
          mockEnv
        );

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.email).toBe('email@example.com');
      });

      it('メールが設定されていない場合空文字を返すこと', () => {
        const mockContext = {
          get: vi.fn().mockReturnValue(undefined),
        };

        const result = getUserEmail(mockContext as never);
        expect(result).toBe('');
      });
    });

    describe('getAuthUser', () => {
      it('ユーザー情報オブジェクトを取得できること', async () => {
        const mockPayload = {
          sub: 'user-full',
          email: 'full@example.com',
        };

        vi.mocked(jwtVerify).mockResolvedValueOnce({
          payload: mockPayload,
          protectedHeader: { alg: 'RS256' },
        } as never);

        const app = new Hono<{ Bindings: typeof mockEnv }>();
        app.use('/api/*', authMiddleware());
        app.get('/api/test', (c) => {
          const user = getAuthUser(c);
          return c.json({ user });
        });

        const response = await app.request(
          '/api/test',
          {
            headers: {
              'CF-Access-JWT-Assertion': 'valid-token',
            },
          },
          mockEnv
        );

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.user).toEqual({
          id: 'user-full',
          email: 'full@example.com',
        });
      });

      it('ユーザーIDがない場合nullを返すこと', () => {
        const mockContext = {
          get: vi.fn().mockReturnValue(undefined),
        };

        const result = getAuthUser(mockContext as never);
        expect(result).toBeNull();
      });
    });
  });
});

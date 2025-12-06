/**
 * Auth Middleware for Cloudflare Access JWT Verification
 * TASK-0039: Cloudflare Access 認証設定
 *
 * @description Cloudflare AccessのJWTトークンを検証するミドルウェア
 * 🔵 信頼性レベル: 青信号（cloudflare-migration-phase4-part1.md より）
 */
import type { Context, MiddlewareHandler, Next } from 'hono';
import { createRemoteJWKSet, jwtVerify } from 'jose';

/**
 * 認証済みユーザー情報
 */
export interface AuthUser {
  /** ユーザーID (Cloudflare Access sub claim) */
  id: string;
  /** メールアドレス */
  email: string;
}

/**
 * 認証コンテキスト拡張
 */
export interface AuthContext {
  userId: string;
  userEmail: string;
}

/**
 * 認証ミドルウェアオプション
 */
interface AuthMiddlewareOptions {
  /** 認証をスキップするパス（正規表現対応） */
  skipPaths?: Array<string | RegExp>;
  /** デバッグモード（本番環境では無効化すること） */
  debug?: boolean;
  /** テスト環境で認証をスキップする（ENVIRONMENT=testの場合） */
  skipInTestEnv?: boolean;
}

/**
 * JWKSキャッシュ
 * Cloudflare Access公開鍵の取得結果をキャッシュ
 */
const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

/**
 * JWKSを取得（キャッシュ対応）
 */
function getJWKS(teamDomain: string): ReturnType<typeof createRemoteJWKSet> {
  const certsUrl = `https://${teamDomain}/cdn-cgi/access/certs`;

  let jwks = jwksCache.get(certsUrl);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(certsUrl));
    jwksCache.set(certsUrl, jwks);
  }

  return jwks;
}

/**
 * 認証ミドルウェア
 *
 * Cloudflare AccessのJWTトークンを検証し、ユーザー情報をコンテキストに設定する
 *
 * @param options ミドルウェアオプション
 * @returns Honoミドルウェア
 *
 * @example
 * ```typescript
 * // 全てのAPIルートに認証を適用
 * app.use('/api/*', authMiddleware());
 *
 * // 特定のパスをスキップ
 * app.use('/api/*', authMiddleware({
 *   skipPaths: ['/api/health', /^\/api\/public\//]
 * }));
 * ```
 */
export function authMiddleware(options: AuthMiddlewareOptions = {}): MiddlewareHandler {
  const { skipPaths = [], debug = false, skipInTestEnv = true } = options;

  return async (c: Context, next: Next) => {
    const path = c.req.path;
    const environment = (c.env as { ENVIRONMENT?: string }).ENVIRONMENT;

    // テスト環境では認証をスキップ（オプションで無効化可能）
    if (skipInTestEnv && environment === 'test') {
      if (debug) {
        console.log(`[Auth] Skipping authentication in test environment for path: ${path}`);
      }
      // テスト環境用のダミーユーザー情報を設定
      c.set('userId', 'test-user-id');
      c.set('userEmail', 'test@example.com');
      await next();
      return;
    }

    // スキップパスのチェック
    const shouldSkip = skipPaths.some((pattern) => {
      if (typeof pattern === 'string') {
        return path === pattern;
      }
      return pattern.test(path);
    });

    if (shouldSkip) {
      if (debug) {
        console.log(`[Auth] Skipping authentication for path: ${path}`);
      }
      await next();
      return;
    }

    // CF-Access-JWT-Assertion ヘッダーからトークンを取得
    const token = c.req.header('CF-Access-JWT-Assertion');

    if (!token) {
      if (debug) {
        console.log('[Auth] No token provided');
      }
      return c.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '認証トークンが必要です',
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          },
        },
        401
      );
    }

    try {
      // 環境変数から設定を取得
      const teamDomain = (c.env as { CF_ACCESS_TEAM_DOMAIN?: string }).CF_ACCESS_TEAM_DOMAIN;
      const expectedAudience = (c.env as { CF_ACCESS_AUD?: string }).CF_ACCESS_AUD;

      if (!teamDomain || !expectedAudience) {
        console.error(
          '[Auth] Missing CF_ACCESS_TEAM_DOMAIN or CF_ACCESS_AUD environment variables'
        );
        return c.json(
          {
            success: false,
            error: {
              code: 'AUTH_CONFIG_ERROR',
              message: '認証設定エラー',
            },
            meta: {
              timestamp: new Date().toISOString(),
              requestId: crypto.randomUUID(),
            },
          },
          500
        );
      }

      // JWKSを取得してJWTを検証
      const jwks = getJWKS(teamDomain);

      const { payload } = await jwtVerify(token, jwks, {
        audience: expectedAudience,
        issuer: `https://${teamDomain}`,
        clockTolerance: 60, // 60秒の時刻誤差を許容
      });

      if (debug) {
        console.log('[Auth] Token verified successfully:', payload);
      }

      // ユーザー情報をコンテキストに設定
      const userId = payload.sub as string;
      const userEmail = payload.email as string;

      if (!userId) {
        return c.json(
          {
            success: false,
            error: {
              code: 'INVALID_TOKEN',
              message: '認証トークンにユーザーIDが含まれていません',
            },
            meta: {
              timestamp: new Date().toISOString(),
              requestId: crypto.randomUUID(),
            },
          },
          401
        );
      }

      // Honoのコンテキストにユーザー情報を設定
      c.set('userId', userId);
      c.set('userEmail', userEmail || '');

      await next();
    } catch (error) {
      if (debug) {
        console.error('[Auth] JWT verification failed:', error);
      }

      // エラーの種類に応じたメッセージ
      let errorCode = 'TOKEN_VALIDATION_ERROR';
      let errorMessage = 'トークン検証エラー';

      if (error instanceof Error) {
        if (error.message.includes('expired')) {
          errorCode = 'TOKEN_EXPIRED';
          errorMessage = '認証トークンの有効期限が切れています';
        } else if (error.message.includes('signature')) {
          errorCode = 'INVALID_SIGNATURE';
          errorMessage = '認証トークンの署名が無効です';
        } else if (error.message.includes('audience')) {
          errorCode = 'INVALID_AUDIENCE';
          errorMessage = '認証トークンの対象が無効です';
        }
      }

      return c.json(
        {
          success: false,
          error: {
            code: errorCode,
            message: errorMessage,
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          },
        },
        401
      );
    }
  };
}

/**
 * コンテキストからユーザーIDを取得するヘルパー関数
 *
 * @param c Honoコンテキスト
 * @returns ユーザーID
 * @throws ユーザーIDが設定されていない場合はエラー
 */
export function getUserId(c: Context): string {
  const userId = c.get('userId');
  if (!userId) {
    throw new Error('User ID not found in context. Ensure authMiddleware is applied.');
  }
  return userId as string;
}

/**
 * コンテキストからユーザーメールを取得するヘルパー関数
 *
 * @param c Honoコンテキスト
 * @returns ユーザーメールアドレス（設定されていない場合は空文字）
 */
export function getUserEmail(c: Context): string {
  return (c.get('userEmail') as string) || '';
}

/**
 * コンテキストからユーザー情報を取得するヘルパー関数
 *
 * @param c Honoコンテキスト
 * @returns ユーザー情報
 */
export function getAuthUser(c: Context): AuthUser | null {
  const userId = c.get('userId') as string | undefined;
  const userEmail = c.get('userEmail') as string | undefined;

  if (!userId) {
    return null;
  }

  return {
    id: userId,
    email: userEmail || '',
  };
}

export type { AuthMiddlewareOptions };

/**
 * Rate Limit Middleware
 * TASK-0032: APIテスト・最適化
 *
 * @description リクエストレート制限ミドルウェア
 * 🔵 信頼性レベル: 青信号（cloudflare-migration-phase2-part3-ii.md より）
 */
import type { Context, Next, MiddlewareHandler } from 'hono';

/**
 * レート制限ストアのレコード型
 */
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

/**
 * レート制限ストアのインターフェース
 */
interface RateLimitStore {
  get(key: string): RateLimitRecord | undefined;
  set(key: string, record: RateLimitRecord): void;
  delete(key: string): void;
}

/**
 * レート制限オプション
 */
interface RateLimitOptions {
  /** リクエスト制限数（デフォルト: 100） */
  limit?: number;
  /** ウィンドウ期間（ミリ秒、デフォルト: 60000 = 1分） */
  windowMs?: number;
  /** カスタムストア（テスト用） */
  store?: RateLimitStore;
}

/**
 * インメモリのレート制限ストアを作成
 */
export function createRateLimitStore(): RateLimitStore {
  const map = new Map<string, RateLimitRecord>();

  return {
    get(key: string) {
      return map.get(key);
    },
    set(key: string, record: RateLimitRecord) {
      map.set(key, record);
    },
    delete(key: string) {
      map.delete(key);
    },
  };
}

// デフォルトのグローバルストア
const defaultStore = createRateLimitStore();

/**
 * クライアントIPアドレスを取得
 */
function getClientIp(c: Context): string {
  // Cloudflare経由のIPを優先
  const cfIp = c.req.header('CF-Connecting-IP');
  if (cfIp) {
    return cfIp;
  }

  // プロキシ経由のIP
  const xForwardedFor = c.req.header('X-Forwarded-For');
  if (xForwardedFor) {
    // 最初のIPを取得（クライアントIP）
    return xForwardedFor.split(',')[0].trim();
  }

  // IPが取得できない場合
  return 'unknown';
}

/**
 * レート制限ミドルウェア
 *
 * @param options レート制限オプション
 * @returns Honoミドルウェア
 *
 * @example
 * ```typescript
 * app.use('/api/*', rateLimit({ limit: 100, windowMs: 60000 }));
 * ```
 */
export function rateLimit(options: RateLimitOptions = {}): MiddlewareHandler {
  const { limit = 100, windowMs = 60000, store = defaultStore } = options;

  return async (c: Context, next: Next) => {
    const ip = getClientIp(c);
    const now = Date.now();

    let record = store.get(ip);

    // 期限切れまたは新規の場合はリセット
    if (!record || now > record.resetAt) {
      record = { count: 0, resetAt: now + windowMs };
      store.set(ip, record);
    }

    // カウントをインクリメント
    record.count++;
    store.set(ip, record);

    // 制限超過チェック
    if (record.count > limit) {
      return c.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'リクエスト制限を超過しました',
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          },
        },
        429
      );
    }

    await next();
  };
}

export type { RateLimitOptions, RateLimitStore, RateLimitRecord };

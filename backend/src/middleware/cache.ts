/**
 * CDNキャッシュミドルウェア
 *
 * TASK-0041: パフォーマンス最適化
 *
 * Cloudflare Workers Cache APIを使用したキャッシュミドルウェア
 */

import type { Context, Next } from 'hono';

/**
 * CDNキャッシュミドルウェア
 *
 * GETリクエストのレスポンスをCloudflare Cache APIにキャッシュする。
 *
 * @param ttl キャッシュの有効期限（秒）。デフォルトは300秒（5分）
 * @returns Honoミドルウェア関数
 *
 * @example
 * ```typescript
 * // 5分間キャッシュ
 * app.get('/api/deck-master', cacheMiddleware(300), async (c) => {
 *   return c.json({ data: 'master data' });
 * });
 *
 * // デフォルト（5分）でキャッシュ
 * app.get('/api/data', cacheMiddleware(), async (c) => {
 *   return c.json({ data: 'some data' });
 * });
 * ```
 */
export function cacheMiddleware(ttl: number = 300) {
  return async (c: Context, next: Next) => {
    // GETリクエスト以外はキャッシュしない
    if (c.req.method !== 'GET') {
      await next();
      return;
    }

    const cacheKey = new Request(c.req.url);
    const cache = caches.default;

    // キャッシュをチェック
    const cachedResponse = await cache.match(cacheKey);

    if (cachedResponse) {
      // キャッシュがある場合はそれを返す
      return cachedResponse;
    }

    // キャッシュがない場合は次のハンドラーを実行
    await next();

    // レスポンスにCache-Controlヘッダーを設定
    c.header('Cache-Control', `public, max-age=${ttl}`);

    // レスポンスをキャッシュに保存（executionCtxがある場合のみ）
    try {
      // Cloudflare Workers環境ではexecutionCtxが存在する
      const executionCtx = c.executionCtx;
      if (executionCtx) {
        const response = c.res.clone();
        executionCtx.waitUntil(cache.put(cacheKey, response));
      }
    } catch {
      // テスト環境などでexecutionCtxが存在しない場合は無視
    }
  };
}

/**
 * 指定したURLのキャッシュを削除する
 *
 * @param url キャッシュを削除するURL
 * @returns キャッシュが削除された場合はtrue、存在しなかった場合はfalse
 *
 * @example
 * ```typescript
 * // 特定のエンドポイントのキャッシュをクリア
 * await clearCache('https://example.com/api/deck-master');
 * ```
 */
export async function clearCache(url: string): Promise<boolean> {
  const cache = caches.default;
  const cacheKey = new Request(url);
  return cache.delete(cacheKey);
}

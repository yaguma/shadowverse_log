/**
 * Shadowverse Battle Log API - Cloudflare Workers エントリーポイント
 *
 * Phase 1: 基本的なAPIエンドポイントとマイグレーション機能
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { D1Database } from '@cloudflare/workers-types';
import migrationRoutes from './routes/migration';

/** 環境バインディング型 */
export interface Env {
  DB: D1Database;
  ENVIRONMENT?: string;
  API_VERSION?: string;
}

/** Honoアプリケーションの型 */
type AppType = Hono<{ Bindings: Env }>;

/** メインアプリケーション */
const app: AppType = new Hono();

// ミドルウェア
app.use('*', cors());
app.use('*', logger());

// ルートエンドポイント
app.get('/', (c) => {
  return c.json({
    success: true,
    data: {
      name: 'Shadowverse Battle Log API',
      version: c.env.API_VERSION || '1.0.0',
      environment: c.env.ENVIRONMENT || 'development',
    },
  });
});

// ヘルスチェックエンドポイント
app.get('/health', (c) => {
  return c.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: c.env.API_VERSION || '1.0.0',
    },
  });
});

// マイグレーションルート
app.route('/api/migration', migrationRoutes);

// 404ハンドラー
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route not found: ${c.req.method} ${c.req.path}`,
      },
    },
    404
  );
});

// グローバルエラーハンドラー
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      },
    },
    500
  );
});

export default app;

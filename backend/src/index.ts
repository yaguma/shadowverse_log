/**
 * Shadowverse Battle Log API - Cloudflare Workers エントリーポイント
 *
 * Phase 1: 基本的なAPIエンドポイントとマイグレーション機能
 * Phase 2: レート制限、統合テスト、パフォーマンステスト (TASK-0032)
 */

import type { D1Database } from '@cloudflare/workers-types';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { authMiddleware } from './middleware/auth';
import { rateLimit } from './middleware/rate-limit';
import battleLogsRoutes from './routes/battle-logs';
import deckMasterRoutes from './routes/deck-master';
import importRoutes from './routes/import';
import migrationRoutes from './routes/migration';
import myDecksRoutes from './routes/my-decks';
import statisticsRoutes from './routes/statistics';

/** 環境バインディング型 */
export interface Env {
  DB: D1Database;
  ENVIRONMENT?: string;
  API_VERSION?: string;
  /** Cloudflare Access チームドメイン */
  CF_ACCESS_TEAM_DOMAIN?: string;
  /** Cloudflare Access アプリケーションAUD */
  CF_ACCESS_AUD?: string;
  /** 許可されるオリジン（CORS用） */
  ALLOWED_ORIGINS?: string;
}

/** Honoアプリケーションの型 */
type AppType = Hono<{ Bindings: Env }>;

/** メインアプリケーション */
const app: AppType = new Hono();

// ミドルウェア
// CORS設定: 環境変数から許可オリジンを取得
app.use('*', async (c, next) => {
  const allowedOrigins = c.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) || [
    'http://localhost:5173',
  ];
  const corsMiddleware = cors({
    origin: allowedOrigins,
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'CF-Access-JWT-Assertion'],
    exposeHeaders: ['Content-Length', 'X-Request-Id'],
    maxAge: 86400,
  });
  return corsMiddleware(c, next);
});
app.use('*', logger());
// レート制限: 100リクエスト/分
app.use('/api/*', rateLimit({ limit: 100, windowMs: 60000 }));
// 認証ミドルウェア: TASK-0040で有効化
// 開発環境ではスキップ、本番環境では有効化
app.use(
  '/api/*',
  authMiddleware({
    skipPaths: ['/api/health', '/api/migration', '/api/import', '/api/battle-logs', '/api/deck-master', '/api/my-decks', '/api/statistics'],
    debug: true,
  })
);

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

// 統計APIルート
app.route('/api/statistics', statisticsRoutes);

// インポートAPIルート
app.route('/api/import', importRoutes);

// 対戦履歴APIルート
app.route('/api/battle-logs', battleLogsRoutes);

// デッキマスターAPIルート
app.route('/api/deck-master', deckMasterRoutes);

// マイデッキAPIルート
app.route('/api/my-decks', myDecksRoutes);

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

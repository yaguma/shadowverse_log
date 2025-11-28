/**
 * TASK-0025-5: マイグレーションAPIエンドポイント
 *
 * 既存JSONデータからD1へのマイグレーションを実行するAPIルート
 */

import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';
import { createDatabaseContext } from '../db';
import { migrateJsonToD1, type JsonDataSource } from '../migration/migrate-json-to-d1';
import type { LegacyBattleLog, LegacyDeckMaster, LegacyMyDeck } from '../migration/schema-mapping';

/** 環境バインディング型 */
interface Env {
  DB: D1Database;
}

/** Honoアプリケーションの型 */
type AppType = Hono<{ Bindings: Env }>;

/** マイグレーションルート */
const migration: AppType = new Hono();

/**
 * マイグレーションステータスの取得
 * GET /api/migration/status
 */
migration.get('/status', (c) => {
  return c.json({
    success: true,
    data: {
      status: 'ready',
      message: 'Migration endpoint is ready',
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * マイグレーション実行（ドライラン）
 * POST /api/migration/dry-run
 *
 * リクエストボディでJSONデータを受け取り、ドライランを実行
 */
migration.post('/dry-run', async (c) => {
  try {
    const body = await c.req.json<{
      deckMaster?: LegacyDeckMaster[];
      battleLogs?: LegacyBattleLog[];
      myDecks?: LegacyMyDeck[];
      userId?: string;
    }>();

    const ctx = createDatabaseContext(c.env.DB);

    const dataSource: JsonDataSource = {
      localData: {
        deckMaster: body.deckMaster || [],
        battleLogs: body.battleLogs || [],
        myDecks: body.myDecks || [],
      },
    };

    const result = await migrateJsonToD1(ctx, dataSource, {
      dryRun: true,
      userId: body.userId,
      onProgress: (msg) => console.log('[dry-run]', msg),
    });

    return c.json({
      success: true,
      message: 'Dry run completed',
      data: result,
    });
  } catch (error) {
    console.error('Dry run error:', error);
    return c.json(
      {
        success: false,
        error: {
          code: 'MIGRATION_DRY_RUN_FAILED',
          message: String(error),
        },
      },
      500
    );
  }
});

/**
 * マイグレーション実行（本番）
 * POST /api/migration/execute
 *
 * 注意: このエンドポイントは実際にデータベースに書き込みを行います
 */
migration.post('/execute', async (c) => {
  try {
    const body = await c.req.json<{
      deckMaster?: LegacyDeckMaster[];
      battleLogs?: LegacyBattleLog[];
      myDecks?: LegacyMyDeck[];
      userId?: string;
      confirmExecution?: boolean;
    }>();

    // 安全のため、確認フラグが必要
    if (!body.confirmExecution) {
      return c.json(
        {
          success: false,
          error: {
            code: 'CONFIRMATION_REQUIRED',
            message:
              'Please set confirmExecution: true to execute migration. This will modify the database.',
          },
        },
        400
      );
    }

    const ctx = createDatabaseContext(c.env.DB);

    const dataSource: JsonDataSource = {
      localData: {
        deckMaster: body.deckMaster || [],
        battleLogs: body.battleLogs || [],
        myDecks: body.myDecks || [],
      },
    };

    const result = await migrateJsonToD1(ctx, dataSource, {
      dryRun: false,
      userId: body.userId,
      onProgress: (msg) => console.log('[execute]', msg),
    });

    return c.json({
      success: true,
      message: 'Migration completed successfully',
      data: result,
    });
  } catch (error) {
    console.error('Migration execution error:', error);
    return c.json(
      {
        success: false,
        error: {
          code: 'MIGRATION_EXECUTION_FAILED',
          message: String(error),
        },
      },
      500
    );
  }
});

export default migration;

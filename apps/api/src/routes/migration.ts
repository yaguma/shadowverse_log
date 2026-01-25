/**
 * TASK-0025-5: マイグレーションAPIエンドポイント
 *
 * 既存JSONデータからD1へのマイグレーションを実行するAPIルート
 */

import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';
import { createDatabaseContext } from '../db';
import { migrateJsonToD1, type JsonDataSource } from '../migration/migrate-json-to-d1';
import { rollbackMigration, rollbackTables } from '../migration/rollback';
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

/**
 * マイグレーションロールバック（全テーブル）
 * POST /api/migration/rollback
 *
 * 全テーブルのデータを削除してマイグレーションをロールバック
 * 注意: このエンドポイントは実際にデータベースからデータを削除します
 */
migration.post('/rollback', async (c) => {
  try {
    const body = await c.req
      .json<{
        confirmRollback?: boolean;
        tables?: ('battle_logs' | 'deck_master' | 'my_decks')[];
      }>()
      .catch(() => ({ confirmRollback: false, tables: undefined }));

    // 安全のため、確認フラグが必要
    if (!body.confirmRollback) {
      return c.json(
        {
          success: false,
          error: {
            code: 'CONFIRMATION_REQUIRED',
            message:
              'Please set confirmRollback: true to execute rollback. This will DELETE all data from the database.',
          },
        },
        400
      );
    }

    // 特定のテーブルのみロールバックする場合
    const result =
      body.tables && body.tables.length > 0
        ? await rollbackTables(c.env.DB, body.tables)
        : await rollbackMigration(c.env.DB);

    if (!result.success) {
      return c.json(
        {
          success: false,
          error: {
            code: 'ROLLBACK_FAILED',
            message: result.error || 'Unknown error during rollback',
          },
        },
        500
      );
    }

    return c.json({
      success: true,
      message: 'Rollback completed successfully',
      data: result,
    });
  } catch (error) {
    console.error('Rollback API error:', error);
    return c.json(
      {
        success: false,
        error: {
          code: 'ROLLBACK_FAILED',
          message: String(error),
        },
      },
      500
    );
  }
});

export default migration;

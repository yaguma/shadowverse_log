/**
 * battle-logs API ルート
 * TASK-0043: battle-logs ルート実装
 *
 * @description GET/POST/DELETE /api/battle-logs エンドポイントの実装
 * 🔵 信頼性レベル: 青信号（workers/src/routes/battle-logs.ts の仕様に基づく）
 */
import type { D1Database } from '@cloudflare/workers-types';
import { Hono } from 'hono';
import { createDb } from '../db';
import { BattleLogsRepository } from '../db/repositories/battle-logs-repository';
import { NewBattleLogSchema } from '../db/schema/battle-logs.validation';

/** 環境バインディング型 */
type Bindings = {
  DB: D1Database;
};

const battleLogs = new Hono<{ Bindings: Bindings }>();

/**
 * メタ情報を生成
 */
function createMeta() {
  return {
    timestamp: new Date().toISOString(),
    requestId: crypto.randomUUID(),
  };
}

/**
 * エラーレスポンスを生成
 */
function createErrorResponse(code: string, message: string, details?: Record<string, string>) {
  return {
    success: false as const,
    error: { code, message, ...(details && { details }) },
    meta: createMeta(),
  };
}

/**
 * GET /api/battle-logs
 *
 * 対戦履歴一覧を取得
 *
 * @query limit - 取得件数（デフォルト: 100, 最大: 1000）
 * @query offset - スキップ件数（デフォルト: 0）
 * @query sortBy - ソートフィールド（デフォルト: "date"）
 * @query sortOrder - ソート順（デフォルト: "desc"）
 */
battleLogs.get('/', async (c) => {
  try {
    const { limit = '100', offset = '0' } = c.req.query();
    // Note: sortBy と sortOrder は将来の実装用にAPIで受け付けるが、
    // 現在はリポジトリが日付降順固定のため使用しない

    // パラメータ補正
    const parsedLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 100, 1), 1000);
    const parsedOffset = Math.max(Number.parseInt(offset, 10) || 0, 0);

    // データベース接続とリポジトリ初期化
    const db = createDb(c.env.DB);
    const repository = new BattleLogsRepository(db);

    // 対戦履歴を取得
    const battleLogList = await repository.findAll(parsedLimit, parsedOffset);
    const total = await repository.count();

    return c.json({
      success: true,
      data: {
        battleLogs: battleLogList,
        total,
        limit: parsedLimit,
        offset: parsedOffset,
      },
      meta: createMeta(),
    });
  } catch (error) {
    console.error('Battle logs GET error:', error);

    return c.json(
      createErrorResponse('DATABASE_ERROR', '対戦履歴の取得中にエラーが発生しました。'),
      500
    );
  }
});

/**
 * POST /api/battle-logs
 *
 * 対戦履歴を新規登録
 *
 * @body date - 対戦日（YYYY-MM-DD形式）
 * @body battleType - 対戦タイプ
 * @body rank - ランク
 * @body groupName - グループ名
 * @body myDeckId - 自分のデッキID
 * @body turn - 先攻/後攻
 * @body result - 勝敗結果
 * @body opponentDeckId - 相手のデッキID
 */
battleLogs.post('/', async (c) => {
  try {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json(
        createErrorResponse('VALIDATION_ERROR', '入力値が不正です', {
          body: 'JSONのパースに失敗しました',
        }),
        400
      );
    }

    // Zodでバリデーション
    const parseResult = NewBattleLogSchema.safeParse(body);
    if (!parseResult.success) {
      const issues = parseResult.error?.issues || [];
      return c.json(
        createErrorResponse(
          'VALIDATION_ERROR',
          '入力値が不正です',
          issues.reduce(
            (acc: Record<string, string>, err: { path: (string | number)[]; message: string }) => {
              acc[err.path.join('.') || 'unknown'] = err.message;
              return acc;
            },
            {} as Record<string, string>
          )
        ),
        400
      );
    }

    // データベース接続とリポジトリ初期化
    const db = createDb(c.env.DB);
    const repository = new BattleLogsRepository(db);

    // バリデーション済みデータをリポジトリ用の形式に変換
    const newBattleLogData = {
      id: parseResult.data.id || crypto.randomUUID(),
      userId: parseResult.data.userId || null,
      date: parseResult.data.date,
      battleType: parseResult.data.battleType,
      rank: parseResult.data.rank,
      groupName: parseResult.data.groupName,
      myDeckId: parseResult.data.myDeckId,
      turn: parseResult.data.turn,
      result: parseResult.data.result,
      opponentDeckId: parseResult.data.opponentDeckId,
    };

    // 対戦履歴を作成
    const battleLog = await repository.create(newBattleLogData);

    return c.json(
      {
        success: true,
        data: { battleLog },
        meta: createMeta(),
      },
      201
    );
  } catch (error) {
    console.error('Battle logs POST error:', error);

    return c.json(
      createErrorResponse('DATABASE_ERROR', '対戦履歴の作成中にエラーが発生しました。'),
      500
    );
  }
});

/**
 * GET /api/battle-logs/latest-season
 *
 * 最新シーズン番号を取得
 *
 * @returns latestSeason - 最新のシーズン番号（データがない場合はnull）
 */
battleLogs.get('/latest-season', async (c) => {
  try {
    // データベース接続とリポジトリ初期化
    const db = createDb(c.env.DB);
    const repository = new BattleLogsRepository(db);

    // 最新シーズンを取得
    const latestSeason = await repository.getLatestSeason();

    return c.json({
      success: true,
      data: { latestSeason },
      meta: createMeta(),
    });
  } catch (error) {
    console.error('Battle logs latest-season GET error:', error);

    return c.json(
      createErrorResponse('DATABASE_ERROR', '最新シーズンの取得中にエラーが発生しました。'),
      500
    );
  }
});

/**
 * DELETE /api/battle-logs/:id
 *
 * 対戦履歴を削除
 *
 * @param id - 対戦履歴ID
 */
battleLogs.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    // データベース接続とリポジトリ初期化
    const db = createDb(c.env.DB);
    const repository = new BattleLogsRepository(db);

    // 対戦履歴を削除
    const deleted = await repository.delete(id);

    if (!deleted) {
      return c.json(
        createErrorResponse('BATTLE_LOG_NOT_FOUND', '指定された対戦履歴が見つかりません'),
        404
      );
    }

    return c.json({
      success: true,
      data: { deletedId: id },
      meta: createMeta(),
    });
  } catch (error) {
    console.error('Battle logs DELETE error:', error);

    return c.json(
      createErrorResponse('DATABASE_ERROR', '対戦履歴の削除中にエラーが発生しました。'),
      500
    );
  }
});

export default battleLogs;

/**
 * 統計API ルート
 * TASK-0030: 統計計算API実装
 * TASK-0025: シーズン一覧取得API追加
 *
 * @description GET /api/statistics エンドポイントの実装
 * 🔵 信頼性レベル: 青信号（api-endpoints-cloudflare.md より）
 */
import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';
import { createDb } from '../db';
import { D1StatisticsService } from '../services/d1-statistics-service';
import { BattleLogsRepository } from '../db/repositories/battle-logs-repository';

/** 環境バインディング型 */
type Bindings = {
  DB: D1Database;
};

const statistics = new Hono<{ Bindings: Bindings }>();

/**
 * 日付形式の検証（YYYY-MM-DD）
 */
function isValidDateFormat(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }
  const date = new Date(dateString);
  return !Number.isNaN(date.getTime());
}

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
function createErrorResponse(code: string, message: string) {
  return {
    success: false as const,
    error: { code, message },
    meta: createMeta(),
  };
}

/**
 * GET /api/statistics/seasons
 * TASK-0025: シーズン一覧取得API実装
 *
 * 対戦履歴から重複を排除したシーズン一覧を降順で取得
 *
 * @returns シーズン番号の配列（降順）
 */
statistics.get('/seasons', async (c) => {
  try {
    // データベース接続とリポジトリ初期化
    const db = createDb(c.env.DB);
    const battleLogsRepo = new BattleLogsRepository(db);

    // シーズン一覧取得
    const seasons = await battleLogsRepo.getSeasonsList();

    return c.json({
      success: true,
      data: {
        seasons,
      },
      meta: createMeta(),
    });
  } catch (error) {
    console.error('Seasons API error:', error);

    return c.json(
      createErrorResponse('DATABASE_ERROR', 'シーズン一覧の取得中にエラーが発生しました。'),
      500
    );
  }
});

/**
 * GET /api/statistics
 *
 * 統計データを取得
 *
 * @query startDate - 開始日（YYYY-MM-DD）
 * @query endDate - 終了日（YYYY-MM-DD）
 * @query battleType - 対戦タイプ
 * @query season - シーズン番号（1以上の整数）
 */
statistics.get('/', async (c) => {
  try {
    const { startDate, endDate, battleType, season } = c.req.query();

    // バリデーション: 日付形式チェック
    if (startDate && !isValidDateFormat(startDate)) {
      return c.json(
        createErrorResponse(
          'INVALID_DATE_FORMAT',
          '日付形式が不正です。YYYY-MM-DD形式で指定してください。'
        ),
        400
      );
    }

    if (endDate && !isValidDateFormat(endDate)) {
      return c.json(
        createErrorResponse(
          'INVALID_DATE_FORMAT',
          '日付形式が不正です。YYYY-MM-DD形式で指定してください。'
        ),
        400
      );
    }

    // バリデーション: 日付範囲チェック
    if (startDate && endDate && startDate > endDate) {
      return c.json(
        createErrorResponse('INVALID_DATE_RANGE', '開始日は終了日より前の日付を指定してください。'),
        400
      );
    }

    // バリデーション: シーズンチェック
    if (
      season &&
      (Number.isNaN(Number(season)) || Number(season) < 1 || !Number.isInteger(Number(season)))
    ) {
      return c.json(
        createErrorResponse('INVALID_SEASON', 'シーズンは1以上の整数で指定してください。'),
        400
      );
    }

    // データベース接続とサービス初期化
    const db = createDb(c.env.DB);
    const service = new D1StatisticsService(db);

    // 統計データ取得
    const stats = await service.getStatistics({
      startDate,
      endDate,
      battleType,
      season: season ? Number(season) : undefined,
    });

    return c.json({
      success: true,
      data: stats,
      meta: createMeta(),
    });
  } catch (error) {
    console.error('Statistics API error:', error);

    return c.json(
      createErrorResponse('DATABASE_ERROR', '統計データの取得中にエラーが発生しました。'),
      500
    );
  }
});

export default statistics;

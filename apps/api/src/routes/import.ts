/**
 * インポートAPIルート
 * TASK-0031: インポートAPI実装
 *
 * @description POST /api/import エンドポイント
 */
import { Hono } from 'hono';
import { z } from 'zod';
import type { D1Database } from '@cloudflare/workers-types';
import { createDb } from '../db';
import { D1ImportService } from '../services/d1-import-service';

/**
 * 環境バインディング型
 */
interface Env {
  DB: D1Database;
}

/**
 * エラーコード定数
 */
const ERROR_CODES = {
  INVALID_REQUEST: 'INVALID_REQUEST',
  INVALID_FORMAT: 'INVALID_FORMAT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

/**
 * エラーメッセージ定数
 */
const ERROR_MESSAGES = {
  FORMAT_REQUIRED: 'format パラメータは必須です',
  DATA_REQUIRED: 'data パラメータは必須です',
  FORMAT_INVALID: "format は 'json' または 'csv' である必要があります",
  SERVER_ERROR: 'サーバーエラーが発生しました',
} as const;

/**
 * フォーマットのエラーメッセージパターン
 */
const FORMAT_ERROR_PATTERNS = [
  'JSON形式が不正です',
  '必須ヘッダーが不足しています',
  'CSVデータが空です',
];

/**
 * リクエストバリデーションスキーマ
 */
const importRequestSchema = z.object({
  format: z.enum(['json', 'csv'], {
    error: ERROR_MESSAGES.FORMAT_INVALID,
  }),
  data: z.string().min(1, ERROR_MESSAGES.DATA_REQUIRED),
});

/**
 * インポートAPIルート
 */
const importRoutes = new Hono<{ Bindings: Env }>();

/**
 * POST /api/import
 * データインポートエンドポイント
 */
importRoutes.post('/', async (c) => {
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  try {
    const body = await c.req.json();

    // format未指定チェック
    if (!body.format) {
      return c.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.INVALID_REQUEST,
            message: ERROR_MESSAGES.FORMAT_REQUIRED,
          },
          meta: { timestamp, requestId },
        },
        400
      );
    }

    // data未指定チェック
    if (!body.data) {
      return c.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.INVALID_REQUEST,
            message: ERROR_MESSAGES.DATA_REQUIRED,
          },
          meta: { timestamp, requestId },
        },
        400
      );
    }

    // バリデーション
    const validation = importRequestSchema.safeParse(body);

    if (!validation.success) {
      // Zod v4では issues を使用
      const issues = validation.error.issues || [];
      const firstError = issues[0];
      const errorCode =
        firstError?.path[0] === 'format' ? ERROR_CODES.INVALID_FORMAT : ERROR_CODES.INVALID_REQUEST;

      return c.json(
        {
          success: false,
          error: {
            code: errorCode,
            message: firstError?.message || 'バリデーションエラー',
          },
          meta: { timestamp, requestId },
        },
        400
      );
    }

    const { format, data } = validation.data;

    // D1データベース接続
    const db = createDb(c.env.DB);
    const importService = new D1ImportService(db);

    // インポート実行
    const result =
      format === 'json'
        ? await importService.importFromJson(data)
        : await importService.importFromCsv(data);

    return c.json({
      success: true,
      data: result,
      meta: { timestamp, requestId },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // フォーマットエラーかどうか判定
    const isFormatError = FORMAT_ERROR_PATTERNS.some((pattern) => errorMessage.includes(pattern));

    if (isFormatError) {
      return c.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.INVALID_FORMAT,
            message: errorMessage,
          },
          meta: { timestamp, requestId },
        },
        400
      );
    }

    // その他のエラー（DB接続エラーなど）
    return c.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: errorMessage,
        },
        meta: { timestamp, requestId },
      },
      500
    );
  }
});

export default importRoutes;

/**
 * Battle Logs API - 対戦履歴エンドポイント
 *
 * GET /api/battle-logs - 対戦履歴一覧を取得
 * POST /api/battle-logs - 新規対戦履歴を作成
 * DELETE /api/battle-logs/:id - 対戦履歴を削除
 */

import {
  type HttpRequest,
  type HttpResponseInit,
  type InvocationContext,
  app,
} from '@azure/functions';
import { BattleLogService } from '../services/battleLogService';
import { BlobStorageClient } from '../storage/blobStorageClient';
import type { ApiResponse } from '../types';

/**
 * APIエラーコード定数
 */
const API_ERROR_CODES = {
  INVALID_REQUEST: 'INVALID_REQUEST',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;

/**
 * BattleLogServiceを初期化
 *
 * @returns BattleLogServiceインスタンス
 */
function initializeBattleLogService(): BattleLogService {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME ?? 'shadowverse-data';
  const blobClient = new BlobStorageClient(connectionString, containerName);
  return new BattleLogService(blobClient);
}

/**
 * GET /api/battle-logs - 対戦履歴一覧を取得
 */
export async function getBattleLogs(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const battleLogService = initializeBattleLogService();

    // クエリパラメータを取得
    const limit = request.query.get('limit');
    const offset = request.query.get('offset');
    const sortBy = request.query.get('sortBy');
    const sortOrder = request.query.get('sortOrder');

    // パラメータを数値に変換（型安全に処理）
    const params: {
      limit?: number;
      offset?: number;
      sortBy?: 'date' | 'battleType' | 'rank' | 'group' | 'turn' | 'result';
      sortOrder?: 'asc' | 'desc';
    } = {
      limit: limit ? Number.parseInt(limit, 10) : undefined,
      offset: offset ? Number.parseInt(offset, 10) : undefined,
      sortBy: sortBy ? (sortBy as 'date' | 'battleType' | 'rank' | 'group' | 'turn' | 'result') : undefined,
      sortOrder: sortOrder ? (sortOrder as 'asc' | 'desc') : undefined,
    };

    // 対戦履歴を取得
    const result = await battleLogService.getBattleLogsWithDeckNames(params);

    // 成功レスポンス
    return createSuccessResponse(result, context);
  } catch (error) {
    // エラーハンドリング
    context.error('Error in getBattleLogs:', error);

    if (error instanceof Error && error.message.includes('validation')) {
      // バリデーションエラー
      return createErrorResponse(
        400,
        API_ERROR_CODES.INVALID_REQUEST,
        error.message,
        context
      );
    }

    // その他のエラー
    return createErrorResponse(
      500,
      API_ERROR_CODES.INTERNAL_SERVER_ERROR,
      error instanceof Error ? error.message : 'サーバーエラーが発生しました',
      context
    );
  }
}

/**
 * POST /api/battle-logs - 新規対戦履歴を作成
 */
export async function createBattleLog(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const battleLogService = initializeBattleLogService();

    // リクエストボディを取得
    const body = (await request.json()) as {
      battleType: 'ランクマッチ' | '対戦台' | 'ロビー大会';
      rank: 'サファイア' | 'ダイアモンド' | 'ルビー' | 'トパーズ' | '-';
      group: '-' | 'A' | 'AA' | 'AAA' | 'Master';
      myDeckId: string;
      turn: '先攻' | '後攻';
      result: '勝ち' | '負け';
      opponentDeckId: string;
      date?: string;
    };

    // 対戦履歴を作成
    const result = await battleLogService.createBattleLog(body);

    // 成功レスポンス
    return createSuccessResponse(result, context);
  } catch (error) {
    // エラーハンドリング
    context.error('Error in createBattleLog:', error);

    if (error instanceof Error && error.message.includes('validation')) {
      // バリデーションエラー
      return createErrorResponse(
        400,
        API_ERROR_CODES.INVALID_REQUEST,
        error.message,
        context
      );
    }

    // その他のエラー
    return createErrorResponse(
      500,
      API_ERROR_CODES.INTERNAL_SERVER_ERROR,
      error instanceof Error ? error.message : 'サーバーエラーが発生しました',
      context
    );
  }
}

/**
 * DELETE /api/battle-logs/:id - 対戦履歴を削除
 */
export async function deleteBattleLog(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const battleLogService = initializeBattleLogService();

    // パスパラメータからIDを取得
    const id = request.params.id;

    if (!id) {
      return createErrorResponse(
        400,
        API_ERROR_CODES.INVALID_REQUEST,
        '対戦履歴IDが指定されていません',
        context
      );
    }

    // 対戦履歴を削除
    const result = await battleLogService.deleteBattleLog(id);

    // 成功レスポンス
    return createSuccessResponse(result, context);
  } catch (error) {
    // エラーハンドリング
    context.error('Error in deleteBattleLog:', error);

    if (error instanceof Error && error.message.includes('見つかりません')) {
      // 404エラー
      return createErrorResponse(
        404,
        API_ERROR_CODES.NOT_FOUND,
        error.message,
        context
      );
    }

    // その他のエラー
    return createErrorResponse(
      500,
      API_ERROR_CODES.INTERNAL_SERVER_ERROR,
      error instanceof Error ? error.message : 'サーバーエラーが発生しました',
      context
    );
  }
}

/**
 * 成功レスポンスを作成
 *
 * @param data - レスポンスデータ
 * @param context - InvocationContext
 * @returns HttpResponseInit
 */
function createSuccessResponse(data: unknown, context: InvocationContext): HttpResponseInit {
  const response: ApiResponse<unknown> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: context.invocationId,
    },
  };

  return {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(response),
  };
}

/**
 * エラーレスポンスを作成
 *
 * @param status - HTTPステータスコード
 * @param code - エラーコード
 * @param message - エラーメッセージ
 * @param context - InvocationContext
 * @returns HttpResponseInit
 */
function createErrorResponse(
  status: number,
  code: string,
  message: string,
  context: InvocationContext
): HttpResponseInit {
  const response: ApiResponse<never> = {
    success: false,
    error: {
      code,
      message,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: context.invocationId,
    },
  };

  return {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(response),
  };
}

// Azure Functions v4 登録
app.http('getBattleLogs', {
  methods: ['GET'],
  route: 'battle-logs',
  authLevel: 'anonymous',
  handler: getBattleLogs,
});

app.http('createBattleLog', {
  methods: ['POST'],
  route: 'battle-logs',
  authLevel: 'anonymous',
  handler: createBattleLog,
});

app.http('deleteBattleLog', {
  methods: ['DELETE'],
  route: 'battle-logs/{id}',
  authLevel: 'anonymous',
  handler: deleteBattleLog,
});

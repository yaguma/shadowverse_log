/**
 * Battle Logs API - 対戦履歴エンドポイント
 *
 * GET /api/battle-logs - 対戦履歴一覧を取得
 */

import { InvocationContext, HttpRequest, HttpResponseInit } from '@azure/functions';
import { BattleLogService } from '../libs/services/battleLogService';
import { BlobStorageClient } from '../libs/storage/blobStorageClient';
import type { ApiResponse } from '../libs/types';

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
export default async function httpTrigger(context: InvocationContext, req: HttpRequest): Promise<HttpResponseInit> {
    context.error('start getBattleLogs.');
  try {
    const battleLogService = initializeBattleLogService();

    // クエリパラメータを取得
    const limit = req.query.get("limit");
    const offset = req.query.get("offset");
    const sortBy = req.query.get("sortBy");
    const sortOrder = req.query.get("sortOrder");

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
 * 成功レスポンスを作成
 *
 * @param data - レスポンスデータ
 * @param context - InvocationContext
 * @returns レスポンスオブジェクト
 */
function createSuccessResponse(data: unknown, context: InvocationContext) {
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
 * @returns レスポンスオブジェクト
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
    body: JSON.stringify(response),
  };
}


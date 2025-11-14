/**
 * Battle Logs API - 対戦履歴エンドポイント
 *
 * DELETE /api/battle-logs/:id - 対戦履歴を削除
 */

import { InvocationContext, HttpRequest, HttpResponseInit } from '@azure/functions';
import { BattleLogService } from '../../services/battleLogService';
import { BlobStorageClient } from '../../storage/blobStorageClient';
import type { ApiResponse } from '../../types';

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
 * DELETE /api/battle-logs/:id - 対戦履歴を削除
 */
export async function httpTrigger(context: InvocationContext, req: HttpRequest): Promise<HttpResponseInit> {
  try {
    const battleLogService = initializeBattleLogService();

    // パスパラメータからIDを取得
    const id = req.params.id;

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
 * @param context - Context
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
) {
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


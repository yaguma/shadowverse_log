/**
 * Battle Logs API - 対戦履歴エンドポイント
 *
 * POST /api/battle-logs - 新規対戦履歴を作成
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
 * POST /api/battle-logs - 新規対戦履歴を作成
 */
export async function httpTrigger(context: InvocationContext, req: HttpRequest): Promise<HttpResponseInit> {
  try {
    const battleLogService = initializeBattleLogService();

    // リクエストボディを取得
    const body = (await req.json()) as {
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


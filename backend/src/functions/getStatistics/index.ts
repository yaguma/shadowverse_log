/**
 * Azure Functions エンドポイント - Statistics API
 *
 * 【機能概要】: GET /api/statistics エンドポイント
 * 対戦履歴から統計情報を計算し、JSON形式で返却する
 *
 * 【実装方針】: TDD Greenフェーズとして、要件を満たす最小限の実装
 *
 * 🔵 信頼性レベル: 青信号（requirements.md Lines 76-336 より）
 */

import { InvocationContext, HttpRequest, HttpResponseInit } from '@azure/functions';
import { StatisticsService } from '../../services/statisticsService';
import { BlobStorageClient } from '../../storage/blobStorageClient';
import type { ApiResponse, StatisticsResponse } from '../../types';

/**
 * 【Azure Functions ハンドラ】: GET /api/statistics
 *
 * 【機能概要】:
 * 1. クエリパラメータを取得（startDate, endDate, battleType）
 * 2. StatisticsService を呼び出して統計を計算
 * 3. ApiResponse 形式で返却
 *
 * 【実装方針】:
 * - クエリパラメータのバリデーションは省略（Phase 1）
 * - エラーハンドリング: 500 Internal Server Error
 *
 * 🔵 信頼性レベル: 青信号（requirements.md Lines 82-336 より）
 *
 * @param context - Azure Functions 実行コンテキスト
 * @param req - HTTPリクエスト
 */
export async function httpTrigger(context: InvocationContext, req: HttpRequest): Promise<HttpResponseInit> {
  try {
    // 【クエリパラメータ取得】: startDate, endDate, battleType を取得
    // 🔵 信頼性レベル: 青信号（requirements.md Lines 89-116 より）
    const startDate = req.query.get("startDate") ?? undefined;
    const endDate = req.query.get("endDate") ?? undefined;
    const battleType = req.query.get("battleType") ?? undefined;

    // 【環境変数取得】: Azure Storage 接続文字列とコンテナ名
    // 🔵 信頼性レベル: 青信号（requirements.md Lines 362-365 より）
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING ?? '';
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME ?? 'shadowverse-data';

    // 【サービス初期化】: BlobStorageClient と StatisticsService のインスタンス作成
    // 🔵 信頼性レベル: 青信号
    const blobClient = new BlobStorageClient(connectionString, containerName);
    const statisticsService = new StatisticsService(blobClient);

    // 【統計計算】: calculateStatistics() メソッドを呼び出す
    // 🔵 信頼性レベル: 青信号
    const statistics = await statisticsService.calculateStatistics({
      startDate,
      endDate,
      battleType,
    });

    // 【レスポンス構築】: ApiResponse 形式で返却
    // 🔵 信頼性レベル: 青信号（requirements.md Lines 120-210 より）
    const response: ApiResponse<StatisticsResponse> = {
      success: true,
      data: statistics,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: context.invocationId,
      },
    };

    // 【正常レスポンス】: 200 OK
    // 🔵 信頼性レベル: 青信号
    return {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    // 【エラーハンドリング】: 500 Internal Server Error
    // 【エラーメッセージ】: ユーザーフレンドリーなメッセージを返却
    // 🔵 信頼性レベル: 青信号（requirements.md Lines 243-257 より）
    context.error('Error in getStatistics:', error);

    const errorResponse: ApiResponse<never> = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'サーバーエラーが発生しました',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: context.invocationId,
      },
    };

    return {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorResponse),
    };
  }
}


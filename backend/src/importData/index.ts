/**
 * Import API - データインポートエンドポイント
 *
 * POST /api/import
 * JSON/CSV形式のデータをインポートする
 */

import { InvocationContext, HttpResponseInit, HttpRequest } from '@azure/functions';
import { ImportService } from '../libs/services/importService';
import { BlobStorageClient } from '../libs/storage/blobStorageClient';

/**
 * APIエラーコード定数
 */
const API_ERROR_CODES = {
  INVALID_REQUEST: 'INVALID_REQUEST',
  INVALID_FORMAT: 'INVALID_FORMAT',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;

/**
 * APIエラーメッセージ定数
 */
const API_ERROR_MESSAGES = {
  FORMAT_REQUIRED: 'format パラメータは必須です',
  DATA_REQUIRED: 'data パラメータは必須です',
  FORMAT_INVALID: "format は 'json' または 'csv' である必要があります",
  SERVER_ERROR: 'サーバーエラーが発生しました',
} as const;

/**
 * 有効なフォーマット型
 */
type ValidFormat = 'json' | 'csv';

/**
 * リクエストボディの型定義
 */
interface ImportRequestBody {
  format?: string;
  data?: string;
}

/**
 * POST /api/import - データインポートAPI
 */
export async function httpTrigger(context: InvocationContext, req: HttpRequest): Promise<HttpResponseInit> {
  try {
    // Blob Storage クライアント初期化
    const importService = initializeImportService();

    // リクエストボディ取得
    const body = req.body as ImportRequestBody;

    // リクエストバリデーション
    const validationError = validateRequestBody(body);
    if (validationError) {
      return createErrorResponse(
        validationError.status,
        validationError.code,
        validationError.message,
        context
      );
    }

    // インポート実行
    try {
      const result = await executeImport(
        importService,
        body.format as ValidFormat,
        body.data as string,
        context
      );
      // 成功レスポンス
      return createSuccessResponse(result, context);
    } catch (error) {
      // executeImportからのエラーレスポンス
      if (isHttpResponse(error)) {
        return error;
      }
      throw error;
    }
  } catch (error) {
    // 予期しないエラー（サーバーエラー）
    context.error('Error in importData:', error);

    return createErrorResponse(
      500,
      API_ERROR_CODES.INTERNAL_SERVER_ERROR,
      error instanceof Error ? error.message : API_ERROR_MESSAGES.SERVER_ERROR,
      context
    );
  }
}

/**
 * ImportServiceを初期化
 *
 * @returns ImportServiceインスタンス
 */
function initializeImportService(): ImportService {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
  const containerName = 'shadowverse-data';
  const blobClient = new BlobStorageClient(connectionString, containerName);
  return new ImportService(blobClient);
}

/**
 * リクエストボディをバリデート
 *
 * @param body - リクエストボディ
 * @returns バリデーションエラー（エラーがない場合はnull）
 */
function validateRequestBody(
  body: ImportRequestBody
): { status: number; code: string; message: string } | null {
  // format パラメータチェック
  if (!body.format) {
    return {
      status: 400,
      code: API_ERROR_CODES.INVALID_REQUEST,
      message: API_ERROR_MESSAGES.FORMAT_REQUIRED,
    };
  }

  // data パラメータチェック
  if (!body.data) {
    return {
      status: 400,
      code: API_ERROR_CODES.INVALID_REQUEST,
      message: API_ERROR_MESSAGES.DATA_REQUIRED,
    };
  }

  // format 値チェック
  if (body.format !== 'json' && body.format !== 'csv') {
    return {
      status: 400,
      code: API_ERROR_CODES.INVALID_FORMAT,
      message: API_ERROR_MESSAGES.FORMAT_INVALID,
    };
  }

  return null;
}

/**
 * インポート処理を実行
 *
 * @param importService - ImportServiceインスタンス
 * @param format - データフォーマット
 * @param data - インポートデータ
 * @param context - InvocationContext
 * @returns インポート結果
 * @throws エラーレスポンスオブジェクト
 */
async function executeImport(
  importService: ImportService,
  format: ValidFormat,
  data: string,
  context: InvocationContext
) {
  try {
    if (format === 'json') {
      return await importService.importFromJson(data);
    }
    return await importService.importFromCsv(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'データインポートに失敗しました';

    // Blob Storageエラーの場合は500を返す
    if (isBlobStorageError(errorMessage)) {
      context.error('Blob Storage error in importData:', error);
      throw createErrorResponse(500, API_ERROR_CODES.INTERNAL_SERVER_ERROR, errorMessage, context);
    }

    // その他のエラー（JSON形式エラー、CSVヘッダー不足など）は400を返す
    throw createErrorResponse(400, API_ERROR_CODES.INVALID_FORMAT, errorMessage, context);
  }
}

/**
 * Blob Storageエラーかどうかを判定
 *
 * @param errorMessage - エラーメッセージ
 * @returns Blob Storageエラーの場合true
 */
function isBlobStorageError(errorMessage: string): boolean {
  return errorMessage.includes('Blob Storage');
}

/**
 * HTTPレスポンスオブジェクトかどうかを判定
 *
 * @param value - 判定対象の値
 * @returns HTTPレスポンスオブジェクトの場合true
 */
function isHttpResponse(value: unknown): value is { status: number; body: string } {
  return typeof value === 'object' && value !== null && 'status' in value && 'body' in value;
}

/**
 * 成功レスポンスを作成
 *
 * @param data - レスポンスデータ
 * @param context - InvocationContext
 * @returns レスポンスオブジェクト
 */
function createSuccessResponse(data: unknown, context: InvocationContext) {
  return {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: context.invocationId,
      },
    }),
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
  return {
    status,
    body: JSON.stringify({
      success: false,
      error: {
        code,
        message,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: context.invocationId,
      },
    }),
  };
}


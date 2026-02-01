/**
 * API レスポンスユーティリティ
 *
 * 共通のレスポンス生成関数を提供
 * Issue 1: レスポンス生成関数の重複解消
 */

/**
 * メタ情報の型
 */
export interface ResponseMeta {
  timestamp: string;
  requestId: string;
  count?: number;
}

/**
 * 成功レスポンスの型
 */
export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta: ResponseMeta;
}

/**
 * エラーレスポンスの型
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: ResponseMeta;
}

/**
 * メタ情報を生成
 * @param count - オプションのカウント値
 * @returns メタ情報オブジェクト
 */
export function createMeta(count?: number): ResponseMeta {
  return {
    timestamp: new Date().toISOString(),
    requestId: crypto.randomUUID(),
    ...(count !== undefined && { count }),
  };
}

/**
 * エラーレスポンスを生成
 * @param code - エラーコード
 * @param message - エラーメッセージ
 * @param details - 追加の詳細情報
 * @returns エラーレスポンスオブジェクト
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: unknown
): ErrorResponse {
  return {
    success: false as const,
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
    },
    meta: createMeta(),
  };
}

/**
 * 成功レスポンスを生成
 * @param data - レスポンスデータ
 * @param count - オプションのカウント値
 * @returns 成功レスポンスオブジェクト
 */
export function createSuccessResponse<T>(data: T, count?: number): SuccessResponse<T> {
  return {
    success: true as const,
    data,
    meta: createMeta(count),
  };
}

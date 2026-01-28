/**
 * APIエラーハンドリングフック
 *
 * API呼び出しで発生したエラーを管理し、日本語メッセージに変換するフック。
 * ValidationErrorの場合はフィールド別のエラーメッセージも提供する。
 */

import type { ValidationError } from '@shadowverse-log/shared';
import {
  getValidationErrorMessages,
  isValidationError,
  translateApiError,
} from '@shadowverse-log/shared';
import { useCallback, useState } from 'react';

/**
 * useApiErrorフックの戻り値の型定義
 */
export interface UseApiErrorReturn {
  /** エラーメッセージ（日本語） */
  error: string | null;
  /** フィールド別のエラーメッセージ */
  fieldErrors: Record<string, string>;
  /** エラーを設定する関数 */
  setError: (error: unknown) => void;
  /** エラーをクリアする関数 */
  clearError: () => void;
  /** ValidationErrorかどうか */
  isValidationError: boolean;
}

/**
 * APIエラーハンドリングフック
 *
 * @returns エラー状態とエラー操作関数を含むオブジェクト
 */
export function useApiError(): UseApiErrorReturn {
  const [error, setErrorState] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isValidation, setIsValidation] = useState(false);

  const setError = useCallback((err: unknown) => {
    const message = translateApiError(err);
    setErrorState(message);

    if (isValidationError(err)) {
      setFieldErrors(getValidationErrorMessages(err as ValidationError));
      setIsValidation(true);
    } else {
      setFieldErrors({});
      setIsValidation(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setErrorState(null);
    setFieldErrors({});
    setIsValidation(false);
  }, []);

  return {
    error,
    fieldErrors,
    setError,
    clearError,
    isValidationError: isValidation,
  };
}

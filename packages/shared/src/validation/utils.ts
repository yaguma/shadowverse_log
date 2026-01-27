import type { ZodSchema, ZodError } from 'zod';
import type { ValidationError } from '../types/api.js';

/**
 * Zodバリデーションエラーを ValidationError 形式に変換する
 * REQ-EXT-403 対応
 */
export function zodErrorToValidationError(zodError: ZodError): ValidationError {
  return {
    code: 'VALIDATION_ERROR',
    message: 'バリデーションエラー',
    details: zodError.issues.map((err) => ({
      field: err.path.join('.'),
      constraint: err.code,
      value: undefined,
    })),
  };
}

/**
 * データをバリデーションし、エラーがあればValidationErrorを返す
 */
export function validate<T>(
  schema: ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: ValidationError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: zodErrorToValidationError(result.error) };
}

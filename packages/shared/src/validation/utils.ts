import type { ZodError, ZodSchema } from 'zod';
import type { ValidationError, ValidationErrorDetail } from '../types/api.js';

/**
 * ZodIssueから関連する値を取得する
 */
function getIssueValue(issue: Record<string, unknown>): unknown {
  // ZodIssueの種類に応じて値を取得
  if ('received' in issue) return issue.received;
  if ('minimum' in issue) return issue.minimum;
  if ('maximum' in issue) return issue.maximum;
  if ('min' in issue) return issue.min;
  if ('max' in issue) return issue.max;
  return undefined;
}

/**
 * ZodIssueから日本語メッセージを生成する
 */
function getJapaneseMessage(issue: Record<string, unknown>): string {
  const code = issue.code as string;
  const message = issue.message as string | undefined;

  switch (code) {
    case 'invalid_type': {
      const received = issue.received;
      if (received === 'undefined' || received === 'null') {
        return '必須項目です';
      }
      const expected = issue.expected;
      return typeof expected === 'string'
        ? `${expected}型で入力してください`
        : '型が正しくありません';
    }

    case 'too_small': {
      const minimum = issue.minimum ?? issue.min;
      const originType = issue.type ?? issue.origin;
      if (originType === 'string') {
        return `${minimum}文字以上で入力してください`;
      }
      return `${minimum}以上の値を入力してください`;
    }

    case 'too_big': {
      const maximum = issue.maximum ?? issue.max;
      const originType = issue.type ?? issue.origin;
      if (originType === 'string') {
        return `${maximum}文字以下で入力してください`;
      }
      return `${maximum}以下の値を入力してください`;
    }

    case 'invalid_enum_value':
    case 'invalid_value':
      return '無効な値です';

    case 'invalid_string':
    case 'invalid_format':
      return message || '無効な文字列形式です';

    default:
      return message || `バリデーションエラー: ${code}`;
  }
}

/**
 * Zodバリデーションエラーを ValidationError 形式に変換する
 * REQ-EXT-403 対応
 */
export function zodErrorToValidationError(zodError: ZodError): ValidationError {
  return {
    code: 'VALIDATION_ERROR',
    message: 'バリデーションエラー',
    details: zodError.issues.map((issue): ValidationErrorDetail => {
      // issueをRecord型として扱う
      const issueRecord = issue as unknown as Record<string, unknown>;

      // pathを(string | number)[]に変換
      const path = (issueRecord.path as unknown[]).map((p) =>
        typeof p === 'symbol' ? String(p) : (p as string | number)
      );

      return {
        field: path.join('.'),
        constraint: issue.code,
        value: getIssueValue(issueRecord),
        message: getJapaneseMessage(issueRecord),
      };
    }),
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

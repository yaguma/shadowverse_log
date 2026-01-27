/**
 * エラーハンドリング共通コンポーネント
 *
 * デッキ管理機能で使用するエラーハンドリングの共通関数を提供する。
 * - ValidationErrorのパース処理
 * - DeleteConstraintErrorのパース処理
 * - エラーメッセージの日本語変換
 */

import type { ValidationError, DeleteConstraintError } from '../types/api.js';

/**
 * APIエラーレスポンスがValidationErrorかどうかを判定する
 */
export function isValidationError(error: unknown): error is ValidationError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as ValidationError).code === 'VALIDATION_ERROR'
  );
}

/**
 * APIエラーレスポンスがDeleteConstraintErrorかどうかを判定する
 */
export function isDeleteConstraintError(error: unknown): error is DeleteConstraintError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as DeleteConstraintError).code === 'DELETE_CONSTRAINT_ERROR'
  );
}

/**
 * バリデーション制約を日本語メッセージに変換する
 */
export function translateValidationConstraint(constraint: string, value: unknown): string {
  const translations: Record<string, string> = {
    required: '必須項目です',
    minLength: `${value}文字以上で入力してください`,
    maxLength: `${value}文字以下で入力してください`,
    invalidClassName: '無効なクラス名です',
  };
  return translations[constraint] ?? `バリデーションエラー: ${constraint}`;
}

/**
 * ValidationErrorからフィールド別のエラーメッセージを取得する
 */
export function getValidationErrorMessages(error: ValidationError): Record<string, string> {
  const messages: Record<string, string> = {};
  for (const detail of error.details) {
    messages[detail.field] = translateValidationConstraint(detail.constraint, detail.value);
  }
  return messages;
}

/**
 * DeleteConstraintErrorから参照数を取得する
 */
export function getReferenceCount(error: DeleteConstraintError): number {
  return error.details.referenceCount;
}

/**
 * DeleteConstraintErrorからエンティティタイプを取得する
 */
export function getEntityType(error: DeleteConstraintError): 'deckMaster' | 'myDeck' {
  return error.details.entityType;
}

/**
 * 削除制約エラーを日本語メッセージに変換する
 */
export function translateDeleteConstraintError(error: DeleteConstraintError): string {
  const entityTypeLabels: Record<string, string> = {
    deckMaster: 'デッキ種別',
    myDeck: '使用デッキ',
  };
  const entityLabel = entityTypeLabels[error.details.entityType] ?? error.details.entityType;
  return `この${entityLabel}は${error.details.referenceCount}件の対戦履歴で使用されているため削除できません`;
}

/**
 * APIエラーを日本語メッセージに変換する
 */
export function translateApiError(error: unknown): string {
  if (isValidationError(error)) {
    const messages = Object.values(getValidationErrorMessages(error));
    return messages.join('、');
  }
  if (isDeleteConstraintError(error)) {
    return translateDeleteConstraintError(error);
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return (error as { message: string }).message;
  }
  return 'エラーが発生しました';
}

/**
 * エラーハンドリング共通コンポーネント
 *
 * デッキ管理機能で使用するエラーハンドリングの共通関数を提供する。
 * - ValidationErrorのパース処理
 * - DeleteConstraintErrorのパース処理
 * - エラーメッセージの日本語変換
 */

import type { DeleteConstraintError, ValidationError } from '../types/api.js';

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
 * Zodのエラーコードに対応
 */
export function translateValidationConstraint(constraint: string, value: unknown): string {
  switch (constraint) {
    case 'invalid_type':
      return '必須項目です';
    case 'too_small':
      return typeof value === 'number'
        ? `${value}文字以上で入力してください`
        : '入力値が短すぎます';
    case 'too_big':
      return typeof value === 'number'
        ? `${value}文字以下で入力してください`
        : '入力値が長すぎます';
    case 'invalid_enum_value':
      return '無効な値です';
    case 'invalid_string':
      return '無効な文字列形式です';
    // 後方互換性のための旧キー
    case 'required':
      return '必須項目です';
    case 'minLength':
      return typeof value === 'number'
        ? `${value}文字以上で入力してください`
        : '入力値が短すぎます';
    case 'maxLength':
      return typeof value === 'number'
        ? `${value}文字以下で入力してください`
        : '入力値が長すぎます';
    case 'invalidClassName':
      return '無効なクラス名です';
    default:
      return `バリデーションエラー: ${constraint}`;
  }
}

/**
 * ValidationErrorからフィールド別のエラーメッセージを取得する
 */
export function getValidationErrorMessages(error: ValidationError): Record<string, string> {
  const messages: Record<string, string> = {};
  for (const detail of error.details) {
    // detailにmessageがあればそれを使用、なければ旧方式でメッセージを生成
    messages[detail.field] =
      detail.message || translateValidationConstraint(detail.constraint, detail.value);
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

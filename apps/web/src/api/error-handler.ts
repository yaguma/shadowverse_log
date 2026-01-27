/**
 * APIエラーハンドリングユーティリティ
 * 【機能概要】: APIエラーレスポンスをユーザーフレンドリーなメッセージに変換
 * 【TASK-0004】: APIクライアント共通処理拡張
 * 🔵 信頼性レベル: TASK-0002のエラーハンドリング設計に基づく
 */

import type { ValidationError, DeleteConstraintError } from '@shadowverse-log/shared';

/**
 * 【機能概要】: APIエラーレスポンスがValidationErrorかどうかを判定する
 * 【実装方針】: code === 'VALIDATION_ERROR' で判定
 * 🔵 信頼性レベル: interfaces.ts REQ-EXT-403対応
 *
 * @param error - APIから返されたエラー
 * @returns ValidationErrorの場合はtrue
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
 * 【機能概要】: APIエラーレスポンスがDeleteConstraintErrorかどうかを判定する
 * 【実装方針】: code === 'DELETE_CONSTRAINT_ERROR' で判定
 * 🔵 信頼性レベル: interfaces.ts REQ-EXT-401, REQ-EXT-402対応
 *
 * @param error - APIから返されたエラー
 * @returns DeleteConstraintErrorの場合はtrue
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
 * 【機能概要】: バリデーション制約を日本語メッセージに変換する
 * 【実装方針】: 制約名に対応する日本語メッセージを返す
 * 🔵 信頼性レベル: ユーザビリティ要件として確定
 *
 * @param constraint - 制約名（required, minLength, maxLength, etc.）
 * @param value - 制約値
 * @returns 日本語エラーメッセージ
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
 * 【機能概要】: ValidationErrorからフィールド別のエラーメッセージを取得する
 * 【実装方針】: detailsを走査し、フィールド名をキーとしたメッセージマップを返す
 * 🔵 信頼性レベル: interfaces.ts REQ-EXT-403対応
 *
 * @param error - ValidationErrorオブジェクト
 * @returns フィールド名をキーとした日本語エラーメッセージのマップ
 */
export function getValidationErrorMessages(error: ValidationError): Record<string, string> {
  const messages: Record<string, string> = {};
  for (const detail of error.details) {
    messages[detail.field] = translateValidationConstraint(detail.constraint, detail.value);
  }
  return messages;
}

/**
 * 【機能概要】: 削除制約エラーを日本語メッセージに変換する
 * 【実装方針】: entityTypeとreferenceCountを使って日本語メッセージを生成
 * 🔵 信頼性レベル: interfaces.ts REQ-EXT-401, REQ-EXT-402対応
 *
 * @param error - DeleteConstraintErrorオブジェクト
 * @returns 日本語エラーメッセージ
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
 * 【機能概要】: APIエラーをユーザーフレンドリーなメッセージに変換
 * 【実装方針】: ValidationError、DeleteConstraintErrorを判定し、適切なメッセージを返す
 * 🔵 信頼性レベル: TASK-0002のエラーハンドリング設計に基づく
 *
 * @param error - APIから返されたエラー
 * @returns 日本語エラーメッセージ
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

/**
 * 【機能概要】: DeleteConstraintErrorから参照数を取得する
 * 【実装方針】: details.referenceCountを返す
 * 🔵 信頼性レベル: interfaces.ts REQ-EXT-401, REQ-EXT-402対応
 *
 * @param error - DeleteConstraintErrorオブジェクト
 * @returns 参照数
 */
export function getReferenceCount(error: DeleteConstraintError): number {
  return error.details.referenceCount;
}

/**
 * 【機能概要】: DeleteConstraintErrorからエンティティタイプを取得する
 * 【実装方針】: details.entityTypeを返す
 * 🔵 信頼性レベル: interfaces.ts REQ-EXT-401, REQ-EXT-402対応
 *
 * @param error - DeleteConstraintErrorオブジェクト
 * @returns エンティティタイプ（"deckMaster" | "myDeck"）
 */
export function getEntityType(error: DeleteConstraintError): 'deckMaster' | 'myDeck' {
  return error.details.entityType;
}

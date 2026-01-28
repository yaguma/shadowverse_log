/**
 * APIエラーハンドリングユーティリティの単体テスト
 * 【テストファイル概要】: TASK-0004 - APIクライアント共通処理拡張
 * 【テスト目的】: ValidationError/DeleteConstraintErrorのパースと変換を検証する
 */

import type { DeleteConstraintError, ValidationError } from '@shadowverse-log/shared';
import { describe, expect, it } from 'vitest';
import {
  getEntityType,
  getReferenceCount,
  getValidationErrorMessages,
  isDeleteConstraintError,
  isValidationError,
  translateApiError,
  translateDeleteConstraintError,
  translateValidationConstraint,
} from './error-handler';

describe('Error Handler Utilities', () => {
  // ==================== isValidationError テスト ====================

  describe('isValidationError', () => {
    it('正常系: ValidationErrorオブジェクトを正しく判定できること', () => {
      // 【テスト目的】: code === 'VALIDATION_ERROR' の場合にtrueを返すこと
      const validationError: ValidationError = {
        code: 'VALIDATION_ERROR',
        message: 'バリデーションエラー',
        details: [{ field: 'deckName', constraint: 'required', value: '' }],
      };

      expect(isValidationError(validationError)).toBe(true);
    });

    it('正常系: 非ValidationErrorオブジェクトでfalseを返すこと', () => {
      // 【テスト目的】: code !== 'VALIDATION_ERROR' の場合にfalseを返すこと
      const otherError = {
        code: 'UNKNOWN_ERROR',
        message: '不明なエラー',
      };

      expect(isValidationError(otherError)).toBe(false);
    });

    it('正常系: nullでfalseを返すこと', () => {
      expect(isValidationError(null)).toBe(false);
    });

    it('正常系: undefinedでfalseを返すこと', () => {
      expect(isValidationError(undefined)).toBe(false);
    });

    it('正常系: 文字列でfalseを返すこと', () => {
      expect(isValidationError('error')).toBe(false);
    });
  });

  // ==================== isDeleteConstraintError テスト ====================

  describe('isDeleteConstraintError', () => {
    it('正常系: DeleteConstraintErrorオブジェクトを正しく判定できること', () => {
      // 【テスト目的】: code === 'DELETE_CONSTRAINT_ERROR' の場合にtrueを返すこと
      const deleteConstraintError: DeleteConstraintError = {
        code: 'DELETE_CONSTRAINT_ERROR',
        message: '削除制約エラー',
        details: {
          entityType: 'deckMaster',
          entityId: 'dm-001',
          referencedBy: 'battleLogs',
          referenceCount: 5,
        },
      };

      expect(isDeleteConstraintError(deleteConstraintError)).toBe(true);
    });

    it('正常系: 非DeleteConstraintErrorオブジェクトでfalseを返すこと', () => {
      // 【テスト目的】: code !== 'DELETE_CONSTRAINT_ERROR' の場合にfalseを返すこと
      const validationError = {
        code: 'VALIDATION_ERROR',
        message: 'バリデーションエラー',
      };

      expect(isDeleteConstraintError(validationError)).toBe(false);
    });
  });

  // ==================== translateValidationConstraint テスト ====================

  describe('translateValidationConstraint', () => {
    it('正常系: required制約を日本語に変換できること', () => {
      expect(translateValidationConstraint('required', null)).toBe('必須項目です');
    });

    it('正常系: minLength制約を日本語に変換できること', () => {
      expect(translateValidationConstraint('minLength', 3)).toBe('3文字以上で入力してください');
    });

    it('正常系: maxLength制約を日本語に変換できること', () => {
      expect(translateValidationConstraint('maxLength', 50)).toBe('50文字以下で入力してください');
    });

    it('正常系: invalidClassName制約を日本語に変換できること', () => {
      expect(translateValidationConstraint('invalidClassName', null)).toBe('無効なクラス名です');
    });

    it('正常系: 未知の制約でフォールバックメッセージを返すこと', () => {
      expect(translateValidationConstraint('unknownConstraint', null)).toBe(
        'バリデーションエラー: unknownConstraint'
      );
    });
  });

  // ==================== getValidationErrorMessages テスト ====================

  describe('getValidationErrorMessages', () => {
    it('正常系: ValidationErrorからフィールド別エラーメッセージを取得できること', () => {
      // 【テスト目的】: detailsを走査し、フィールド名をキーとしたメッセージマップを返すこと
      const validationError: ValidationError = {
        code: 'VALIDATION_ERROR',
        message: 'バリデーションエラー',
        details: [
          { field: 'deckName', constraint: 'required', value: '' },
          { field: 'className', constraint: 'invalidClassName', value: '不正なクラス' },
        ],
      };

      const messages = getValidationErrorMessages(validationError);

      expect(messages).toEqual({
        deckName: '必須項目です',
        className: '無効なクラス名です',
      });
    });

    it('正常系: 空のdetailsで空オブジェクトを返すこと', () => {
      const validationError: ValidationError = {
        code: 'VALIDATION_ERROR',
        message: 'バリデーションエラー',
        details: [],
      };

      const messages = getValidationErrorMessages(validationError);

      expect(messages).toEqual({});
    });
  });

  // ==================== translateDeleteConstraintError テスト ====================

  describe('translateDeleteConstraintError', () => {
    it('正常系: deckMasterの削除制約エラーを日本語に変換できること', () => {
      const deleteConstraintError: DeleteConstraintError = {
        code: 'DELETE_CONSTRAINT_ERROR',
        message: '削除制約エラー',
        details: {
          entityType: 'deckMaster',
          entityId: 'dm-001',
          referencedBy: 'battleLogs',
          referenceCount: 5,
        },
      };

      const message = translateDeleteConstraintError(deleteConstraintError);

      expect(message).toBe('このデッキ種別は5件の対戦履歴で使用されているため削除できません');
    });

    it('正常系: myDeckの削除制約エラーを日本語に変換できること', () => {
      const deleteConstraintError: DeleteConstraintError = {
        code: 'DELETE_CONSTRAINT_ERROR',
        message: '削除制約エラー',
        details: {
          entityType: 'myDeck',
          entityId: 'md-001',
          referencedBy: 'battleLogs',
          referenceCount: 3,
        },
      };

      const message = translateDeleteConstraintError(deleteConstraintError);

      expect(message).toBe('この使用デッキは3件の対戦履歴で使用されているため削除できません');
    });
  });

  // ==================== translateApiError テスト ====================

  describe('translateApiError', () => {
    it('正常系: ValidationErrorを日本語メッセージに変換できること', () => {
      const validationError: ValidationError = {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: [{ field: 'deckName', constraint: 'required', value: '' }],
      };

      const message = translateApiError(validationError);

      expect(message).toBe('必須項目です');
    });

    it('正常系: DeleteConstraintErrorを日本語メッセージに変換できること', () => {
      const deleteConstraintError: DeleteConstraintError = {
        code: 'DELETE_CONSTRAINT_ERROR',
        message: 'Delete constraint violation',
        details: {
          entityType: 'deckMaster',
          entityId: 'dm-001',
          referencedBy: 'battleLogs',
          referenceCount: 10,
        },
      };

      const message = translateApiError(deleteConstraintError);

      expect(message).toBe('このデッキ種別は10件の対戦履歴で使用されているため削除できません');
    });

    it('正常系: messageプロパティを持つオブジェクトからメッセージを取得できること', () => {
      const errorWithMessage = {
        message: 'サーバーエラーが発生しました',
      };

      const message = translateApiError(errorWithMessage);

      expect(message).toBe('サーバーエラーが発生しました');
    });

    it('正常系: 未知のエラーでデフォルトメッセージを返すこと', () => {
      const unknownError = { code: 'UNKNOWN', data: 123 };

      const message = translateApiError(unknownError);

      expect(message).toBe('エラーが発生しました');
    });

    it('正常系: nullエラーでデフォルトメッセージを返すこと', () => {
      expect(translateApiError(null)).toBe('エラーが発生しました');
    });
  });

  // ==================== getReferenceCount テスト ====================

  describe('getReferenceCount', () => {
    it('正常系: DeleteConstraintErrorから参照数を取得できること', () => {
      const deleteConstraintError: DeleteConstraintError = {
        code: 'DELETE_CONSTRAINT_ERROR',
        message: '削除制約エラー',
        details: {
          entityType: 'deckMaster',
          entityId: 'dm-001',
          referencedBy: 'battleLogs',
          referenceCount: 15,
        },
      };

      expect(getReferenceCount(deleteConstraintError)).toBe(15);
    });
  });

  // ==================== getEntityType テスト ====================

  describe('getEntityType', () => {
    it('正常系: DeleteConstraintErrorからエンティティタイプを取得できること', () => {
      const deleteConstraintError: DeleteConstraintError = {
        code: 'DELETE_CONSTRAINT_ERROR',
        message: '削除制約エラー',
        details: {
          entityType: 'myDeck',
          entityId: 'md-001',
          referencedBy: 'battleLogs',
          referenceCount: 3,
        },
      };

      expect(getEntityType(deleteConstraintError)).toBe('myDeck');
    });
  });
});

import { describe, expect, it } from 'vitest';
import type { DeleteConstraintError, ValidationError } from '../../types/api.js';
import {
  getEntityType,
  getReferenceCount,
  getValidationErrorMessages,
  isDeleteConstraintError,
  isValidationError,
  translateApiError,
  translateDeleteConstraintError,
  translateValidationConstraint,
} from '../error-handling.js';

describe('error-handling', () => {
  // ===================================
  // isValidationError関数のテスト
  // ===================================
  describe('isValidationError', () => {
    it('ValidationErrorオブジェクトの場合trueを返す', () => {
      const error: ValidationError = {
        code: 'VALIDATION_ERROR',
        message: 'バリデーションエラー',
        details: [
          { field: 'deckName', constraint: 'required', value: '', message: '必須項目です' },
        ],
      };
      expect(isValidationError(error)).toBe(true);
    });

    it('ValidationErrorでないオブジェクトの場合falseを返す', () => {
      const error = {
        code: 'NOT_FOUND',
        message: 'Not found',
      };
      expect(isValidationError(error)).toBe(false);
    });

    it('nullの場合falseを返す', () => {
      expect(isValidationError(null)).toBe(false);
    });

    it('undefinedの場合falseを返す', () => {
      expect(isValidationError(undefined)).toBe(false);
    });

    it('文字列の場合falseを返す', () => {
      expect(isValidationError('error')).toBe(false);
    });

    it('数値の場合falseを返す', () => {
      expect(isValidationError(123)).toBe(false);
    });
  });

  // ===================================
  // getValidationErrorMessages関数のテスト
  // ===================================
  describe('getValidationErrorMessages', () => {
    it('複数のエラーを含むValidationErrorから日本語メッセージを取得する', () => {
      const error: ValidationError = {
        code: 'VALIDATION_ERROR',
        message: 'バリデーションエラー',
        details: [
          { field: 'deckName', constraint: 'required', value: '', message: '必須項目です' },
          {
            field: 'className',
            constraint: 'invalidClassName',
            value: 'invalid',
            message: '無効なクラス名です',
          },
        ],
      };
      const messages = getValidationErrorMessages(error);
      expect(messages).toEqual({
        deckName: '必須項目です',
        className: '無効なクラス名です',
      });
    });

    it('minLength制約のエラーメッセージを正しく変換する', () => {
      const error: ValidationError = {
        code: 'VALIDATION_ERROR',
        message: 'バリデーションエラー',
        details: [
          {
            field: 'deckName',
            constraint: 'minLength',
            value: 3,
            message: '3文字以上で入力してください',
          },
        ],
      };
      const messages = getValidationErrorMessages(error);
      expect(messages).toEqual({
        deckName: '3文字以上で入力してください',
      });
    });

    it('maxLength制約のエラーメッセージを正しく変換する', () => {
      const error: ValidationError = {
        code: 'VALIDATION_ERROR',
        message: 'バリデーションエラー',
        details: [
          {
            field: 'deckName',
            constraint: 'maxLength',
            value: 50,
            message: '50文字以下で入力してください',
          },
        ],
      };
      const messages = getValidationErrorMessages(error);
      expect(messages).toEqual({
        deckName: '50文字以下で入力してください',
      });
    });

    it('未知の制約の場合はデフォルトメッセージを返す', () => {
      const error: ValidationError = {
        code: 'VALIDATION_ERROR',
        message: 'バリデーションエラー',
        details: [
          {
            field: 'deckName',
            constraint: 'unknownConstraint',
            value: null,
            message: 'バリデーションエラー: unknownConstraint',
          },
        ],
      };
      const messages = getValidationErrorMessages(error);
      expect(messages).toEqual({
        deckName: 'バリデーションエラー: unknownConstraint',
      });
    });
  });

  // ===================================
  // isDeleteConstraintError関数のテスト
  // ===================================
  describe('isDeleteConstraintError', () => {
    it('DeleteConstraintErrorオブジェクトの場合trueを返す', () => {
      const error: DeleteConstraintError = {
        code: 'DELETE_CONSTRAINT_ERROR',
        message: '削除できません',
        details: {
          entityType: 'deckMaster',
          entityId: 'test-id',
          referencedBy: 'battleLogs',
          referenceCount: 5,
        },
      };
      expect(isDeleteConstraintError(error)).toBe(true);
    });

    it('DeleteConstraintErrorでないオブジェクトの場合falseを返す', () => {
      const error = {
        code: 'NOT_FOUND',
        message: 'Not found',
      };
      expect(isDeleteConstraintError(error)).toBe(false);
    });

    it('nullの場合falseを返す', () => {
      expect(isDeleteConstraintError(null)).toBe(false);
    });

    it('undefinedの場合falseを返す', () => {
      expect(isDeleteConstraintError(undefined)).toBe(false);
    });
  });

  // ===================================
  // getReferenceCount関数のテスト
  // ===================================
  describe('getReferenceCount', () => {
    it('DeleteConstraintErrorから参照数を取得する', () => {
      const error: DeleteConstraintError = {
        code: 'DELETE_CONSTRAINT_ERROR',
        message: '削除できません',
        details: {
          entityType: 'deckMaster',
          entityId: 'test-id',
          referencedBy: 'battleLogs',
          referenceCount: 5,
        },
      };
      expect(getReferenceCount(error)).toBe(5);
    });

    it('参照数が0の場合も正しく返す', () => {
      const error: DeleteConstraintError = {
        code: 'DELETE_CONSTRAINT_ERROR',
        message: '削除できません',
        details: {
          entityType: 'myDeck',
          entityId: 'test-id',
          referencedBy: 'battleLogs',
          referenceCount: 0,
        },
      };
      expect(getReferenceCount(error)).toBe(0);
    });
  });

  // ===================================
  // getEntityType関数のテスト
  // ===================================
  describe('getEntityType', () => {
    it('deckMasterエンティティタイプを取得する', () => {
      const error: DeleteConstraintError = {
        code: 'DELETE_CONSTRAINT_ERROR',
        message: '削除できません',
        details: {
          entityType: 'deckMaster',
          entityId: 'test-id',
          referencedBy: 'battleLogs',
          referenceCount: 5,
        },
      };
      expect(getEntityType(error)).toBe('deckMaster');
    });

    it('myDeckエンティティタイプを取得する', () => {
      const error: DeleteConstraintError = {
        code: 'DELETE_CONSTRAINT_ERROR',
        message: '削除できません',
        details: {
          entityType: 'myDeck',
          entityId: 'test-id',
          referencedBy: 'battleLogs',
          referenceCount: 3,
        },
      };
      expect(getEntityType(error)).toBe('myDeck');
    });
  });

  // ===================================
  // translateValidationConstraint関数のテスト
  // ===================================
  describe('translateValidationConstraint', () => {
    it('required制約を日本語に変換する', () => {
      expect(translateValidationConstraint('required', null)).toBe('必須項目です');
    });

    it('minLength制約を日本語に変換する', () => {
      expect(translateValidationConstraint('minLength', 5)).toBe('5文字以上で入力してください');
    });

    it('maxLength制約を日本語に変換する', () => {
      expect(translateValidationConstraint('maxLength', 100)).toBe('100文字以下で入力してください');
    });

    it('invalidClassName制約を日本語に変換する', () => {
      expect(translateValidationConstraint('invalidClassName', 'invalid')).toBe(
        '無効なクラス名です'
      );
    });

    it('未知の制約はデフォルトメッセージを返す', () => {
      expect(translateValidationConstraint('unknown', null)).toBe('バリデーションエラー: unknown');
    });
  });

  // ===================================
  // translateDeleteConstraintError関数のテスト
  // ===================================
  describe('translateDeleteConstraintError', () => {
    it('deckMasterの削除制約エラーを日本語に変換する', () => {
      const error: DeleteConstraintError = {
        code: 'DELETE_CONSTRAINT_ERROR',
        message: '削除できません',
        details: {
          entityType: 'deckMaster',
          entityId: 'test-id',
          referencedBy: 'battleLogs',
          referenceCount: 3,
        },
      };
      expect(translateDeleteConstraintError(error)).toBe(
        'このデッキ種別は3件の対戦履歴で使用されているため削除できません'
      );
    });

    it('myDeckの削除制約エラーを日本語に変換する', () => {
      const error: DeleteConstraintError = {
        code: 'DELETE_CONSTRAINT_ERROR',
        message: '削除できません',
        details: {
          entityType: 'myDeck',
          entityId: 'test-id',
          referencedBy: 'battleLogs',
          referenceCount: 7,
        },
      };
      expect(translateDeleteConstraintError(error)).toBe(
        'この使用デッキは7件の対戦履歴で使用されているため削除できません'
      );
    });
  });

  // ===================================
  // translateApiError関数のテスト
  // ===================================
  describe('translateApiError', () => {
    it('ValidationErrorを日本語メッセージに変換する', () => {
      const error: ValidationError = {
        code: 'VALIDATION_ERROR',
        message: 'バリデーションエラー',
        details: [
          { field: 'deckName', constraint: 'required', value: '', message: '必須項目です' },
          {
            field: 'className',
            constraint: 'invalidClassName',
            value: 'invalid',
            message: '無効なクラス名です',
          },
        ],
      };
      const message = translateApiError(error);
      expect(message).toBe('必須項目です、無効なクラス名です');
    });

    it('DeleteConstraintErrorを日本語メッセージに変換する', () => {
      const error: DeleteConstraintError = {
        code: 'DELETE_CONSTRAINT_ERROR',
        message: '削除できません',
        details: {
          entityType: 'deckMaster',
          entityId: 'test-id',
          referencedBy: 'battleLogs',
          referenceCount: 5,
        },
      };
      const message = translateApiError(error);
      expect(message).toBe('このデッキ種別は5件の対戦履歴で使用されているため削除できません');
    });

    it('messageプロパティを持つオブジェクトはmessageを返す', () => {
      const error = {
        code: 'SOME_ERROR',
        message: 'カスタムエラーメッセージ',
      };
      expect(translateApiError(error)).toBe('カスタムエラーメッセージ');
    });

    it('不明なエラーの場合はデフォルトメッセージを返す', () => {
      expect(translateApiError({})).toBe('エラーが発生しました');
    });

    it('nullの場合はデフォルトメッセージを返す', () => {
      expect(translateApiError(null)).toBe('エラーが発生しました');
    });

    it('undefinedの場合はデフォルトメッセージを返す', () => {
      expect(translateApiError(undefined)).toBe('エラーが発生しました');
    });

    it('文字列の場合はデフォルトメッセージを返す', () => {
      expect(translateApiError('error string')).toBe('エラーが発生しました');
    });
  });
});

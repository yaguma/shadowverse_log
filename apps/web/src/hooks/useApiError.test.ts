import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useApiError } from './useApiError';
import type { ValidationError, DeleteConstraintError } from '@shadowverse-log/shared';

describe('useApiError', () => {
  describe('初期状態', () => {
    it('errorはnullで初期化される', () => {
      const { result } = renderHook(() => useApiError());
      expect(result.current.error).toBeNull();
    });

    it('fieldErrorsは空オブジェクトで初期化される', () => {
      const { result } = renderHook(() => useApiError());
      expect(result.current.fieldErrors).toEqual({});
    });

    it('isValidationErrorはfalseで初期化される', () => {
      const { result } = renderHook(() => useApiError());
      expect(result.current.isValidationError).toBe(false);
    });
  });

  describe('setError', () => {
    it('ValidationErrorを設定すると日本語メッセージに変換される', () => {
      const { result } = renderHook(() => useApiError());

      const validationError: ValidationError = {
        code: 'VALIDATION_ERROR',
        message: 'バリデーションエラー',
        details: [
          { field: 'deckName', constraint: 'required', value: '' },
        ],
      };

      act(() => {
        result.current.setError(validationError);
      });

      expect(result.current.error).toBe('必須項目です');
      expect(result.current.fieldErrors).toEqual({
        deckName: '必須項目です',
      });
      expect(result.current.isValidationError).toBe(true);
    });

    it('ValidationErrorの複数フィールドエラーを設定する', () => {
      const { result } = renderHook(() => useApiError());

      const validationError: ValidationError = {
        code: 'VALIDATION_ERROR',
        message: 'バリデーションエラー',
        details: [
          { field: 'deckName', constraint: 'required', value: '' },
          { field: 'className', constraint: 'invalidClassName', value: 'invalid' },
        ],
      };

      act(() => {
        result.current.setError(validationError);
      });

      expect(result.current.error).toBe('必須項目です、無効なクラス名です');
      expect(result.current.fieldErrors).toEqual({
        deckName: '必須項目です',
        className: '無効なクラス名です',
      });
      expect(result.current.isValidationError).toBe(true);
    });

    it('DeleteConstraintErrorを設定すると日本語メッセージに変換される', () => {
      const { result } = renderHook(() => useApiError());

      const deleteError: DeleteConstraintError = {
        code: 'DELETE_CONSTRAINT_ERROR',
        message: '削除できません',
        details: {
          entityType: 'deckMaster',
          entityId: 'test-id',
          referencedBy: 'battleLogs',
          referenceCount: 5,
        },
      };

      act(() => {
        result.current.setError(deleteError);
      });

      expect(result.current.error).toBe(
        'このデッキ種別は5件の対戦履歴で使用されているため削除できません'
      );
      expect(result.current.fieldErrors).toEqual({});
      expect(result.current.isValidationError).toBe(false);
    });

    it('一般的なエラーオブジェクトを設定する', () => {
      const { result } = renderHook(() => useApiError());

      const generalError = {
        code: 'NOT_FOUND',
        message: 'リソースが見つかりません',
      };

      act(() => {
        result.current.setError(generalError);
      });

      expect(result.current.error).toBe('リソースが見つかりません');
      expect(result.current.fieldErrors).toEqual({});
      expect(result.current.isValidationError).toBe(false);
    });

    it('不明なエラーを設定するとデフォルトメッセージになる', () => {
      const { result } = renderHook(() => useApiError());

      act(() => {
        result.current.setError({});
      });

      expect(result.current.error).toBe('エラーが発生しました');
      expect(result.current.fieldErrors).toEqual({});
      expect(result.current.isValidationError).toBe(false);
    });

    it('nullを設定するとデフォルトメッセージになる', () => {
      const { result } = renderHook(() => useApiError());

      act(() => {
        result.current.setError(null);
      });

      expect(result.current.error).toBe('エラーが発生しました');
    });
  });

  describe('clearError', () => {
    it('エラーをクリアするとすべての状態がリセットされる', () => {
      const { result } = renderHook(() => useApiError());

      // まずエラーを設定
      const validationError: ValidationError = {
        code: 'VALIDATION_ERROR',
        message: 'バリデーションエラー',
        details: [
          { field: 'deckName', constraint: 'required', value: '' },
        ],
      };

      act(() => {
        result.current.setError(validationError);
      });

      // エラーが設定されていることを確認
      expect(result.current.error).not.toBeNull();
      expect(result.current.isValidationError).toBe(true);

      // クリア実行
      act(() => {
        result.current.clearError();
      });

      // すべてリセットされていることを確認
      expect(result.current.error).toBeNull();
      expect(result.current.fieldErrors).toEqual({});
      expect(result.current.isValidationError).toBe(false);
    });
  });

  describe('状態の連続更新', () => {
    it('エラーを設定した後に別のエラーを設定すると置き換わる', () => {
      const { result } = renderHook(() => useApiError());

      // 最初のエラー
      const firstError: ValidationError = {
        code: 'VALIDATION_ERROR',
        message: '最初のエラー',
        details: [{ field: 'field1', constraint: 'required', value: '' }],
      };

      act(() => {
        result.current.setError(firstError);
      });

      expect(result.current.error).toBe('必須項目です');
      expect(result.current.fieldErrors).toHaveProperty('field1');

      // 2番目のエラー
      const secondError: DeleteConstraintError = {
        code: 'DELETE_CONSTRAINT_ERROR',
        message: '2番目のエラー',
        details: {
          entityType: 'myDeck',
          entityId: 'test-id',
          referencedBy: 'battleLogs',
          referenceCount: 3,
        },
      };

      act(() => {
        result.current.setError(secondError);
      });

      // 2番目のエラーに置き換わっている
      expect(result.current.error).toBe(
        'この使用デッキは3件の対戦履歴で使用されているため削除できません'
      );
      expect(result.current.fieldErrors).toEqual({});
      expect(result.current.isValidationError).toBe(false);
    });
  });
});

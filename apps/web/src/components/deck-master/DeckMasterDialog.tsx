'use client';

/**
 * 【機能概要】: デッキ種別の追加/編集ダイアログコンポーネント
 * 【実装方針】: React 19 + TypeScript + Tailwind CSSを使用した実装
 * 【テスト対応】: TC-DM-DIALOG-001〜TC-DM-DIALOG-012の全12ケースを通すための実装
 * 【TASK-0012対応】: デッキ種別ダイアログ実装
 * 🔵 信頼性レベル: TASK-0012仕様に基づく
 */

import type { DeckMasterWithUsage } from '@shadowverse-log/shared';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';

/**
 * 【定数定義】: クラス名選択肢
 * 🔵 信頼性レベル: interfaces.ts CLASS_NAMESに基づく
 */
const CLASS_OPTIONS = [
  { value: 'エルフ', label: 'エルフ' },
  { value: 'ロイヤル', label: 'ロイヤル' },
  { value: 'ウィッチ', label: 'ウィッチ' },
  { value: 'ドラゴン', label: 'ドラゴン' },
  { value: 'ナイトメア', label: 'ナイトメア' },
  { value: 'ビショップ', label: 'ビショップ' },
  { value: 'ネメシス', label: 'ネメシス' },
] as const;

/**
 * 【型定義】: DeckMasterDialogコンポーネントのプロップス型
 * 🔵 信頼性レベル: TASK-0012仕様に準拠
 */
interface DeckMasterDialogProps {
  /** ダイアログ表示状態 */
  isOpen: boolean;
  /** ダイアログモード（新規追加 or 編集） */
  mode: 'create' | 'edit';
  /** 編集対象のデータ（編集モード時のみ） */
  initialData?: DeckMasterWithUsage;
  /** ダイアログを閉じるハンドラ */
  onClose: () => void;
  /** 送信ハンドラ */
  onSubmit: (data: { className: string; deckName: string }) => Promise<void>;
  /** 送信中フラグ */
  isSubmitting: boolean;
  /** エラーメッセージ */
  error?: string;
}

/**
 * 【型定義】: バリデーションエラー状態の型
 * 🔵 信頼性レベル: TASK-0012バリデーション要件に基づく
 */
interface ValidationErrors {
  className?: string;
  deckName?: string;
}

/**
 * 【機能概要】: デッキ種別の追加/編集ダイアログコンポーネント
 * 【実装方針】: モーダルダイアログとしてフォームを表示
 * 【テスト対応】: TC-DM-DIALOG-001〜TC-DM-DIALOG-012の全12ケースを通すための実装
 * 🔵 信頼性レベル: TASK-0012仕様に準拠
 */
export const DeckMasterDialog: React.FC<DeckMasterDialogProps> = ({
  isOpen,
  mode,
  initialData,
  onClose,
  onSubmit,
  isSubmitting,
  error,
}) => {
  // 【ローカル状態管理】: フォームデータとバリデーションエラーを管理 🔵
  const [className, setClassName] = useState<string>('');
  const [deckName, setDeckName] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  /**
   * 【初期化処理】: initialDataから初期値を設定
   * 【実装方針】: 編集モード時はinitialDataから値を引き継ぐ
   * 🔵 信頼性レベル: TASK-0012仕様に基づく
   */
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setClassName(initialData.className);
      setDeckName(initialData.deckName);
    } else if (mode === 'create') {
      setClassName('');
      setDeckName('');
    }
    // エラー状態をクリア
    setValidationErrors({});
  }, [mode, initialData]);

  /**
   * 【バリデーション】: フォームの入力値を検証
   * 【実装方針】: className必須（新規時）、deckName必須・100文字以内
   * 🔵 信頼性レベル: TASK-0012バリデーション要件に基づく
   */
  const validateForm = useCallback((): boolean => {
    const errors: ValidationErrors = {};

    // 【className検証】: 新規モード時は必須 🔵
    if (mode === 'create' && !className) {
      errors.className = 'クラス名を選択してください';
    }

    // 【deckName検証】: 必須、1〜100文字 🔵
    if (!deckName.trim()) {
      errors.deckName = 'デッキ名を入力してください';
    } else if (deckName.length > 100) {
      errors.deckName = 'デッキ名は100文字以内で入力してください';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [mode, className, deckName]);

  /**
   * 【フォーム送信ハンドラ】: フォームを送信
   * 【実装方針】: バリデーション成功時にonSubmitを呼び出す
   * 🔵 信頼性レベル: TASK-0012送信要件に基づく
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // 【バリデーション実行】: フォーム送信前にバリデーションを実行 🔵
      const isValid = validateForm();
      if (!isValid) {
        return;
      }

      try {
        // 【送信実行】: onSubmitを呼び出す 🔵
        await onSubmit({ className, deckName: deckName.trim() });
      } catch {
        // 【エラーハンドリング】: エラーはpropsで管理されるため、ここでは何もしない 🔵
      }
    },
    [validateForm, onSubmit, className, deckName]
  );

  /**
   * 【キャンセルハンドラ】: ダイアログを閉じる
   * 🔵 信頼性レベル: TASK-0012キャンセル要件に基づく
   */
  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  // 【非表示処理】: isOpen=falseの場合は何も表示しない 🔵
  if (!isOpen) {
    return null;
  }

  // 【タイトル決定】: モードに応じてタイトルを設定 🔵
  const title = mode === 'create' ? 'デッキ種別の追加' : 'デッキ種別の編集';
  const submitButtonLabel = mode === 'create' ? '登録' : '更新';

  return (
    <>
      {/* 【モーダル背景】: 背景をクリックしてもクローズしない 🔵 */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        {/* 【ダイアログコンテンツ】: フォームを表示 🔵 */}
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          {/* 【ダイアログタイトル】: モードに応じたタイトルを表示 🔵 */}
          <h2 className="text-xl font-bold mb-4">{title}</h2>

          {/* 【APIエラーメッセージ】: error propがある場合に表示 🔵 */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* 【クラス名フィールド】: クラス名選択 🔵 */}
            <div className="mb-4">
              <label htmlFor="className" className="block text-sm font-medium text-gray-700 mb-1">
                クラス名 <span className="text-red-500">*</span>
              </label>
              <select
                id="className"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                disabled={mode === 'edit'}
                aria-label="クラス名"
              >
                <option value="">選択してください</option>
                {CLASS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {validationErrors.className && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.className}</p>
              )}
            </div>

            {/* 【デッキ名フィールド】: デッキ名入力 🔵 */}
            <div className="mb-4">
              <label htmlFor="deckName" className="block text-sm font-medium text-gray-700 mb-1">
                デッキ名 <span className="text-red-500">*</span>
              </label>
              <input
                id="deckName"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                maxLength={101}
                aria-label="デッキ名"
              />
              {validationErrors.deckName && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.deckName}</p>
              )}
            </div>

            {/* 【ボタンエリア】: キャンセル・登録ボタン 🔵 */}
            <div className="flex gap-4 justify-end mt-6">
              {/* 【キャンセルボタン】: onCloseコールバックを呼び出す 🔵 */}
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                キャンセル
              </button>

              {/* 【登録ボタン】: フォームを送信 🔵 */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '送信中...' : submitButtonLabel}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

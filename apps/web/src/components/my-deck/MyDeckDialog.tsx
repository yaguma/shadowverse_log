'use client';

/**
 * 【機能概要】: マイデッキの追加ダイアログコンポーネント
 * 【実装方針】: React 19 + TypeScript + Tailwind CSSを使用した実装
 * 【テスト対応】: TC-MD-DIALOG-001〜TC-MD-DIALOG-010の全10ケースを通すための実装
 * 【TASK-0020対応】: マイデッキダイアログ実装
 */

import type { DeckMaster } from '@shadowverse-log/shared';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';

/**
 * 【型定義】: マイデッキ作成入力の型
 */
export interface CreateMyDeckInput {
  /** デッキマスターID */
  deckId: string;
  /** デッキ名 */
  deckName: string;
  /** デッキコード（任意） */
  deckCode?: string;
}

/**
 * 【型定義】: MyDeckDialogコンポーネントのプロップス型
 */
interface MyDeckDialogProps {
  /** ダイアログ表示状態 */
  isOpen: boolean;
  /** デッキマスター一覧（選択肢用） */
  deckMasters: DeckMaster[];
  /** 送信中フラグ */
  isSubmitting: boolean;
  /** ダイアログを閉じるハンドラ */
  onClose: () => void;
  /** 送信ハンドラ */
  onSubmit: (input: CreateMyDeckInput) => Promise<void>;
}

/**
 * 【型定義】: バリデーションエラー状態の型
 */
interface ValidationErrors {
  deckId?: string;
  deckName?: string;
}

/**
 * 【機能概要】: マイデッキの追加ダイアログコンポーネント
 * 【実装方針】: モーダルダイアログとしてフォームを表示
 * 【テスト対応】: TC-MD-DIALOG-001〜TC-MD-DIALOG-010の全10ケースを通すための実装
 */
export const MyDeckDialog: React.FC<MyDeckDialogProps> = ({
  isOpen,
  deckMasters,
  isSubmitting,
  onClose,
  onSubmit,
}) => {
  // 【ローカル状態管理】: フォームデータとバリデーションエラーを管理
  const [deckId, setDeckId] = useState<string>('');
  const [deckName, setDeckName] = useState<string>('');
  const [deckCode, setDeckCode] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  /**
   * 【初期化処理】: ダイアログが開くたびにフォームをリセット
   */
  useEffect(() => {
    if (isOpen) {
      setDeckId('');
      setDeckName('');
      setDeckCode('');
      setValidationErrors({});
    }
  }, [isOpen]);

  /**
   * 【バリデーション】: フォームの入力値を検証
   * 【実装方針】: deckId必須、deckName必須
   */
  const validateForm = useCallback((): boolean => {
    const errors: ValidationErrors = {};

    // 【deckId検証】: 必須
    if (!deckId) {
      errors.deckId = 'デッキ種別を選択してください';
    }

    // 【deckName検証】: 必須
    if (!deckName.trim()) {
      errors.deckName = 'デッキ名を入力してください';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [deckId, deckName]);

  /**
   * 【フォーム送信ハンドラ】: フォームを送信
   * 【実装方針】: バリデーション成功時にonSubmitを呼び出す
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // 【バリデーション実行】: フォーム送信前にバリデーションを実行
      const isValid = validateForm();
      if (!isValid) {
        return;
      }

      try {
        // 【送信実行】: onSubmitを呼び出す
        await onSubmit({
          deckId,
          deckName: deckName.trim(),
          deckCode: deckCode.trim(),
        });
      } catch {
        // 【エラーハンドリング】: エラーは親コンポーネントで管理されるため、ここでは何もしない
      }
    },
    [validateForm, onSubmit, deckId, deckName, deckCode]
  );

  /**
   * 【キャンセルハンドラ】: ダイアログを閉じる
   */
  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  // 【非表示処理】: isOpen=falseの場合は何も表示しない
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* 【モーダル背景】: 背景をクリックしてもクローズしない */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        {/* 【ダイアログコンテンツ】: フォームを表示 */}
        <div
          className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="my-deck-dialog-title"
        >
          {/* 【ダイアログタイトル】: タイトルを表示 */}
          <h2 id="my-deck-dialog-title" className="text-xl font-bold mb-4">
            マイデッキの追加
          </h2>

          <form onSubmit={handleSubmit}>
            {/* 【デッキ種別フィールド】: デッキ種別選択 */}
            <div className="mb-4">
              <label htmlFor="deckId" className="block text-sm font-medium text-gray-700 mb-1">
                デッキ種別 <span className="text-red-500">*</span>
              </label>
              <select
                id="deckId"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={deckId}
                onChange={(e) => setDeckId(e.target.value)}
                aria-label="デッキ種別"
              >
                <option value="">選択してください</option>
                {deckMasters.map((dm) => (
                  <option key={dm.id} value={dm.id}>
                    {dm.deckName}（{dm.className}）
                  </option>
                ))}
              </select>
              {validationErrors.deckId && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.deckId}</p>
              )}
            </div>

            {/* 【デッキ名フィールド】: デッキ名入力 */}
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
                aria-label="デッキ名"
              />
              {validationErrors.deckName && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.deckName}</p>
              )}
            </div>

            {/* 【デッキコードフィールド】: デッキコード入力（任意） */}
            <div className="mb-4">
              <label htmlFor="deckCode" className="block text-sm font-medium text-gray-700 mb-1">
                デッキコード
              </label>
              <input
                id="deckCode"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={deckCode}
                onChange={(e) => setDeckCode(e.target.value)}
                aria-label="デッキコード"
              />
            </div>

            {/* 【ボタンエリア】: キャンセル・登録ボタン */}
            <div className="flex gap-4 justify-end mt-6">
              {/* 【キャンセルボタン】: onCloseコールバックを呼び出す */}
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                キャンセル
              </button>

              {/* 【登録ボタン】: フォームを送信 */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '登録中...' : '登録'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

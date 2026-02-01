/**
 * 【機能概要】: 汎用確認ダイアログコンポーネント
 * 【実装方針】: モーダルダイアログで確認を行い、各種カスタマイズに対応
 * 【設計理由】: battle-log, my-deck, deck-master の DeleteConfirmDialog を統合
 */

import type React from 'react';

/**
 * 【型定義】: ConfirmDialogコンポーネントのプロップス型
 */
interface ConfirmDialogProps {
  /** ダイアログ表示状態 */
  isOpen: boolean;
  /** ダイアログを閉じるコールバック関数 */
  onClose: () => void;
  /** 確認実行時のコールバック関数 */
  onConfirm: () => void;
  /** ダイアログタイトル */
  title: string;
  /** 確認メッセージ */
  message: string;
  /** 追加の詳細情報（任意） */
  details?: React.ReactNode;
  /** 確認ボタンのラベル（デフォルト: "確認"） */
  confirmLabel?: string;
  /** キャンセルボタンのラベル（デフォルト: "キャンセル"） */
  cancelLabel?: string;
  /** ダイアログのバリアント（デフォルト: "danger"） */
  variant?: 'danger' | 'warning' | 'info';
  /** ローディング状態 */
  isLoading?: boolean;
  /** 警告メッセージ（任意） */
  warningMessage?: string;
}

/**
 * バリアントに応じた確認ボタンのスタイルを返す
 */
function getConfirmButtonStyle(variant: 'danger' | 'warning' | 'info'): string {
  switch (variant) {
    case 'danger':
      return 'bg-red-500 text-white hover:bg-red-600';
    case 'warning':
      return 'bg-yellow-500 text-white hover:bg-yellow-600';
    case 'info':
      return 'bg-blue-500 text-white hover:bg-blue-600';
    default:
      return 'bg-red-500 text-white hover:bg-red-600';
  }
}

/**
 * 【機能概要】: 汎用確認ダイアログコンポーネント
 * 【実装方針】: シンプルなモーダルダイアログで確認を行う
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  details,
  confirmLabel = '確認',
  cancelLabel = 'キャンセル',
  variant = 'danger',
  isLoading = false,
  warningMessage,
}) => {
  // 【エッジケース処理】: isOpen=false の場合は非表示
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* 【モーダル背景】: 背景オーバーレイ */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        data-testid="confirm-dialog"
      >
        {/* 【ダイアログコンテンツ】: 確認の内容を表示 */}
        <div
          className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
        >
          {/* 【ダイアログタイトル】 */}
          <h2
            id="confirm-dialog-title"
            className="text-xl font-bold mb-4"
            data-testid="confirm-dialog-title"
          >
            {title}
          </h2>

          {/* 【確認メッセージ】 */}
          <p className="mb-4" data-testid="confirm-dialog-message">
            {message}
          </p>

          {/* 【詳細情報】（任意） */}
          {details && <div className="mb-4 p-3 bg-gray-100 rounded">{details}</div>}

          {/* 【警告メッセージ】（任意） */}
          {warningMessage && <p className="mb-6 text-sm text-gray-600">{warningMessage}</p>}

          {/* 【ローディングスピナー】: ローディング中に表示 */}
          {isLoading && (
            <div className="mb-4 text-center">
              <output className="inline-block">
                <span className="text-gray-600">処理中...</span>
              </output>
            </div>
          )}

          {/* 【ボタンエリア】: キャンセル・確認ボタンを表示 */}
          <div className="flex gap-4 justify-end">
            {/* 【キャンセルボタン】 */}
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="confirm-dialog-cancel"
            >
              {cancelLabel}
            </button>

            {/* 【確認ボタン】 */}
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed ${getConfirmButtonStyle(variant)}`}
              data-testid="confirm-dialog-confirm"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

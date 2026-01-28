/**
 * 【機能概要】: デッキ種別削除確認ダイアログコンポーネント
 * 【実装方針】: モーダルダイアログで削除確認を行う
 * 【テスト対応】: TC-006〜TC-008の削除確認ダイアログ関連テストに対応
 * 🔵 信頼性レベル: TASK-0011の要件に基づく
 */

import type { DeckMasterWithUsage } from '../../types';

/**
 * 【型定義】: DeleteConfirmDialogコンポーネントのプロップス型
 * 🔵 信頼性レベル: TASK-0011の要件に基づく
 */
interface DeleteConfirmDialogProps {
  /** ダイアログ表示状態 */
  isOpen: boolean;
  /** 削除対象のデッキ種別 */
  target: DeckMasterWithUsage | null;
  /** 削除実行時のコールバック関数 */
  onConfirm: () => void;
  /** キャンセル時のコールバック関数 */
  onCancel: () => void;
}

/**
 * 【機能概要】: デッキ種別削除確認ダイアログコンポーネント
 * 【実装方針】: シンプルなモーダルダイアログで削除の最終確認を行う
 * 🔵 信頼性レベル: TASK-0011の要件に基づく
 */
export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  target,
  onConfirm,
  onCancel,
}) => {
  // 【エッジケース処理】: isOpen=false or target=null の場合は非表示
  if (!isOpen || !target) {
    return null;
  }

  return (
    <>
      {/* 【モーダル背景】: 背景オーバーレイ */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        {/* 【ダイアログコンテンツ】: 削除確認の内容を表示 */}
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          {/* 【ダイアログタイトル】: "デッキ種別の削除"を表示 */}
          <h2 className="text-xl font-bold mb-4">デッキ種別の削除</h2>

          {/* 【確認メッセージ】: デッキ名を含む確認メッセージを表示 */}
          <p className="mb-4">「{target.deckName}」を削除してもよろしいですか？</p>

          {/* 【警告メッセージ】: 操作が取り消せないことを警告 */}
          <p className="mb-6 text-sm text-gray-600">この操作は取り消せません。</p>

          {/* 【ボタンエリア】: キャンセル・削除するボタンを表示 */}
          <div className="flex gap-4 justify-end">
            {/* 【キャンセルボタン】: onCancelコールバックを呼び出す */}
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              キャンセル
            </button>

            {/* 【削除するボタン】: onConfirmコールバックを呼び出す */}
            <button
              type="button"
              onClick={onConfirm}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              削除する
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

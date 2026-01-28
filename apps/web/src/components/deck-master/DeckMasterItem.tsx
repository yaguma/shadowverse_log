/**
 * 【機能概要】: デッキ種別アイテムコンポーネント
 * 【実装方針】: デッキ種別の情報表示、編集/削除ボタン、削除確認ダイアログを含む
 * 【テスト対応】: TC-001〜TC-010の全テストケースに対応
 * 🔵 信頼性レベル: TASK-0011の要件に基づく
 */

import { useState } from 'react';
import type { DeckMasterWithUsage } from '../../types';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

/**
 * 【型定義】: DeckMasterItemコンポーネントのプロップス型
 * 🔵 信頼性レベル: docs/design/deck-management-extension/interfaces.ts に基づく
 */
interface DeckMasterItemProps {
  /** デッキ種別データ */
  deckMaster: DeckMasterWithUsage;
  /** 編集ボタンクリックハンドラ */
  onEdit: (deckMaster: DeckMasterWithUsage) => void;
  /** 削除ボタンクリックハンドラ */
  onDelete: (id: string) => void;
  /** 削除可能かどうか（参照されている場合はfalse） */
  canDelete: boolean;
}

/**
 * 【ユーティリティ関数】: 日付をYYYY/MM/DD形式にフォーマットする
 * @param dateString ISO 8601形式の日付文字列
 * @returns フォーマットされた日付文字列
 */
const formatDate = (dateString: string | null): string => {
  if (!dateString) {
    return '未使用';
  }
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
};

/**
 * 【機能概要】: デッキ種別アイテムコンポーネント
 * 【実装方針】: 個別デッキ種別の表示と編集/削除操作を提供
 * 🔵 信頼性レベル: TASK-0011の要件に基づく
 */
export const DeckMasterItem: React.FC<DeckMasterItemProps> = ({
  deckMaster,
  onEdit,
  onDelete,
  canDelete,
}) => {
  // 【状態管理】: 削除確認ダイアログの表示状態
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // 【イベントハンドラ】: 編集ボタンクリック時の処理
  const handleEditClick = () => {
    onEdit(deckMaster);
  };

  // 【イベントハンドラ】: 削除ボタンクリック時の処理
  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  // 【イベントハンドラ】: 削除確認ダイアログでキャンセル時の処理
  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
  };

  // 【イベントハンドラ】: 削除確認ダイアログで削除確定時の処理
  const handleDeleteConfirm = () => {
    onDelete(deckMaster.id);
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      {/* 【メインコンテンツ】: デッキ種別情報カード */}
      <div className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
        {/* 【上部セクション】: クラス名、デッキ名 */}
        <div className="mb-3">
          {/* 【クラス名表示】: 小さめのラベルとして表示 */}
          <div className="text-sm text-gray-500">{deckMaster.className}</div>
          {/* 【デッキ名表示】: メインのタイトルとして表示 */}
          <div className="text-lg font-semibold text-gray-900">{deckMaster.deckName}</div>
        </div>

        {/* 【中部セクション】: 使用統計情報 */}
        <div className="text-sm text-gray-600 mb-4">
          {/* 【使用回数表示】: 対戦相手として使用された回数 */}
          <span>使用回数: {deckMaster.usageCount}回</span>
          <span className="mx-2">|</span>
          {/* 【最終使用日表示】: 最後に対戦相手として使用された日付 */}
          <span>最終使用: {formatDate(deckMaster.lastUsedDate)}</span>
        </div>

        {/* 【下部セクション】: 操作ボタン */}
        <div className="flex justify-end gap-2">
          {/* 【編集ボタン】: onEditを呼び出す */}
          <button
            type="button"
            onClick={handleEditClick}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            編集
          </button>

          {/* 【削除ボタン】: canDelete=falseの場合は無効化 */}
          <button
            type="button"
            onClick={handleDeleteClick}
            disabled={!canDelete}
            title={!canDelete ? '対戦履歴で使用中' : undefined}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              canDelete
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            削除
          </button>
        </div>
      </div>

      {/* 【削除確認ダイアログ】: 削除操作の最終確認 */}
      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        target={deckMaster}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
};

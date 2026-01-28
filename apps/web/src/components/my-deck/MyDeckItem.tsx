/**
 * 【機能概要】: 使用デッキアイテムコンポーネント
 * 【実装方針】: 使用デッキの情報表示、削除ボタン、削除確認ダイアログを含む
 * 【テスト対応】: TC-001〜TC-012の全テストケースに対応
 * 🔵 信頼性レベル: TASK-0019の要件に基づく
 */

import { useState } from 'react';
import type { DeckMaster, MyDeck } from '../../types';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

/**
 * 【型定義】: MyDeckItemコンポーネントのプロップス型
 * 🔵 信頼性レベル: docs/design/deck-management-extension/interfaces.ts に基づく
 */
interface MyDeckItemProps {
  /** 使用デッキデータ */
  myDeck: MyDeck;
  /** 関連デッキ種別（クラス名表示用） */
  deckMaster?: DeckMaster;
  /** 削除ボタンクリックハンドラ */
  onDelete: (id: string) => void;
  /** 削除可能かどうか（参照されている場合はfalse） */
  canDelete: boolean;
}

/**
 * 【機能概要】: 使用デッキアイテムコンポーネント
 * 【実装方針】: 個別使用デッキの表示と削除操作を提供
 * 🔵 信頼性レベル: TASK-0019の要件に基づく
 */
export const MyDeckItem: React.FC<MyDeckItemProps> = ({
  myDeck,
  deckMaster,
  onDelete,
  canDelete,
}) => {
  // 【状態管理】: 削除確認ダイアログの表示状態
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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
    onDelete(myDeck.id);
    setIsDeleteDialogOpen(false);
  };

  // 【表示データ】: クラス名（deckMasterがない場合は「-」を表示）
  const className = deckMaster?.className ?? '-';

  return (
    <>
      {/* 【メインコンテンツ】: 使用デッキ情報カード */}
      <div className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
        {/* 【上部セクション】: クラス名、デッキ名 */}
        <div className="mb-3">
          {/* 【クラス名表示】: 小さめのラベルとして表示 */}
          <div className="text-sm text-gray-500" data-testid="deck-class-name">
            {className}
          </div>
          {/* 【デッキ名表示】: メインのタイトルとして表示 */}
          <div className="text-lg font-semibold text-gray-900" data-testid="deck-name">
            {myDeck.deckName}
          </div>
        </div>

        {/* 【中部セクション】: デッキコード（空でない場合のみ表示） */}
        {myDeck.deckCode && (
          <div className="text-sm text-gray-600 mb-4 font-mono" data-testid="deck-code">
            {myDeck.deckCode}
          </div>
        )}

        {/* 【下部セクション】: 操作ボタン */}
        <div className="flex justify-end gap-2">
          {/* 【削除ボタン】: canDelete=falseの場合は無効化 */}
          <button
            type="button"
            onClick={handleDeleteClick}
            disabled={!canDelete}
            title={canDelete ? undefined : '対戦履歴から参照されているため削除できません'}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              canDelete
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            data-testid="delete-button"
          >
            削除
          </button>
        </div>
      </div>

      {/* 【削除確認ダイアログ】: 削除操作の最終確認 */}
      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        target={myDeck}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
};

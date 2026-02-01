/**
 * 【機能概要】: 使用デッキ削除確認ダイアログコンポーネント（マイデッキ用ラッパー）
 * 【実装方針】: 汎用ConfirmDialogを使用し、マイデッキ削除用にカスタマイズ
 * 【テスト対応】: TC-004、TC-006、TC-011、TC-012の削除確認ダイアログ関連テストに対応
 * 【リファクタリング】: 006-delete-confirm-dialog-duplication.md に基づき汎用コンポーネントに統合
 */

import type { MyDeck } from '../../types';
import { ConfirmDialog } from '../common/ConfirmDialog';

/**
 * 【型定義】: DeleteConfirmDialogコンポーネントのプロップス型
 */
interface DeleteConfirmDialogProps {
  /** ダイアログ表示状態 */
  isOpen: boolean;
  /** 削除対象の使用デッキ */
  target: MyDeck | null;
  /** 削除実行時のコールバック関数 */
  onConfirm: () => void;
  /** キャンセル時のコールバック関数 */
  onCancel: () => void;
}

/**
 * 【機能概要】: 使用デッキ削除確認ダイアログコンポーネント
 * 【実装方針】: 汎用ConfirmDialogをラップして、マイデッキの削除確認に特化
 */
export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  target,
  onConfirm,
  onCancel,
}) => {
  // 【エッジケース処理】: target=null の場合は非表示
  if (!target) {
    return null;
  }

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onCancel}
      onConfirm={onConfirm}
      title="デッキの削除"
      message={`「${target.deckName}」を削除してもよろしいですか？`}
      confirmLabel="削除する"
      variant="danger"
      warningMessage="この操作は取り消せません。"
    />
  );
};

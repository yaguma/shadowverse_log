/**
 * 【機能概要】: デッキ種別削除確認ダイアログコンポーネント（デッキマスター用ラッパー）
 * 【実装方針】: 汎用ConfirmDialogを使用し、デッキマスター削除用にカスタマイズ
 * 【テスト対応】: TC-006〜TC-008の削除確認ダイアログ関連テストに対応
 * 【リファクタリング】: 006-delete-confirm-dialog-duplication.md に基づき汎用コンポーネントに統合
 */

import type { DeckMasterWithUsage } from '../../types';
import { ConfirmDialog } from '../common/ConfirmDialog';

/**
 * 【型定義】: DeleteConfirmDialogコンポーネントのプロップス型
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
 * 【実装方針】: 汎用ConfirmDialogをラップして、デッキマスターの削除確認に特化
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
      title="デッキ種別の削除"
      message={`「${target.deckName}」を削除してもよろしいですか？`}
      confirmLabel="削除する"
      variant="danger"
      warningMessage="この操作は取り消せません。"
    />
  );
};

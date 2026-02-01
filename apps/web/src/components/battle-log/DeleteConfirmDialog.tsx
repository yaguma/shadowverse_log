/**
 * 【機能概要】: 削除確認ダイアログコンポーネント（対戦履歴用ラッパー）
 * 【実装方針】: 汎用ConfirmDialogを使用し、対戦履歴削除用にカスタマイズ
 * 【テスト対応】: TC-DELETE-DIALOG-001〜TC-EDGE-002の全6ケースを通すための実装
 * 【リファクタリング】: 006-delete-confirm-dialog-duplication.md に基づき汎用コンポーネントに統合
 */

import type { BattleLog } from '../../types';
import { ConfirmDialog } from '../common/ConfirmDialog';

/**
 * 【型定義】: DeleteConfirmDialogコンポーネントのプロップス型
 */
interface DeleteConfirmDialogProps {
  /** ダイアログ表示状態 */
  isOpen: boolean;
  /** 削除対象の対戦履歴 */
  targetLog: BattleLog | null;
  /** ローディング状態 */
  isLoading: boolean;
  /** 削除実行時のコールバック関数 */
  onConfirm: () => void;
  /** キャンセル時のコールバック関数 */
  onCancel: () => void;
}

/**
 * 【機能概要】: 削除確認ダイアログコンポーネント（対戦履歴用）
 * 【実装方針】: 汎用ConfirmDialogをラップして、対戦履歴の削除確認に特化
 */
export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  targetLog,
  isLoading,
  onConfirm,
  onCancel,
}) => {
  // 【エッジケース処理】: targetLog=null の場合は非表示
  if (!targetLog) {
    return null;
  }

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onCancel}
      onConfirm={onConfirm}
      title="削除確認"
      message="本当に削除しますか？"
      details={
        <p>
          {targetLog.date} | {targetLog.result}
        </p>
      }
      confirmLabel="削除する"
      variant="danger"
      isLoading={isLoading}
    />
  );
};

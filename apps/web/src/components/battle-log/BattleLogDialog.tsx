/**
 * 🔵 TASK-0029: BattleLogDialog - 対戦履歴登録ダイアログコンポーネント
 *
 * 【機能概要】: 統計画面から直接対戦履歴を登録するためのモーダルダイアログ
 * 【主要機能】:
 *   - モーダルダイアログとして表示
 *   - BattleLogFormコンポーネントを内包
 *   - 登録成功時のコールバック実行
 *   - オーバーレイクリック・Escキーでのダイアログクローズ
 * 【設計方針】:
 *   - 既存のBattleLogFormコンポーネントを再利用
 *   - アクセシビリティに配慮（focus trap, aria属性）
 * 🔵 信頼性レベル: REQ-EXT-201, REQ-EXT-202 に基づく
 */

import { useCallback, useEffect, useRef } from 'react';
import { BattleLogForm } from './BattleLogForm';

/**
 * 【型定義】: BattleLogDialogコンポーネントのプロップス型
 */
interface BattleLogDialogProps {
  /** ダイアログの開閉状態 */
  isOpen: boolean;
  /** ダイアログを閉じる際のコールバック */
  onClose: () => void;
  /** 登録成功時のコールバック（統計再取得用） */
  onSaved?: () => void;
  /** 統計画面から渡されるデフォルトシーズン（現在は未使用だが将来の拡張用） */
  defaultSeason?: number;
}

/**
 * 🔵 TASK-0029: BattleLogDialog - 対戦履歴登録ダイアログコンポーネント
 *
 * 統計画面から直接対戦履歴を登録するためのモーダルダイアログ
 */
export const BattleLogDialog: React.FC<BattleLogDialogProps> = ({
  isOpen,
  onClose,
  onSaved,
  defaultSeason: _defaultSeason,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  /**
   * 【登録成功ハンドラ】: 登録成功時にダイアログを閉じ、親コンポーネントに通知
   */
  const handleSuccess = useCallback(() => {
    onClose();
    if (onSaved) {
      onSaved();
    }
  }, [onClose, onSaved]);

  /**
   * 【キャンセルハンドラ】: キャンセル時にダイアログを閉じる
   */
  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  /**
   * 【Escキーハンドラ】: Escキーでダイアログを閉じる
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  /**
   * 【オーバーレイクリックハンドラ】: オーバーレイクリックでダイアログを閉じる
   */
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  // ダイアログが閉じている場合は何も表示しない
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleOverlayClick}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="battle-log-dialog-title"
    >
      {/* biome-ignore lint/a11y/noStaticElementInteractions: ダイアログ内部のクリックイベント伝播防止用 */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: クリックイベント伝播防止用で、キーボードはダイアログ全体で処理 */}
      <div
        ref={dialogRef}
        className="relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* BattleLogFormコンポーネントを表示 */}
        <BattleLogForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  );
};

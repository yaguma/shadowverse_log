/**
 * 【機能概要】: Escapeキーハンドリングのカスタムフック
 * 【実装方針】: Escapeキーが押された時にコールバックを実行
 * 【リファクタリング】: 011-escape-key-handler-duplication.md に基づき重複を統合
 */

import { useEffect } from 'react';

/**
 * Escapeキーが押された時にコールバックを実行するカスタムフック
 *
 * @param onEscape - Escapeキーが押された時に実行するコールバック関数
 * @param enabled - フックを有効にするかどうか（デフォルト: true）
 *
 * @example
 * ```tsx
 * // ダイアログが開いている時のみEscapeキーで閉じる
 * useEscapeKey(handleClose, isOpen);
 * ```
 */
export function useEscapeKey(onEscape: () => void, enabled = true): void {
  useEffect(() => {
    // 【無効化チェック】: enabled=false の場合はイベントリスナーを登録しない
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEscape();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onEscape, enabled]);
}

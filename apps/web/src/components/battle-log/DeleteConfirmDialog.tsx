/**
 * 【機能概要】: 削除確認ダイアログコンポーネント
 * 【実装方針】: モーダルダイアログで削除確認を行い、ローディング状態も管理する
 * 【テスト対応】: TC-DELETE-DIALOG-001〜TC-EDGE-002の全6ケースを通すための実装
 * 🟡 信頼性レベル: 一般的なダイアログUXパターンから推測
 */

import type { BattleLog } from '../../types';

/**
 * 【型定義】: DeleteConfirmDialogコンポーネントのプロップス型
 * 🟡 信頼性レベル: 一般的なダイアログコンポーネントのパターンに基づく
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
 * 【機能概要】: 削除確認ダイアログコンポーネント
 * 【実装方針】: 最小限の実装でテストを通す
 * 【テスト対応】: TC-DELETE-DIALOG-001〜TC-EDGE-002の全6ケースを通すための実装
 * 🟡 信頼性レベル: 一般的なダイアログコンポーネントのパターンに基づく
 */
export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  targetLog,
  isLoading,
  onConfirm,
  onCancel,
}) => {
  // 【エッジケース処理】: isOpen=false or targetLog=null の場合は非表示 🟡
  // 【TC-EDGE-001、TC-EDGE-002対応】: ダイアログの表示制御
  if (!isOpen || !targetLog) {
    return null;
  }

  return (
    <>
      {/* 【モーダル背景】: 背景をクリックしてもクローズしない 🟡 */}
      {/* 【最小実装】: 背景クリックでのクローズは後で改善 */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        {/* 【ダイアログコンテンツ】: 削除確認の内容を表示 🟡 */}
        {/* 【TC-DELETE-DIALOG-001対応】: ダイアログタイトル、メッセージ、ボタンの表示 */}
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          {/* 【ダイアログタイトル】: "削除確認"を表示 🟡 */}
          <h2 className="text-xl font-bold mb-4">削除確認</h2>

          {/* 【確認メッセージ】: "本当に削除しますか？"を表示 🟡 */}
          {/* 【TC-DELETE-DIALOG-001対応】: 確認メッセージの表示 */}
          <p className="mb-4">本当に削除しますか？</p>

          {/* 【対象情報表示】: 削除対象の対戦日・対戦結果を表示 🟡 */}
          {/* 【TC-DELETE-DIALOG-001対応】: 対象の対戦日・対戦結果の表示 */}
          <div className="mb-6 p-3 bg-gray-100 rounded">
            <p>
              {targetLog.date} | {targetLog.result}
            </p>
          </div>

          {/* 【ローディングスピナー】: ローディング中に表示 🟡 */}
          {/* 【TC-DELETE-DIALOG-004対応】: ローディングスピナーの表示 */}
          {isLoading && (
            <div className="mb-4 text-center">
              <output className="inline-block">
                <span className="text-gray-600">削除中...</span>
              </output>
            </div>
          )}

          {/* 【ボタンエリア】: キャンセル・削除するボタンを表示 🟡 */}
          {/* 【TC-DELETE-DIALOG-002、TC-DELETE-DIALOG-003、TC-DELETE-DIALOG-004対応】 */}
          <div className="flex gap-4 justify-end">
            {/* 【キャンセルボタン】: onCancelコールバックを呼び出す 🟡 */}
            {/* 【TC-DELETE-DIALOG-002対応】: キャンセルボタンのクリック */}
            {/* 【TC-DELETE-DIALOG-004対応】: ローディング中は無効化 */}
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              キャンセル
            </button>

            {/* 【削除するボタン】: onConfirmコールバックを呼び出す 🟡 */}
            {/* 【TC-DELETE-DIALOG-003対応】: 削除するボタンのクリック */}
            {/* 【TC-DELETE-DIALOG-004対応】: ローディング中は無効化 */}
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              削除する
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

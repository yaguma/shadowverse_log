/**
 * 🔵 REQ-405: 空データ状態表示コンポーネント
 *
 * 指定期間にデータが存在しない場合のメッセージ表示
 * 🔵 TASK-0029: 「最初の対戦を記録する」ボタンを追加
 */

/**
 * 【型定義】: EmptyStateコンポーネントのプロップス型
 */
interface EmptyStateProps {
  /** 「最初の対戦を記録する」ボタンクリック時のコールバック（オプション） */
  onRecordBattle?: () => void;
}

/**
 * 🔵 REQ-405: 空データ状態表示コンポーネント
 *
 * 集計期間にデータが存在しない場合の「データなし」メッセージを表示
 * 🔵 TASK-0029: onRecordBattleが渡された場合、「最初の対戦を記録する」ボタンを表示
 */
export function EmptyState({ onRecordBattle }: EmptyStateProps) {
  return (
    <div className="text-center py-8">
      <p className="text-gray-600">指定期間にデータがありません</p>
      <p className="text-sm text-gray-500 mt-2">別の期間を選択してください</p>
      {/* 🔵 TASK-0029: 「最初の対戦を記録する」ボタン */}
      {onRecordBattle && (
        <button
          type="button"
          onClick={onRecordBattle}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          最初の対戦を記録する
        </button>
      )}
    </div>
  );
}

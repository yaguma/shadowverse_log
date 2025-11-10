/**
 * 🔵 REQ-405: 空データ状態表示コンポーネント
 *
 * 指定期間にデータが存在しない場合のメッセージ表示
 */

/**
 * 🔵 REQ-405: 空データ状態表示コンポーネント
 *
 * 集計期間にデータが存在しない場合の「データなし」メッセージを表示
 */
export function EmptyState() {
  return (
    <div className="text-center py-8">
      <p className="text-gray-600">指定期間にデータがありません</p>
      <p className="text-sm text-gray-500 mt-2">別の期間を選択してください</p>
    </div>
  );
}

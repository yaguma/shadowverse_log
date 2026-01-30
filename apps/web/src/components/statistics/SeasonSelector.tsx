/**
 * シーズン選択コンポーネント
 * 統計画面でシーズン別フィルタリングを行うための入力フィールド
 *
 * TASK-0028: 統計画面シーズン選択UI実装
 * 🔵 信頼性レベル: dataflow.md 3.1〜3.2より
 *
 * 【使用方法】
 * 1. propsモード（従来）: availableSeasonsを渡さない → number入力フィールド
 * 2. ドロップダウンモード: availableSeasonsを渡す → selectドロップダウン
 *
 * 【設計意図】
 * 既存のStatisticsDashboardPageとの後方互換性を維持しつつ、
 * シーズン一覧が取得できる場合はドロップダウンを表示する
 */

interface SeasonSelectorProps {
  /** 選択中のシーズン（undefinedは全シーズン） */
  season: number | undefined;
  /** シーズン変更時のコールバック */
  onSeasonChange: (season: number | undefined) => void;
  /** ローディング中かどうか */
  isLoading: boolean;
  /** 利用可能なシーズン一覧（指定時はドロップダウン表示） */
  availableSeasons?: number[];
  /** シーズン一覧取得中かどうか */
  isSeasonsLoading?: boolean;
}

/**
 * シーズン選択コンポーネント
 */
export function SeasonSelector({
  season,
  onSeasonChange,
  isLoading,
  availableSeasons,
  isSeasonsLoading,
}: SeasonSelectorProps) {
  // 【ローディング状態】: シーズン一覧取得中はメッセージを表示 🔵
  if (isSeasonsLoading) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">シーズン読み込み中...</span>
      </div>
    );
  }

  // 【シーズンなし状態】: シーズン一覧が明示的に空の場合はメッセージを表示 🔵
  // availableSeasonsがundefinedの場合はpropsモードなので、メッセージは表示しない
  if (availableSeasons !== undefined && availableSeasons.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">シーズンデータがありません</span>
      </div>
    );
  }

  // 【ドロップダウンモード】: シーズン一覧がある場合 🔵
  if (availableSeasons && availableSeasons.length > 0) {
    return (
      <div className="flex items-center gap-2">
        <label htmlFor="seasonFilter" className="text-sm font-medium text-gray-700">
          シーズン
        </label>
        <select
          id="seasonFilter"
          value={season ?? ''}
          onChange={(e) => onSeasonChange(e.target.value ? Number(e.target.value) : undefined)}
          className="border rounded px-3 py-2 w-32 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading}
        >
          <option value="">すべて</option>
          {availableSeasons.map((s) => (
            <option key={s} value={s}>
              シーズン {s}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // 【propsモード（従来）】: シーズン一覧がない場合は数値入力フィールドを表示 🔵
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="seasonFilter" className="text-sm font-medium text-gray-700">
        シーズン
      </label>
      <input
        type="number"
        id="seasonFilter"
        min="1"
        value={season ?? ''}
        onChange={(e) => onSeasonChange(e.target.value ? Number(e.target.value) : undefined)}
        className="border rounded px-3 py-2 w-20 text-sm"
        disabled={isLoading}
        placeholder="全て"
      />
    </div>
  );
}

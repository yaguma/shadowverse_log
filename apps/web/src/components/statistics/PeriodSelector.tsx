/**
 * 🔵 REQ-202: 期間選択コンポーネント
 *
 * Statistics Dashboard用の期間選択フォーム
 * - 開始日・終了日の入力フィールド
 * - 検索ボタン
 * - ローディング中はボタンを無効化
 */

interface PeriodSelectorProps {
  /** 🔵 開始日 (YYYY-MM-DD形式、nullの場合は空文字で表示) */
  startDate: string | null;
  /** 🔵 終了日 (YYYY-MM-DD形式、nullの場合は空文字で表示) */
  endDate: string | null;
  /** 🔵 開始日変更ハンドラ */
  onStartDateChange: (date: string | null) => void;
  /** 🔵 終了日変更ハンドラ */
  onEndDateChange: (date: string | null) => void;
  /** 🔵 検索ボタンクリックハンドラ */
  onSearch: () => void;
  /** 🔵 ローディング状態 */
  isLoading: boolean;
}

/**
 * 🔵 REQ-202: 期間選択コンポーネント
 *
 * 統計データの表示期間を選択するためのフォーム
 */
export function PeriodSelector({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onSearch,
  isLoading,
}: PeriodSelectorProps) {
  return (
    <div className="mb-4 flex gap-4 items-end">
      {/* 🔵 開始日入力 */}
      <div>
        <label htmlFor="startDate" className="block text-sm font-medium mb-1">
          開始日
        </label>
        <input
          type="date"
          id="startDate"
          value={startDate ?? ''}
          onChange={(e) => onStartDateChange(e.target.value || null)}
          className="border rounded px-3 py-2"
          disabled={isLoading}
        />
      </div>

      {/* 🔵 終了日入力 */}
      <div>
        <label htmlFor="endDate" className="block text-sm font-medium mb-1">
          終了日
        </label>
        <input
          type="date"
          id="endDate"
          value={endDate ?? ''}
          onChange={(e) => onEndDateChange(e.target.value || null)}
          className="border rounded px-3 py-2"
          disabled={isLoading}
        />
      </div>

      {/* 🔵 検索ボタン */}
      <div>
        <button
          type="button"
          onClick={onSearch}
          disabled={isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          検索
        </button>
      </div>
    </div>
  );
}

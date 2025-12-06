/**
 * シーズン選択コンポーネント
 * 統計画面でシーズン別フィルタリングを行うための入力フィールド
 */

interface SeasonSelectorProps {
  /** 選択中のシーズン（undefinedは全シーズン） */
  season: number | undefined;
  /** シーズン変更時のコールバック */
  onSeasonChange: (season: number | undefined) => void;
  /** ローディング中かどうか */
  isLoading: boolean;
}

/**
 * シーズン選択コンポーネント
 */
export function SeasonSelector({ season, onSeasonChange, isLoading }: SeasonSelectorProps) {
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

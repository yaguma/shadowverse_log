/**
 * 🔵 REQ-203: デッキ別統計テーブルコンポーネント
 *
 * マイデッキ別または相手デッキ別の統計情報をテーブル形式で表示
 */

interface DeckStatsTableProps {
  /** 🔵 テーブルタイトル */
  title: string;
  /** 🔵 デッキ別統計データ */
  deckStats: Array<{
    /** 🔵 デッキID */
    deckId: string;
    /** 🔵 デッキ名 */
    deckName: string;
    /** 🔵 総試合数 */
    totalGames: number;
    /** 🔵 勝数 */
    wins: number;
    /** 🔵 敗数 */
    losses: number;
    /** 🔵 勝率（パーセンテージ） */
    winRate: number;
  }>;
}

/**
 * 🔵 REQ-203: デッキ別統計テーブルコンポーネント
 *
 * デッキごとの対戦成績をテーブル形式で表示
 */
export function DeckStatsTable({ title, deckStats }: DeckStatsTableProps) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-2 text-left">デッキ名</th>
              <th className="border px-4 py-2 text-right">試合数</th>
              <th className="border px-4 py-2 text-right">勝数</th>
              <th className="border px-4 py-2 text-right">敗数</th>
              <th className="border px-4 py-2 text-right">勝率</th>
            </tr>
          </thead>
          <tbody>
            {deckStats.map((deck) => (
              <tr key={deck.deckId} className="hover:bg-gray-50">
                <td className="border px-4 py-2">{deck.deckName}</td>
                <td className="border px-4 py-2 text-right">{deck.totalGames}</td>
                <td className="border px-4 py-2 text-right text-green-600">
                  {deck.wins}
                </td>
                <td className="border px-4 py-2 text-right text-red-600">
                  {deck.losses}
                </td>
                <td className="border px-4 py-2 text-right text-blue-600 font-bold">
                  {deck.winRate.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

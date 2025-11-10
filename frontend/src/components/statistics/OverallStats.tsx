/**
 * 🔵 REQ-203: 全体統計表示コンポーネント
 *
 * 全体の対戦成績（総試合数、勝数、敗数、勝率）を表示
 */

interface OverallStatsProps {
  /** 🔵 全体統計データ */
  stats: {
    /** 🔵 総試合数 */
    totalGames: number;
    /** 🔵 勝数 */
    wins: number;
    /** 🔵 敗数 */
    losses: number;
    /** 🔵 勝率（パーセンテージ） */
    winRate: number;
  };
}

/**
 * 🔵 REQ-203: 全体統計表示コンポーネント
 *
 * ユーザーの全体的な対戦成績を表示するコンポーネント
 */
export function OverallStats({ stats }: OverallStatsProps) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-bold mb-2">全体統計</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* 🔵 総試合数 */}
        <div className="border rounded p-3">
          <p>総試合数: {stats.totalGames}試合</p>
        </div>

        {/* 🔵 勝数 */}
        <div className="border rounded p-3">
          <p>勝数: {stats.wins}勝</p>
        </div>

        {/* 🔵 敗数 */}
        <div className="border rounded p-3">
          <p>敗数: {stats.losses}敗</p>
        </div>

        {/* 🔵 勝率 */}
        <div className="border rounded p-3">
          <p>勝率: {stats.winRate.toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
}

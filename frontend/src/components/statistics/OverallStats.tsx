/**
 * 🔵 REQ-203: 全体統計表示コンポーネント
 *
 * 全体の対戦成績（総試合数、勝数、敗数、勝率）をグラフィカルに表示
 */

import { WinRateGauge } from './WinRateGauge';

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
 * ユーザーの全体的な対戦成績をグラフィカルに表示するコンポーネント
 */
export function OverallStats({ stats }: OverallStatsProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold mb-4 text-center text-gray-800">全体統計</h3>
      <WinRateGauge
        winRate={stats.winRate}
        totalGames={stats.totalGames}
        wins={stats.wins}
        losses={stats.losses}
      />
    </div>
  );
}

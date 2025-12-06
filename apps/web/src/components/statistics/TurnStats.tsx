/**
 * 🔵 REQ-203: 先攻後攻別統計表示コンポーネント
 *
 * 先攻・後攻それぞれの対戦成績をグラフィカルに表示
 */

import { TurnComparisonChart } from './TurnComparisonChart';

interface TurnStatsProps {
  /** 🔵 先攻後攻別統計データ */
  turnStats: {
    /** 🔵 先攻の統計 */
    先攻: {
      /** 🔵 総試合数 */
      totalGames: number;
      /** 🔵 勝数 */
      wins: number;
      /** 🔵 敗数 */
      losses: number;
      /** 🔵 勝率（パーセンテージ） */
      winRate: number;
    };
    /** 🔵 後攻の統計 */
    後攻: {
      /** 🔵 総試合数 */
      totalGames: number;
      /** 🔵 勝数 */
      wins: number;
      /** 🔵 敗数 */
      losses: number;
      /** 🔵 勝率（パーセンテージ） */
      winRate: number;
    };
  };
}

/**
 * 🔵 REQ-203: 先攻後攻別統計表示コンポーネント
 *
 * 先攻・後攻それぞれの対戦成績をグラフィカルに比較表示
 */
export function TurnStats({ turnStats }: TurnStatsProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold mb-4 text-center text-gray-800">先攻後攻別統計</h3>
      <TurnComparisonChart first={turnStats.先攻} second={turnStats.後攻} />
    </div>
  );
}

/**
 * 🔵 REQ-203: ランク帯別統計テーブルコンポーネント
 *
 * ランク・グループ別の統計情報をテーブル形式で表示
 */

import type { Group, Rank } from '../../types';

interface RankStatsTableProps {
  /** 🔵 ランク帯別統計データ */
  rankStats: Array<{
    /** 🔵 ランク */
    rank: Rank;
    /** 🔵 グループ */
    group: Group;
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
 * 🔵 REQ-203: ランク帯別統計テーブルコンポーネント
 *
 * ランクとグループごとの対戦成績をテーブル形式で表示
 */
export function RankStatsTable({ rankStats }: RankStatsTableProps) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-bold mb-2">ランク帯別統計</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-2 text-left">ランク</th>
              <th className="border px-4 py-2 text-left">グループ</th>
              <th className="border px-4 py-2 text-right">試合数</th>
              <th className="border px-4 py-2 text-right">勝数</th>
              <th className="border px-4 py-2 text-right">敗数</th>
              <th className="border px-4 py-2 text-right">勝率</th>
            </tr>
          </thead>
          <tbody>
            {rankStats.map((rank, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border px-4 py-2">{rank.rank}</td>
                <td className="border px-4 py-2">{rank.group}</td>
                <td className="border px-4 py-2 text-right">{rank.totalGames}</td>
                <td className="border px-4 py-2 text-right text-green-600">{rank.wins}</td>
                <td className="border px-4 py-2 text-right text-red-600">{rank.losses}</td>
                <td className="border px-4 py-2 text-right text-blue-600 font-bold">
                  {rank.winRate.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

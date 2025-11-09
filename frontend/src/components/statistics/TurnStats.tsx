/**
 * 🔵 REQ-203: 先攻後攻別統計表示コンポーネント
 *
 * 先攻・後攻それぞれの対戦成績を表示
 */

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
 * 先攻・後攻それぞれの対戦成績を比較表示
 */
export function TurnStats({ turnStats }: TurnStatsProps) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-bold mb-2">先攻後攻別統計</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 🔵 先攻の統計 */}
        <div className="border rounded p-4">
          <h4 className="font-bold mb-2">先攻</h4>
          <p className="text-sm">
            {turnStats.先攻.totalGames}試合 {turnStats.先攻.wins}勝{' '}
            {turnStats.先攻.losses}敗 勝率{turnStats.先攻.winRate.toFixed(1)}%
          </p>
        </div>

        {/* 🔵 後攻の統計 */}
        <div className="border rounded p-4">
          <h4 className="font-bold mb-2">後攻</h4>
          <p className="text-sm">
            {turnStats.後攻.totalGames}試合 {turnStats.後攻.wins}勝{' '}
            {turnStats.後攻.losses}敗 勝率{turnStats.後攻.winRate.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * シーズン統計情報
 */
export interface SeasonStatistics {
  /** シーズン番号 */
  season: number;
  /** 総対戦数 */
  totalMatches: number;
  /** 勝利数 */
  wins: number;
  /** 敗北数 */
  losses: number;
  /** 勝率（パーセント） */
  winRate: number;
  /** 先攻勝率 */
  firstWinRate: number;
  /** 後攻勝率 */
  secondWinRate: number;
}

/**
 * 統計クエリパラメータ
 */
export interface StatisticsQueryParams {
  /** シーズン番号（省略時は全期間） */
  season?: number;
}

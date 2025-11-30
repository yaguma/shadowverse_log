/**
 * D1StatisticsService - D1データベースを使用した統計計算サービス
 * TASK-0030: 統計計算API実装
 *
 * @description 対戦履歴データから統計情報を計算し、集計結果を返すサービスクラス
 * @implements Cloudflare D1 + Drizzle ORM
 * 🔵 信頼性レベル: 青信号（requirements.md より）
 */
import { and, eq, gte, lte } from 'drizzle-orm';
import type { Database } from '../db';
import { battleLogs } from '../db/schema/battle-logs';

/**
 * 全体統計の型定義
 */
export interface OverallStatistics {
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
}

/**
 * デッキ別統計の型定義
 */
export interface DeckStatistics {
  deckId: string;
  deckName: string;
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
}

/**
 * ランク別統計の型定義
 */
export interface RankStatistics {
  rank: string;
  group: string;
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
}

/**
 * 統計レスポンスの型定義
 */
export interface StatisticsResult {
  overall: OverallStatistics;
  byMyDeck: DeckStatistics[];
  byOpponentDeck: DeckStatistics[];
  byRank: RankStatistics[];
  byTurn: {
    first: OverallStatistics;
    second: OverallStatistics;
  };
}

/**
 * 統計クエリパラメータの型定義
 */
export interface StatisticsParams {
  startDate?: string;
  endDate?: string;
  battleType?: string;
}

/**
 * D1StatisticsService - 統計計算サービス
 */
export class D1StatisticsService {
  constructor(private db: Database) {}

  /**
   * 統計データを取得
   *
   * @param params - クエリパラメータ（startDate, endDate, battleType）
   * @returns 統計情報
   */
  async getStatistics(params: StatisticsParams): Promise<StatisticsResult> {
    // デフォルト期間の設定
    const today = new Date();
    const endDate =
      params.endDate || today.toISOString().split('T')[0] || '';
    const startDate =
      params.startDate || this.getDateBeforeDays(endDate, 7);

    // 対戦履歴を取得
    const logs = await this.fetchBattleLogs(
      startDate,
      endDate,
      params.battleType
    );

    // 各種統計を計算
    const overall = this.calculateOverall(logs);
    const byMyDeck = this.calculateByMyDeck(logs);
    const byOpponentDeck = this.calculateByOpponentDeck(logs);
    const byRank = this.calculateByRank(logs);
    const byTurn = this.calculateByTurn(logs);

    return {
      overall,
      byMyDeck,
      byOpponentDeck,
      byRank,
      byTurn,
    };
  }

  /**
   * 対戦履歴を取得
   */
  private async fetchBattleLogs(
    startDate: string,
    endDate: string,
    battleType?: string
  ) {
    const conditions = [
      gte(battleLogs.date, startDate),
      lte(battleLogs.date, endDate),
    ];

    if (battleType) {
      conditions.push(eq(battleLogs.battleType, battleType));
    }

    return await this.db
      .select()
      .from(battleLogs)
      .where(and(...conditions));
  }

  /**
   * 全体統計を計算
   */
  private calculateOverall(
    logs: Array<{ result: string }>
  ): OverallStatistics {
    const totalGames = logs.length;

    if (totalGames === 0) {
      return { totalGames: 0, wins: 0, losses: 0, winRate: 0 };
    }

    const { wins, losses } = logs.reduce(
      (acc, log) => {
        if (log.result === '勝ち') {
          acc.wins++;
        } else if (log.result === '負け') {
          acc.losses++;
        }
        return acc;
      },
      { wins: 0, losses: 0 }
    );

    const winRate = this.calculateWinRate(wins, totalGames);

    return { totalGames, wins, losses, winRate };
  }

  /**
   * デッキ別統計を計算する共通メソッド
   *
   * @param logs - 対戦履歴
   * @param deckIdExtractor - ログからデッキIDを抽出する関数
   * @returns デッキ別統計の配列
   */
  private calculateByDeck<T extends { result: string }>(
    logs: T[],
    deckIdExtractor: (log: T) => string
  ): DeckStatistics[] {
    if (logs.length === 0) {
      return [];
    }

    const grouped = logs.reduce(
      (acc, log) => {
        const key = deckIdExtractor(log);
        if (!acc[key]) {
          acc[key] = {
            deckId: key,
            deckName: key, // TODO: デッキマスターから名前を取得
            totalGames: 0,
            wins: 0,
            losses: 0,
          };
        }
        acc[key].totalGames++;
        if (log.result === '勝ち') {
          acc[key].wins++;
        } else if (log.result === '負け') {
          acc[key].losses++;
        }
        return acc;
      },
      {} as Record<
        string,
        Omit<DeckStatistics, 'winRate'>
      >
    );

    return Object.values(grouped)
      .sort((a, b) => b.totalGames - a.totalGames)
      .map((stat) => ({
        ...stat,
        winRate: this.calculateWinRate(stat.wins, stat.totalGames),
      }));
  }

  /**
   * マイデッキ別統計を計算
   */
  private calculateByMyDeck(
    logs: Array<{ myDeckId: string; result: string }>
  ): DeckStatistics[] {
    return this.calculateByDeck(logs, (log) => log.myDeckId);
  }

  /**
   * 相手デッキ別統計を計算
   */
  private calculateByOpponentDeck(
    logs: Array<{ opponentDeckId: string; result: string }>
  ): DeckStatistics[] {
    return this.calculateByDeck(logs, (log) => log.opponentDeckId);
  }

  /**
   * ランク別統計を計算
   */
  private calculateByRank(
    logs: Array<{ rank: string; groupName: string; result: string }>
  ): RankStatistics[] {
    if (logs.length === 0) {
      return [];
    }

    const grouped = logs.reduce(
      (acc, log) => {
        const key = `${log.rank}|${log.groupName}`;
        if (!acc[key]) {
          acc[key] = {
            rank: log.rank,
            group: log.groupName,
            totalGames: 0,
            wins: 0,
            losses: 0,
          };
        }
        acc[key].totalGames++;
        if (log.result === '勝ち') {
          acc[key].wins++;
        } else if (log.result === '負け') {
          acc[key].losses++;
        }
        return acc;
      },
      {} as Record<
        string,
        {
          rank: string;
          group: string;
          totalGames: number;
          wins: number;
          losses: number;
        }
      >
    );

    return Object.values(grouped)
      .sort((a, b) => b.totalGames - a.totalGames)
      .map((stat) => ({
        ...stat,
        winRate: this.calculateWinRate(stat.wins, stat.totalGames),
      }));
  }

  /**
   * ターン別統計を計算
   */
  private calculateByTurn(logs: Array<{ turn: string; result: string }>): {
    first: OverallStatistics;
    second: OverallStatistics;
  } {
    const stats = logs.reduce(
      (acc, log) => {
        if (log.turn === '先攻') {
          acc.first.totalGames++;
          if (log.result === '勝ち') {
            acc.first.wins++;
          } else if (log.result === '負け') {
            acc.first.losses++;
          }
        } else if (log.turn === '後攻') {
          acc.second.totalGames++;
          if (log.result === '勝ち') {
            acc.second.wins++;
          } else if (log.result === '負け') {
            acc.second.losses++;
          }
        }
        return acc;
      },
      {
        first: { totalGames: 0, wins: 0, losses: 0 },
        second: { totalGames: 0, wins: 0, losses: 0 },
      }
    );

    return {
      first: {
        ...stats.first,
        winRate: this.calculateWinRate(
          stats.first.wins,
          stats.first.totalGames
        ),
      },
      second: {
        ...stats.second,
        winRate: this.calculateWinRate(
          stats.second.wins,
          stats.second.totalGames
        ),
      },
    };
  }

  /**
   * 勝率を計算（小数点第1位まで）
   */
  private calculateWinRate(wins: number, totalGames: number): number {
    if (totalGames === 0) {
      return 0;
    }
    return Math.round((wins / totalGames) * 1000) / 10;
  }

  /**
   * 指定日から指定日数前の日付を取得
   */
  private getDateBeforeDays(date: string, days: number): string {
    const baseDate = new Date(date);
    baseDate.setDate(baseDate.getDate() - days);
    return baseDate.toISOString().split('T')[0] || '';
  }
}

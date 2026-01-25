/**
 * D1StatisticsService - D1データベースを使用した統計計算サービス
 * TASK-0030: 統計計算API実装
 *
 * @description 対戦履歴データから統計情報を計算し、集計結果を返すサービスクラス
 * @implements Cloudflare D1 + Drizzle ORM
 * 🔵 信頼性レベル: 青信号（requirements.md より）
 */
import { and, eq, gte, inArray, lte } from 'drizzle-orm';
import type { Database } from '../db';
import { battleLogs } from '../db/schema/battle-logs';
import { deckMaster } from '../db/schema/deck-master';
import { myDecks } from '../db/schema/my-decks';
import { getTodayInJST, getDateBeforeDays } from '../utils/date';

/**
 * 勝敗の定数（データベースの値に合わせる）
 */
const RESULT = {
  WIN: 'WIN',
  LOSE: 'LOSE',
} as const;

/**
 * ターンの定数（データベースの値に合わせる）
 */
const TURN = {
  FIRST: '先行',
  SECOND: '後攻',
} as const;

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
 * クラス別統計の型定義
 */
export interface ClassStatistics {
  className: string;
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
  byOpponentClass: ClassStatistics[];
  byRank: RankStatistics[];
  byTurn: {
    先攻: OverallStatistics;
    後攻: OverallStatistics;
  };
}

/**
 * 統計クエリパラメータの型定義
 */
export interface StatisticsParams {
  startDate?: string;
  endDate?: string;
  battleType?: string;
  season?: number; // シーズンフィルタ
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
    // デフォルト期間の設定（日本時間）
    const endDate = params.endDate || getTodayInJST();
    const startDate = params.startDate || getDateBeforeDays(endDate, 7);

    // 対戦履歴を取得
    const logs = await this.fetchBattleLogs(startDate, endDate, params.battleType, params.season);

    // デッキ名のマッピングを取得
    const myDeckNameMap = await this.fetchMyDeckNames(logs);
    const opponentDeckNameMap = await this.fetchDeckMasterNames(logs);
    const opponentClassNameMap = await this.fetchDeckMasterClassNames(logs);

    // 各種統計を計算
    const overall = this.calculateOverall(logs);
    const byMyDeck = this.calculateByMyDeck(logs, myDeckNameMap);
    const byOpponentDeck = this.calculateByOpponentDeck(logs, opponentDeckNameMap);
    const byOpponentClass = this.calculateByOpponentClass(logs, opponentClassNameMap);
    const byRank = this.calculateByRank(logs);
    const byTurn = this.calculateByTurn(logs);

    return {
      overall,
      byMyDeck,
      byOpponentDeck,
      byOpponentClass,
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
    battleType?: string,
    season?: number
  ) {
    const conditions = [gte(battleLogs.date, startDate), lte(battleLogs.date, endDate)];

    if (battleType) {
      conditions.push(eq(battleLogs.battleType, battleType));
    }

    if (season) {
      conditions.push(eq(battleLogs.season, season));
    }

    return await this.db
      .select()
      .from(battleLogs)
      .where(and(...conditions));
  }

  /**
   * マイデッキのデッキ名マッピングを取得
   */
  private async fetchMyDeckNames(logs: Array<{ myDeckId: string }>): Promise<Map<string, string>> {
    const deckIds = [...new Set(logs.map((log) => log.myDeckId))];
    if (deckIds.length === 0) {
      return new Map();
    }

    const decks = await this.db
      .select({ id: myDecks.id, deckName: myDecks.deckName })
      .from(myDecks)
      .where(inArray(myDecks.id, deckIds));

    return new Map(decks.map((d) => [d.id, d.deckName]));
  }

  /**
   * デッキマスターのデッキ名マッピングを取得
   */
  private async fetchDeckMasterNames(
    logs: Array<{ opponentDeckId: string }>
  ): Promise<Map<string, string>> {
    const deckIds = [...new Set(logs.map((log) => log.opponentDeckId))];
    if (deckIds.length === 0) {
      return new Map();
    }

    const decks = await this.db
      .select({ id: deckMaster.id, deckName: deckMaster.deckName })
      .from(deckMaster)
      .where(inArray(deckMaster.id, deckIds));

    return new Map(decks.map((d) => [d.id, d.deckName]));
  }

  /**
   * デッキマスターのクラス名マッピングを取得
   */
  private async fetchDeckMasterClassNames(
    logs: Array<{ opponentDeckId: string }>
  ): Promise<Map<string, string>> {
    const deckIds = [...new Set(logs.map((log) => log.opponentDeckId))];
    if (deckIds.length === 0) {
      return new Map();
    }

    const decks = await this.db
      .select({ id: deckMaster.id, className: deckMaster.className })
      .from(deckMaster)
      .where(inArray(deckMaster.id, deckIds));

    return new Map(decks.map((d) => [d.id, d.className]));
  }

  /**
   * 全体統計を計算
   */
  private calculateOverall(logs: Array<{ result: string }>): OverallStatistics {
    const totalGames = logs.length;

    if (totalGames === 0) {
      return { totalGames: 0, wins: 0, losses: 0, winRate: 0 };
    }

    const { wins, losses } = logs.reduce(
      (acc, log) => {
        if (log.result === RESULT.WIN) {
          acc.wins++;
        } else if (log.result === RESULT.LOSE) {
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
   * @param deckNameMap - デッキIDからデッキ名へのマッピング
   * @returns デッキ別統計の配列
   */
  private calculateByDeck<T extends { result: string }>(
    logs: T[],
    deckIdExtractor: (log: T) => string,
    deckNameMap: Map<string, string>
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
            deckName: deckNameMap.get(key) || `Unknown(${key})`,
            totalGames: 0,
            wins: 0,
            losses: 0,
          };
        }
        acc[key].totalGames++;
        if (log.result === RESULT.WIN) {
          acc[key].wins++;
        } else if (log.result === RESULT.LOSE) {
          acc[key].losses++;
        }
        return acc;
      },
      {} as Record<string, Omit<DeckStatistics, 'winRate'>>
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
    logs: Array<{ myDeckId: string; result: string }>,
    deckNameMap: Map<string, string>
  ): DeckStatistics[] {
    return this.calculateByDeck(logs, (log) => log.myDeckId, deckNameMap);
  }

  /**
   * 相手デッキ別統計を計算
   */
  private calculateByOpponentDeck(
    logs: Array<{ opponentDeckId: string; result: string }>,
    deckNameMap: Map<string, string>
  ): DeckStatistics[] {
    return this.calculateByDeck(logs, (log) => log.opponentDeckId, deckNameMap);
  }

  /**
   * 相手デッキのクラス別統計を計算
   */
  private calculateByOpponentClass(
    logs: Array<{ opponentDeckId: string; result: string }>,
    classNameMap: Map<string, string>
  ): ClassStatistics[] {
    if (logs.length === 0) {
      return [];
    }

    const grouped = logs.reduce(
      (acc, log) => {
        const className = classNameMap.get(log.opponentDeckId) || 'Unknown';
        if (!acc[className]) {
          acc[className] = {
            className,
            totalGames: 0,
            wins: 0,
            losses: 0,
          };
        }
        acc[className].totalGames++;
        if (log.result === RESULT.WIN) {
          acc[className].wins++;
        } else if (log.result === RESULT.LOSE) {
          acc[className].losses++;
        }
        return acc;
      },
      {} as Record<string, Omit<ClassStatistics, 'winRate'>>
    );

    return Object.values(grouped)
      .sort((a, b) => b.totalGames - a.totalGames)
      .map((stat) => ({
        ...stat,
        winRate: this.calculateWinRate(stat.wins, stat.totalGames),
      }));
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
        if (log.result === RESULT.WIN) {
          acc[key].wins++;
        } else if (log.result === RESULT.LOSE) {
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
    先攻: OverallStatistics;
    後攻: OverallStatistics;
  } {
    const stats = logs.reduce(
      (acc, log) => {
        if (log.turn === TURN.FIRST) {
          acc.first.totalGames++;
          if (log.result === RESULT.WIN) {
            acc.first.wins++;
          } else if (log.result === RESULT.LOSE) {
            acc.first.losses++;
          }
        } else if (log.turn === TURN.SECOND) {
          acc.second.totalGames++;
          if (log.result === RESULT.WIN) {
            acc.second.wins++;
          } else if (log.result === RESULT.LOSE) {
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
      先攻: {
        ...stats.first,
        winRate: this.calculateWinRate(stats.first.wins, stats.first.totalGames),
      },
      後攻: {
        ...stats.second,
        winRate: this.calculateWinRate(stats.second.wins, stats.second.totalGames),
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
}

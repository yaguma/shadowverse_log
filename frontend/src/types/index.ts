/**
 * 対戦タイプ
 */
export type BattleType = 'ランクマッチ' | '対戦台' | 'ロビー大会';

/**
 * ランク
 */
export type Rank = 'サファイア' | 'ダイアモンド' | 'ルビー' | 'トパーズ' | '-';

/**
 * グループ
 */
export type Group = 'A' | 'AA' | 'AAA' | 'Master' | '-';

/**
 * ターン
 */
export type Turn = '先攻' | '後攻';

/**
 * 対戦結果
 */
export type BattleResult = '勝ち' | '負け';

/**
 * 対戦履歴エンティティ
 */
export interface BattleLog {
  /** 対戦履歴ID */
  id: string;
  /** 対戦日 (YYYY/MM/DD 形式) */
  date: string;
  /** 対戦タイプ */
  battleType: BattleType;
  /** ランク */
  rank: Rank;
  /** グループ */
  group: Group;
  /** マイデッキID */
  myDeckId: string;
  /** ターン */
  turn: Turn;
  /** 対戦結果 */
  result: BattleResult;
  /** 相手デッキID */
  opponentDeckId: string;
}

/**
 * デッキマスターエンティティ（相手デッキ）
 */
export interface DeckMaster {
  /** デッキID */
  id: string;
  /** クラス名 */
  className: string;
  /** デッキ名 */
  deckName: string;
  /** ソート順 */
  sortOrder: number;
}

/**
 * マイデッキエンティティ
 */
export interface MyDeck {
  /** デッキID */
  id: string;
  /** デッキマスターID */
  deckId: string;
  /** デッキコード */
  deckCode: string;
  /** デッキ名 */
  deckName: string;
  /** 使用中フラグ */
  isActive: boolean;
  /** 作成日時 (ISO 8601形式) */
  createdAt: string;
}

/**
 * 定数定義
 */
export const BATTLE_TYPES: readonly BattleType[] = ['ランクマッチ', '対戦台', 'ロビー大会'];

export const RANKS: readonly Rank[] = ['サファイア', 'ダイアモンド', 'ルビー', 'トパーズ', '-'];

export const GROUPS: readonly Group[] = ['A', 'AA', 'AAA', 'Master', '-'];

export const TURNS: readonly Turn[] = ['先攻', '後攻'];

export const BATTLE_RESULTS: readonly BattleResult[] = ['勝ち', '負け'];

/**
 * API レスポンス型
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

/**
 * 対戦履歴一覧レスポンス
 */
export interface BattleLogsResponse {
  battleLogs: BattleLog[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * 統計データレスポンス
 */
export interface StatisticsResponse {
  overall: {
    totalGames: number;
    wins: number;
    losses: number;
    winRate: number;
  };
  byMyDeck: Array<{
    deckId: string;
    deckName: string;
    totalGames: number;
    wins: number;
    losses: number;
    winRate: number;
  }>;
  byOpponentDeck: Array<{
    deckId: string;
    deckName: string;
    totalGames: number;
    wins: number;
    losses: number;
    winRate: number;
  }>;
  byRank: Array<{
    rank: Rank;
    group: Group;
    totalGames: number;
    wins: number;
    losses: number;
    winRate: number;
  }>;
  byTurn: {
    先攻: {
      totalGames: number;
      wins: number;
      losses: number;
      winRate: number;
    };
    後攻: {
      totalGames: number;
      wins: number;
      losses: number;
      winRate: number;
    };
  };
  opponentDeckDistribution: Array<{
    deckId: string;
    deckName: string;
    count: number;
    percentage: number;
  }>;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

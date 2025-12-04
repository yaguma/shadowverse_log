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
export type Group = 'A' | 'AA' | 'AAA' | 'Master' | 'GrandMaster0' | 'GrandMaster1' | 'GrandMaster2' | 'GrandMaster3' | '-';

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
  /** グループ名 */
  groupName: Group;
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
 * 対戦履歴エンティティ（デッキ名付き）
 * 【型定義】: 対戦履歴一覧表示でデッキ名を表示するための拡張型
 * 🔵 信頼性レベル: docs/design/shadowverse-battle-log/interfaces.ts に基づく
 */
export interface BattleLogWithDeckNames extends BattleLog {
  /** マイデッキ名 */
  myDeckName: string;
  /** 相手デッキ名 */
  opponentDeckName: string;
}

/**
 * 対戦履歴登録リクエスト型
 * 【型定義】: 新規対戦履歴を登録する際のリクエストボディ型
 * 【改善内容】: battleLogStore.tsから共有型定義ファイルに移動（DRY原則）
 * 🔵 信頼性レベル: Backend API仕様に基づいた型定義
 */
export interface CreateBattleLogRequest {
  /** 対戦日 (YYYY-MM-DD形式、省略時は当日) */
  date?: string;
  /** 対戦タイプ */
  battleType: BattleType;
  /** ランク */
  rank: Rank;
  /** グループ名 */
  groupName: Group;
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

export const GROUPS: readonly Group[] = ['A', 'AA', 'AAA', 'Master', 'GrandMaster0', 'GrandMaster1', 'GrandMaster2', 'GrandMaster3', '-'];

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
 * 【型定義】: 対戦履歴一覧APIのレスポンス型
 * 【改善内容】: battleLogsをBattleLogWithDeckNames[]に変更（TASK-0047対応）
 * 🔵 信頼性レベル: TASK-0047の要件に基づく
 */
export interface BattleLogsResponse {
  battleLogs: BattleLogWithDeckNames[];
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

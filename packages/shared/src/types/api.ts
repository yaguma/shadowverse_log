import type { BattleLogWithDeckNames, Group, Rank } from './battle-log.js';

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
  battleLogs: BattleLogWithDeckNames[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * デッキ統計
 */
export interface DeckStats {
  deckId: string;
  deckName: string;
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
}

/**
 * クラス統計
 */
export interface ClassStats {
  className: string;
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
}

/**
 * ランク統計
 */
export interface RankStats {
  rank: Rank;
  group: Group;
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
}

/**
 * ターン統計
 */
export interface TurnStats {
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
}

/**
 * デッキ分布
 */
export interface DeckDistribution {
  deckId: string;
  deckName: string;
  count: number;
  percentage: number;
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
  byMyDeck: DeckStats[];
  byOpponentDeck: DeckStats[];
  byOpponentClass: ClassStats[];
  byRank: RankStats[];
  byTurn: {
    先攻: TurnStats;
    後攻: TurnStats;
  };
  opponentDeckDistribution: DeckDistribution[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

/**
 * APIエラー基底型
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * バリデーションエラー
 * REQ-EXT-403 対応
 */
export interface ValidationError {
  code: 'VALIDATION_ERROR';
  message: string;
  details: {
    field: string;
    constraint: string;
    value: unknown;
  }[];
}

/**
 * 削除制約エラー
 * REQ-EXT-401, REQ-EXT-402 対応
 */
export interface DeleteConstraintError {
  code: 'DELETE_CONSTRAINT_ERROR';
  message: string;
  details: {
    entityType: 'deckMaster' | 'myDeck';
    entityId: string;
    referencedBy: 'battleLogs';
    referenceCount: number;
  };
}

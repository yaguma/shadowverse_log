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
export type Group =
  | 'A'
  | 'AA'
  | 'AAA'
  | 'Master'
  | 'GrandMaster0'
  | 'GrandMaster1'
  | 'GrandMaster2'
  | 'GrandMaster3'
  | '-';

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
  /** 対戦日 (YYYY-MM-DD 形式) */
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
  /** シーズン番号（任意） */
  season?: number;
  /** ユーザーID（Phase 2で必須化予定） */
  userId?: string;
  /** 作成日時 */
  createdAt?: string;
  /** 更新日時 */
  updatedAt?: string;
}

/**
 * 対戦履歴エンティティ（デッキ名付き）
 * 対戦履歴一覧表示でデッキ名を表示するための拡張型
 */
export interface BattleLogWithDeckNames extends BattleLog {
  /** マイデッキ名 */
  myDeckName: string;
  /** 相手デッキ名 */
  opponentDeckName: string;
}

/**
 * 対戦履歴登録リクエスト型
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
  /** シーズン番号（任意） */
  season?: number;
}

export interface BattleLog {
  id: string;
  date: string;
  battleType: BattleType;
  rank?: Rank;
  group?: Group;
  turn: Turn;
  myDeckId: string;
  opponentDeckId: string;
  result: BattleResult;
  createdAt: string;
  updatedAt: string;
}

export type BattleType = 'ランクマッチ' | '対戦台' | '2pick' | 'ロビー大会';

export type Rank = 'C' | 'B' | 'A' | 'AA' | 'Master';

export type Group = 'エメラルド' | 'トパーズ' | 'ルビー' | 'サファイア' | 'ダイアモンド';

export type Turn = '先行' | '後攻';

export type BattleResult = 'WIN' | 'LOSE';

export interface DeckMaster {
  id: string;
  className: string;
  deckName: string;
  sortOrder: number;
}

export interface MyDeck {
  id: string;
  deckId: string;
  deckCode: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateBattleLogRequest {
  date: string;
  battleType: BattleType;
  rank?: Rank;
  group?: Group;
  turn: Turn;
  myDeckId: string;
  opponentDeckId: string;
  result: BattleResult;
}

export interface UpdateBattleLogRequest extends Partial<CreateBattleLogRequest> {
  id: string;
}
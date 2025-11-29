export type BattleType = "ランクマッチ" | "対戦台" | "ロビー大会";
export type Rank = "サファイア" | "ダイアモンド" | "ルビー" | "トパーズ" | "-";
export type Group = "A" | "AA" | "AAA" | "Master" | "-";
export type Turn = "先攻" | "後攻";
export type BattleResult = "勝ち" | "負け";

export interface BattleLog {
  id: string;
  date: string;
  battleType: BattleType;
  rank: Rank;
  group: Group;
  myDeckId: string;
  turn: Turn;
  result: BattleResult;
  opponentDeckId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBattleLogRequest {
  date?: string;
  battleType: BattleType;
  rank: Rank;
  group: Group;
  myDeckId: string;
  turn: Turn;
  result: BattleResult;
  opponentDeckId: string;
}

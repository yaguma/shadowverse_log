/**
 * Drizzle ORM スキーマ定義
 * すべてのテーブル定義と型をエクスポート
 */

// 型定義
export type { BattleLog, NewBattleLog } from './battle-logs';
// テーブル定義
export { battleLogs } from './battle-logs';
export type {
  BattleType,
  NewBattleLogInput,
  Rank,
  Result,
  Turn,
  UpdateBattleLogInput,
} from './battle-logs.validation';
// バリデーションスキーマ
export {
  BattleTypeSchema,
  NewBattleLogSchema,
  RankSchema,
  ResultSchema,
  TurnSchema,
  UpdateBattleLogSchema,
} from './battle-logs.validation';
export type { DeckMaster, NewDeckMaster } from './deck-master';
export { deckMaster } from './deck-master';
export type {
  ClassName,
  NewDeckMasterInput,
  UpdateDeckMasterInput,
} from './deck-master.validation';
export {
  ClassNameSchema,
  NewDeckMasterSchema,
  UpdateDeckMasterSchema,
} from './deck-master.validation';
export type { MyDeck, NewMyDeck } from './my-decks';
export { myDecks } from './my-decks';
export type { NewMyDeckInput, UpdateMyDeckInput } from './my-decks.validation';
export {
  DeckCodeSchema,
  NewMyDeckSchema,
  UpdateMyDeckSchema,
} from './my-decks.validation';

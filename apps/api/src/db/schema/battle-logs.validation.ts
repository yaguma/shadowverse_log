/**
 * Battle Log バリデーションスキーマ
 * 共有パッケージから再エクスポート
 */
export {
  BattleTypeSchema,
  RankSchema,
  TurnSchema,
  ResultSchema,
  NewBattleLogSchema,
  UpdateBattleLogSchema,
  type NewBattleLogInput,
  type UpdateBattleLogInput,
} from '@shadowverse-log/shared';

// 共有パッケージの型から推論した型をエクスポート
import type {
  BattleTypeSchema as BattleTypeSchemaType,
  RankSchema as RankSchemaType,
  TurnSchema as TurnSchemaType,
  ResultSchema as ResultSchemaType,
} from '@shadowverse-log/shared';
import type { z } from 'zod';

export type BattleType = z.infer<typeof BattleTypeSchemaType>;
export type Rank = z.infer<typeof RankSchemaType>;
export type Turn = z.infer<typeof TurnSchemaType>;
export type Result = z.infer<typeof ResultSchemaType>;

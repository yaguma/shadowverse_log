import { z } from 'zod';

/**
 * 対戦タイプ
 */
export const BattleTypeSchema = z.enum(['ランクマッチ', '対戦台', 'ロビー大会']);
export type BattleType = z.infer<typeof BattleTypeSchema>;

/**
 * ランク
 */
export const RankSchema = z.enum(['サファイア', 'ダイアモンド', 'ルビー', 'トパーズ', '-']);
export type Rank = z.infer<typeof RankSchema>;

/**
 * 先攻/後攻
 */
export const TurnSchema = z.enum(['先攻', '後攻']);
export type Turn = z.infer<typeof TurnSchema>;

/**
 * 勝敗結果
 */
export const ResultSchema = z.enum(['勝ち', '負け']);
export type Result = z.infer<typeof ResultSchema>;

/**
 * 新規対戦履歴の入力スキーマ
 */
export const NewBattleLogSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().min(1).optional(), // Phase 2で必須化
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式で入力してください'),
  battleType: BattleTypeSchema,
  rank: RankSchema,
  groupName: z.string().min(1, 'グループ名は必須です'),
  myDeckId: z.string().min(1, '自分のデッキIDは必須です'),
  turn: TurnSchema,
  result: ResultSchema,
  opponentDeckId: z.string().min(1, '相手のデッキIDは必須です'),
  season: z.number().int().positive().optional(), // シーズン番号（任意、1以上の整数）
});

export type NewBattleLogInput = z.infer<typeof NewBattleLogSchema>;

/**
 * 対戦履歴更新の入力スキーマ
 */
export const UpdateBattleLogSchema = NewBattleLogSchema.partial().omit({ id: true });

export type UpdateBattleLogInput = z.infer<typeof UpdateBattleLogSchema>;

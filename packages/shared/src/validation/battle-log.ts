import { z } from 'zod';

/**
 * 対戦タイプスキーマ
 */
export const BattleTypeSchema = z.enum(['ランクマッチ', '対戦台', 'ロビー大会']);

/**
 * ランクスキーマ
 */
export const RankSchema = z.enum(['サファイア', 'ダイアモンド', 'ルビー', 'トパーズ', '-']);

/**
 * グループスキーマ
 */
export const GroupSchema = z.enum([
  'A',
  'AA',
  'AAA',
  'Master',
  'GrandMaster0',
  'GrandMaster1',
  'GrandMaster2',
  'GrandMaster3',
  '-',
]);

/**
 * ターンスキーマ
 */
export const TurnSchema = z.enum(['先攻', '後攻']);

/**
 * 対戦結果スキーマ
 */
export const ResultSchema = z.enum(['勝ち', '負け']);

/**
 * 新規対戦履歴の入力スキーマ
 */
export const NewBattleLogSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().min(1).optional(), // Phase 2で必須化
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式で入力してください'),
  battleType: BattleTypeSchema,
  rank: RankSchema,
  groupName: GroupSchema,
  myDeckId: z.string().min(1, '自分のデッキIDは必須です'),
  turn: TurnSchema,
  result: ResultSchema,
  opponentDeckId: z.string().min(1, '相手のデッキIDは必須です'),
  season: z.number().int().positive().optional(),
});

export type NewBattleLogInput = z.infer<typeof NewBattleLogSchema>;

/**
 * 対戦履歴更新の入力スキーマ
 */
export const UpdateBattleLogSchema = NewBattleLogSchema.partial().omit({ id: true });

export type UpdateBattleLogInput = z.infer<typeof UpdateBattleLogSchema>;

/**
 * 対戦履歴登録リクエストスキーマ（フロントエンド用、dateはオプショナル）
 */
export const CreateBattleLogRequestSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式で入力してください')
    .optional(),
  battleType: BattleTypeSchema,
  rank: RankSchema,
  groupName: GroupSchema,
  myDeckId: z.string().min(1, '自分のデッキIDは必須です'),
  turn: TurnSchema,
  result: ResultSchema,
  opponentDeckId: z.string().min(1, '相手のデッキIDは必須です'),
  season: z.number().int().positive().optional(),
});

export type CreateBattleLogRequestInput = z.infer<typeof CreateBattleLogRequestSchema>;

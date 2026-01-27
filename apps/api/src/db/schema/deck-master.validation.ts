import { z } from 'zod';

/**
 * クラス名
 */
export const ClassNameSchema = z.enum([
  'エルフ',
  'ロイヤル',
  'ウィッチ',
  'ドラゴン',
  'ネクロマンサー',
  'ヴァンパイア',
  'ビショップ',
  'ネメシス',
]);
export type ClassName = z.infer<typeof ClassNameSchema>;

/**
 * 新規デッキマスターの入力スキーマ
 */
export const NewDeckMasterSchema = z.object({
  id: z.string().uuid().optional(),
  className: ClassNameSchema,
  deckName: z
    .string()
    .min(1, 'デッキ名は必須です')
    .max(100, 'デッキ名は100文字以内で入力してください'),
  sortOrder: z.number().int().nonnegative('ソート順は0以上の整数で入力してください'),
});

export type NewDeckMasterInput = z.infer<typeof NewDeckMasterSchema>;

/**
 * デッキマスター更新の入力スキーマ
 */
export const UpdateDeckMasterSchema = NewDeckMasterSchema.partial().omit({ id: true });

export type UpdateDeckMasterInput = z.infer<typeof UpdateDeckMasterSchema>;

/**
 * PUT用デッキマスター更新スキーマ
 * TASK-0007: deckNameのみ更新可能、classNameは無視
 * Issue #17: 文字数制限を100文字に統一
 */
export const PutDeckMasterSchema = z.object({
  deckName: z
    .string()
    .min(1, 'デッキ名は必須です')
    .max(100, 'デッキ名は100文字以内で入力してください'),
});

export type PutDeckMasterInput = z.infer<typeof PutDeckMasterSchema>;

/**
 * UUID形式のIDスキーマ
 */
export const DeckMasterIdSchema = z.string().uuid('無効なID形式です');

export type DeckMasterId = z.infer<typeof DeckMasterIdSchema>;

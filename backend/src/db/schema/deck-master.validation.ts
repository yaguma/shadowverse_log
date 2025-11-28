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

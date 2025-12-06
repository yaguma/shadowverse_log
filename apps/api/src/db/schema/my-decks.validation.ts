import { z } from 'zod';

/**
 * デッキコードのバリデーション
 * シャドウバースのデッキコードは特定の形式を持つ
 */
export const DeckCodeSchema = z.string().min(1, 'デッキコードは必須です');

/**
 * 新規マイデッキの入力スキーマ
 */
export const NewMyDeckSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().min(1).optional(), // Phase 2で必須化
  deckCode: DeckCodeSchema,
  deckName: z
    .string()
    .min(1, 'デッキ名は必須です')
    .max(100, 'デッキ名は100文字以内で入力してください'),
  isActive: z.boolean().default(true),
});

export type NewMyDeckInput = z.infer<typeof NewMyDeckSchema>;

/**
 * マイデッキ更新の入力スキーマ
 */
export const UpdateMyDeckSchema = NewMyDeckSchema.partial().omit({ id: true });

export type UpdateMyDeckInput = z.infer<typeof UpdateMyDeckSchema>;

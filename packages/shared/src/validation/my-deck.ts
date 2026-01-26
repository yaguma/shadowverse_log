import { z } from 'zod';
import { DeckNameSchema } from './deck-master.js';

/**
 * デッキコードスキーマ（既存、必須バージョン - 後方互換性のため残す）
 */
export const DeckCodeSchema = z.string().min(1, 'デッキコードは必須です');

/**
 * デッキコードスキーマ（任意、バリデーションなし）
 * REQ-EXT-107: deckCodeにはバリデーションを適用しない
 */
export const DeckCodeOptionalSchema = z.string().optional();

/**
 * デッキIDスキーマ（UUID形式）
 */
export const DeckIdSchema = z.string().uuid('無効なデッキIDです');

/**
 * 新規マイデッキの入力スキーマ（既存、後方互換性のため残す）
 */
export const NewMyDeckSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().min(1).optional(), // Phase 2で必須化
  deckCode: DeckCodeSchema,
  deckName: z.string().min(1, 'デッキ名は必須です').max(100, 'デッキ名は100文字以内で入力してください'),
  isActive: z.boolean().default(true),
});

export type NewMyDeckInput = z.infer<typeof NewMyDeckSchema>;

/**
 * マイデッキ更新の入力スキーマ（既存、後方互換性のため残す）
 */
export const UpdateMyDeckSchema = NewMyDeckSchema.partial().omit({ id: true });

export type UpdateMyDeckInput = z.infer<typeof UpdateMyDeckSchema>;

/**
 * MyDeckCreateRequest バリデーションスキーマ
 * REQ-EXT-101〜REQ-EXT-107 対応
 */
export const MyDeckCreateRequestSchema = z.object({
  deckId: DeckIdSchema,
  deckName: DeckNameSchema,
  deckCode: DeckCodeOptionalSchema,
});

export type MyDeckCreateRequestInput = z.infer<typeof MyDeckCreateRequestSchema>;

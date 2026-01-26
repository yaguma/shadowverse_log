import { z } from 'zod';
import { CLASS_NAMES } from '../constants/index.js';

/**
 * クラス名スキーマ（CLASS_NAMES定数から生成）
 * REQ-EXT-001〜REQ-EXT-005 対応
 */
export const ClassNameSchema = z.enum(CLASS_NAMES, {
  error: () => '無効なクラス名です',
});

/**
 * デッキ名スキーマ（必須、1-100文字）
 * REQ-EXT-403 対応
 */
export const DeckNameSchema = z
  .string()
  .min(1, 'デッキ名は必須です')
  .max(100, 'デッキ名は100文字以内で入力してください');

/**
 * 新規デッキマスターの入力スキーマ（既存、後方互換性のため残す）
 */
export const NewDeckMasterSchema = z.object({
  id: z.string().uuid().optional(),
  className: ClassNameSchema,
  deckName: DeckNameSchema,
  sortOrder: z.number().int().nonnegative('ソート順は0以上の整数で入力してください'),
});

export type NewDeckMasterInput = z.infer<typeof NewDeckMasterSchema>;

/**
 * デッキマスター更新の入力スキーマ（既存、後方互換性のため残す）
 */
export const UpdateDeckMasterSchema = NewDeckMasterSchema.partial().omit({ id: true });

export type UpdateDeckMasterInput = z.infer<typeof UpdateDeckMasterSchema>;

/**
 * DeckMasterCreateRequest バリデーションスキーマ
 * REQ-EXT-001〜REQ-EXT-005 対応
 */
export const DeckMasterCreateRequestSchema = z.object({
  className: ClassNameSchema,
  deckName: DeckNameSchema,
});

export type DeckMasterCreateRequestInput = z.infer<typeof DeckMasterCreateRequestSchema>;

/**
 * DeckMasterUpdateRequest バリデーションスキーマ
 * REQ-EXT-006〜REQ-EXT-007 対応
 * classNameは変更不可のため含まない
 */
export const DeckMasterUpdateRequestSchema = z.object({
  deckName: DeckNameSchema,
});

export type DeckMasterUpdateRequestInput = z.infer<typeof DeckMasterUpdateRequestSchema>;

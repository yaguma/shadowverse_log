/**
 * Deck Master バリデーションスキーマ
 * 共有パッケージから再エクスポート
 */
import { z } from 'zod';
export {
  ClassNameSchema,
  NewDeckMasterSchema,
  UpdateDeckMasterSchema,
  DeckNameSchema,
  DeckMasterUpdateRequestSchema as PutDeckMasterSchema,
  type NewDeckMasterInput,
  type UpdateDeckMasterInput,
  type DeckMasterUpdateRequestInput as PutDeckMasterInput,
} from '@shadowverse-log/shared';

export type { ClassName } from '@shadowverse-log/shared';

/**
 * UUID形式のIDスキーマ
 * API固有のスキーマ
 */
export const DeckMasterIdSchema = z.string().uuid('無効なID形式です');

export type DeckMasterId = z.infer<typeof DeckMasterIdSchema>;

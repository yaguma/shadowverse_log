import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * マイデッキテーブル
 * 自分のデッキ情報を管理するテーブル
 * Phase 1: user_id はオプショナル（簡易版）
 * Phase 2: user_id は必須化予定
 */
export const myDecks = sqliteTable(
  'my_decks',
  {
    id: text('id').primaryKey(),
    userId: text('user_id'), // Phase 2で必須化
    deckCode: text('deck_code').notNull(),
    deckName: text('deck_name').notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    createdAt: text('created_at').default(sql`(datetime('now'))`),
    updatedAt: text('updated_at').default(sql`(datetime('now'))`),
  },
  (table) => [index('idx_my_decks_user_id').on(table.userId)] // Phase 2
);

export type MyDeck = typeof myDecks.$inferSelect;
export type NewMyDeck = typeof myDecks.$inferInsert;

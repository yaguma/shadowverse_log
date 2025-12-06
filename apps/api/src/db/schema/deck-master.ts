import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * デッキマスターテーブル
 * 相手のデッキ情報を管理するマスターデータ
 */
export const deckMaster = sqliteTable(
  'deck_master',
  {
    id: text('id').primaryKey(),
    className: text('class_name').notNull(),
    deckName: text('deck_name').notNull(),
    sortOrder: integer('sort_order').notNull(),
    createdAt: text('created_at').default(sql`(datetime('now'))`),
    updatedAt: text('updated_at').default(sql`(datetime('now'))`),
  },
  (table) => [index('idx_deck_master_sort_order').on(table.sortOrder)]
);

export type DeckMaster = typeof deckMaster.$inferSelect;
export type NewDeckMaster = typeof deckMaster.$inferInsert;

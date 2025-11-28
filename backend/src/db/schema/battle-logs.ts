import { sql } from 'drizzle-orm';
import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * 対戦履歴テーブル
 * Phase 1: user_id はオプショナル
 * Phase 2: user_id は必須化予定
 */
export const battleLogs = sqliteTable(
  'battle_logs',
  {
    id: text('id').primaryKey(),
    userId: text('user_id'), // Phase 2で必須化
    date: text('date').notNull(),
    battleType: text('battle_type').notNull(),
    rank: text('rank').notNull(),
    groupName: text('group_name').notNull(),
    myDeckId: text('my_deck_id').notNull(),
    turn: text('turn').notNull(),
    result: text('result').notNull(),
    opponentDeckId: text('opponent_deck_id').notNull(),
    createdAt: text('created_at').default(sql`(datetime('now'))`),
    updatedAt: text('updated_at').default(sql`(datetime('now'))`),
  },
  (table) => [
    index('idx_battle_logs_date').on(table.date),
    index('idx_battle_logs_my_deck_id').on(table.myDeckId),
    index('idx_battle_logs_opponent_deck_id').on(table.opponentDeckId),
    index('idx_battle_logs_user_id').on(table.userId), // Phase 2
  ]
);

export type BattleLog = typeof battleLogs.$inferSelect;
export type NewBattleLog = typeof battleLogs.$inferInsert;

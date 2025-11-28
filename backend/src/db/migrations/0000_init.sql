-- Shadowverse Battle Log Database Schema
-- Generated from Drizzle ORM schema definitions

-- Battle Logs Table
CREATE TABLE IF NOT EXISTS `battle_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`date` text NOT NULL,
	`battle_type` text NOT NULL,
	`rank` text NOT NULL,
	`group_name` text NOT NULL,
	`my_deck_id` text NOT NULL,
	`turn` text NOT NULL,
	`result` text NOT NULL,
	`opponent_deck_id` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now'))
);

-- Battle Logs Indexes
CREATE INDEX IF NOT EXISTS `idx_battle_logs_date` ON `battle_logs` (`date`);
CREATE INDEX IF NOT EXISTS `idx_battle_logs_my_deck_id` ON `battle_logs` (`my_deck_id`);
CREATE INDEX IF NOT EXISTS `idx_battle_logs_opponent_deck_id` ON `battle_logs` (`opponent_deck_id`);
CREATE INDEX IF NOT EXISTS `idx_battle_logs_user_id` ON `battle_logs` (`user_id`);

-- Deck Master Table
CREATE TABLE IF NOT EXISTS `deck_master` (
	`id` text PRIMARY KEY NOT NULL,
	`class_name` text NOT NULL,
	`deck_name` text NOT NULL,
	`sort_order` integer NOT NULL,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now'))
);

-- Deck Master Indexes
CREATE INDEX IF NOT EXISTS `idx_deck_master_sort_order` ON `deck_master` (`sort_order`);

-- My Decks Table
CREATE TABLE IF NOT EXISTS `my_decks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`deck_code` text NOT NULL,
	`deck_name` text NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now'))
);

-- My Decks Indexes
CREATE INDEX IF NOT EXISTS `idx_my_decks_user_id` ON `my_decks` (`user_id`);

CREATE TABLE `battle_logs` (
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
--> statement-breakpoint
CREATE INDEX `idx_battle_logs_date` ON `battle_logs` (`date`);--> statement-breakpoint
CREATE INDEX `idx_battle_logs_my_deck_id` ON `battle_logs` (`my_deck_id`);--> statement-breakpoint
CREATE INDEX `idx_battle_logs_opponent_deck_id` ON `battle_logs` (`opponent_deck_id`);--> statement-breakpoint
CREATE INDEX `idx_battle_logs_user_id` ON `battle_logs` (`user_id`);--> statement-breakpoint
CREATE TABLE `deck_master` (
	`id` text PRIMARY KEY NOT NULL,
	`class_name` text NOT NULL,
	`deck_name` text NOT NULL,
	`sort_order` integer NOT NULL,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE INDEX `idx_deck_master_sort_order` ON `deck_master` (`sort_order`);--> statement-breakpoint
CREATE TABLE `my_decks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`deck_code` text NOT NULL,
	`deck_name` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE INDEX `idx_my_decks_user_id` ON `my_decks` (`user_id`);
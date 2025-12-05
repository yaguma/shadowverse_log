ALTER TABLE `battle_logs` ADD `season` integer;--> statement-breakpoint
CREATE INDEX `idx_battle_logs_season` ON `battle_logs` (`season`);
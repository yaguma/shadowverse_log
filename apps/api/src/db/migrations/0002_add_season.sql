-- シーズンカラムを追加するマイグレーション
-- 対戦履歴にシーズン情報を追加（数字: 1, 2, 3...）

-- battle_logsテーブルにseasonカラムを追加
ALTER TABLE battle_logs ADD COLUMN season INTEGER DEFAULT NULL;

-- シーズンフィルタリング用インデックスを作成
CREATE INDEX IF NOT EXISTS idx_battle_logs_season ON battle_logs (season);

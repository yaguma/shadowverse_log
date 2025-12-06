-- TASK-0041: パフォーマンス最適化
-- D1データベース パフォーマンス向上のための複合インデックス追加

-- 対戦履歴の日付検索高速化
-- ユーザーごとの対戦履歴を日付降順で取得するクエリに最適化
CREATE INDEX IF NOT EXISTS idx_battle_logs_user_date
ON battle_logs(user_id, date DESC);

-- 統計計算の高速化
-- ユーザーごとの対戦タイプ・結果別統計計算に最適化
CREATE INDEX IF NOT EXISTS idx_battle_logs_user_type_result
ON battle_logs(user_id, battle_type, result);

-- マイデッキ検索の高速化
-- ユーザーごとのアクティブデッキ一覧取得に最適化
CREATE INDEX IF NOT EXISTS idx_my_decks_user_active
ON my_decks(user_id, is_active DESC);

-- 対戦履歴のユーザー・デッキID複合検索の高速化
-- ユーザーごとのデッキ別勝率計算に最適化
CREATE INDEX IF NOT EXISTS idx_battle_logs_user_deck
ON battle_logs(user_id, my_deck_id);

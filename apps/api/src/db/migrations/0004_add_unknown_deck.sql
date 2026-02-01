-- 0004_add_unknown_deck.sql
-- データ不整合対応: ID="0" の「不明」デッキレコードを追加
-- battle_logsにopponent_deck_id="0"やmy_deck_id="0"のデータが存在するため、
-- 参照先として「不明」レコードを追加する

-- deck_masterに「不明」レコードを追加
INSERT OR IGNORE INTO deck_master (id, class_name, deck_name, sort_order, created_at, updated_at)
VALUES ('0', '不明', '不明', 9999, datetime('now'), datetime('now'));

-- my_decksに「不明」レコードを追加
INSERT OR IGNORE INTO my_decks (id, deck_code, deck_name, is_active, created_at, updated_at)
VALUES ('0', '', '（不明）', 0, datetime('now'), datetime('now'));

-- TASK-0015: MyDeck API - POST 実装
-- マイデッキテーブルにdeckId, classNameカラムを追加
-- REQ-EXT-101〜107対応

-- deck_idカラム追加（DeckMasterへの参照）
ALTER TABLE my_decks ADD COLUMN deck_id TEXT;

-- class_nameカラム追加（DeckMasterから取得）
ALTER TABLE my_decks ADD COLUMN class_name TEXT;

-- deck_idにインデックスを追加（参照用）
CREATE INDEX IF NOT EXISTS idx_my_decks_deck_id ON my_decks (deck_id);

-- deck_codeのデフォルト値を空文字列に変更するため、既存データを更新
-- 注: SQLiteではALTER TABLE COLUMN DEFAULTは直接サポートされていないため、
-- 新規レコードはアプリケーション側で空文字列を設定する

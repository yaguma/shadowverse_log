/**
 * デッキマスターエンティティの型定義
 * 🔵 青信号: データベーススキーマ (0000_init.sql) に基づく定義
 */
export interface DeckMaster {
  /** デッキマスターID (UUID形式) */
  id: string;
  /** クラス名 (エルフ、ロイヤル等) */
  className: string;
  /** デッキ名 (アグロエルフ、コントロールロイヤル等) */
  deckName: string;
  /** 表示順序 */
  sortOrder: number;
  /** 作成日時 */
  createdAt?: string;
  /** 更新日時 */
  updatedAt?: string;
}

/**
 * D1データベースから取得した行の型定義
 * 🔵 青信号: データベーススキーマの snake_case カラム名に対応
 */
export interface DeckMasterRow {
  id: string;
  class_name: string;
  deck_name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

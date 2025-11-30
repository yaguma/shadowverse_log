import type { DeckMaster, DeckMasterRow } from "../types/deckMaster";

/**
 * D1の行データをDeckMaster型に変換する
 * 🔵 青信号: タスクファイルの仕様に基づくsnake_case → camelCase変換
 */
const rowToDeckMaster = (row: DeckMasterRow): DeckMaster => ({
  id: row.id,
  className: row.class_name,
  deckName: row.deck_name,
  sortOrder: row.sort_order,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/**
 * デッキマスターサービス
 * D1データベースを使用してデッキマスターデータを取得する
 * 🔵 青信号: タスクファイル (cloudflare-migration-phase2-part2-i.md) の仕様に基づく実装
 */
export class DeckMasterService {
  constructor(private db: D1Database) {}

  /**
   * デッキマスター一覧を取得する
   * @returns デッキマスターの配列（sort_orderの昇順）
   */
  async getDeckMasters(): Promise<DeckMaster[]> {
    const { results } = await this.db
      .prepare("SELECT * FROM deck_master ORDER BY sort_order ASC")
      .all<DeckMasterRow>();

    return (results || []).map(rowToDeckMaster);
  }
}

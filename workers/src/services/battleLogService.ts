import type { BattleLog } from "../types/battleLog";
import type { CreateBattleLogInput } from "../utils/validation";

/**
 * D1データベースから取得した行の型定義
 */
interface BattleLogRow {
  id: string;
  date: string;
  battle_type: string;
  rank: string;
  group_name: string;
  my_deck_id: string;
  turn: string;
  result: string;
  opponent_deck_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * D1の行データをBattleLog型に変換する
 */
const rowToBattleLog = (row: BattleLogRow): BattleLog => ({
  id: row.id,
  date: row.date,
  battleType: row.battle_type as BattleLog["battleType"],
  rank: row.rank as BattleLog["rank"],
  group: row.group_name as BattleLog["group"],
  myDeckId: row.my_deck_id,
  turn: row.turn as BattleLog["turn"],
  result: row.result as BattleLog["result"],
  opponentDeckId: row.opponent_deck_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/**
 * 対戦履歴サービス
 * D1データベースを使用してCRUD操作を提供する
 */
export class BattleLogService {
  constructor(private db: D1Database) {}

  /**
   * 対戦履歴一覧を取得する
   */
  async getBattleLogs(
    limit = 100,
    offset = 0,
    sortBy = "date",
    sortOrder: "asc" | "desc" = "desc",
  ): Promise<{ battleLogs: BattleLog[]; total: number }> {
    // SQLインジェクション防止のため、sortByを安全なカラム名に制限
    const safeColumns: Record<string, string> = {
      date: "date",
      created_at: "created_at",
      updated_at: "updated_at",
    };
    const safeColumn = safeColumns[sortBy] || "date";
    const safeOrder = sortOrder === "asc" ? "ASC" : "DESC";

    // 一覧取得
    const { results } = await this.db
      .prepare(`SELECT * FROM battle_logs ORDER BY ${safeColumn} ${safeOrder} LIMIT ? OFFSET ?`)
      .bind(limit, offset)
      .all<BattleLogRow>();

    // 総件数取得
    const countResult = await this.db
      .prepare("SELECT COUNT(*) as total FROM battle_logs")
      .first<{ total: number }>();

    return {
      battleLogs: (results || []).map(rowToBattleLog),
      total: countResult?.total ?? 0,
    };
  }

  /**
   * 対戦履歴を新規作成する
   */
  async createBattleLog(input: CreateBattleLogInput): Promise<BattleLog> {
    const id = crypto.randomUUID();

    await this.db
      .prepare(
        `
        INSERT INTO battle_logs
        (id, date, battle_type, rank, group_name, my_deck_id, turn, result, opponent_deck_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `,
      )
      .bind(
        id,
        input.date,
        input.battleType,
        input.rank,
        input.group,
        input.myDeckId,
        input.turn,
        input.result,
        input.opponentDeckId,
      )
      .run();

    return {
      id,
      date: input.date,
      battleType: input.battleType,
      rank: input.rank,
      group: input.group,
      myDeckId: input.myDeckId,
      turn: input.turn,
      result: input.result,
      opponentDeckId: input.opponentDeckId,
    };
  }

  /**
   * 対戦履歴を削除する
   */
  async deleteBattleLog(id: string): Promise<boolean> {
    const result = await this.db.prepare("DELETE FROM battle_logs WHERE id = ?").bind(id).run();

    return (result.meta.changes ?? 0) > 0;
  }
}

/**
 * BattleLogs リポジトリ
 * TASK-0024-2: Battles リポジトリ実装
 *
 * @description 対戦履歴テーブル用のリポジトリ実装
 * CRUD操作とカスタムクエリメソッドを提供
 */
import { and, desc, eq, gte, lte, max } from 'drizzle-orm';
import type { Database } from '../index';
import { type BattleLog, type NewBattleLog, battleLogs } from '../schema/battle-logs';
import { deckMaster } from '../schema/deck-master';
import { myDecks } from '../schema/my-decks';
import type { BaseRepository, PaginationOptions } from './base-repository';

/**
 * デッキ名を含む対戦履歴の型
 */
export type BattleLogWithDeckNames = BattleLog & {
  myDeckName: string | null;
  opponentDeckName: string | null;
};

/**
 * 対戦履歴リポジトリ
 */
export class BattleLogsRepository implements BaseRepository<BattleLog, NewBattleLog> {
  constructor(private db: Database) {}

  /**
   * 日付フォーマットを正規化（ハイフン形式をスラッシュ形式に変換）
   * 既存データとの互換性を維持するため、YYYY/MM/DD形式に統一
   * @param dateStr - 日付文字列（YYYY-MM-DD または YYYY/MM/DD）
   * @returns YYYY/MM/DD形式の日付文字列
   */
  private normalizeDateFormat(dateStr: string): string {
    // YYYY-MM-DD形式の場合、YYYY/MM/DD形式に変換
    return dateStr.replace(/-/g, '/');
  }

  /**
   * IDで対戦履歴を検索
   */
  async findById(id: string): Promise<BattleLog | null> {
    const result = await this.db.select().from(battleLogs).where(eq(battleLogs.id, id)).limit(1);
    return result[0] || null;
  }

  /**
   * すべての対戦履歴を取得（ページネーション対応）
   * 日付の降順でソート、同じ日付の場合はcreatedAtの降順でソート
   * デッキ名をJOINで取得
   */
  async findAll(limit = 50, offset = 0): Promise<BattleLogWithDeckNames[]> {
    const results = await this.db
      .select({
        id: battleLogs.id,
        userId: battleLogs.userId,
        date: battleLogs.date,
        battleType: battleLogs.battleType,
        rank: battleLogs.rank,
        groupName: battleLogs.groupName,
        myDeckId: battleLogs.myDeckId,
        turn: battleLogs.turn,
        result: battleLogs.result,
        opponentDeckId: battleLogs.opponentDeckId,
        season: battleLogs.season,
        createdAt: battleLogs.createdAt,
        updatedAt: battleLogs.updatedAt,
        myDeckName: myDecks.deckName,
        opponentDeckName: deckMaster.deckName,
      })
      .from(battleLogs)
      .leftJoin(myDecks, eq(battleLogs.myDeckId, myDecks.id))
      .leftJoin(deckMaster, eq(battleLogs.opponentDeckId, deckMaster.id))
      .orderBy(desc(battleLogs.date), desc(battleLogs.createdAt))
      .limit(limit)
      .offset(offset);

    return results;
  }

  /**
   * 対戦履歴を作成
   * @param data - 作成するデータ（idが含まれている場合はそれを使用）
   * 日付フォーマットはYYYY/MM/DD形式に正規化される
   */
  async create(data: NewBattleLog): Promise<BattleLog> {
    // データにIDが含まれている場合はそれを使用、なければ生成
    const id = data.id || crypto.randomUUID();

    const newBattleLog = {
      id,
      userId: data.userId,
      date: this.normalizeDateFormat(data.date), // 日付フォーマットを正規化
      battleType: data.battleType,
      rank: data.rank,
      groupName: data.groupName,
      myDeckId: data.myDeckId,
      turn: data.turn,
      result: data.result,
      opponentDeckId: data.opponentDeckId,
    };

    await this.db.insert(battleLogs).values(newBattleLog);

    // 作成したレコードを返す
    const created = await this.findById(id);
    if (!created) {
      throw new Error('Failed to create battle log');
    }
    return created;
  }

  /**
   * 対戦履歴を更新
   * 日付フォーマットが含まれる場合はYYYY/MM/DD形式に正規化される
   */
  async update(id: string, data: Partial<NewBattleLog>): Promise<BattleLog | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    // 日付が含まれる場合は正規化
    const normalizedData = data.date
      ? { ...data, date: this.normalizeDateFormat(data.date) }
      : data;

    await this.db.update(battleLogs).set(normalizedData).where(eq(battleLogs.id, id));

    return await this.findById(id);
  }

  /**
   * 対戦履歴を削除
   */
  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;

    await this.db.delete(battleLogs).where(eq(battleLogs.id, id));
    return true;
  }

  // ===== カスタムメソッド =====

  /**
   * ユーザーIDで対戦履歴を検索
   * 日付の降順でソート、同じ日付の場合はcreatedAtの降順でソート
   */
  async findByUserId(userId: string, options?: PaginationOptions): Promise<BattleLog[]> {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    return await this.db
      .select()
      .from(battleLogs)
      .where(eq(battleLogs.userId, userId))
      .orderBy(desc(battleLogs.date), desc(battleLogs.createdAt))
      .limit(limit)
      .offset(offset);
  }

  /**
   * 日付範囲で対戦履歴を検索
   * 日付の降順でソート、同じ日付の場合はcreatedAtの降順でソート
   */
  async findByDateRange(startDate: string, endDate: string, userId?: string): Promise<BattleLog[]> {
    const conditions = [gte(battleLogs.date, startDate), lte(battleLogs.date, endDate)];

    if (userId) {
      conditions.push(eq(battleLogs.userId, userId));
    }

    return await this.db
      .select()
      .from(battleLogs)
      .where(and(...conditions))
      .orderBy(desc(battleLogs.date), desc(battleLogs.createdAt));
  }

  /**
   * デッキIDで対戦履歴を検索
   * 日付の降順でソート、同じ日付の場合はcreatedAtの降順でソート
   */
  async findByMyDeckId(myDeckId: string, options?: PaginationOptions): Promise<BattleLog[]> {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    return await this.db
      .select()
      .from(battleLogs)
      .where(eq(battleLogs.myDeckId, myDeckId))
      .orderBy(desc(battleLogs.date), desc(battleLogs.createdAt))
      .limit(limit)
      .offset(offset);
  }

  /**
   * 勝敗別の対戦数をカウント
   */
  async countByResult(result: 'win' | 'lose', userId?: string): Promise<number> {
    const conditions = [eq(battleLogs.result, result)];

    if (userId) {
      conditions.push(eq(battleLogs.userId, userId));
    }

    const rows = await this.db
      .select()
      .from(battleLogs)
      .where(and(...conditions));

    return rows.length;
  }

  /**
   * 総対戦数を取得
   */
  async count(userId?: string): Promise<number> {
    const conditions = userId ? [eq(battleLogs.userId, userId)] : [];

    const rows =
      conditions.length > 0
        ? await this.db
            .select()
            .from(battleLogs)
            .where(and(...conditions))
        : await this.db.select().from(battleLogs);

    return rows.length;
  }

  /**
   * 最新シーズン番号を取得
   * @returns 最新のシーズン番号、データがない場合はnull
   */
  async getLatestSeason(): Promise<number | null> {
    const result = await this.db.select({ maxSeason: max(battleLogs.season) }).from(battleLogs);
    return result[0]?.maxSeason ?? null;
  }
}

/**
 * BattleLogs リポジトリ
 * TASK-0024-2: Battles リポジトリ実装
 *
 * @description 対戦履歴テーブル用のリポジトリ実装
 * CRUD操作とカスタムクエリメソッドを提供
 */
import { and, desc, eq, gte, lte } from 'drizzle-orm';
import type { Database } from '../index';
import {
  type BattleLog,
  type NewBattleLog,
  battleLogs,
} from '../schema/battle-logs';
import type { BaseRepository, PaginationOptions } from './base-repository';

/**
 * 対戦履歴リポジトリ
 */
export class BattleLogsRepository
  implements BaseRepository<BattleLog, NewBattleLog>
{
  constructor(private db: Database) {}

  /**
   * IDで対戦履歴を検索
   */
  async findById(id: string): Promise<BattleLog | null> {
    const result = await this.db
      .select()
      .from(battleLogs)
      .where(eq(battleLogs.id, id))
      .limit(1);
    return result[0] || null;
  }

  /**
   * すべての対戦履歴を取得（ページネーション対応）
   * 日付の降順でソート
   */
  async findAll(limit = 50, offset = 0): Promise<BattleLog[]> {
    return await this.db
      .select()
      .from(battleLogs)
      .orderBy(desc(battleLogs.date))
      .limit(limit)
      .offset(offset);
  }

  /**
   * 対戦履歴を作成
   */
  async create(data: NewBattleLog): Promise<BattleLog> {
    const id = crypto.randomUUID();

    const newBattleLog: BattleLog = {
      id,
      ...data,
      createdAt: null, // DB側でデフォルト値が設定される
      updatedAt: null, // DB側でデフォルト値が設定される
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
   */
  async update(
    id: string,
    data: Partial<NewBattleLog>
  ): Promise<BattleLog | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    await this.db.update(battleLogs).set(data).where(eq(battleLogs.id, id));

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
   */
  async findByUserId(
    userId: string,
    options?: PaginationOptions
  ): Promise<BattleLog[]> {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    return await this.db
      .select()
      .from(battleLogs)
      .where(eq(battleLogs.userId, userId))
      .orderBy(desc(battleLogs.date))
      .limit(limit)
      .offset(offset);
  }

  /**
   * 日付範囲で対戦履歴を検索
   */
  async findByDateRange(
    startDate: string,
    endDate: string,
    userId?: string
  ): Promise<BattleLog[]> {
    const conditions = [
      gte(battleLogs.date, startDate),
      lte(battleLogs.date, endDate),
    ];

    if (userId) {
      conditions.push(eq(battleLogs.userId, userId));
    }

    return await this.db
      .select()
      .from(battleLogs)
      .where(and(...conditions))
      .orderBy(desc(battleLogs.date));
  }

  /**
   * デッキIDで対戦履歴を検索
   */
  async findByMyDeckId(
    myDeckId: string,
    options?: PaginationOptions
  ): Promise<BattleLog[]> {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    return await this.db
      .select()
      .from(battleLogs)
      .where(eq(battleLogs.myDeckId, myDeckId))
      .orderBy(desc(battleLogs.date))
      .limit(limit)
      .offset(offset);
  }

  /**
   * 勝敗別の対戦数をカウント
   */
  async countByResult(
    result: 'win' | 'lose',
    userId?: string
  ): Promise<number> {
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
}

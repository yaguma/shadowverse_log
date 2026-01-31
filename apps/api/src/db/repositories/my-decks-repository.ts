/**
 * MyDecks リポジトリ
 * TASK-0024-4: MyDecks リポジトリ実装
 * TASK-0016: MyDeck API - DELETE 実装
 *
 * @description マイデッキテーブル用のリポジトリ実装
 * 自分のデッキ情報を管理する
 */
import { desc, eq, sql } from 'drizzle-orm';
import type { Database } from '../index';
import { type MyDeck, type NewMyDeck, myDecks } from '../schema/my-decks';
import { battleLogs } from '../schema/battle-logs';
import type { BaseRepository, PaginationOptions } from './base-repository';

/**
 * マイデッキリポジトリ
 */
export class MyDecksRepository implements BaseRepository<MyDeck, NewMyDeck> {
  constructor(private db: Database) {}

  /**
   * IDでマイデッキを検索
   */
  async findById(id: string): Promise<MyDeck | null> {
    const result = await this.db.select().from(myDecks).where(eq(myDecks.id, id)).limit(1);
    return result[0] || null;
  }

  /**
   * すべてのマイデッキを取得（作成日時の降順）
   */
  async findAll(limit = 50, offset = 0): Promise<MyDeck[]> {
    return await this.db
      .select()
      .from(myDecks)
      .orderBy(desc(myDecks.createdAt))
      .limit(limit)
      .offset(offset);
  }

  /**
   * マイデッキを作成
   * TASK-0015: deckId, className サポート追加
   * @param data - 作成するデータ（idが含まれている場合はそれを使用）
   */
  async create(data: NewMyDeck): Promise<MyDeck> {
    // データにIDが含まれている場合はそれを使用、なければ生成
    const id = data.id || crypto.randomUUID();

    const newMyDeck = {
      id,
      userId: data.userId,
      deckId: data.deckId, // DeckMasterへの参照（REQ-EXT-105）
      deckCode: data.deckCode ?? '', // 空文字許可
      deckName: data.deckName,
      className: data.className, // DeckMasterから取得（REQ-EXT-104）
      isActive: data.isActive ?? true,
    };

    await this.db.insert(myDecks).values(newMyDeck);

    // 作成したレコードを返す
    const created = await this.findById(id);
    if (!created) {
      throw new Error('Failed to create my deck');
    }
    return created;
  }

  /**
   * マイデッキを更新
   */
  async update(id: string, data: Partial<NewMyDeck>): Promise<MyDeck | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    await this.db.update(myDecks).set(data).where(eq(myDecks.id, id));

    return await this.findById(id);
  }

  /**
   * マイデッキを削除
   */
  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;

    await this.db.delete(myDecks).where(eq(myDecks.id, id));
    return true;
  }

  // ===== カスタムメソッド =====

  /**
   * ユーザーIDでマイデッキを検索
   */
  async findByUserId(userId: string, options?: PaginationOptions): Promise<MyDeck[]> {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    return await this.db
      .select()
      .from(myDecks)
      .where(eq(myDecks.userId, userId))
      .orderBy(desc(myDecks.createdAt))
      .limit(limit)
      .offset(offset);
  }

  /**
   * アクティブなマイデッキのみ取得
   */
  async findActive(userId?: string): Promise<MyDeck[]> {
    if (userId) {
      const allDecks = await this.db
        .select()
        .from(myDecks)
        .where(eq(myDecks.userId, userId))
        .orderBy(desc(myDecks.createdAt));

      return allDecks.filter((d) => d.isActive === true);
    }

    const allDecks = await this.db.select().from(myDecks).orderBy(desc(myDecks.createdAt));

    return allDecks.filter((d) => d.isActive === true);
  }

  /**
   * デッキコードで検索
   */
  async findByDeckCode(deckCode: string): Promise<MyDeck | null> {
    const result = await this.db
      .select()
      .from(myDecks)
      .where(eq(myDecks.deckCode, deckCode))
      .limit(1);
    return result[0] || null;
  }

  /**
   * 総件数を取得
   */
  async count(userId?: string): Promise<number> {
    const rows = userId
      ? await this.db.select().from(myDecks).where(eq(myDecks.userId, userId))
      : await this.db.select().from(myDecks);

    return rows.length;
  }

  /**
   * デッキを非アクティブ化
   */
  async deactivate(id: string): Promise<MyDeck | null> {
    return await this.update(id, { isActive: false });
  }

  /**
   * デッキをアクティブ化
   */
  async activate(id: string): Promise<MyDeck | null> {
    return await this.update(id, { isActive: true });
  }

  /**
   * マイデッキがbattle_logsから参照されている回数をカウント
   * TASK-0016: MyDeck API - DELETE 実装
   *
   * @description
   * battle_logsテーブルのmy_deck_idで参照されている件数を取得
   * 削除前の参照チェックに使用
   *
   * @param id - マイデッキID
   * @returns 参照されている件数
   */
  async countReferences(id: string): Promise<number> {
    const result = await this.db
      .select({
        count: sql<number>`COUNT(*)`.as('count'),
      })
      .from(battleLogs)
      .where(eq(battleLogs.myDeckId, id));

    return result[0]?.count ?? 0;
  }
}

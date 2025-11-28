/**
 * DeckMaster リポジトリ
 * TASK-0024-4: DeckMaster リポジトリ実装
 *
 * @description デッキマスターテーブル用のリポジトリ実装
 * 相手のデッキ情報を管理するマスターデータ用
 */
import { asc, eq } from 'drizzle-orm';
import type { Database } from '../index';
import {
  type DeckMaster,
  type NewDeckMaster,
  deckMaster,
} from '../schema/deck-master';
import type { BaseRepository } from './base-repository';

/**
 * デッキマスターリポジトリ
 */
export class DeckMasterRepository
  implements BaseRepository<DeckMaster, NewDeckMaster>
{
  constructor(private db: Database) {}

  /**
   * IDでデッキマスターを検索
   */
  async findById(id: string): Promise<DeckMaster | null> {
    const result = await this.db
      .select()
      .from(deckMaster)
      .where(eq(deckMaster.id, id))
      .limit(1);
    return result[0] || null;
  }

  /**
   * すべてのデッキマスターを取得（sortOrder昇順）
   */
  async findAll(limit = 100, offset = 0): Promise<DeckMaster[]> {
    return await this.db
      .select()
      .from(deckMaster)
      .orderBy(asc(deckMaster.sortOrder))
      .limit(limit)
      .offset(offset);
  }

  /**
   * デッキマスターを作成
   * @param data - 作成するデータ（idが含まれている場合はそれを使用）
   */
  async create(data: NewDeckMaster): Promise<DeckMaster> {
    // データにIDが含まれている場合はそれを使用、なければ生成
    const id = data.id || crypto.randomUUID();

    const newDeckMaster = {
      id,
      className: data.className,
      deckName: data.deckName,
      sortOrder: data.sortOrder,
    };

    await this.db.insert(deckMaster).values(newDeckMaster);

    // 作成したレコードを返す
    const created = await this.findById(id);
    if (!created) {
      throw new Error('Failed to create deck master');
    }
    return created;
  }

  /**
   * デッキマスターを更新
   */
  async update(
    id: string,
    data: Partial<NewDeckMaster>
  ): Promise<DeckMaster | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    await this.db.update(deckMaster).set(data).where(eq(deckMaster.id, id));

    return await this.findById(id);
  }

  /**
   * デッキマスターを削除
   */
  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;

    await this.db.delete(deckMaster).where(eq(deckMaster.id, id));
    return true;
  }

  // ===== カスタムメソッド =====

  /**
   * クラス名でデッキマスターを検索
   */
  async findByClassName(className: string): Promise<DeckMaster[]> {
    return await this.db
      .select()
      .from(deckMaster)
      .where(eq(deckMaster.className, className))
      .orderBy(asc(deckMaster.sortOrder));
  }

  /**
   * 総件数を取得
   */
  async count(): Promise<number> {
    const rows = await this.db.select().from(deckMaster);
    return rows.length;
  }

  /**
   * クラス名とデッキ名で検索（ユニーク検索用）
   */
  async findByClassAndDeckName(
    className: string,
    deckName: string
  ): Promise<DeckMaster | null> {
    const result = await this.db
      .select()
      .from(deckMaster)
      .where(eq(deckMaster.className, className));

    // SQLiteにはANDでの複合条件が使いにくいので、フィルタリング
    const found = result.find((d) => d.deckName === deckName);
    return found || null;
  }
}

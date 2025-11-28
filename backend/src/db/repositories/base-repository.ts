/**
 * リポジトリパターン基盤インターフェース
 * TASK-0024-1: Drizzle ORM リポジトリパターン基盤実装
 *
 * @description すべてのリポジトリが実装する基底インターフェースと
 * ページネーション関連の型定義を提供する
 */

/**
 * 基底リポジトリインターフェース
 * @template T - エンティティの型
 * @template TInsert - 新規作成時の入力型
 */
export interface BaseRepository<T, TInsert> {
  /**
   * IDでエンティティを検索
   * @param id - エンティティのID
   * @returns エンティティまたはnull
   */
  findById(id: string): Promise<T | null>;

  /**
   * すべてのエンティティを取得（ページネーション対応）
   * @param limit - 取得件数の上限
   * @param offset - スキップする件数
   * @returns エンティティの配列
   */
  findAll(limit?: number, offset?: number): Promise<T[]>;

  /**
   * エンティティを作成
   * @param data - 作成するデータ
   * @returns 作成されたエンティティ
   */
  create(data: TInsert): Promise<T>;

  /**
   * エンティティを更新
   * @param id - 更新対象のID
   * @param data - 更新するデータ
   * @returns 更新されたエンティティまたはnull
   */
  update(id: string, data: Partial<TInsert>): Promise<T | null>;

  /**
   * エンティティを削除
   * @param id - 削除対象のID
   * @returns 削除成功の場合true
   */
  delete(id: string): Promise<boolean>;
}

/**
 * ページネーションオプション
 */
export interface PaginationOptions {
  /** 取得件数の上限 */
  limit: number;
  /** スキップする件数 */
  offset: number;
}

/**
 * ページネーション結果
 * @template T - エンティティの型
 */
export interface PaginatedResult<T> {
  /** 取得したデータ */
  data: T[];
  /** 総件数 */
  total: number;
  /** 取得件数の上限 */
  limit: number;
  /** スキップした件数 */
  offset: number;
  /** 次のページがあるか */
  hasNext: boolean;
}

/**
 * ページネーション結果を作成するヘルパー関数
 * @param data - 取得したデータ
 * @param total - 総件数
 * @param options - ページネーションオプション
 * @returns ページネーション結果
 */
export function createPaginatedResult<T>(
  data: T[],
  total: number,
  options: PaginationOptions
): PaginatedResult<T> {
  return {
    data,
    total,
    limit: options.limit,
    offset: options.offset,
    hasNext: options.offset + data.length < total,
  };
}

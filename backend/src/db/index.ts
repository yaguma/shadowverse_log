/**
 * データベースモジュール
 * TASK-0024-5: リポジトリ統合とエクスポート
 *
 * @description D1データベースの初期化とリポジトリコンテキストの作成
 */
import type { D1Database } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';
import { type Repositories, createRepositories } from './repositories';

/**
 * Drizzle ORMのデータベースインスタンスを作成
 */
export const createDb = (d1Database: D1Database) => {
  return drizzle(d1Database, { schema });
};

/** データベースインスタンスの型 */
export type Database = ReturnType<typeof createDb>;

/**
 * データベースコンテキストインターフェース
 */
export interface DatabaseContext {
  /** Drizzle ORMのデータベースインスタンス */
  db: Database;
  /** 全リポジトリのコンテナ */
  repositories: Repositories;
}

/**
 * データベースコンテキストを作成
 * D1データベースを受け取り、ORMインスタンスとリポジトリを初期化
 *
 * @param d1Database - CloudflareのD1データベース
 * @returns データベースコンテキスト
 */
export function createDatabaseContext(d1Database: D1Database): DatabaseContext {
  const db = createDb(d1Database);
  const repositories = createRepositories(db);

  return { db, repositories };
}

// リポジトリのエクスポート
export * from './repositories';

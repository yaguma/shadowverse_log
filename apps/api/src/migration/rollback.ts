/**
 * TASK-0025-8: マイグレーションロールバック機能
 *
 * マイグレーション失敗時にD1データベースをクリアする
 * @see docs/design/shadowverse-battle-log/storage-design-cloudflare.md
 */

import type { D1Database } from '@cloudflare/workers-types';

/**
 * ロールバック結果
 */
export interface RollbackResult {
  /** 削除された対戦履歴の件数 */
  deletedBattleLogs: number;
  /** 削除されたデッキマスターの件数 */
  deletedDeckMaster: number;
  /** 削除されたマイデッキの件数 */
  deletedMyDecks: number;
  /** ロールバック成功フラグ */
  success: boolean;
  /** エラーメッセージ（失敗時のみ） */
  error?: string;
  /** ロールバック完了日時 */
  completedAt: string;
}

/**
 * マイグレーションのロールバックを実行
 *
 * D1データベースの全テーブルからデータを削除する
 * 注意: D1はトランザクションをサポートしていないため、順番に削除を実行
 *
 * @param db - D1データベースインスタンス
 * @returns ロールバック結果
 */
export async function rollbackMigration(db: D1Database): Promise<RollbackResult> {
  const result: RollbackResult = {
    deletedBattleLogs: 0,
    deletedDeckMaster: 0,
    deletedMyDecks: 0,
    success: false,
    completedAt: '',
  };

  try {
    console.log('Starting migration rollback...');

    // 1. battle_logs テーブルをクリア
    // 外部キー制約がある場合は、参照している側から削除する
    const battleLogsResult = await db.prepare('DELETE FROM battle_logs').run();
    result.deletedBattleLogs = battleLogsResult.meta.changes ?? 0;
    console.log(`Deleted ${result.deletedBattleLogs} battle logs`);

    // 2. my_decks テーブルをクリア
    const myDecksResult = await db.prepare('DELETE FROM my_decks').run();
    result.deletedMyDecks = myDecksResult.meta.changes ?? 0;
    console.log(`Deleted ${result.deletedMyDecks} my decks`);

    // 3. deck_master テーブルをクリア
    const deckMasterResult = await db.prepare('DELETE FROM deck_master').run();
    result.deletedDeckMaster = deckMasterResult.meta.changes ?? 0;
    console.log(`Deleted ${result.deletedDeckMaster} deck masters`);

    result.success = true;
    result.completedAt = new Date().toISOString();

    console.log(
      `Rollback completed: ${result.deletedBattleLogs} battle logs, ` +
        `${result.deletedDeckMaster} deck masters, ${result.deletedMyDecks} my decks deleted`
    );

    return result;
  } catch (error) {
    console.error('Rollback failed:', error);
    result.error = String(error);
    result.completedAt = new Date().toISOString();
    return result;
  }
}

/**
 * 特定のテーブルのみロールバック
 *
 * @param db - D1データベースインスタンス
 * @param tables - ロールバックするテーブル名の配列
 * @returns ロールバック結果
 */
export async function rollbackTables(
  db: D1Database,
  tables: ('battle_logs' | 'deck_master' | 'my_decks')[]
): Promise<RollbackResult> {
  const result: RollbackResult = {
    deletedBattleLogs: 0,
    deletedDeckMaster: 0,
    deletedMyDecks: 0,
    success: false,
    completedAt: '',
  };

  try {
    console.log(`Starting partial rollback for tables: ${tables.join(', ')}`);

    for (const table of tables) {
      const deleteResult = await db.prepare(`DELETE FROM ${table}`).run();
      const deletedCount = deleteResult.meta.changes ?? 0;

      switch (table) {
        case 'battle_logs':
          result.deletedBattleLogs = deletedCount;
          break;
        case 'deck_master':
          result.deletedDeckMaster = deletedCount;
          break;
        case 'my_decks':
          result.deletedMyDecks = deletedCount;
          break;
      }

      console.log(`Deleted ${deletedCount} records from ${table}`);
    }

    result.success = true;
    result.completedAt = new Date().toISOString();

    return result;
  } catch (error) {
    console.error('Partial rollback failed:', error);
    result.error = String(error);
    result.completedAt = new Date().toISOString();
    return result;
  }
}

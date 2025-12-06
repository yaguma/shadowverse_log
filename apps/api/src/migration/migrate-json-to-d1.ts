/**
 * TASK-0025-2: マイグレーションスクリプト
 *
 * 既存JSONデータからD1データベースへのマイグレーション
 * @see docs/design/shadowverse-battle-log/storage-design-cloudflare.md
 */

import type { R2Bucket } from '@cloudflare/workers-types';
import type { DatabaseContext } from '../db';
import {
  type LegacyBattleLog,
  type LegacyDeckMaster,
  type LegacyMyDeck,
  mapLegacyBattleLogToNew,
  mapLegacyDeckMasterToNew,
  mapLegacyMyDeckToNew,
  validateLegacyBattleLog,
  validateLegacyDeckMaster,
  validateLegacyMyDeck,
} from './schema-mapping';

// ============================================================
// 型定義
// ============================================================

/**
 * マイグレーション結果
 */
export interface MigrationResult {
  /** デッキマスターのマイグレーション結果 */
  deckMaster: MigrationEntityResult;
  /** 対戦履歴のマイグレーション結果 */
  battleLogs: MigrationEntityResult;
  /** マイデッキのマイグレーション結果 */
  myDecks: MigrationEntityResult;
  /** 総処理時間（ミリ秒） */
  totalTime: number;
  /** マイグレーション完了日時 */
  completedAt: string;
}

/**
 * 各エンティティのマイグレーション結果
 */
export interface MigrationEntityResult {
  /** インポート成功数 */
  imported: number;
  /** スキップ数 */
  skipped: number;
  /** エラーリスト */
  errors: string[];
}

/**
 * マイグレーションオプション
 */
export interface MigrationOptions {
  /** ドライラン（実際にDBに書き込まない） */
  dryRun?: boolean;
  /** ユーザーID（Phase 2対応） */
  userId?: string;
  /** バッチサイズ（一度に処理するレコード数） */
  batchSize?: number;
  /** 進捗コールバック */
  onProgress?: (message: string) => void;
}

/**
 * JSONデータソース
 */
export interface JsonDataSource {
  /** R2バケットからの読み込み */
  r2Bucket?: R2Bucket;
  /** ローカルJSONデータ（テスト用） */
  localData?: {
    deckMaster?: LegacyDeckMaster[];
    battleLogs?: LegacyBattleLog[];
    myDecks?: LegacyMyDeck[];
  };
}

// ============================================================
// マイグレーション関数
// ============================================================

/**
 * JSONからD1へのマイグレーションを実行
 *
 * @param ctx - データベースコンテキスト
 * @param dataSource - JSONデータソース
 * @param options - マイグレーションオプション
 * @returns マイグレーション結果
 */
export async function migrateJsonToD1(
  ctx: DatabaseContext,
  dataSource: JsonDataSource,
  options: MigrationOptions = {}
): Promise<MigrationResult> {
  const startTime = Date.now();
  const {
    dryRun = false,
    userId,
    batchSize = 100,
    onProgress = console.log,
  } = options;

  const result: MigrationResult = {
    deckMaster: { imported: 0, skipped: 0, errors: [] },
    battleLogs: { imported: 0, skipped: 0, errors: [] },
    myDecks: { imported: 0, skipped: 0, errors: [] },
    totalTime: 0,
    completedAt: '',
  };

  try {
    // 1. デッキマスターのマイグレーション
    onProgress('Migrating deck_master...');
    const deckMasterData = await loadDeckMasterData(dataSource);
    result.deckMaster = await migrateDeckMaster(
      ctx,
      deckMasterData,
      dryRun,
      batchSize,
      onProgress
    );
    onProgress(
      `deck_master: ${result.deckMaster.imported} imported, ${result.deckMaster.skipped} skipped`
    );

    // 2. 対戦履歴のマイグレーション
    onProgress('Migrating battle_logs...');
    const battleLogsData = await loadBattleLogsData(dataSource);
    result.battleLogs = await migrateBattleLogs(
      ctx,
      battleLogsData,
      userId,
      dryRun,
      batchSize,
      onProgress
    );
    onProgress(
      `battle_logs: ${result.battleLogs.imported} imported, ${result.battleLogs.skipped} skipped`
    );

    // 3. マイデッキのマイグレーション
    onProgress('Migrating my_decks...');
    const myDecksData = await loadMyDecksData(dataSource);
    result.myDecks = await migrateMyDecks(
      ctx,
      myDecksData,
      userId,
      dryRun,
      batchSize,
      onProgress
    );
    onProgress(
      `my_decks: ${result.myDecks.imported} imported, ${result.myDecks.skipped} skipped`
    );
  } catch (error) {
    onProgress(`Migration failed: ${String(error)}`);
    throw error;
  }

  result.totalTime = Date.now() - startTime;
  result.completedAt = new Date().toISOString();

  onProgress(`Migration completed in ${result.totalTime}ms`);
  return result;
}

// ============================================================
// データ読み込み関数
// ============================================================

/**
 * デッキマスターデータを読み込む
 */
async function loadDeckMasterData(
  dataSource: JsonDataSource
): Promise<unknown[]> {
  if (dataSource.localData?.deckMaster) {
    return dataSource.localData.deckMaster;
  }

  if (dataSource.r2Bucket) {
    const object = await dataSource.r2Bucket.get('legacy/deck-master.json');
    if (!object) throw new Error('deck-master.json not found in R2');
    const text = await object.text();
    return JSON.parse(text);
  }

  return [];
}

/**
 * 対戦履歴データを読み込む
 */
async function loadBattleLogsData(
  dataSource: JsonDataSource
): Promise<unknown[]> {
  if (dataSource.localData?.battleLogs) {
    return dataSource.localData.battleLogs;
  }

  if (dataSource.r2Bucket) {
    const object = await dataSource.r2Bucket.get('legacy/battle-logs.json');
    if (!object) throw new Error('battle-logs.json not found in R2');
    const text = await object.text();
    return JSON.parse(text);
  }

  return [];
}

/**
 * マイデッキデータを読み込む
 */
async function loadMyDecksData(dataSource: JsonDataSource): Promise<unknown[]> {
  if (dataSource.localData?.myDecks) {
    return dataSource.localData.myDecks;
  }

  if (dataSource.r2Bucket) {
    const object = await dataSource.r2Bucket.get('legacy/my-decks.json');
    if (!object) throw new Error('my-decks.json not found in R2');
    const text = await object.text();
    return JSON.parse(text);
  }

  return [];
}

// ============================================================
// エンティティ別マイグレーション関数
// ============================================================

/**
 * デッキマスターをマイグレーション
 */
async function migrateDeckMaster(
  ctx: DatabaseContext,
  data: unknown[],
  dryRun: boolean,
  batchSize: number,
  onProgress: (message: string) => void
): Promise<MigrationEntityResult> {
  const result: MigrationEntityResult = {
    imported: 0,
    skipped: 0,
    errors: [],
  };

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);

    for (const item of batch) {
      try {
        if (!validateLegacyDeckMaster(item)) {
          result.skipped++;
          result.errors.push(
            `Invalid deck master data: ${JSON.stringify(item)}`
          );
          continue;
        }

        const newData = mapLegacyDeckMasterToNew(item);

        if (!dryRun) {
          await ctx.repositories.deckMaster.create(newData);
        }

        result.imported++;
      } catch (error) {
        result.skipped++;
        result.errors.push(`Error: ${String(error)}`);
      }
    }

    onProgress(`deck_master: processed ${Math.min(i + batchSize, data.length)}/${data.length}`);
  }

  return result;
}

/**
 * 対戦履歴をマイグレーション
 */
async function migrateBattleLogs(
  ctx: DatabaseContext,
  data: unknown[],
  userId: string | undefined,
  dryRun: boolean,
  batchSize: number,
  onProgress: (message: string) => void
): Promise<MigrationEntityResult> {
  const result: MigrationEntityResult = {
    imported: 0,
    skipped: 0,
    errors: [],
  };

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);

    for (const item of batch) {
      try {
        if (!validateLegacyBattleLog(item)) {
          result.skipped++;
          result.errors.push(`Invalid battle log data: ${JSON.stringify(item)}`);
          continue;
        }

        const newData = mapLegacyBattleLogToNew(item, userId);

        if (!dryRun) {
          await ctx.repositories.battleLogs.create(newData);
        }

        result.imported++;
      } catch (error) {
        result.skipped++;
        result.errors.push(`Error: ${String(error)}`);
      }
    }

    onProgress(`battle_logs: processed ${Math.min(i + batchSize, data.length)}/${data.length}`);
  }

  return result;
}

/**
 * マイデッキをマイグレーション
 */
async function migrateMyDecks(
  ctx: DatabaseContext,
  data: unknown[],
  userId: string | undefined,
  dryRun: boolean,
  batchSize: number,
  onProgress: (message: string) => void
): Promise<MigrationEntityResult> {
  const result: MigrationEntityResult = {
    imported: 0,
    skipped: 0,
    errors: [],
  };

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);

    for (const item of batch) {
      try {
        if (!validateLegacyMyDeck(item)) {
          result.skipped++;
          result.errors.push(`Invalid my deck data: ${JSON.stringify(item)}`);
          continue;
        }

        const newData = mapLegacyMyDeckToNew(item, userId);

        if (!dryRun) {
          await ctx.repositories.myDecks.create(newData);
        }

        result.imported++;
      } catch (error) {
        result.skipped++;
        result.errors.push(`Error: ${String(error)}`);
      }
    }

    onProgress(`my_decks: processed ${Math.min(i + batchSize, data.length)}/${data.length}`);
  }

  return result;
}

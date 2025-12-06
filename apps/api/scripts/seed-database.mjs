/**
 * D1ローカルデータベースにJSONデータをシードするスクリプト
 * Usage: node scripts/seed-database.mjs [--clear]
 *
 * オプション:
 *   --clear  既存のデータを削除してから投入
 *
 * Note: better-sqlite3が必要です（devDependencies）
 */

import Database from 'better-sqlite3';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_ROOT = dirname(__dirname);
const DATA_DIR = join(PROJECT_ROOT, '..', '..', 'data', 'json');

// D1ローカルデータベースのパスを探す
const WRANGLER_STATE_DIR = join(PROJECT_ROOT, '.wrangler', 'state', 'v3', 'd1', 'miniflare-D1DatabaseObject');

function findDatabasePath() {
  if (!existsSync(WRANGLER_STATE_DIR)) {
    console.error(`Error: Wrangler state directory not found: ${WRANGLER_STATE_DIR}`);
    console.error('Run "pnpm dev" at least once to create the local D1 database.');
    process.exit(1);
  }

  const files = readdirSync(WRANGLER_STATE_DIR).filter(f => f.endsWith('.sqlite'));
  if (files.length === 0) {
    console.error('Error: No SQLite database found in wrangler state directory.');
    console.error('Run "pnpm dev" at least once to create the local D1 database.');
    process.exit(1);
  }

  // 最新のファイルを使用
  return join(WRANGLER_STATE_DIR, files[0]);
}

function loadJsonFile(filename) {
  const filePath = join(DATA_DIR, filename);
  if (!existsSync(filePath)) {
    console.error(`Error: JSON file not found: ${filePath}`);
    return null;
  }
  const content = readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

function seedDeckMaster(db, data, clearFirst) {
  console.log('Seeding deck_master...');

  if (clearFirst) {
    db.exec('DELETE FROM deck_master');
    console.log('  Cleared existing data');
  }

  const insert = db.prepare(`
    INSERT OR REPLACE INTO deck_master (id, class_name, deck_name, sort_order, created_at, updated_at)
    VALUES (@id, @className, @deckName, @sortOrder, datetime('now'), datetime('now'))
  `);

  const insertMany = db.transaction((items) => {
    for (const item of items) {
      insert.run({
        id: item.id,
        className: item.className,
        deckName: item.deckName,
        sortOrder: parseInt(item.sortOrder, 10),
      });
    }
  });

  insertMany(data);
  console.log(`  Inserted ${data.length} records`);
}

function seedMyDecks(db, data, clearFirst) {
  console.log('Seeding my_decks...');

  if (clearFirst) {
    db.exec('DELETE FROM my_decks');
    console.log('  Cleared existing data');
  }

  const insert = db.prepare(`
    INSERT OR REPLACE INTO my_decks (id, user_id, deck_code, deck_name, is_active, created_at, updated_at)
    VALUES (@id, @userId, @deckCode, @deckName, @isActive, @createdAt, datetime('now'))
  `);

  const insertMany = db.transaction((items) => {
    for (const item of items) {
      insert.run({
        id: item.id,
        userId: null, // Phase 2で必須化予定
        deckCode: item.deckCode,
        deckName: item.deckName,
        isActive: item.isActive ? 1 : 0,
        createdAt: item.createdAt || new Date().toISOString(),
      });
    }
  });

  insertMany(data);
  console.log(`  Inserted ${data.length} records`);
}

function seedBattleLogs(db, data, clearFirst) {
  console.log('Seeding battle_logs...');

  if (clearFirst) {
    db.exec('DELETE FROM battle_logs');
    console.log('  Cleared existing data');
  }

  const insert = db.prepare(`
    INSERT OR REPLACE INTO battle_logs (id, user_id, date, battle_type, rank, group_name, my_deck_id, turn, result, opponent_deck_id, season, created_at, updated_at)
    VALUES (@id, @userId, @date, @battleType, @rank, @groupName, @myDeckId, @turn, @result, @opponentDeckId, @season, datetime('now'), datetime('now'))
  `);

  const insertMany = db.transaction((items) => {
    for (const item of items) {
      insert.run({
        id: item.id,
        userId: null, // Phase 2で必須化予定
        date: item.date,
        battleType: item.battleType,
        rank: item.rank,
        groupName: item.group,
        myDeckId: item.myDeckId,
        turn: item.turn,
        result: item.result,
        opponentDeckId: item.opponentDeckId,
        season: item.season ?? null,
      });
    }
  });

  insertMany(data);
  console.log(`  Inserted ${data.length} records`);
}

function main() {
  const args = process.argv.slice(2);
  const clearFirst = args.includes('--clear');

  console.log('=== D1 Database Seed Script ===');
  console.log(`Project root: ${PROJECT_ROOT}`);
  console.log(`Data directory: ${DATA_DIR}`);
  console.log(`Clear existing data: ${clearFirst}`);
  console.log('');

  // データベース接続
  const dbPath = findDatabasePath();
  console.log(`Database path: ${dbPath}`);
  console.log('');

  const db = new Database(dbPath);

  try {
    // deck-master
    const deckMasterData = loadJsonFile('deck-master.json');
    if (deckMasterData) {
      seedDeckMaster(db, deckMasterData, clearFirst);
    }

    // my-decks
    const myDecksData = loadJsonFile('my-decks.json');
    if (myDecksData) {
      seedMyDecks(db, myDecksData, clearFirst);
    }

    // battle-logs
    const battleLogsData = loadJsonFile('battle-logs.json');
    if (battleLogsData) {
      seedBattleLogs(db, battleLogsData, clearFirst);
    }

    console.log('');
    console.log('=== Seed Complete ===');

    // 各テーブルのレコード数を表示
    console.log('');
    console.log('=== Record Counts ===');
    const tables = ['deck_master', 'my_decks', 'battle_logs'];
    for (const table of tables) {
      const row = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
      console.log(`  ${table}: ${row.count} records`);
    }
  } finally {
    db.close();
  }

  console.log('');
  console.log('Done!');
}

main();

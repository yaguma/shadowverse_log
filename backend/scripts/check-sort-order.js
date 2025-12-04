/**
 * ソート順確認スクリプト
 */
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(
  __dirname,
  '../.wrangler/state/v3/d1/miniflare-D1DatabaseObject/5d04c0db617f7a1b9fad11e55b3b6b02e6c59aead377993d5a549c48bb6ccec7.sqlite'
);

console.log('Opening database:', dbPath);

try {
  const db = new Database(dbPath);

  // 現在のソート順を確認（日付降順、created_at降順）
  console.log('\n=== Current sort order (date DESC, created_at DESC) ===');
  const rows = db
    .prepare('SELECT id, date, created_at FROM battle_logs ORDER BY date DESC, created_at DESC LIMIT 20')
    .all();

  rows.forEach((row, i) => {
    console.log(`${i + 1}. ID: ${row.id}, Date: ${row.date}, CreatedAt: ${row.created_at}`);
  });

  // 日付のユニーク値を確認
  console.log('\n=== Unique dates (last 10) ===');
  const uniqueDates = db
    .prepare('SELECT DISTINCT date FROM battle_logs ORDER BY date DESC LIMIT 10')
    .all();
  uniqueDates.forEach((row) => {
    console.log(`  ${row.date}`);
  });

  // 最新の日付のレコードを確認
  const latestDate = uniqueDates[0]?.date;
  if (latestDate) {
    console.log(`\n=== Records for latest date (${latestDate}) ===`);
    const latestRecords = db
      .prepare('SELECT id, date, created_at FROM battle_logs WHERE date = ? ORDER BY created_at DESC')
      .all(latestDate);
    latestRecords.forEach((row, i) => {
      console.log(`${i + 1}. ID: ${row.id}, Date: ${row.date}, CreatedAt: ${row.created_at}`);
    });
  }

  db.close();
  console.log('\nDone!');
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}

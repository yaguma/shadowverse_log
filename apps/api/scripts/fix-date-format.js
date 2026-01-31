/**
 * 日付フォーマット修正スクリプト
 * スラッシュ形式（YYYY/MM/DD）をハイフン形式（YYYY-MM-DD）に変換
 * ※ YYYY-MM-DD形式で統一するためのマイグレーションスクリプト
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

  // スラッシュ形式の日付を持つレコードを検索
  const slashRows = db
    .prepare("SELECT id, date FROM battle_logs WHERE date LIKE '%/%'")
    .all();

  console.log(`\nFound ${slashRows.length} records with slash format dates:`);
  slashRows.forEach((row) => {
    console.log(`  ID: ${row.id}, Date: ${row.date}`);
  });

  if (slashRows.length > 0) {
    // 日付フォーマットを変換 (YYYY/MM/DD → YYYY-MM-DD)
    const updateStmt = db.prepare(
      "UPDATE battle_logs SET date = REPLACE(date, '/', '-') WHERE date LIKE '%/%'"
    );
    const result = updateStmt.run();

    console.log(`\nUpdated ${result.changes} records.`);

    // 更新後の確認
    const verifyRows = db
      .prepare("SELECT id, date FROM battle_logs WHERE id IN (" + slashRows.map(() => '?').join(',') + ")")
      .all(slashRows.map(r => r.id));

    console.log('\nVerification after update:');
    verifyRows.forEach((row) => {
      console.log(`  ID: ${row.id}, Date: ${row.date}`);
    });
  } else {
    console.log('\nNo records to update.');
  }

  db.close();
  console.log('\nDone!');
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}

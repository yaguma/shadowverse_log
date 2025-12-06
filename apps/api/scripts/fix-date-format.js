/**
 * 日付フォーマット修正スクリプト
 * ハイフン形式（YYYY-MM-DD）をスラッシュ形式（YYYY/MM/DD）に変換
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

  // ハイフン形式の日付を持つレコードを検索
  const hyphenRows = db
    .prepare("SELECT id, date FROM battle_logs WHERE date LIKE '%-%'")
    .all();

  console.log(`\nFound ${hyphenRows.length} records with hyphen format dates:`);
  hyphenRows.forEach((row) => {
    console.log(`  ID: ${row.id}, Date: ${row.date}`);
  });

  if (hyphenRows.length > 0) {
    // 日付フォーマットを変換
    const updateStmt = db.prepare(
      "UPDATE battle_logs SET date = REPLACE(date, '-', '/') WHERE date LIKE '%-%'"
    );
    const result = updateStmt.run();

    console.log(`\nUpdated ${result.changes} records.`);

    // 更新後の確認
    const verifyRows = db
      .prepare("SELECT id, date FROM battle_logs WHERE id IN (" + hyphenRows.map(() => '?').join(',') + ")")
      .all(hyphenRows.map(r => r.id));

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

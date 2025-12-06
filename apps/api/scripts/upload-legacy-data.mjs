/**
 * TASK-0025-4: 既存JSONデータをR2にアップロード
 * Usage: node scripts/upload-legacy-data.mjs
 *
 * Note: wranglerコマンドが必要です。
 * R2バケットが事前に作成されている必要があります。
 */

import { execSync } from 'child_process';
import { existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_ROOT = dirname(__dirname);
const DATA_DIR = join(PROJECT_ROOT, '..', 'data', 'json');
const R2_BUCKET = 'shadowverse-data';

console.log('=== Legacy Data Upload to R2 ===');
console.log(`Project root: ${PROJECT_ROOT}`);
console.log(`Data directory: ${DATA_DIR}`);
console.log(`R2 Bucket: ${R2_BUCKET}`);
console.log('');

// データディレクトリの確認
if (!existsSync(DATA_DIR)) {
  console.error(`Error: Data directory not found: ${DATA_DIR}`);
  process.exit(1);
}

// JSONファイルの一覧を表示
console.log('=== Source Files ===');
const files = readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
for (const file of files) {
  const filePath = join(DATA_DIR, file);
  const stats = statSync(filePath);
  console.log(`  ${file}: ${(stats.size / 1024).toFixed(2)} KB`);
}
console.log('');

// R2にアップロード
console.log('=== Uploading to R2 ===');

const filesToUpload = [
  { local: 'deck-master.json', remote: 'legacy/deck-master.json' },
  { local: 'battle-logs.json', remote: 'legacy/battle-logs.json' },
  { local: 'my-decks.json', remote: 'legacy/my-decks.json' },
];

let uploadedCount = 0;
let skippedCount = 0;

for (const { local, remote } of filesToUpload) {
  const localPath = join(DATA_DIR, local);

  if (!existsSync(localPath)) {
    console.log(`⚠ ${local} not found, skipping`);
    skippedCount++;
    continue;
  }

  try {
    console.log(`Uploading ${local}...`);
    execSync(`wrangler r2 object put "${R2_BUCKET}/${remote}" --file="${localPath}"`, {
      stdio: 'inherit',
      cwd: PROJECT_ROOT,
    });
    console.log(`✓ ${local} uploaded to ${remote}`);
    uploadedCount++;
  } catch (error) {
    console.error(`✗ Failed to upload ${local}: ${error.message}`);
  }
}

console.log('');
console.log('=== Upload Summary ===');
console.log(`Uploaded: ${uploadedCount}`);
console.log(`Skipped: ${skippedCount}`);
console.log('');

// アップロード確認
console.log('=== Verifying Upload ===');
try {
  execSync(`wrangler r2 object list "${R2_BUCKET}" --prefix="legacy/"`, {
    stdio: 'inherit',
    cwd: PROJECT_ROOT,
  });
} catch (error) {
  console.log('Could not verify upload (bucket may not exist yet in local environment)');
}

console.log('');
console.log('Done!');

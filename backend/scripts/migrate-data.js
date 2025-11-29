#!/usr/bin/env node
/**
 * マイグレーションスクリプト
 *
 * JSONファイルを読み込んでマイグレーションAPIに送信する
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data/json');
const API_BASE_URL = 'http://127.0.0.1:8787';

async function main() {
  console.log('🚀 マイグレーション開始...\n');

  // JSONファイルを読み込み
  const deckMaster = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'deck-master.json'), 'utf8'));
  const battleLogs = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'battle-logs.json'), 'utf8'));
  const myDecks = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'my-decks.json'), 'utf8'));

  console.log(`📊 読み込んだデータ:`);
  console.log(`   - デッキマスター: ${deckMaster.length}件`);
  console.log(`   - 対戦履歴: ${battleLogs.length}件`);
  console.log(`   - マイデッキ: ${myDecks.length}件\n`);

  // ドライラン実行
  console.log('🔍 ドライラン実行中...');
  const dryRunResponse = await fetch(`${API_BASE_URL}/api/migration/dry-run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deckMaster,
      battleLogs,
      myDecks,
      userId: 'default-user'
    })
  });

  const dryRunResult = await dryRunResponse.json();
  console.log('✅ ドライラン結果:');
  console.log(JSON.stringify(dryRunResult, null, 2));

  if (!dryRunResult.success) {
    console.error('❌ ドライランが失敗しました');
    process.exit(1);
  }

  console.log('\n');

  // 本番マイグレーション実行
  console.log('⚡ 本番マイグレーション実行中...');
  const executeResponse = await fetch(`${API_BASE_URL}/api/migration/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deckMaster,
      battleLogs,
      myDecks,
      userId: 'default-user',
      confirmExecution: true
    })
  });

  const executeResult = await executeResponse.json();
  console.log('✅ 本番マイグレーション結果:');
  console.log(JSON.stringify(executeResult, null, 2));

  if (!executeResult.success) {
    console.error('❌ マイグレーションが失敗しました');
    process.exit(1);
  }

  console.log('\n🎉 マイグレーション完了!\n');

  // 結果をログファイルに保存
  const logPath = path.join(__dirname, '../migration-result.json');
  fs.writeFileSync(logPath, JSON.stringify(executeResult, null, 2));
  console.log(`📝 マイグレーションログを保存しました: ${logPath}`);
}

main().catch(error => {
  console.error('❌ エラーが発生しました:', error);
  process.exit(1);
});

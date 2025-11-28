/**
 * ロールバック機能テストスクリプト
 *
 * wrangler d1 executeを使用してロールバックをテスト
 */

import { execSync } from 'child_process';

const DB_NAME = 'shadowverse-db';

function executeD1(command) {
  try {
    const result = execSync(
      `npx wrangler d1 execute ${DB_NAME} --local --command="${command}"`,
      { encoding: 'utf-8', cwd: process.cwd() }
    );
    return result;
  } catch (error) {
    console.error('D1 execution error:', error.message);
    throw error;
  }
}

function getCount(table) {
  const result = executeD1(`SELECT COUNT(*) as count FROM ${table};`);
  const match = result.match(/"count":\s*(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

async function testRollback() {
  console.log('=== ロールバックテスト開始 ===\n');

  // 1. ロールバック前の件数を確認
  console.log('【ロールバック前のデータ件数】');
  const beforeBattleLogs = getCount('battle_logs');
  const beforeDeckMaster = getCount('deck_master');
  const beforeMyDecks = getCount('my_decks');

  console.log(`  battle_logs: ${beforeBattleLogs}件`);
  console.log(`  deck_master: ${beforeDeckMaster}件`);
  console.log(`  my_decks: ${beforeMyDecks}件`);
  console.log();

  // 2. ロールバック実行
  console.log('【ロールバック実行中...】');

  // battle_logsを削除（外部キー制約のため先に削除）
  executeD1('DELETE FROM battle_logs;');
  console.log('  battle_logs: 削除完了');

  // my_decksを削除
  executeD1('DELETE FROM my_decks;');
  console.log('  my_decks: 削除完了');

  // deck_masterを削除
  executeD1('DELETE FROM deck_master;');
  console.log('  deck_master: 削除完了');
  console.log();

  // 3. ロールバック後の件数を確認
  console.log('【ロールバック後のデータ件数】');
  const afterBattleLogs = getCount('battle_logs');
  const afterDeckMaster = getCount('deck_master');
  const afterMyDecks = getCount('my_decks');

  console.log(`  battle_logs: ${afterBattleLogs}件`);
  console.log(`  deck_master: ${afterDeckMaster}件`);
  console.log(`  my_decks: ${afterMyDecks}件`);
  console.log();

  // 4. 結果判定
  const success = afterBattleLogs === 0 && afterDeckMaster === 0 && afterMyDecks === 0;

  if (success) {
    console.log('✅ ロールバック成功！全テーブルが空になりました。');
    console.log(`   削除件数: battle_logs=${beforeBattleLogs}, deck_master=${beforeDeckMaster}, my_decks=${beforeMyDecks}`);
  } else {
    console.log('❌ ロールバック失敗: 一部のデータが残っています。');
  }

  console.log('\n=== ロールバックテスト完了 ===');

  return success;
}

testRollback().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('テスト実行エラー:', error);
  process.exit(1);
});

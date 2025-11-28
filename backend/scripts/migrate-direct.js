#!/usr/bin/env node
/**
 * 直接D1マイグレーションスクリプト
 *
 * wrangler d1 executeコマンドを使用してJSONデータをD1に直接インサート
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data/json');

// SQLの特殊文字をエスケープ
function escapeSQL(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

async function main() {
  console.log('🚀 直接D1マイグレーション開始...\n');

  // JSONファイルを読み込み
  const deckMaster = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'deck-master.json'), 'utf8'));
  const battleLogs = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'battle-logs.json'), 'utf8'));
  const myDecks = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'my-decks.json'), 'utf8'));

  console.log(`📊 読み込んだデータ:`);
  console.log(`   - デッキマスター: ${deckMaster.length}件`);
  console.log(`   - 対戦履歴: ${battleLogs.length}件`);
  console.log(`   - マイデッキ: ${myDecks.length}件\n`);

  // 既存のテストデータを削除
  console.log('🗑️ 既存データをクリア中...');
  try {
    execSync('npx wrangler d1 execute shadowverse-db --local --command="DELETE FROM battle_logs;"', { cwd: path.join(__dirname, '..') });
    execSync('npx wrangler d1 execute shadowverse-db --local --command="DELETE FROM my_decks;"', { cwd: path.join(__dirname, '..') });
    execSync('npx wrangler d1 execute shadowverse-db --local --command="DELETE FROM deck_master;"', { cwd: path.join(__dirname, '..') });
    console.log('✅ 既存データをクリアしました\n');
  } catch (e) {
    console.log('⚠️ データクリア中にエラーが発生しましたが続行します\n');
  }

  // デッキマスターをインサート
  console.log('📥 デッキマスターをインサート中...');
  let deckMasterInserted = 0;
  for (const deck of deckMaster) {
    const sql = `INSERT INTO deck_master (id, class_name, deck_name, sort_order) VALUES (${escapeSQL(deck.id)}, ${escapeSQL(deck.className)}, ${escapeSQL(deck.deckName)}, ${deck.sortOrder});`;
    try {
      execSync(`npx wrangler d1 execute shadowverse-db --local --command="${sql.replace(/"/g, '\\"')}"`, {
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe'
      });
      deckMasterInserted++;
    } catch (e) {
      console.error(`❌ デッキマスター ID ${deck.id} の挿入に失敗: ${e.message}`);
    }
  }
  console.log(`✅ デッキマスター: ${deckMasterInserted}/${deckMaster.length}件 インサート完了\n`);

  // 対戦履歴をインサート
  console.log('📥 対戦履歴をインサート中...');
  let battleLogsInserted = 0;
  for (const battle of battleLogs) {
    // 日付形式を変換 (YYYY/MM/DD -> YYYY-MM-DD)
    const date = battle.date.replace(/\//g, '-');
    const sql = `INSERT INTO battle_logs (id, user_id, date, battle_type, rank, group_name, my_deck_id, turn, result, opponent_deck_id) VALUES (${escapeSQL(battle.id)}, 'default-user', ${escapeSQL(date)}, ${escapeSQL(battle.battleType)}, ${escapeSQL(battle.rank)}, ${escapeSQL(battle.group)}, ${escapeSQL(battle.myDeckId)}, ${escapeSQL(battle.turn)}, ${escapeSQL(battle.result)}, ${escapeSQL(battle.opponentDeckId)});`;
    try {
      execSync(`npx wrangler d1 execute shadowverse-db --local --command="${sql.replace(/"/g, '\\"')}"`, {
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe'
      });
      battleLogsInserted++;
    } catch (e) {
      console.error(`❌ 対戦履歴 ID ${battle.id} の挿入に失敗: ${e.message}`);
    }
  }
  console.log(`✅ 対戦履歴: ${battleLogsInserted}/${battleLogs.length}件 インサート完了\n`);

  // マイデッキをインサート
  console.log('📥 マイデッキをインサート中...');
  let myDecksInserted = 0;
  for (const deck of myDecks) {
    const sql = `INSERT INTO my_decks (id, user_id, deck_code, deck_name, is_active) VALUES (${escapeSQL(deck.id)}, 'default-user', ${escapeSQL(deck.deckCode)}, ${escapeSQL(deck.deckName)}, ${deck.isActive ? 1 : 0});`;
    try {
      execSync(`npx wrangler d1 execute shadowverse-db --local --command="${sql.replace(/"/g, '\\"')}"`, {
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe'
      });
      myDecksInserted++;
    } catch (e) {
      console.error(`❌ マイデッキ ID ${deck.id} の挿入に失敗: ${e.message}`);
    }
  }
  console.log(`✅ マイデッキ: ${myDecksInserted}/${myDecks.length}件 インサート完了\n`);

  // 結果確認
  console.log('📊 マイグレーション結果確認...');
  const deckCountResult = execSync('npx wrangler d1 execute shadowverse-db --local --command="SELECT COUNT(*) as count FROM deck_master;"', {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf8'
  });
  const battleCountResult = execSync('npx wrangler d1 execute shadowverse-db --local --command="SELECT COUNT(*) as count FROM battle_logs;"', {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf8'
  });
  const myDeckCountResult = execSync('npx wrangler d1 execute shadowverse-db --local --command="SELECT COUNT(*) as count FROM my_decks;"', {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf8'
  });

  console.log('📊 D1データベースのレコード数:');
  console.log(`   deck_master:`, deckCountResult.match(/"count":\s*(\d+)/)?.[1] || 'N/A');
  console.log(`   battle_logs:`, battleCountResult.match(/"count":\s*(\d+)/)?.[1] || 'N/A');
  console.log(`   my_decks:`, myDeckCountResult.match(/"count":\s*(\d+)/)?.[1] || 'N/A');

  console.log('\n🎉 直接D1マイグレーション完了!\n');

  // 結果をログファイルに保存
  const logPath = path.join(__dirname, '../migration-result.json');
  const result = {
    success: true,
    message: 'Direct D1 migration completed',
    data: {
      deckMaster: { imported: deckMasterInserted, total: deckMaster.length },
      battleLogs: { imported: battleLogsInserted, total: battleLogs.length },
      myDecks: { imported: myDecksInserted, total: myDecks.length },
      completedAt: new Date().toISOString()
    }
  };
  fs.writeFileSync(logPath, JSON.stringify(result, null, 2));
  console.log(`📝 マイグレーションログを保存しました: ${logPath}`);
}

main().catch(error => {
  console.error('❌ エラーが発生しました:', error);
  process.exit(1);
});

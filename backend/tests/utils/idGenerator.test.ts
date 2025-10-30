/**
 * ID生成関数のテストスイート
 *
 * テストフレームワーク: Jest 29.7.0 + ts-jest
 * テスト対象: backend/src/utils/idGenerator.ts
 *
 * 🔵 テストケース定義書: docs/implements/shadowverse-battle-log/TASK-0007/testcases.md
 * 🔵 要件定義書: docs/implements/shadowverse-battle-log/TASK-0007/requirements.md
 */

import type { BattleLog } from '../../src/types';
import { generateBattleLogId } from '../../src/utils/idGenerator';

describe('generateBattleLogId', () => {
  // =============================================================================
  // ユーティリティ関数のテストケース
  // =============================================================================

  describe('ユーティリティ: TC-401 - generateBattleLogId() が正しくIDを生成する（既存ログなし）', () => {
    test('既存ログが空の場合に log_YYYYMMDD_001 を生成する', () => {
      // 【テスト目的】: ID生成関数が正しくIDフォーマットを生成できることを確認
      // 【テスト内容】: 日付文字列（YYYY-MM-DD）をYYYYMMDDに変換し、連番001を生成
      // 【期待される動作】:
      //   - 日付文字列（YYYY-MM-DD）をYYYYMMDDに変換
      //   - 既存ログが空の場合、連番001を生成
      // 🔵 信頼性レベル: 青信号（tasks/shadowverse-battle-log-phase2.md Lines 116-147、testcases.md Lines 876-895 より）

      // 【テストデータ準備】: 初回登録時のID生成
      // 【初期条件設定】: 既存ログが空の状態
      const existingLogs: BattleLog[] = [];
      const date = '2025-01-24';

      // 【実際の処理実行】: generateBattleLogId() 関数を呼び出す
      // 【処理内容】: 日付形式変換 + 最大連番取得（0） + 連番生成（001）
      const result = generateBattleLogId(existingLogs, date);

      // 【結果検証】: ID形式の正確性を保証
      // 【期待値確認】: 日付形式変換が正しく、連番が001で始まる
      expect(result).toBe('log_20250124_001'); // 【確認内容】: log_YYYYMMDD_001 形式でIDが生成される 🔵
    });
  });

  describe('ユーティリティ: TC-402 - generateBattleLogId() が正しくIDを生成する（既存ログあり）', () => {
    test('既存ログがある場合に最大連番+1を生成する', () => {
      // 【テスト目的】: ID生成関数が既存ログから最大連番を取得し、+1する動作を確認
      // 【テスト内容】: 既存ログから同日のログをフィルタリングし、最大連番+1を3桁ゼロパディング
      // 【期待される動作】:
      //   - 既存ログをフィルタリング（同日のみ）
      //   - 最大連番を取得
      //   - 最大連番+1を3桁ゼロパディング
      // 🔵 信頼性レベル: 青信号（tasks/shadowverse-battle-log-phase2.md Lines 116-147、testcases.md Lines 899-925 より）

      // 【テストデータ準備】: 同日に既存ログがある場合のID生成
      // 【初期条件設定】: 既存ログに log_20250124_001, log_20250124_002 が存在
      const existingLogs: BattleLog[] = [
        {
          id: 'log_20250124_001',
          date: '2025/01/24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_001',
        },
        {
          id: 'log_20250124_002',
          date: '2025/01/24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '後攻',
          result: '負け',
          opponentDeckId: 'deck_master_002',
        },
      ];
      const date = '2025-01-24';

      // 【実際の処理実行】: generateBattleLogId() 関数を呼び出す
      // 【処理内容】: 同日のログをフィルタリング → 最大連番を取得（002） → 新規連番生成（003）
      const result = generateBattleLogId(existingLogs, date);

      // 【結果検証】: 既存の最大連番002 + 1 = 003 が生成される
      // 【期待値確認】: 最大連番が正しく取得され、+1された値が3桁ゼロパディングされる
      expect(result).toBe('log_20250124_003'); // 【確認内容】: 既存の最大連番002 + 1 = 003 が生成される 🔵
    });
  });

  describe('ユーティリティ: TC-403 - generateBattleLogId() が異なる日付のログを無視する', () => {
    test('異なる日付のログを無視して連番を生成する', () => {
      // 【テスト目的】: ID生成関数が同日のログのみをフィルタリングし、他の日付のログを無視することを確認
      // 【テスト内容】: 複数日のログがある場合、当日のログのみを考慮してID生成
      // 【期待される動作】:
      //   - 既存ログから同日のログのみをフィルタリング
      //   - 他の日付のログは無視
      //   - 同日の最大連番のみを取得
      // 🔵 信頼性レベル: 青信号（tasks/shadowverse-battle-log-phase2.md Lines 127-133、testcases.md Lines 929-959 より）

      // 【テストデータ準備】: 複数日のログがある場合、当日のログのみを考慮してID生成
      // 【初期条件設定】: 前日、当日、翌日のログが混在
      const existingLogs: BattleLog[] = [
        {
          id: 'log_20250123_001',
          date: '2025/01/23',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_001',
        },
        {
          id: 'log_20250123_005',
          date: '2025/01/23',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '後攻',
          result: '負け',
          opponentDeckId: 'deck_master_002',
        },
        {
          id: 'log_20250124_001',
          date: '2025/01/24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_003',
        },
        {
          id: 'log_20250125_010',
          date: '2025/01/25',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '後攻',
          result: '負け',
          opponentDeckId: 'deck_master_004',
        },
      ];
      const date = '2025-01-24';

      // 【実際の処理実行】: generateBattleLogId() 関数を呼び出す
      // 【処理内容】: 同日のログのみをフィルタリング（log_20250124_001のみ） → 最大連番001 → 新規連番002
      const result = generateBattleLogId(existingLogs, date);

      // 【結果検証】: 前日の005、翌日の010は無視され、当日の最大連番001 + 1 = 002 が生成される
      // 【期待値確認】:
      //   - 前日の005、翌日の010は無視される
      //   - 当日の最大連番001 + 1 = 002
      expect(result).toBe('log_20250124_002'); // 【確認内容】: 前日の005、翌日の010は無視され、当日の最大連番001 + 1 = 002 が生成される 🔵
    });
  });

  describe('境界値: TC-202 - 同日の連番が999に達した場合の動作', () => {
    test('同日の連番が999に達した場合、1000として生成される（4桁になる）', () => {
      // 【テスト目的】: ID生成ロジックの桁数オーバーフロー確認
      // 【境界値の意味】: 連番の最大値（3桁の上限999）
      // 【境界値での動作保証】: 999を超えても正常に動作する（4桁になる）
      // 🟡 信頼性レベル: 黄信号（ID生成ロジックの実装（tasks/shadowverse-battle-log-phase2.md Lines 116-147）からの妥当な推測、testcases.md Lines 578-599 より）

      // 【テストデータ準備】: 1日に1000件以上の対戦履歴を記録するケース（現実的には稀だが、システムの堅牢性を保証）
      // 【初期条件設定】: 既存ログに `log_20250124_999` が存在
      // 【境界値選択の根拠】: ID生成ロジックが3桁ゼロパディング（`.padStart(3, '0')`）を使用しているため、999を超えた場合の動作を確認
      const existingLogs: BattleLog[] = [
        {
          id: 'log_20250124_999',
          date: '2025/01/24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_001',
        },
      ];
      const date = '2025-01-24';

      // 【実際の処理実行】: generateBattleLogId() 関数を呼び出す
      // 【処理内容】: 最大連番999 + 1 = 1000 → `.padStart(3, '0')` は既に3桁以上の文字列に対しては何もしないため、"1000"がそのまま使用される
      const result = generateBattleLogId(existingLogs, date);

      // 【結果検証】: 999 + 1 = 1000（4桁）が生成される
      // 【期待値確認】:
      //   - `.padStart(3, '0')` は既に3桁以上の文字列に対しては何もしないため、"1000"がそのまま使用される
      //   - 3桁から4桁への遷移が自然に行われる
      expect(result).toBe('log_20250124_1000'); // 【確認内容】: 999 + 1 = 1000（4桁）が生成される 🟡
    });
  });
});

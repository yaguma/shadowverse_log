import { describe, expect, it } from 'vitest';
import type { BattleLog, BattleLogsResponse, BattleLogWithDeckNames } from './index';

/**
 * 型定義のテスト
 * 【目的】: 型定義が正しくエクスポートされ、使用できることを確認
 * 🔵 信頼性レベル: TASK-0047の要件に基づく
 */
describe('型定義', () => {
  describe('BattleLogWithDeckNames', () => {
    it('BattleLogを拡張してmyDeckNameとopponentDeckNameを持つ', () => {
      // 【テスト】: BattleLogWithDeckNamesがBattleLogのすべてのプロパティを持つ
      const battleLogWithNames: BattleLogWithDeckNames = {
        id: 'test-id',
        date: '2025/01/01',
        battleType: 'ランクマッチ',
        rank: 'ダイアモンド',
        groupName: 'A',
        myDeckId: 'deck-001',
        turn: '先攻',
        result: '勝ち',
        opponentDeckId: 'opponent-deck-001',
        myDeckName: 'テストデッキ',
        opponentDeckName: '相手デッキ',
      };

      expect(battleLogWithNames.myDeckName).toBe('テストデッキ');
      expect(battleLogWithNames.opponentDeckName).toBe('相手デッキ');
      expect(battleLogWithNames.id).toBe('test-id');
    });

    it('BattleLogと互換性がある（必須プロパティ）', () => {
      // 【テスト】: BattleLogWithDeckNamesはBattleLogの型を満たす
      const battleLogWithNames: BattleLogWithDeckNames = {
        id: 'test-id',
        date: '2025/01/01',
        battleType: 'ランクマッチ',
        rank: 'ダイアモンド',
        groupName: 'A',
        myDeckId: 'deck-001',
        turn: '先攻',
        result: '勝ち',
        opponentDeckId: 'opponent-deck-001',
        myDeckName: 'マイデッキ名',
        opponentDeckName: '相手デッキ名',
      };

      // BattleLog型として使用できることを確認
      const asBattleLog: BattleLog = battleLogWithNames;
      expect(asBattleLog.id).toBe('test-id');
    });
  });

  describe('BattleLogsResponse', () => {
    it('battleLogsがBattleLogWithDeckNames[]型である', () => {
      // 【テスト】: BattleLogsResponseのbattleLogsフィールドがデッキ名付きの型
      const response: BattleLogsResponse = {
        battleLogs: [
          {
            id: 'test-id',
            date: '2025/01/01',
            battleType: 'ランクマッチ',
            rank: 'ダイアモンド',
            groupName: 'A',
            myDeckId: 'deck-001',
            turn: '先攻',
            result: '勝ち',
            opponentDeckId: 'opponent-deck-001',
            myDeckName: 'マイデッキ',
            opponentDeckName: '相手デッキ',
          },
        ],
        total: 1,
        limit: 10,
        offset: 0,
      };

      expect(response.battleLogs[0].myDeckName).toBe('マイデッキ');
      expect(response.battleLogs[0].opponentDeckName).toBe('相手デッキ');
    });
  });
});

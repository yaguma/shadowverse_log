/**
 * パーサー テスト
 * TASK-0031: インポートAPI実装
 *
 * @description JSON/CSVパーサーのテスト
 */
import { describe, expect, it } from 'vitest';
import { parseJSON, parseCSV } from '../../src/utils/parser';
import type { ImportBattleLogInput } from '../../src/types/import';

describe('parseJSON', () => {
  // ===========================================
  // TC-001: 正常系: 単一オブジェクトJSONをパースできる
  // ===========================================
  describe('TC-001: 正常系: 単一オブジェクトJSONをパースできる', () => {
    it('有効なJSON（1件）をパースしてBattleLog配列（1件）を返す', () => {
      const jsonData = JSON.stringify([
        {
          date: '2025-01-24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_002',
        },
      ]);

      const result = parseJSON(jsonData);

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2025-01-24');
      expect(result[0].battleType).toBe('ランクマッチ');
    });
  });

  // ===========================================
  // TC-002: 正常系: 配列JSONをパースできる
  // ===========================================
  describe('TC-002: 正常系: 配列JSONをパースできる', () => {
    it('有効なJSON配列（3件）をパースしてBattleLog配列（3件）を返す', () => {
      const jsonData = JSON.stringify([
        {
          date: '2025-01-24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_001',
        },
        {
          date: '2025-01-24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '後攻',
          result: '負け',
          opponentDeckId: 'deck_master_002',
        },
        {
          date: '2025-01-25',
          battleType: '対戦台',
          rank: '-',
          group: '-',
          myDeckId: 'deck_002',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_003',
        },
      ]);

      const result = parseJSON(jsonData);

      expect(result).toHaveLength(3);
    });
  });

  // ===========================================
  // TC-003: 正常系: 空配列をパースできる
  // ===========================================
  describe('TC-003: 正常系: 空配列をパースできる', () => {
    it('空配列をパースして空配列を返す', () => {
      const jsonData = '[]';

      const result = parseJSON(jsonData);

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });
  });

  // ===========================================
  // TC-004: 異常系: 不正なJSON形式でエラー
  // ===========================================
  describe('TC-004: 異常系: 不正なJSON形式でエラー', () => {
    it('不正なJSONでエラーをスローする', () => {
      const invalidJson = '{invalid json}';

      expect(() => parseJSON(invalidJson)).toThrow('JSON形式が不正です');
    });
  });

  // ===========================================
  // TC-005: 異常系: null値でエラー
  // ===========================================
  describe('TC-005: 異常系: null値でエラー', () => {
    it('nullでエラーをスローする', () => {
      const nullJson = 'null';

      expect(() => parseJSON(nullJson)).toThrow(
        'JSONデータは配列である必要があります'
      );
    });
  });

  // ===========================================
  // TC-006: 異常系: オブジェクトでエラー
  // ===========================================
  describe('TC-006: 異常系: オブジェクトでエラー', () => {
    it('オブジェクト（非配列）でエラーをスローする', () => {
      const objectJson = '{}';

      expect(() => parseJSON(objectJson)).toThrow(
        'JSONデータは配列である必要があります'
      );
    });
  });
});

describe('parseCSV', () => {
  // CSV ヘッダー
  const validHeader =
    'date,battleType,rank,group,myDeckId,turn,result,opponentDeckId';

  // ===========================================
  // TC-007: 正常系: 有効なCSVをパースできる
  // ===========================================
  describe('TC-007: 正常系: 有効なCSVをパースできる', () => {
    it('有効なCSV（ヘッダー+3行）をパースしてBattleLog配列（3件）を返す', () => {
      const csvData = `${validHeader}
2025-01-24,ランクマッチ,ダイアモンド,AAA,deck_001,先攻,勝ち,deck_master_001
2025-01-24,ランクマッチ,ダイアモンド,AAA,deck_001,後攻,負け,deck_master_002
2025-01-25,対戦台,-,-,deck_002,先攻,勝ち,deck_master_003`;

      const result = parseCSV(csvData);

      expect(result).toHaveLength(3);
      expect(result[0].date).toBe('2025-01-24');
      expect(result[0].battleType).toBe('ランクマッチ');
    });
  });

  // ===========================================
  // TC-008: 正常系: ヘッダーのみのCSVをパースできる
  // ===========================================
  describe('TC-008: 正常系: ヘッダーのみのCSVをパースできる', () => {
    it('ヘッダー行のみのCSVをパースして空配列を返す', () => {
      const csvData = validHeader;

      const result = parseCSV(csvData);

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });
  });

  // ===========================================
  // TC-009: 異常系: 空文字列でエラー
  // ===========================================
  describe('TC-009: 異常系: 空文字列でエラー', () => {
    it('空文字列でエラーをスローする', () => {
      const emptyData = '';

      expect(() => parseCSV(emptyData)).toThrow('CSVデータが空です');
    });
  });

  // ===========================================
  // TC-010: 異常系: ヘッダー不足でエラー
  // ===========================================
  describe('TC-010: 異常系: ヘッダー不足でエラー', () => {
    it('必須ヘッダー不足でエラーをスローする', () => {
      const incompleteHeader = 'date,battleType,rank';

      expect(() => parseCSV(incompleteHeader)).toThrow(
        '必須ヘッダーが不足しています'
      );
    });
  });

  // ===========================================
  // TC-011: 異常系: カラム数不一致でエラー情報を返す
  // ===========================================
  describe('TC-011: 異常系: カラム数不一致でエラー情報を返す', () => {
    it('カラム数が異なる行はスキップされる', () => {
      const csvData = `${validHeader}
2025-01-24,ランクマッチ,ダイアモンド,AAA,deck_001,先攻,勝ち,deck_master_001
2025-01-24,ランクマッチ,ダイアモンド
2025-01-25,対戦台,-,-,deck_002,先攻,勝ち,deck_master_003`;

      const result = parseCSV(csvData);

      // カラム数不一致の行はスキップされる
      expect(result).toHaveLength(2);
    });
  });

  // ===========================================
  // TC-012: 正常系: 空白行をスキップできる
  // ===========================================
  describe('TC-012: 正常系: 空白行をスキップできる', () => {
    it('空白行を含むCSVから空白行を除いた配列を返す', () => {
      const csvData = `${validHeader}
2025-01-24,ランクマッチ,ダイアモンド,AAA,deck_001,先攻,勝ち,deck_master_001

2025-01-25,対戦台,-,-,deck_002,先攻,勝ち,deck_master_003
`;

      const result = parseCSV(csvData);

      expect(result).toHaveLength(2);
    });
  });
});

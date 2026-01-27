/**
 * D1StatisticsService テスト
 * TASK-0030: 統計計算API実装
 *
 * @description D1データベースを使用した統計計算サービスのテスト
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { D1StatisticsService } from '../../src/services/d1-statistics-service';
import type { Database } from '../../src/db';

describe('D1StatisticsService', () => {
  let service: D1StatisticsService;
  let mockDb: Database;

  // テスト用のモック対戦履歴データ
  // 実際のDBの値に合わせる: result='WIN'/'LOSE', turn='先行'/'後攻'
  const mockBattleLogs = [
    {
      id: '1',
      userId: 'user-1',
      date: '2025-01-15',
      battleType: 'ランクマッチ',
      rank: 'ダイアモンド',
      groupName: 'AAA',
      myDeckId: 'deck-1',
      turn: '先行',
      result: 'WIN',
      opponentDeckId: 'opp-1',
    },
    {
      id: '2',
      userId: 'user-1',
      date: '2025-01-15',
      battleType: 'ランクマッチ',
      rank: 'ダイアモンド',
      groupName: 'AAA',
      myDeckId: 'deck-1',
      turn: '後攻',
      result: 'LOSE',
      opponentDeckId: 'opp-2',
    },
    {
      id: '3',
      userId: 'user-1',
      date: '2025-01-16',
      battleType: 'ランクマッチ',
      rank: 'ダイアモンド',
      groupName: 'AAA',
      myDeckId: 'deck-2',
      turn: '先行',
      result: 'WIN',
      opponentDeckId: 'opp-1',
    },
    {
      id: '4',
      userId: 'user-1',
      date: '2025-01-16',
      battleType: 'フリーマッチ',
      rank: 'マスター',
      groupName: 'S',
      myDeckId: 'deck-1',
      turn: '後攻',
      result: 'WIN',
      opponentDeckId: 'opp-3',
    },
  ];

  // マイデッキマスターデータ
  const mockMyDecks = [
    { id: 'deck-1', deckName: 'エルフ', userId: 'user-1' },
    { id: 'deck-2', deckName: 'ロイヤル', userId: 'user-1' },
  ];

  // デッキマスターデータ
  const mockDeckMasters = [
    { id: 'opp-1', deckName: '回復ビショップ', sortOrder: 1 },
    { id: 'opp-2', deckName: 'アグロナイトメア', sortOrder: 2 },
    { id: 'opp-3', deckName: 'コントロールナイトメア', sortOrder: 3 },
  ];

  /**
   * テーブル名に応じて適切なモックデータを返すヘルパー関数
   * @param battleLogsData - battle_logsテーブル用のモックデータ
   * @returns モックDB
   */
  const createMockDb = (battleLogsData: typeof mockBattleLogs) => {
    let queryCount = 0;
    const mockSelectFrom = vi.fn().mockImplementation((table: unknown) => {
      queryCount++;
      // 1回目: battle_logs, 2回目: my_decks, 3回目: deck_master
      if (queryCount === 1) {
        return {
          where: vi.fn().mockResolvedValue(battleLogsData),
        };
      }
      if (queryCount === 2) {
        // my_decks
        return {
          where: vi.fn().mockResolvedValue(mockMyDecks),
        };
      }
      // deck_master
      return {
        where: vi.fn().mockResolvedValue(mockDeckMasters),
      };
    });
    return {
      select: vi.fn().mockReturnValue({ from: mockSelectFrom }),
    } as unknown as Database;
  };

  beforeEach(() => {
    // モックDBの基本設定
    mockDb = {} as unknown as Database;
    service = new D1StatisticsService(mockDb);
  });

  // ===========================================
  // TC-001: 全体統計を取得できる 🔵
  // ===========================================
  describe('TC-001: 全体統計を取得できる', () => {
    it('期間内の全体統計（総試合数、勝利数、敗北数、勝率）を計算する', async () => {
      // モック設定
      mockDb = createMockDb(mockBattleLogs.slice(0, 3));
      service = new D1StatisticsService(mockDb);

      const result = await service.getStatistics({
        startDate: '2025-01-15',
        endDate: '2025-01-16',
      });

      expect(result.overall).toBeDefined();
      expect(result.overall.totalGames).toBe(3);
      expect(result.overall.wins).toBe(2);
      expect(result.overall.losses).toBe(1);
      expect(result.overall.winRate).toBe(66.7);
    });
  });

  // ===========================================
  // TC-002: マイデッキ別統計を取得できる 🔵
  // ===========================================
  describe('TC-002: マイデッキ別統計を取得できる', () => {
    it('myDeckIdでグループ化し、各デッキの統計を計算する', async () => {
      mockDb = createMockDb(mockBattleLogs.slice(0, 3));
      service = new D1StatisticsService(mockDb);

      const result = await service.getStatistics({
        startDate: '2025-01-15',
        endDate: '2025-01-16',
      });

      expect(result.byMyDeck).toBeDefined();
      expect(Array.isArray(result.byMyDeck)).toBe(true);
      expect(result.byMyDeck.length).toBeGreaterThan(0);

      // 試合数降順でソートされている
      if (result.byMyDeck.length > 1) {
        expect(result.byMyDeck[0].totalGames).toBeGreaterThanOrEqual(
          result.byMyDeck[1].totalGames
        );
      }
    });
  });

  // ===========================================
  // TC-003: 相手デッキ別統計を取得できる 🔵
  // ===========================================
  describe('TC-003: 相手デッキ別統計を取得できる', () => {
    it('opponentDeckIdでグループ化し、各相手デッキの統計を計算する', async () => {
      mockDb = createMockDb(mockBattleLogs.slice(0, 3));
      service = new D1StatisticsService(mockDb);

      const result = await service.getStatistics({
        startDate: '2025-01-15',
        endDate: '2025-01-16',
      });

      expect(result.byOpponentDeck).toBeDefined();
      expect(Array.isArray(result.byOpponentDeck)).toBe(true);
    });
  });

  // ===========================================
  // TC-004: ランク別統計を取得できる 🔵
  // ===========================================
  describe('TC-004: ランク別統計を取得できる', () => {
    it('rank + groupNameでグループ化し、各ランク帯の統計を計算する', async () => {
      mockDb = createMockDb(mockBattleLogs);
      service = new D1StatisticsService(mockDb);

      const result = await service.getStatistics({
        startDate: '2025-01-15',
        endDate: '2025-01-16',
      });

      expect(result.byRank).toBeDefined();
      expect(Array.isArray(result.byRank)).toBe(true);
    });
  });

  // ===========================================
  // TC-005: ターン別統計を取得できる 🔵
  // ===========================================
  describe('TC-005: ターン別統計を取得できる', () => {
    it("turn = '先行' と '後攻' で分けて統計を計算する", async () => {
      mockDb = createMockDb(mockBattleLogs.slice(0, 4));
      service = new D1StatisticsService(mockDb);

      const result = await service.getStatistics({
        startDate: '2025-01-15',
        endDate: '2025-01-16',
      });

      expect(result.byTurn).toBeDefined();
      expect(result.byTurn.先攻).toBeDefined();
      expect(result.byTurn.後攻).toBeDefined();
      expect(result.byTurn.先攻.totalGames).toBeGreaterThanOrEqual(0);
      expect(result.byTurn.後攻.totalGames).toBeGreaterThanOrEqual(0);
    });
  });

  // ===========================================
  // TC-006: 期間フィルタリングが正常動作する 🔵
  // ===========================================
  describe('TC-006: 期間フィルタリングが正常動作する', () => {
    it('startDate と endDate で期間を絞り込める', async () => {
      const filteredLogs = mockBattleLogs.filter(
        (log) => log.date >= '2025-01-16' && log.date <= '2025-01-16'
      );

      mockDb = createMockDb(filteredLogs);
      service = new D1StatisticsService(mockDb);

      const result = await service.getStatistics({
        startDate: '2025-01-16',
        endDate: '2025-01-16',
      });

      expect(result.overall.totalGames).toBe(2);
    });
  });

  // ===========================================
  // TC-007: 対戦タイプフィルタリングが正常動作する 🔵
  // ===========================================
  describe('TC-007: 対戦タイプフィルタリングが正常動作する', () => {
    it('battleType で対戦タイプを絞り込める', async () => {
      const filteredLogs = mockBattleLogs.filter(
        (log) => log.battleType === 'ランクマッチ'
      );

      mockDb = createMockDb(filteredLogs);
      service = new D1StatisticsService(mockDb);

      const result = await service.getStatistics({
        startDate: '2025-01-15',
        endDate: '2025-01-16',
        battleType: 'ランクマッチ',
      });

      expect(result.overall.totalGames).toBe(3);
    });
  });

  // ===========================================
  // TC-201: データ0件の場合の処理 🔵
  // ===========================================
  describe('TC-201: データ0件の場合の処理', () => {
    it('対戦履歴が0件の場合、適切な初期値を返す', async () => {
      mockDb = createMockDb([]);
      service = new D1StatisticsService(mockDb);

      const result = await service.getStatistics({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      });

      expect(result.overall.totalGames).toBe(0);
      expect(result.overall.wins).toBe(0);
      expect(result.overall.losses).toBe(0);
      expect(result.overall.winRate).toBe(0);
      expect(result.byMyDeck).toEqual([]);
      expect(result.byOpponentDeck).toEqual([]);
      expect(result.byRank).toEqual([]);
    });
  });

  // ===========================================
  // TC-202: 全勝の場合の勝率計算 🔵
  // ===========================================
  describe('TC-202: 全勝の場合の勝率計算', () => {
    it('全勝の場合、勝率が100.0になる', async () => {
      const allWins = mockBattleLogs.filter((log) => log.result === 'WIN');

      mockDb = createMockDb(allWins);
      service = new D1StatisticsService(mockDb);

      const result = await service.getStatistics({
        startDate: '2025-01-15',
        endDate: '2025-01-16',
      });

      expect(result.overall.winRate).toBe(100.0);
    });
  });

  // ===========================================
  // TC-203: 全敗の場合の勝率計算 🔵
  // ===========================================
  describe('TC-203: 全敗の場合の勝率計算', () => {
    it('全敗の場合、勝率が0.0になる', async () => {
      const allLosses = [mockBattleLogs[1]]; // 負けのみ

      mockDb = createMockDb(allLosses);
      service = new D1StatisticsService(mockDb);

      const result = await service.getStatistics({
        startDate: '2025-01-15',
        endDate: '2025-01-16',
      });

      expect(result.overall.winRate).toBe(0.0);
    });
  });

  // ===========================================
  // TC-204: 勝率の小数点第1位丸め 🔵
  // ===========================================
  describe('TC-204: 勝率の小数点第1位丸め', () => {
    it('勝率が小数点第1位まで四捨五入される（2勝1敗 = 66.7%）', async () => {
      const twoWinsOneLoss = mockBattleLogs.slice(0, 3);

      mockDb = createMockDb(twoWinsOneLoss);
      service = new D1StatisticsService(mockDb);

      const result = await service.getStatistics({
        startDate: '2025-01-15',
        endDate: '2025-01-16',
      });

      // 2/3 = 66.666...% → 66.7%
      expect(result.overall.winRate).toBe(66.7);
    });
  });

  // ===========================================
  // TC-205: 1件のみの統計計算 🔵
  // ===========================================
  describe('TC-205: 1件のみの統計計算', () => {
    it('対戦履歴が1件のみの場合も正常に計算できる', async () => {
      const singleLog = [mockBattleLogs[0]];

      mockDb = createMockDb(singleLog);
      service = new D1StatisticsService(mockDb);

      const result = await service.getStatistics({
        startDate: '2025-01-15',
        endDate: '2025-01-16',
      });

      expect(result.overall.totalGames).toBe(1);
      expect(result.overall.winRate).toBe(100.0); // 1勝0敗
    });
  });

  // ===========================================
  // TC-208: 日付境界値の処理 🔵
  // ===========================================
  describe('TC-208: 日付境界値の処理', () => {
    it('startDate と endDate が同日の場合も正常に動作する', async () => {
      const sameDayLogs = mockBattleLogs.filter(
        (log) => log.date === '2025-01-15'
      );

      mockDb = createMockDb(sameDayLogs);
      service = new D1StatisticsService(mockDb);

      const result = await service.getStatistics({
        startDate: '2025-01-15',
        endDate: '2025-01-15',
      });

      expect(result.overall.totalGames).toBe(2);
    });
  });

  // ===========================================
  // TC-210: 複合条件フィルタリング 🔵
  // ===========================================
  describe('TC-210: 複合条件フィルタリング', () => {
    it('期間 + 対戦タイプの複合フィルタリングが正常動作する', async () => {
      const filteredLogs = mockBattleLogs.filter(
        (log) =>
          log.date >= '2025-01-15' &&
          log.date <= '2025-01-16' &&
          log.battleType === 'ランクマッチ'
      );

      mockDb = createMockDb(filteredLogs);
      service = new D1StatisticsService(mockDb);

      const result = await service.getStatistics({
        startDate: '2025-01-15',
        endDate: '2025-01-16',
        battleType: 'ランクマッチ',
      });

      expect(result.overall.totalGames).toBe(3);
    });
  });
});

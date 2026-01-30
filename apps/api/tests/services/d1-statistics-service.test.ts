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
   * @param latestSeason - 最新シーズン番号（nullの場合はシーズンデータなし）
   * @returns モックDB
   */
  const createMockDb = (
    battleLogsData: typeof mockBattleLogs,
    latestSeason: number | null = null
  ) => {
    let queryCount = 0;
    const mockSelectFrom = vi.fn().mockImplementation(() => {
      queryCount++;
      // 1回目: getLatestSeason (maxSeason取得)
      if (queryCount === 1) {
        return {
          where: vi.fn().mockResolvedValue([{ maxSeason: latestSeason }]),
        };
      }
      // 2回目: battle_logs
      if (queryCount === 2) {
        return {
          where: vi.fn().mockResolvedValue(battleLogsData),
        };
      }
      // 3回目: my_decks
      if (queryCount === 3) {
        return {
          where: vi.fn().mockResolvedValue(mockMyDecks),
        };
      }
      // 4回目以降: deck_master (複数回呼ばれる可能性)
      return {
        where: vi.fn().mockResolvedValue(mockDeckMasters),
      };
    });
    return {
      select: vi.fn().mockReturnValue({ from: mockSelectFrom }),
    } as unknown as Database;
  };

  /**
   * シーズン指定ありの場合のモックDB（getLatestSeasonをスキップ）
   */
  const createMockDbWithSeasonParam = (battleLogsData: typeof mockBattleLogs) => {
    let queryCount = 0;
    const mockSelectFrom = vi.fn().mockImplementation(() => {
      queryCount++;
      // シーズン指定時は getLatestSeason が呼ばれない
      // 1回目: battle_logs
      if (queryCount === 1) {
        return {
          where: vi.fn().mockResolvedValue(battleLogsData),
        };
      }
      // 2回目: my_decks
      if (queryCount === 2) {
        return {
          where: vi.fn().mockResolvedValue(mockMyDecks),
        };
      }
      // 3回目以降: deck_master
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
      // シーズン指定ありでテスト（getLatestSeasonをスキップ）
      mockDb = createMockDbWithSeasonParam(mockBattleLogs.slice(0, 3));
      service = new D1StatisticsService(mockDb);

      const result = await service.getStatistics({
        startDate: '2025-01-15',
        endDate: '2025-01-16',
        season: 1, // シーズン指定
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
      mockDb = createMockDbWithSeasonParam(mockBattleLogs.slice(0, 3));
      service = new D1StatisticsService(mockDb);

      const result = await service.getStatistics({
        startDate: '2025-01-15',
        endDate: '2025-01-16',
        season: 1,
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
      mockDb = createMockDbWithSeasonParam(mockBattleLogs.slice(0, 3));
      service = new D1StatisticsService(mockDb);

      const result = await service.getStatistics({
        startDate: '2025-01-15',
        endDate: '2025-01-16',
        season: 1,
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
      mockDb = createMockDbWithSeasonParam(mockBattleLogs);
      service = new D1StatisticsService(mockDb);

      const result = await service.getStatistics({
        startDate: '2025-01-15',
        endDate: '2025-01-16',
        season: 1,
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
      mockDb = createMockDbWithSeasonParam(mockBattleLogs.slice(0, 4));
      service = new D1StatisticsService(mockDb);

      const result = await service.getStatistics({
        startDate: '2025-01-15',
        endDate: '2025-01-16',
        season: 1,
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

      mockDb = createMockDbWithSeasonParam(filteredLogs);
      service = new D1StatisticsService(mockDb);

      const result = await service.getStatistics({
        startDate: '2025-01-16',
        endDate: '2025-01-16',
        season: 1,
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

      mockDb = createMockDbWithSeasonParam(filteredLogs);
      service = new D1StatisticsService(mockDb);

      const result = await service.getStatistics({
        startDate: '2025-01-15',
        endDate: '2025-01-16',
        battleType: 'ランクマッチ',
        season: 1,
      });

      expect(result.overall.totalGames).toBe(3);
    });
  });

  // ===========================================
  // TC-201: データ0件の場合の処理 🔵
  // ===========================================
  describe('TC-201: データ0件の場合の処理', () => {
    it('対戦履歴が0件の場合、適切な初期値を返す', async () => {
      mockDb = createMockDbWithSeasonParam([]);
      service = new D1StatisticsService(mockDb);

      const result = await service.getStatistics({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        season: 1,
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

      mockDb = createMockDbWithSeasonParam(allWins);
      service = new D1StatisticsService(mockDb);

      const result = await service.getStatistics({
        startDate: '2025-01-15',
        endDate: '2025-01-16',
        season: 1,
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

      mockDb = createMockDbWithSeasonParam(allLosses);
      service = new D1StatisticsService(mockDb);

      const result = await service.getStatistics({
        startDate: '2025-01-15',
        endDate: '2025-01-16',
        season: 1,
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

      mockDb = createMockDbWithSeasonParam(twoWinsOneLoss);
      service = new D1StatisticsService(mockDb);

      const result = await service.getStatistics({
        startDate: '2025-01-15',
        endDate: '2025-01-16',
        season: 1,
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

      mockDb = createMockDbWithSeasonParam(singleLog);
      service = new D1StatisticsService(mockDb);

      const result = await service.getStatistics({
        startDate: '2025-01-15',
        endDate: '2025-01-16',
        season: 1,
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

      mockDb = createMockDbWithSeasonParam(sameDayLogs);
      service = new D1StatisticsService(mockDb);

      const result = await service.getStatistics({
        startDate: '2025-01-15',
        endDate: '2025-01-15',
        season: 1,
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

      mockDb = createMockDbWithSeasonParam(filteredLogs);
      service = new D1StatisticsService(mockDb);

      const result = await service.getStatistics({
        startDate: '2025-01-15',
        endDate: '2025-01-16',
        battleType: 'ランクマッチ',
        season: 1,
      });

      expect(result.overall.totalGames).toBe(3);
    });
  });

  // ===========================================
  // TASK-0026: シーズンフィルタリングテスト
  // ===========================================
  describe('TC-301: シーズンフィルタリングが正常動作する', () => {
    // シーズン付きのモック対戦履歴データ
    const mockBattleLogsWithSeason = [
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
        season: 1,
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
        season: 1,
      },
      {
        id: '3',
        userId: 'user-1',
        date: '2025-02-16',
        battleType: 'ランクマッチ',
        rank: 'ダイアモンド',
        groupName: 'AAA',
        myDeckId: 'deck-2',
        turn: '先行',
        result: 'WIN',
        opponentDeckId: 'opp-1',
        season: 2,
      },
      {
        id: '4',
        userId: 'user-1',
        date: '2025-02-16',
        battleType: 'ランクマッチ',
        rank: 'ダイアモンド',
        groupName: 'AAA',
        myDeckId: 'deck-1',
        turn: '後攻',
        result: 'WIN',
        opponentDeckId: 'opp-3',
        season: 2,
      },
    ];

    it('season パラメータで指定シーズンの対戦履歴を絞り込める', async () => {
      // シーズン1のみのデータ
      const season1Logs = mockBattleLogsWithSeason.filter((log) => log.season === 1);

      // シーズン指定ありの場合はgetLatestSeasonが呼ばれない
      mockDb = createMockDbWithSeasonParam(season1Logs);
      service = new D1StatisticsService(mockDb);

      const result = await service.getStatistics({
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        season: 1,
      });

      expect(result.season).toBe(1);
      expect(result.overall.totalGames).toBe(2);
      expect(result.overall.wins).toBe(1);
      expect(result.overall.losses).toBe(1);
    });

    it('season 未指定の場合は最新シーズンの対戦履歴を取得する', async () => {
      // シーズン未指定時は最新シーズン（2）の統計を返す
      const season2Logs = mockBattleLogsWithSeason.filter((log) => log.season === 2);

      // 最新シーズンは2、battle_logsはシーズン2のデータのみ
      mockDb = createMockDb(season2Logs, 2);
      service = new D1StatisticsService(mockDb);

      const result = await service.getStatistics({
        startDate: '2025-01-01',
        endDate: '2025-12-31',
      });

      expect(result.season).toBe(2);
      expect(result.overall.totalGames).toBe(2);
    });

    it('season と他のパラメータを組み合わせてフィルタリングできる', async () => {
      // シーズン2かつ先行のみ
      const filteredLogs = mockBattleLogsWithSeason.filter(
        (log) => log.season === 2 && log.turn === '先行'
      );

      // シーズン指定ありの場合はgetLatestSeasonが呼ばれない
      mockDb = createMockDbWithSeasonParam(filteredLogs);
      service = new D1StatisticsService(mockDb);

      const result = await service.getStatistics({
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        season: 2,
      });

      expect(result.season).toBe(2);
      expect(result.overall.totalGames).toBe(1);
      expect(result.overall.wins).toBe(1);
      expect(result.overall.losses).toBe(0);
      expect(result.overall.winRate).toBe(100.0);
    });

    it('シーズンデータがない場合はseasonがnullを返す', async () => {
      // シーズンデータがない場合
      mockDb = createMockDb([], null);
      service = new D1StatisticsService(mockDb);

      const result = await service.getStatistics({
        startDate: '2025-01-01',
        endDate: '2025-12-31',
      });

      expect(result.season).toBeNull();
      expect(result.overall.totalGames).toBe(0);
    });
  });
});

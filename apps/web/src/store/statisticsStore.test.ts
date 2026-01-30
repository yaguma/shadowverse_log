import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as apiClient from '../api/client';
import * as statisticsApi from '../api/statistics';
import {
  selectAvailableSeasons,
  selectError,
  selectIsLoading,
  selectIsSeasonsLoading,
  selectSelectedSeason,
  selectStatistics,
  useStatisticsStore,
} from './statisticsStore';

// 【テストファイル概要】: Statistics Storeの単体テスト
// 【テスト目的】: Zustandを使用した統計データの状態管理機能を検証する
// 【テスト範囲】: fetchStatistics アクションの正常系とエラー系

// 【モック設定】: API Clientをモック化してBackend APIへの実際の通信を回避
vi.mock('../api/client', () => {
  const extractErrorMessage = (error: unknown, defaultMessage = 'Unknown error'): string => {
    if (error instanceof Error) {
      return error.message;
    }
    return defaultMessage;
  };

  return {
    apiClient: {
      get: vi.fn(),
      post: vi.fn(),
      del: vi.fn(),
    },
    extractErrorMessage,
  };
});

// 【モック設定】: Statistics APIをモック化
vi.mock('../api/statistics', () => ({
  fetchAvailableSeasons: vi.fn(),
  fetchStatistics: vi.fn(),
  fetchStatisticsBySeason: vi.fn(),
}));

describe('Statistics Store', () => {
  // 【テスト前準備】: 各テスト実行前にストアの状態を初期化
  beforeEach(() => {
    useStatisticsStore.setState({
      statistics: null,
      isLoading: false,
      error: null,
      currentPeriod: '1week',
      selectedSeason: null,
      availableSeasons: [],
      isSeasonsLoading: false,
    });
    vi.clearAllMocks();
  });

  // ==================== fetchStatistics() テスト ====================

  describe('fetchStatistics()', () => {
    it('TC-STORE-ST-001: 統計データの取得が成功し、状態が更新される', async () => {
      // 【テスト目的】: StatisticsStoreの fetchStatistics() アクションが正常にデータを取得すること 🔵
      // 【期待される動作】: isLoading が true → false に遷移し、statistics が更新される 🔵
      // 🔵 信頼性レベル: 要件定義書とBackend API仕様に準拠

      const mockStatistics = {
        overall: {
          totalGames: 100,
          wins: 60,
          losses: 40,
          winRate: 60.0,
        },
        byMyDeck: [
          {
            deckId: 'deck-001',
            deckName: 'エルフデッキ',
            totalGames: 50,
            wins: 30,
            losses: 20,
            winRate: 60.0,
          },
        ],
        byOpponentDeck: [
          {
            deckId: 'deck-101',
            deckName: 'ロイヤル',
            totalGames: 30,
            wins: 18,
            losses: 12,
            winRate: 60.0,
          },
        ],
        byRank: [
          {
            rank: 'ダイアモンド' as const,
            group: 'AA' as const,
            totalGames: 50,
            wins: 30,
            losses: 20,
            winRate: 60.0,
          },
        ],
        byTurn: {
          先攻: { totalGames: 50, wins: 35, losses: 15, winRate: 70.0 },
          後攻: { totalGames: 50, wins: 25, losses: 25, winRate: 50.0 },
        },
        opponentDeckDistribution: [
          { deckId: 'deck-101', deckName: 'ロイヤル', count: 30, percentage: 30.0 },
        ],
        dateRange: {
          startDate: '2025-01-01',
          endDate: '2025-01-07',
        },
      };

      vi.mocked(apiClient.apiClient.get).mockResolvedValueOnce(mockStatistics);

      await useStatisticsStore.getState().fetchStatistics({ period: '1week' });

      const state = useStatisticsStore.getState();
      expect(state.statistics).toEqual(mockStatistics);
      expect(state.currentPeriod).toBe('1week');
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();

      expect(apiClient.apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.apiClient.get).toHaveBeenCalledWith('/statistics?period=1week');
    });

    it('TC-STORE-ST-002: 統計データの取得が失敗し、エラー状態が設定される', async () => {
      // 【テスト目的】: エラーハンドリングの確認 - API呼び出しが失敗した場合 🔵
      // 【期待される動作】: errorにエラーメッセージが設定される 🔵
      // 🔵 信頼性レベル: エラー時でもアプリケーションが安全に動作すること

      const mockError = new Error('統計データの取得に失敗しました');
      vi.mocked(apiClient.apiClient.get).mockRejectedValueOnce(mockError);

      await useStatisticsStore.getState().fetchStatistics({ period: '1week' });

      const state = useStatisticsStore.getState();
      expect(state.error).toBe('統計データの取得に失敗しました');
      expect(state.statistics).toBeNull();
      expect(state.isLoading).toBe(false);
    });

    it('TC-STORE-ST-003: カスタム期間での統計データ取得が成功する', async () => {
      // 【テスト目的】: カスタム期間指定での統計取得を確認 🔵
      // 🔵 信頼性レベル: 期間フィルタ機能の要件に準拠

      const mockStatistics = {
        overall: { totalGames: 50, wins: 30, losses: 20, winRate: 60.0 },
        byMyDeck: [],
        byOpponentDeck: [],
        byRank: [],
        byTurn: {
          先攻: { totalGames: 25, wins: 15, losses: 10, winRate: 60.0 },
          後攻: { totalGames: 25, wins: 15, losses: 10, winRate: 60.0 },
        },
        opponentDeckDistribution: [],
        dateRange: { startDate: '2025-01-01', endDate: '2025-01-31' },
      };

      vi.mocked(apiClient.apiClient.get).mockResolvedValueOnce(mockStatistics);

      await useStatisticsStore.getState().fetchStatistics({
        period: 'custom',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      });

      expect(apiClient.apiClient.get).toHaveBeenCalledWith(
        '/statistics?period=custom&startDate=2025-01-01&endDate=2025-01-31'
      );
    });
  });

  // ==================== setPeriod() テスト ====================

  describe('setPeriod()', () => {
    it('TC-STORE-ST-004: 期間の設定が成功する', () => {
      // 【テスト目的】: StatisticsStoreの setPeriod() アクションが正常に動作すること 🔵
      // 🔵 信頼性レベル: 期間選択UIの状態管理

      useStatisticsStore.getState().setPeriod('1month');

      expect(useStatisticsStore.getState().currentPeriod).toBe('1month');
    });

    it('TC-STORE-ST-005: 異なる期間への切り替えが成功する', () => {
      // 【テスト目的】: 期間切り替えの動作確認 🔵
      // 🔵 信頼性レベル: ユーザー操作に応じた状態変更

      useStatisticsStore.getState().setPeriod('1week');
      expect(useStatisticsStore.getState().currentPeriod).toBe('1week');

      useStatisticsStore.getState().setPeriod('1month');
      expect(useStatisticsStore.getState().currentPeriod).toBe('1month');

      useStatisticsStore.getState().setPeriod('all');
      expect(useStatisticsStore.getState().currentPeriod).toBe('all');
    });
  });

  // ==================== clearError() テスト ====================

  describe('clearError()', () => {
    it('TC-STORE-ST-006: エラー状態のクリアが成功する', () => {
      // 【テスト目的】: StatisticsStoreの clearError() アクションが正常に動作すること 🔵
      // 🔵 信頼性レベル: ユーザーがエラーメッセージを閉じた後の状態管理

      useStatisticsStore.setState({ error: '統計データの取得に失敗しました' });

      useStatisticsStore.getState().clearError();

      expect(useStatisticsStore.getState().error).toBeNull();
    });
  });

  // ==================== fetchSeasons() テスト (TASK-0027) ====================

  describe('fetchSeasons()', () => {
    it('TC-STORE-ST-007: シーズン一覧の取得が成功し、最新シーズンが自動選択される', async () => {
      // 【テスト目的】: fetchSeasons()がシーズン一覧を取得し、最新シーズンを自動選択すること
      // 🔵 信頼性レベル: TASK-0027要件に基づく

      const mockSeasons = [31, 30, 29, 28];
      vi.mocked(statisticsApi.fetchAvailableSeasons).mockResolvedValueOnce(mockSeasons);

      await useStatisticsStore.getState().fetchSeasons();

      const state = useStatisticsStore.getState();
      expect(state.availableSeasons).toEqual(mockSeasons);
      expect(state.selectedSeason).toBe(31); // 最新シーズンが自動選択される
      expect(state.isSeasonsLoading).toBe(false);
      expect(statisticsApi.fetchAvailableSeasons).toHaveBeenCalledTimes(1);
    });

    it('TC-STORE-ST-008: シーズン一覧取得中はisSeasonsLoadingがtrueになる', async () => {
      // 【テスト目的】: ローディング状態が正しく管理されること
      // 🔵 信頼性レベル: UI状態管理の要件

      let resolvePromise: (value: number[]) => void;
      const promise = new Promise<number[]>((resolve) => {
        resolvePromise = resolve;
      });
      vi.mocked(statisticsApi.fetchAvailableSeasons).mockReturnValueOnce(promise);

      const fetchPromise = useStatisticsStore.getState().fetchSeasons();

      // ローディング中
      expect(useStatisticsStore.getState().isSeasonsLoading).toBe(true);

      // 解決
      resolvePromise!([31, 30]);
      await fetchPromise;

      expect(useStatisticsStore.getState().isSeasonsLoading).toBe(false);
    });

    it('TC-STORE-ST-009: シーズン一覧取得が失敗した場合、エラー状態が設定される', async () => {
      // 【テスト目的】: エラーハンドリングの確認
      // 🔵 信頼性レベル: エラー時のアプリケーション安全動作

      const mockError = new Error('シーズン一覧の取得に失敗しました');
      vi.mocked(statisticsApi.fetchAvailableSeasons).mockRejectedValueOnce(mockError);

      await useStatisticsStore.getState().fetchSeasons();

      const state = useStatisticsStore.getState();
      expect(state.error).toBe('シーズン一覧の取得に失敗しました');
      expect(state.availableSeasons).toEqual([]);
      expect(state.isSeasonsLoading).toBe(false);
    });

    it('TC-STORE-ST-010: シーズン一覧が空の場合、selectedSeasonはnullのまま', async () => {
      // 【テスト目的】: 空配列の場合の動作確認
      // 🔵 信頼性レベル: エッジケースの処理

      vi.mocked(statisticsApi.fetchAvailableSeasons).mockResolvedValueOnce([]);

      await useStatisticsStore.getState().fetchSeasons();

      const state = useStatisticsStore.getState();
      expect(state.availableSeasons).toEqual([]);
      expect(state.selectedSeason).toBeNull();
    });
  });

  // ==================== setSelectedSeason() テスト (TASK-0027) ====================

  describe('setSelectedSeason()', () => {
    it('TC-STORE-ST-011: シーズン選択が成功し、統計データが再取得される', async () => {
      // 【テスト目的】: setSelectedSeason()がシーズンを選択し、統計を再取得すること
      // 🔵 信頼性レベル: TASK-0027要件に基づく

      const mockStatistics = {
        season: 30,
        totalMatches: 100,
        wins: 60,
        losses: 40,
        winRate: 60.0,
        firstWinRate: 65.0,
        secondWinRate: 55.0,
      };
      vi.mocked(statisticsApi.fetchStatisticsBySeason).mockResolvedValueOnce(mockStatistics);

      // 初期状態を設定
      useStatisticsStore.setState({ availableSeasons: [31, 30, 29], selectedSeason: 31 });

      await useStatisticsStore.getState().setSelectedSeason(30);

      const state = useStatisticsStore.getState();
      expect(state.selectedSeason).toBe(30);
      expect(statisticsApi.fetchStatisticsBySeason).toHaveBeenCalledWith(30);
    });

    it('TC-STORE-ST-012: シーズン変更中はisLoadingがtrueになる', async () => {
      // 【テスト目的】: ローディング状態が正しく管理されること
      // 🔵 信頼性レベル: UI状態管理の要件

      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      vi.mocked(statisticsApi.fetchStatisticsBySeason).mockReturnValueOnce(
        promise as Promise<never>
      );

      useStatisticsStore.setState({ availableSeasons: [31, 30], selectedSeason: 31 });

      const setSeasonPromise = useStatisticsStore.getState().setSelectedSeason(30);

      // ローディング中
      expect(useStatisticsStore.getState().isLoading).toBe(true);

      // 解決
      resolvePromise!({
        season: 30,
        totalMatches: 50,
        wins: 30,
        losses: 20,
        winRate: 60.0,
        firstWinRate: 60.0,
        secondWinRate: 60.0,
      });
      await setSeasonPromise;

      expect(useStatisticsStore.getState().isLoading).toBe(false);
    });
  });

  // ==================== fetchStatisticsBySeason() テスト (TASK-0027) ====================

  describe('fetchStatisticsBySeason()', () => {
    it('TC-STORE-ST-013: 指定シーズンの統計データ取得が成功する', async () => {
      // 【テスト目的】: fetchStatisticsBySeason()が指定シーズンの統計を取得すること
      // 🔵 信頼性レベル: TASK-0027要件に基づく

      const mockStatistics = {
        season: 29,
        totalMatches: 80,
        wins: 50,
        losses: 30,
        winRate: 62.5,
        firstWinRate: 70.0,
        secondWinRate: 55.0,
      };
      vi.mocked(statisticsApi.fetchStatisticsBySeason).mockResolvedValueOnce(mockStatistics);

      await useStatisticsStore.getState().fetchStatisticsBySeason(29);

      expect(statisticsApi.fetchStatisticsBySeason).toHaveBeenCalledWith(29);
      expect(useStatisticsStore.getState().isLoading).toBe(false);
    });

    it('TC-STORE-ST-014: 統計データ取得が失敗した場合、エラー状態が設定される', async () => {
      // 【テスト目的】: エラーハンドリングの確認
      // 🔵 信頼性レベル: エラー時のアプリケーション安全動作

      const mockError = new Error('統計データの取得に失敗しました');
      vi.mocked(statisticsApi.fetchStatisticsBySeason).mockRejectedValueOnce(mockError);

      await useStatisticsStore.getState().fetchStatisticsBySeason(29);

      const state = useStatisticsStore.getState();
      expect(state.error).toBe('統計データの取得に失敗しました');
      expect(state.isLoading).toBe(false);
    });
  });

  // ==================== セレクタ テスト (TASK-0027) ====================

  describe('セレクタ', () => {
    it('TC-STORE-ST-015: selectStatisticsがstatisticsを返す', () => {
      const mockStats = {
        overall: { totalGames: 100, wins: 60, losses: 40, winRate: 60.0 },
        byMyDeck: [],
        byOpponentDeck: [],
        byRank: [],
        byTurn: {
          先攻: { totalGames: 50, wins: 30, losses: 20, winRate: 60.0 },
          後攻: { totalGames: 50, wins: 30, losses: 20, winRate: 60.0 },
        },
        opponentDeckDistribution: [],
        dateRange: { startDate: '2025-01-01', endDate: '2025-01-07' },
      };
      useStatisticsStore.setState({ statistics: mockStats });

      expect(selectStatistics(useStatisticsStore.getState())).toEqual(mockStats);
    });

    it('TC-STORE-ST-016: selectSelectedSeasonがselectedSeasonを返す', () => {
      useStatisticsStore.setState({ selectedSeason: 30 });

      expect(selectSelectedSeason(useStatisticsStore.getState())).toBe(30);
    });

    it('TC-STORE-ST-017: selectAvailableSeasonsがavailableSeasonsを返す', () => {
      useStatisticsStore.setState({ availableSeasons: [31, 30, 29] });

      expect(selectAvailableSeasons(useStatisticsStore.getState())).toEqual([31, 30, 29]);
    });

    it('TC-STORE-ST-018: selectIsLoadingがisLoadingを返す', () => {
      useStatisticsStore.setState({ isLoading: true });

      expect(selectIsLoading(useStatisticsStore.getState())).toBe(true);
    });

    it('TC-STORE-ST-019: selectIsSeasonsLoadingがisSeasonsLoadingを返す', () => {
      useStatisticsStore.setState({ isSeasonsLoading: true });

      expect(selectIsSeasonsLoading(useStatisticsStore.getState())).toBe(true);
    });

    it('TC-STORE-ST-020: selectErrorがerrorを返す', () => {
      useStatisticsStore.setState({ error: 'テストエラー' });

      expect(selectError(useStatisticsStore.getState())).toBe('テストエラー');
    });
  });
});

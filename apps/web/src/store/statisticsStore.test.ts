import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as apiClient from '../api/client';
import { useStatisticsStore } from './statisticsStore';

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

describe('Statistics Store', () => {
  // 【テスト前準備】: 各テスト実行前にストアの状態を初期化
  beforeEach(() => {
    useStatisticsStore.setState({
      statistics: null,
      isLoading: false,
      error: null,
      currentPeriod: '1week',
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
});

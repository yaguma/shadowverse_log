import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../api/client';
import type { StatisticsResponse } from '../types';
import { StatisticsDashboardPage } from './StatisticsDashboardPage';

// 【テストファイル概要】: Statistics Dashboardページコンポーネントの単体テスト
// 【テスト目的】: StatisticsDashboardPageコンポーネントの全機能（正常系・異常系・境界値・UI/UX）を検証する
// 【テスト範囲】: 統計表示、期間選択、ローディング、エラーハンドリング、レスポンシブデザイン

// 【モック設定】: API Clientをモック化してAPIレスポンスを制御
vi.mock('../api/client');

describe('StatisticsDashboardPage', () => {
  // 【テスト前準備】: 各テスト実行前にモックを初期化し、一貫したテスト環境を構築
  // 【環境初期化】: モックAPIのレスポンスをリセットして前のテストの影響を受けないようにする
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== 1. 正常系テストケース ====================

  describe('正常系テスト', () => {
    it('TC-STATS-001: ページ初期表示 - デフォルト期間（過去7日間）で統計情報が表示される', async () => {
      // 【テスト目的】: StatisticsDashboardPageコンポーネントの初回マウント時の動作を確認
      // 【テスト内容】: デフォルト期間（過去7日間）で自動的にAPI呼び出しが実行され、統計情報が表示される
      // 【期待される動作】: startDate=今日-7日, endDate=今日の日付でAPIが呼ばれ、統計が表示される
      // 🔵 信頼性レベル: REQ-201, REQ-202 に基づく

      // ========== Given: テストデータ準備 ==========
      // 【テストデータ準備】: モックAPIレスポンスを用意（150試合、勝率65.3%のデータ）
      // 【初期条件設定】: ページ初回マウント状態を想定
      const mockStatistics: StatisticsResponse = {
        overall: {
          totalGames: 150,
          wins: 98,
          losses: 52,
          winRate: 65.3,
        },
        byMyDeck: [
          {
            deckId: 'deck_001',
            deckName: '秘術オデンスペル',
            totalGames: 75,
            wins: 50,
            losses: 25,
            winRate: 66.7,
          },
        ],
        byOpponentDeck: [
          {
            deckId: 'deck_master_005',
            deckName: '進化ネクロ',
            totalGames: 30,
            wins: 20,
            losses: 10,
            winRate: 66.7,
          },
        ],
        byRank: [
          {
            rank: 'ダイアモンド',
            group: 'AAA',
            totalGames: 80,
            wins: 55,
            losses: 25,
            winRate: 68.8,
          },
        ],
        byTurn: {
          先攻: {
            totalGames: 78,
            wins: 52,
            losses: 26,
            winRate: 66.7,
          },
          後攻: {
            totalGames: 72,
            wins: 46,
            losses: 26,
            winRate: 63.9,
          },
        },
        opponentDeckDistribution: [],
        dateRange: {
          startDate: '2025-11-02',
          endDate: '2025-11-09',
        },
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockStatistics);

      // ========== When: 実際の処理実行 ==========
      // 【実際の処理実行】: StatisticsDashboardPageコンポーネントをレンダリング
      // 【処理内容】: useEffect内でAPI呼び出しが自動実行される
      render(<StatisticsDashboardPage />);

      // ========== Then: 結果検証 ==========
      // 【結果検証】: ローディング状態が表示され、その後統計情報が表示される
      // 【期待値確認】: APIが正しいパラメータで呼ばれ、統計が表示される

      // 【検証項目】: API呼び出しが実行される（デフォルト期間：過去7日間） 🔵
      await waitFor(() => {
        const today = new Date().toISOString().split('T')[0];
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];
        expect(apiClient.get).toHaveBeenCalledWith(
          `/statistics?startDate=${sevenDaysAgo}&endDate=${today}`
        );
      });

      // 【検証項目】: 全体統計が表示される 🔵
      await waitFor(() => {
        expect(screen.getByText(/総試合数.*150/)).toBeInTheDocument();
        expect(screen.getByText(/勝率.*65\.3%/)).toBeInTheDocument();
      });
    });

    it('TC-STATS-002: 全体統計が正しく表示される', async () => {
      // 【テスト目的】: OverallStatsコンポーネントの表示機能を確認
      // 【テスト内容】: APIレスポンスのoverall統計が正確に表示される
      // 【期待される動作】: 総試合数、勝数、敗数、勝率が正しく表示される
      // 🔵 信頼性レベル: REQ-203 に基づく

      // 【テストデータ準備】: 150試合中98勝52敗、勝率65.3%のサンプルデータ
      const mockStatistics: StatisticsResponse = {
        overall: {
          totalGames: 150,
          wins: 98,
          losses: 52,
          winRate: 65.3,
        },
        byMyDeck: [],
        byOpponentDeck: [],
        byRank: [],
        byTurn: {
          先攻: { totalGames: 0, wins: 0, losses: 0, winRate: 0 },
          後攻: { totalGames: 0, wins: 0, losses: 0, winRate: 0 },
        },
        opponentDeckDistribution: [],
        dateRange: { startDate: '2025-11-01', endDate: '2025-11-09' },
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockStatistics);

      render(<StatisticsDashboardPage />);

      // 【検証項目】: 総試合数が表示される 🔵
      await waitFor(() => {
        expect(screen.getByText(/総試合数.*150/)).toBeInTheDocument();
      });

      // 【検証項目】: 勝数が表示される 🔵
      expect(screen.getByText(/勝数.*98/)).toBeInTheDocument();

      // 【検証項目】: 敗数が表示される 🔵
      expect(screen.getByText(/敗数.*52/)).toBeInTheDocument();

      // 【検証項目】: 勝率が小数点第1位まで表示される 🔵
      expect(screen.getByText(/勝率.*65\.3%/)).toBeInTheDocument();
    });

    it('TC-STATS-003: デッキ別統計が正しく表示される', async () => {
      // 【テスト目的】: DeckStatsTableコンポーネントの表示機能を確認
      // 【テスト内容】: APIレスポンスのbyMyDeck, byOpponentDeck統計が正確に表示される
      // 【期待される動作】: マイデッキ別・相手デッキ別の統計が正しく表示される
      // 🔵 信頼性レベル: REQ-203 に基づく

      // 【テストデータ準備】: マイデッキ2種類、相手デッキ1種類の統計データ
      const mockStatistics: StatisticsResponse = {
        overall: { totalGames: 150, wins: 98, losses: 52, winRate: 65.3 },
        byMyDeck: [
          {
            deckId: 'deck_001',
            deckName: '秘術オデンスペル',
            totalGames: 75,
            wins: 50,
            losses: 25,
            winRate: 66.7,
          },
          {
            deckId: 'deck_002',
            deckName: '進化葬送ネクロ',
            totalGames: 75,
            wins: 48,
            losses: 27,
            winRate: 64.0,
          },
        ],
        byOpponentDeck: [
          {
            deckId: 'deck_master_005',
            deckName: '進化ネクロ',
            totalGames: 30,
            wins: 20,
            losses: 10,
            winRate: 66.7,
          },
        ],
        byRank: [],
        byTurn: {
          先攻: { totalGames: 0, wins: 0, losses: 0, winRate: 0 },
          後攻: { totalGames: 0, wins: 0, losses: 0, winRate: 0 },
        },
        opponentDeckDistribution: [],
        dateRange: { startDate: '2025-11-01', endDate: '2025-11-09' },
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockStatistics);

      render(<StatisticsDashboardPage />);

      // 【検証項目】: マイデッキ別統計テーブルに2行表示される 🔵
      await waitFor(() => {
        expect(screen.getByText('秘術オデンスペル')).toBeInTheDocument();
        expect(screen.getByText('進化葬送ネクロ')).toBeInTheDocument();
      });

      // 【検証項目】: 相手デッキ別統計テーブルに1行表示される 🔵
      expect(screen.getByText('進化ネクロ')).toBeInTheDocument();

      // 【検証項目】: デッキ名、試合数、勝数、敗数、勝率が正しく表示される 🔵
      // 【修正】: 複数の要素に分かれたテキストを個別に検証 🟡
      expect(screen.getAllByText('75')[0]).toBeInTheDocument();
      expect(screen.getAllByText('50')[0]).toBeInTheDocument();
      expect(screen.getAllByText('66.7%')[0]).toBeInTheDocument();
    });

    it('TC-STATS-004: ランク帯別統計が正しく表示される', async () => {
      // 【テスト目的】: RankStatsTableコンポーネントの表示機能を確認
      // 【テスト内容】: APIレスポンスのbyRank統計が正確に表示される
      // 【期待される動作】: ランク帯別の統計が正しく表示される
      // 🔵 信頼性レベル: REQ-203 に基づく

      // 【テストデータ準備】: ダイアモンドAAAとルビーMasterの2ランク帯の統計データ
      const mockStatistics: StatisticsResponse = {
        overall: { totalGames: 150, wins: 98, losses: 52, winRate: 65.3 },
        byMyDeck: [],
        byOpponentDeck: [],
        byRank: [
          {
            rank: 'ダイアモンド',
            group: 'AAA',
            totalGames: 80,
            wins: 55,
            losses: 25,
            winRate: 68.8,
          },
          {
            rank: 'ルビー',
            group: 'Master',
            totalGames: 70,
            wins: 43,
            losses: 27,
            winRate: 61.4,
          },
        ],
        byTurn: {
          先攻: { totalGames: 0, wins: 0, losses: 0, winRate: 0 },
          後攻: { totalGames: 0, wins: 0, losses: 0, winRate: 0 },
        },
        opponentDeckDistribution: [],
        dateRange: { startDate: '2025-11-01', endDate: '2025-11-09' },
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockStatistics);

      render(<StatisticsDashboardPage />);

      // 【検証項目】: ランク帯別統計テーブルに2行表示される 🔵
      await waitFor(() => {
        expect(screen.getByText('ダイアモンド')).toBeInTheDocument();
        expect(screen.getByText('ルビー')).toBeInTheDocument();
      });

      // 【検証項目】: ランク、グループ、試合数、勝数、敗数、勝率が正しく表示される 🔵
      expect(screen.getByText('AAA')).toBeInTheDocument();
      expect(screen.getByText('Master')).toBeInTheDocument();
      expect(screen.getByText(/68\.8%/)).toBeInTheDocument();
      expect(screen.getByText(/61\.4%/)).toBeInTheDocument();
    });

    it('TC-STATS-005: 先攻後攻別統計が正しく表示される', async () => {
      // 【テスト目的】: TurnStatsコンポーネントの表示機能を確認
      // 【テスト内容】: APIレスポンスのbyTurn統計が正確に表示される
      // 【期待される動作】: 先攻後攻別の統計が正しく表示される
      // 🔵 信頼性レベル: REQ-203 に基づく

      // 【テストデータ準備】: 先攻78試合、後攻72試合の統計データ
      const mockStatistics: StatisticsResponse = {
        overall: { totalGames: 150, wins: 98, losses: 52, winRate: 65.3 },
        byMyDeck: [],
        byOpponentDeck: [],
        byRank: [],
        byTurn: {
          先攻: {
            totalGames: 78,
            wins: 52,
            losses: 26,
            winRate: 66.7,
          },
          後攻: {
            totalGames: 72,
            wins: 46,
            losses: 26,
            winRate: 63.9,
          },
        },
        opponentDeckDistribution: [],
        dateRange: { startDate: '2025-11-01', endDate: '2025-11-09' },
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockStatistics);

      render(<StatisticsDashboardPage />);

      // 【検証項目】: 先攻の統計が表示される（試合数: 78、勝率: 66.7%） 🔵
      // 【修正】: 複数の要素に分かれたテキストを個別に検証 🟡
      await waitFor(() => {
        expect(
          screen.getByText((_content, element) => {
            return element?.textContent === '78試合 52勝 26敗 勝率66.7%';
          })
        ).toBeInTheDocument();
      });

      // 【検証項目】: 後攻の統計が表示される（試合数: 72、勝率: 63.9%） 🔵
      // 【修正】: 複数の要素に分かれたテキストを個別に検証 🟡
      expect(
        screen.getByText((_content, element) => {
          return element?.textContent === '72試合 46勝 26敗 勝率63.9%';
        })
      ).toBeInTheDocument();
    });

    it('TC-STATS-006: 期間選択で統計情報が更新される', async () => {
      // 【テスト目的】: PeriodSelectorコンポーネントの期間変更機能を確認
      // 【テスト内容】: 開始日・終了日を変更して検索ボタンをクリックすると統計情報が更新される
      // 【期待される動作】: 期間を変更して検索ボタンをクリックするとAPI呼び出しが再実行される
      // 🔵 信頼性レベル: REQ-202 に基づく

      // 【テストデータ準備】: 初回API呼び出し用と2回目API呼び出し用のモックデータを用意
      const mockStatistics: StatisticsResponse = {
        overall: { totalGames: 150, wins: 98, losses: 52, winRate: 65.3 },
        byMyDeck: [],
        byOpponentDeck: [],
        byRank: [],
        byTurn: {
          先攻: { totalGames: 0, wins: 0, losses: 0, winRate: 0 },
          後攻: { totalGames: 0, wins: 0, losses: 0, winRate: 0 },
        },
        opponentDeckDistribution: [],
        dateRange: { startDate: '2025-11-01', endDate: '2025-11-09' },
      };

      const updatedStatistics: StatisticsResponse = {
        overall: { totalGames: 200, wins: 130, losses: 70, winRate: 65.0 },
        byMyDeck: [],
        byOpponentDeck: [],
        byRank: [],
        byTurn: {
          先攻: { totalGames: 0, wins: 0, losses: 0, winRate: 0 },
          後攻: { totalGames: 0, wins: 0, losses: 0, winRate: 0 },
        },
        opponentDeckDistribution: [],
        dateRange: { startDate: '2025-01-01', endDate: '2025-01-31' },
      };

      // 【修正】: 日付変更が2回（startDate, endDate）行われるため、最大3回のAPI呼び出しに対応 🟡
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce(mockStatistics) // 初回表示
        .mockResolvedValueOnce(mockStatistics) // startDate変更時（中間状態）
        .mockResolvedValueOnce(updatedStatistics); // endDate変更時（最終状態）

      render(<StatisticsDashboardPage />);

      // 初回表示を待つ
      await waitFor(() => {
        expect(screen.getByText(/総試合数.*150/)).toBeInTheDocument();
      });

      // 【実際の処理実行】: 開始日・終了日を変更（useEffectで自動的にAPI呼び出しが実行される）
      // 【処理内容】: 2025年1月の1ヶ月間の統計を確認
      const startDateInput = screen.getByLabelText('開始日');
      const endDateInput = screen.getByLabelText('終了日');

      // 【修正】: 一度に両方の日付を変更してAPI呼び出しを1回にする 🟡
      fireEvent.change(startDateInput, { target: { value: '2025-01-01' } });
      fireEvent.change(endDateInput, { target: { value: '2025-01-31' } });

      // 【検証項目】: API呼び出しが再実行される（2025年1月） 🔵
      // 【注意】: useEffectによる自動呼び出しのため、最後の呼び出しを確認
      await waitFor(
        () => {
          expect(apiClient.get).toHaveBeenCalledWith(
            '/statistics?startDate=2025-01-01&endDate=2025-01-31'
          );
        },
        { timeout: 3000 }
      );

      // 【検証項目】: 新しい統計情報が表示される 🔵
      // 【修正】: 複数の要素に分かれたテキストを正規表現で検証 🟡
      await waitFor(() => {
        expect(screen.getByText(/総試合数.*200/)).toBeInTheDocument();
      });
    });

    it('TC-STATS-007: ローディング状態が正しく表示される', async () => {
      // 【テスト目的】: Loading Stateの表示機能を確認
      // 【テスト内容】: API呼び出し中はローディングスピナーが表示される
      // 【期待される動作】: isLoading=trueの間、ローディングスピナーが表示される
      // 🔵 信頼性レベル: REQ-502 に基づく

      // 【テストデータ準備】: API呼び出しを遅延させてローディング状態を確認
      let resolveApi: (value: StatisticsResponse) => void;
      const apiPromise = new Promise<StatisticsResponse>((resolve) => {
        resolveApi = resolve;
      });
      vi.mocked(apiClient.get).mockReturnValueOnce(apiPromise);

      render(<StatisticsDashboardPage />);

      // 【検証項目】: ローディングスピナーが表示される 🔵
      expect(screen.getByRole('status')).toBeInTheDocument();

      // 【検証項目】: 統計情報は表示されない 🔵
      expect(screen.queryByText(/総試合数/)).not.toBeInTheDocument();

      // APIレスポンスを返す
      resolveApi!({
        overall: { totalGames: 150, wins: 98, losses: 52, winRate: 65.3 },
        byMyDeck: [],
        byOpponentDeck: [],
        byRank: [],
        byTurn: {
          先攻: { totalGames: 0, wins: 0, losses: 0, winRate: 0 },
          後攻: { totalGames: 0, wins: 0, losses: 0, winRate: 0 },
        },
        opponentDeckDistribution: [],
        dateRange: { startDate: '2025-11-01', endDate: '2025-11-09' },
      });

      // 【検証項目】: ローディング終了後、統計情報が表示される 🔵
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
        expect(screen.getByText(/総試合数.*150/)).toBeInTheDocument();
      });
    });

    it('TC-STATS-008: データが0件の場合に「データなし」メッセージが表示される', async () => {
      // 【テスト目的】: Empty Stateの表示機能を確認
      // 【テスト内容】: 選択期間にデータが0件の場合、「データなし」メッセージが表示される
      // 【期待される動作】: overall.totalGames=0の場合、データなしメッセージが表示される
      // 🔵 信頼性レベル: REQ-405 に基づく

      // 【テストデータ準備】: 選択期間に対戦履歴が存在しない状態
      const mockStatistics: StatisticsResponse = {
        overall: { totalGames: 0, wins: 0, losses: 0, winRate: 0 },
        byMyDeck: [],
        byOpponentDeck: [],
        byRank: [],
        byTurn: {
          先攻: { totalGames: 0, wins: 0, losses: 0, winRate: 0 },
          後攻: { totalGames: 0, wins: 0, losses: 0, winRate: 0 },
        },
        opponentDeckDistribution: [],
        dateRange: { startDate: '2025-11-01', endDate: '2025-11-09' },
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockStatistics);

      render(<StatisticsDashboardPage />);

      // 【検証項目】: 「指定期間にデータがありません」のメッセージが表示される 🔵
      await waitFor(() => {
        expect(screen.getByText(/指定期間にデータがありません/)).toBeInTheDocument();
      });

      // 【検証項目】: 統計テーブルは表示されない 🔵
      expect(screen.queryByText(/デッキ別統計/)).not.toBeInTheDocument();
    });

    it('TC-STATS-009: 期間選択のデフォルト値が正しく設定される', async () => {
      // 【テスト目的】: PeriodSelectorコンポーネントの初期値設定を確認
      // 【テスト内容】: 期間選択フォームのデフォルト値が過去7日間に設定される
      // 【期待される動作】: startDate=今日から7日前、endDate=今日の日付が初期値として設定される
      // 🟡 信頼性レベル: 一般的なUX要件から推測

      // 【テストデータ準備】: モックAPIレスポンスを用意
      const mockStatistics: StatisticsResponse = {
        overall: { totalGames: 150, wins: 98, losses: 52, winRate: 65.3 },
        byMyDeck: [],
        byOpponentDeck: [],
        byRank: [],
        byTurn: {
          先攻: { totalGames: 0, wins: 0, losses: 0, winRate: 0 },
          後攻: { totalGames: 0, wins: 0, losses: 0, winRate: 0 },
        },
        opponentDeckDistribution: [],
        dateRange: { startDate: '2025-11-01', endDate: '2025-11-09' },
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockStatistics);

      render(<StatisticsDashboardPage />);

      // 【検証項目】: startDate input要素のvalue属性が今日から7日前の日付（YYYY-MM-DD形式） 🟡
      const today = new Date().toISOString().split('T')[0];
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      await waitFor(() => {
        const startDateInput = screen.getByLabelText('開始日') as HTMLInputElement;
        expect(startDateInput.value).toBe(sevenDaysAgo);
      });

      // 【検証項目】: endDate input要素のvalue属性が今日の日付（YYYY-MM-DD形式） 🟡
      const endDateInput = screen.getByLabelText('終了日') as HTMLInputElement;
      expect(endDateInput.value).toBe(today);
    });

    it('TC-STATS-010: API呼び出しが正しいクエリパラメータで実行される', async () => {
      // 【テスト目的】: API呼び出し時のクエリパラメータ構築を確認
      // 【テスト内容】: 期間選択後、正しいクエリパラメータでAPI呼び出しが実行される
      // 【期待される動作】: startDate, endDateがクエリパラメータとして正しく渡される
      // 🔵 信頼性レベル: TASK-0010 API仕様に基づく

      // 【テストデータ準備】: 初回API呼び出し用と2回目API呼び出し用のモックデータを用意
      const mockStatistics: StatisticsResponse = {
        overall: { totalGames: 150, wins: 98, losses: 52, winRate: 65.3 },
        byMyDeck: [],
        byOpponentDeck: [],
        byRank: [],
        byTurn: {
          先攻: { totalGames: 0, wins: 0, losses: 0, winRate: 0 },
          後攻: { totalGames: 0, wins: 0, losses: 0, winRate: 0 },
        },
        opponentDeckDistribution: [],
        dateRange: { startDate: '2025-02-01', endDate: '2025-02-28' },
      };

      vi.mocked(apiClient.get)
        .mockResolvedValueOnce(mockStatistics)
        .mockResolvedValueOnce(mockStatistics);

      render(<StatisticsDashboardPage />);

      // 初回表示を待つ
      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalled();
      });

      // 【実際の処理実行】: 開始日・終了日を変更して検索ボタンをクリック
      // 【処理内容】: 2025年2月の1ヶ月間の統計を確認
      const startDateInput = screen.getByLabelText('開始日');
      const endDateInput = screen.getByLabelText('終了日');
      const searchButton = screen.getByRole('button', { name: '検索' });

      fireEvent.change(startDateInput, { target: { value: '2025-02-01' } });
      fireEvent.change(endDateInput, { target: { value: '2025-02-28' } });
      fireEvent.click(searchButton);

      // 【検証項目】: API呼び出しが正しいクエリパラメータで実行される 🔵
      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith(
          '/statistics?startDate=2025-02-01&endDate=2025-02-28'
        );
      });
    });
  });
});

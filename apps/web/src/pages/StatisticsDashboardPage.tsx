/**
 * 🔵 REQ-201, REQ-202, REQ-203: Statistics Dashboard Page
 *
 * 【機能概要】: 統計ダッシュボードページ - 対戦履歴の集計・分析を表示
 * 【主要機能】:
 *   - 期間選択機能（デフォルト: 過去7日間）
 *   - 全体統計、デッキ別統計、ランク帯別統計、先攻後攻別統計の表示
 *   - ローディング状態、エラー状態、空データ状態の管理
 * 【設計方針】:
 *   - Zustand (useStatisticsStore) による状態管理
 *   - useEffect による自動データ取得（期間変更時に即座に反映）
 *   - コンポーネント分離による関心の分離とテスト容易性の確保
 * 【パフォーマンス考慮】:
 *   - API 呼び出しは useEffect で管理（必要最小限の呼び出し）
 *   - 条件付きレンダリングによる不要な描画の削減
 */

import { useCallback, useEffect, useState } from 'react';
import { BattleLogDialog } from '../components/battle-log/BattleLogDialog';
import { DeckStatsTable } from '../components/statistics/DeckStatsTable';
import { EmptyState } from '../components/statistics/EmptyState';
import { StatisticsError } from '../components/statistics/Error';
import { Loading } from '../components/statistics/Loading';
import { OpponentClassPieChart } from '../components/statistics/OpponentClassPieChart';
import { OpponentDeckPieChart } from '../components/statistics/OpponentDeckPieChart';
import { OverallStats } from '../components/statistics/OverallStats';
import { PeriodSelector } from '../components/statistics/PeriodSelector';
import { RankStatsTable } from '../components/statistics/RankStatsTable';
import { SeasonSelector } from '../components/statistics/SeasonSelector';
import { TurnStats } from '../components/statistics/TurnStats';
import { useStatisticsStore } from '../store/statisticsStore';

/**
 * 🔵 REQ-201: Statistics Dashboard Page Component
 *
 * 統計情報を表示するページコンポーネント
 */
export function StatisticsDashboardPage() {
  // 🔵 Zustand Store: useStatisticsStoreを使用して状態管理を統一
  const {
    statistics,
    isLoading,
    error,
    startDate,
    endDate,
    selectedSeason,
    availableSeasons,
    isSeasonsLoading,
    fetchStatisticsByDateRange,
    fetchSeasons,
    setStartDate,
    setEndDate,
  } = useStatisticsStore();

  // 🔵 ローカル状態: シーズン初期化完了フラグ
  const [isSeasonInitialized, setIsSeasonInitialized] = useState<boolean>(false);
  // 🔵 TASK-0029: 対戦履歴登録ダイアログの開閉状態
  const [isBattleLogDialogOpen, setIsBattleLogDialogOpen] = useState<boolean>(false);

  /**
   * 【初期化処理】: シーズン一覧と最新シーズンを取得して設定
   * 🔵 REQ-202: 統計ダッシュボードのデフォルト表示
   * 🔵 TASK-0028: シーズン選択UI実装
   * 【実行タイミング】: コンポーネント初回マウント時（依存配列が空のため1回のみ）
   * 【設計意図】: シーズン一覧を取得してドロップダウン表示、最新シーズンをデフォルト選択
   */
  useEffect(() => {
    const initializeSeasons = async () => {
      await fetchSeasons();
      setIsSeasonInitialized(true);
    };
    initializeSeasons();
  }, [fetchSeasons]);

  /**
   * 【統計データ取得関数】: Backend API から統計情報を取得（Store経由）
   * 🔵 REQ-203: 統計情報の表示機能
   * 【機能概要】: Store のfetchStatisticsByDateRangeを使用してデータ取得
   */
  const fetchStatistics = useCallback(() => {
    fetchStatisticsByDateRange({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      season: selectedSeason || undefined,
    });
  }, [fetchStatisticsByDateRange, startDate, endDate, selectedSeason]);

  /**
   * 【フィルタ変更時の自動データ取得】: 日付またはシーズンが変更されたら統計を再取得
   * 🔵 REQ-202: 期間選択機能
   */
  useEffect(() => {
    // 【初期化待機】: シーズンの初期化が完了するまで統計取得をスキップ
    if (!isSeasonInitialized) return;

    // 【API呼び出し】: シーズン初期化完了後は必ず統計を取得
    fetchStatistics();
  }, [fetchStatistics, isSeasonInitialized]);

  /**
   * 【シーズン変更ハンドラ】: シーズン選択時に統計を再取得
   */
  const handleSeasonChange = useCallback(
    (season: number | undefined) => {
      fetchStatisticsByDateRange({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        season,
      });
    },
    [fetchStatisticsByDateRange, startDate, endDate]
  );

  /**
   * 【検索ボタンクリックハンドラ】: 期間選択フォームの「検索」ボタン処理
   * 【設計意図】: 明示的な再取得を実行
   */
  const handleSearch = useCallback(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  /**
   * 【再試行ハンドラ】: エラー時の「再試行」ボタン処理
   * 🔵 エラーハンドリング: ネットワークエラーやサーバーエラーからの復旧機能
   */
  const handleRetry = useCallback(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  /**
   * 🔵 TASK-0029: 対戦履歴登録ダイアログを開く
   * 【機能概要】: 「対戦を記録」ボタンクリック時にダイアログを開く
   */
  const handleOpenBattleLogDialog = useCallback(() => {
    setIsBattleLogDialogOpen(true);
  }, []);

  /**
   * 🔵 TASK-0029: 対戦履歴登録ダイアログを閉じる
   * 【機能概要】: ダイアログのキャンセルまたはオーバーレイクリック時にダイアログを閉じる
   */
  const handleCloseBattleLogDialog = useCallback(() => {
    setIsBattleLogDialogOpen(false);
  }, []);

  /**
   * 🔵 TASK-0029: 対戦履歴登録成功時のハンドラ
   * 【機能概要】: 登録成功後に統計データを再取得
   */
  const handleBattleLogSaved = useCallback(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* 🔵 ページヘッダー + TASK-0029: 対戦を記録ボタン */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">統計ダッシュボード</h2>
        <button
          type="button"
          onClick={handleOpenBattleLogDialog}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          対戦を記録
        </button>
      </div>

      {/* 🔵 REQ-202: 期間選択フォーム */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <PeriodSelector
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onSearch={handleSearch}
            isLoading={isLoading}
          />

          {/* 🔵 TASK-0028: シーズンフィルタ（ドロップダウン表示） */}
          <SeasonSelector
            season={selectedSeason ?? undefined}
            onSeasonChange={handleSeasonChange}
            isLoading={isLoading}
            availableSeasons={availableSeasons}
            isSeasonsLoading={isSeasonsLoading}
          />
        </div>
      </div>

      {/* 🔵 REQ-502: ローディング状態 */}
      {isLoading && <Loading />}

      {/* 🔵 エラー状態 */}
      {!isLoading && error && <StatisticsError message={error} onRetry={handleRetry} />}

      {/* 🔵 REQ-405: データなし状態 + TASK-0029: 最初の対戦を記録するボタン */}
      {!isLoading && !error && statistics && statistics.overall.totalGames === 0 && (
        <EmptyState onRecordBattle={handleOpenBattleLogDialog} />
      )}

      {/* 🔵 REQ-203: 統計情報表示 */}
      {!isLoading && !error && statistics && statistics.overall.totalGames > 0 && (
        <div className="space-y-6">
          {/* === グラフィカルエリア（優先表示） === */}

          {/* 🔵 全体統計（勝率ゲージ） */}
          <OverallStats stats={statistics.overall} />

          {/* 🔵 先攻後攻別統計（棒グラフ） */}
          <TurnStats turnStats={statistics.byTurn} />

          {/* 🔵 相手クラス分布（円グラフ） */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold mb-4 text-center text-gray-800">相手クラス分布</h3>
            <OpponentClassPieChart data={statistics.byOpponentClass} />
          </div>

          {/* 🔵 相手デッキ分布（円グラフ） */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold mb-4 text-center text-gray-800">相手デッキ分布</h3>
            <OpponentDeckPieChart data={statistics.byOpponentDeck} />
          </div>

          {/* === テーブルエリア（下部に配置、削除しやすく） === */}
          <div className="border-t-2 border-gray-200 pt-6 mt-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-600">詳細統計（テーブル）</h3>

            {/* 🔵 デッキ別統計（マイデッキ） */}
            <DeckStatsTable title="マイデッキ別統計" deckStats={statistics.byMyDeck} />

            {/* 🔵 デッキ別統計（相手デッキ） */}
            <DeckStatsTable title="相手デッキ別統計" deckStats={statistics.byOpponentDeck} />

            {/* 🔵 ランク帯別統計 */}
            <RankStatsTable rankStats={statistics.byRank} />
          </div>
        </div>
      )}

      {/* 🔵 TASK-0029: 対戦履歴登録ダイアログ */}
      <BattleLogDialog
        isOpen={isBattleLogDialogOpen}
        onClose={handleCloseBattleLogDialog}
        onSaved={handleBattleLogSaved}
        defaultSeason={selectedSeason ?? undefined}
      />
    </div>
  );
}

/**
 * 🔵 REQ-201, REQ-202, REQ-203: Statistics Dashboard Page
 *
 * 【機能概要】: 統計ダッシュボードページ - 対戦履歴の集計・分析を表示
 * 【リファクタリング】: Issue 004対応 - ロジックをuseStatisticsDashboardフックに分離
 * 【主要機能】:
 *   - 期間選択機能（デフォルト: 過去7日間）
 *   - 全体統計、デッキ別統計、ランク帯別統計、先攻後攻別統計の表示
 *   - ローディング状態、エラー状態、空データ状態の管理
 */

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
import { useStatisticsDashboard } from '../hooks/useStatisticsDashboard';

/**
 * 🔵 REQ-201: Statistics Dashboard Page Component
 *
 * 統計情報を表示するページコンポーネント
 */
export function StatisticsDashboardPage() {
  const {
    statistics,
    isLoading,
    error,
    startDate,
    endDate,
    selectedSeason,
    availableSeasons,
    isSeasonsLoading,
    setStartDate,
    setEndDate,
    handleSeasonChange,
    handleSearch,
    handleRetry,
    isBattleLogDialogOpen,
    handleOpenBattleLogDialog,
    handleCloseBattleLogDialog,
    handleBattleLogSaved,
  } = useStatisticsDashboard();

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

          {/* 🔵 TASK-0028: シーズンフィルタ */}
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

      {/* 🔵 REQ-405: データなし状態 */}
      {!isLoading && !error && statistics && statistics.overall.totalGames === 0 && (
        <EmptyState onRecordBattle={handleOpenBattleLogDialog} />
      )}

      {/* 🔵 REQ-203: 統計情報表示 */}
      {!isLoading && !error && statistics && statistics.overall.totalGames > 0 && (
        <StatisticsContent statistics={statistics} />
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

// ==================== サブコンポーネント ====================

/**
 * 統計コンテンツ表示コンポーネント
 */
function StatisticsContent({
  statistics,
}: {
  statistics: NonNullable<ReturnType<typeof useStatisticsDashboard>['statistics']>;
}) {
  return (
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

      {/* === テーブルエリア（下部に配置） === */}
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
  );
}

/**
 * 🔵 REQ-201, REQ-202, REQ-203: Statistics Dashboard Page
 *
 * 統計ダッシュボードページ - 対戦履歴の集計・分析を表示
 * - 期間選択機能（デフォルト: 過去7日間）
 * - 全体統計、デッキ別統計、ランク帯別統計、先攻後攻別統計の表示
 * - ローディング状態、エラー状態、空データ状態の管理
 */

import { useEffect, useState } from 'react';
import { apiClient, extractErrorMessage } from '../api/client';
import type { StatisticsResponse } from '../types';
import { DeckStatsTable } from '../components/statistics/DeckStatsTable';
import { EmptyState } from '../components/statistics/EmptyState';
import { Error } from '../components/statistics/Error';
import { Loading } from '../components/statistics/Loading';
import { OverallStats } from '../components/statistics/OverallStats';
import { PeriodSelector } from '../components/statistics/PeriodSelector';
import { RankStatsTable } from '../components/statistics/RankStatsTable';
import { TurnStats } from '../components/statistics/TurnStats';

/**
 * 🔵 REQ-201: Statistics Dashboard Page Component
 *
 * 統計情報を表示するページコンポーネント
 */
export function StatisticsDashboardPage() {
  // 🔵 State管理: 期間選択、統計データ、ローディング状態、エラー状態
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [statistics, setStatistics] = useState<StatisticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 🔵 REQ-202: デフォルト期間の設定（過去7日間）
  // 🟡 初回マウント時に実行（依存配列が空のため1回のみ実行）
  useEffect(() => {
    // 🔵 今日の日付を取得（YYYY-MM-DD形式）
    const today = new Date().toISOString().split('T')[0];

    // 🔵 7日前の日付を計算（YYYY-MM-DD形式）
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    // 🔵 State更新: デフォルト期間を設定
    setStartDate(sevenDaysAgo);
    setEndDate(today);
  }, []);

  /**
   * 🔵 統計データ取得関数
   *
   * Backend API（GET /api/statistics）から統計情報を取得
   * - ローディング状態の管理
   * - エラーハンドリング
   * - レスポンスのState反映
   */
  const fetchStatistics = async () => {
    // 🔵 ローディング開始
    setIsLoading(true);
    setError(null);

    try {
      // 🔵 API呼び出し: GET /api/statistics?startDate=...&endDate=...
      const data = await apiClient.get<StatisticsResponse>(
        `/statistics?startDate=${startDate}&endDate=${endDate}`,
      );

      // 🔵 成功時: 統計データをStateに保存
      setStatistics(data);
    } catch (err) {
      // 🔵 エラー時: エラーメッセージを抽出してStateに保存
      setError(extractErrorMessage(err, 'ネットワークエラーが発生しました'));
    } finally {
      // 🔵 ローディング終了
      setIsLoading(false);
    }
  };

  // 🔵 期間が変更されたら統計データを再取得
  // 🟡 startDateまたはendDateが変更されたら実行
  useEffect(() => {
    // 🔵 両方の日付が設定されている場合のみAPI呼び出し
    if (startDate && endDate) {
      fetchStatistics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  /**
   * 🔵 検索ボタンクリックハンドラ
   *
   * PeriodSelectorコンポーネントからの検索リクエストを処理
   * （useEffectで自動実行されるため、実際には何もしない）
   */
  const handleSearch = () => {
    // 🟡 useEffectで自動的にfetchStatisticsが呼ばれるため、ここでは何もしない
    // 🟡 将来的にバリデーションロジックを追加する可能性あり
  };

  /**
   * 🔵 再試行ハンドラ
   *
   * エラー時に「再試行」ボタンから呼ばれる
   */
  const handleRetry = () => {
    fetchStatistics();
  };

  return (
    <div>
      {/* 🔵 ページヘッダー */}
      <h2 className="text-xl font-bold mb-4">統計ダッシュボード</h2>

      {/* 🔵 REQ-202: 期間選択フォーム */}
      <PeriodSelector
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onSearch={handleSearch}
        isLoading={isLoading}
      />

      {/* 🔵 REQ-502: ローディング状態 */}
      {isLoading && <Loading />}

      {/* 🔵 エラー状態 */}
      {!isLoading && error && <Error message={error} onRetry={handleRetry} />}

      {/* 🔵 REQ-405: データなし状態 */}
      {!isLoading && !error && statistics && statistics.overall.totalGames === 0 && (
        <EmptyState />
      )}

      {/* 🔵 REQ-203: 統計情報表示 */}
      {!isLoading && !error && statistics && statistics.overall.totalGames > 0 && (
        <div>
          {/* 🔵 全体統計 */}
          <OverallStats stats={statistics.overall} />

          {/* 🔵 デッキ別統計（マイデッキ） */}
          <DeckStatsTable title="マイデッキ別統計" deckStats={statistics.byMyDeck} />

          {/* 🔵 デッキ別統計（相手デッキ） */}
          <DeckStatsTable
            title="相手デッキ別統計"
            deckStats={statistics.byOpponentDeck}
          />

          {/* 🔵 ランク帯別統計 */}
          <RankStatsTable rankStats={statistics.byRank} />

          {/* 🔵 先攻後攻別統計 */}
          <TurnStats turnStats={statistics.byTurn} />
        </div>
      )}
    </div>
  );
}

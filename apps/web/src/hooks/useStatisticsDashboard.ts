/**
 * 【機能概要】: StatisticsDashboardPageの状態管理を行うカスタムフック
 * 【実装方針】: 統計データ取得、フィルタ管理、ダイアログ制御を一元管理
 * 【リファクタリング】: Issue 004対応 - StatisticsDashboardPageからロジックを分離
 * 🔵 信頼性レベル: REQ-201, REQ-202, REQ-203に基づく
 */

import { useCallback, useEffect, useState } from 'react';
import { useStatisticsStore } from '../store/statisticsStore';

/**
 * 【型定義】: カスタムフックの戻り値
 */
export interface UseStatisticsDashboardReturn {
  // 統計データ
  statistics: ReturnType<typeof useStatisticsStore>['statistics'];
  isLoading: boolean;
  error: string | null;

  // フィルタ状態
  startDate: string | null;
  endDate: string | null;
  selectedSeason: number | null;
  availableSeasons: number[];
  isSeasonsLoading: boolean;

  // フィルタ変更ハンドラ
  setStartDate: (date: string | null) => void;
  setEndDate: (date: string | null) => void;
  handleSeasonChange: (season: number | undefined) => void;
  handleSearch: () => void;
  handleRetry: () => void;

  // ダイアログ状態
  isBattleLogDialogOpen: boolean;
  handleOpenBattleLogDialog: () => void;
  handleCloseBattleLogDialog: () => void;
  handleBattleLogSaved: () => void;
}

/**
 * 【機能概要】: StatisticsDashboardPageの状態管理を行うカスタムフック
 * 🔵 信頼性レベル: REQ-201, REQ-202, REQ-203に基づく
 */
export function useStatisticsDashboard(): UseStatisticsDashboardReturn {
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
   */
  useEffect(() => {
    const initializeSeasons = async () => {
      await fetchSeasons();
      setIsSeasonInitialized(true);
    };
    initializeSeasons();
  }, [fetchSeasons]);

  /**
   * 【統計データ取得関数】: Backend API から統計情報を取得
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
   */
  useEffect(() => {
    if (!isSeasonInitialized) return;
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
   * 【検索ボタンクリックハンドラ】
   */
  const handleSearch = useCallback(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  /**
   * 【再試行ハンドラ】: エラー時の「再試行」ボタン処理
   */
  const handleRetry = useCallback(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  /**
   * 🔵 TASK-0029: 対戦履歴登録ダイアログを開く
   */
  const handleOpenBattleLogDialog = useCallback(() => {
    setIsBattleLogDialogOpen(true);
  }, []);

  /**
   * 🔵 TASK-0029: 対戦履歴登録ダイアログを閉じる
   */
  const handleCloseBattleLogDialog = useCallback(() => {
    setIsBattleLogDialogOpen(false);
  }, []);

  /**
   * 🔵 TASK-0029: 対戦履歴登録成功時のハンドラ
   */
  const handleBattleLogSaved = useCallback(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return {
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
  };
}

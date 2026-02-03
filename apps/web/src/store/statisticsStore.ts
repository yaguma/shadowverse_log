import { create } from 'zustand';
import { apiClient, extractErrorMessage } from '../api/client';
import {
  fetchAvailableSeasons,
  fetchStatisticsBySeason as fetchStatisticsBySeasonApi,
} from '../api/statistics';
import type { StatisticsResponse } from '../types';

/**
 * 【機能概要】: 統計データの状態管理を行うZustandストア
 * 【実装方針】: Zustandのcreate関数を使用してストアを作成し、API Clientと連携
 * 【テスト対応】: TC-STORE-ST-001〜TC-STORE-ST-020の全20ケースを通すための実装
 * 🔵 信頼性レベル: 要件定義書のStatisticsStore仕様とテストケース定義に基づいた実装
 * 🔵 TASK-0027: シーズン選択機能（fetchSeasons, setSelectedSeason, fetchStatisticsBySeason）追加
 */

/**
 * 期間タイプの定義
 */
export type PeriodType = '1week' | '1month' | 'all' | 'custom';

/**
 * 統計取得リクエストの型
 */
export interface GetStatisticsRequest {
  period: PeriodType;
  startDate?: string;
  endDate?: string;
}

/**
 * 日付範囲とシーズンによる統計取得リクエストの型
 */
export interface GetStatisticsByDateRangeRequest {
  startDate?: string;
  endDate?: string;
  season?: number;
}

/**
 * Statistics Storeの状態型
 * 【型定義】: Zustandストアの状態とアクションを定義
 * 🔵 信頼性レベル: 要件定義書のStatisticsStore仕様に準拠
 */
interface StatisticsState {
  // 【データ状態】: 統計データを保持 🔵
  statistics: StatisticsResponse | null;

  // 【UI状態】: ローディング状態とエラー状態を保持 🔵
  isLoading: boolean;
  error: string | null;

  // 【期間状態】: 現在選択されている期間を保持 🔵
  currentPeriod: PeriodType;

  // 【日付範囲状態】: カスタム日付範囲を保持（nullの場合は未指定） 🔵
  startDate: string | null;
  endDate: string | null;

  // 【シーズン状態】: シーズン選択機能の状態を保持 (TASK-0027) 🔵
  selectedSeason: number | null;
  availableSeasons: number[];
  isSeasonsLoading: boolean;

  // 【アクション】: データ取得・設定アクションを定義 🔵
  fetchStatistics: (params: GetStatisticsRequest) => Promise<void>;
  fetchStatisticsByDateRange: (params: GetStatisticsByDateRangeRequest) => Promise<void>;
  setPeriod: (period: PeriodType) => void;
  setStartDate: (date: string | null) => void;
  setEndDate: (date: string | null) => void;
  clearError: () => void;

  // 【シーズンアクション】: シーズン関連アクションを定義 (TASK-0027) 🔵
  fetchSeasons: () => Promise<void>;
  setSelectedSeason: (season: number) => Promise<void>;
  fetchStatisticsBySeason: (season: number) => Promise<void>;
}

/**
 * Statistics Storeの作成
 * 【Zustandストア定義】: create関数でストアを作成
 * 🔵 信頼性レベル: Zustand公式ドキュメントの推奨パターンに準拠
 */
export const useStatisticsStore = create<StatisticsState>((set) => ({
  // 【初期状態】: ストアの初期値を設定 🔵
  statistics: null,
  isLoading: false,
  error: null,
  currentPeriod: '1week',

  // 【日付範囲初期状態】: nullは未指定を表す 🔵
  startDate: null,
  endDate: null,

  // 【シーズン初期状態】: (TASK-0027) 🔵
  selectedSeason: null,
  availableSeasons: [],
  isSeasonsLoading: false,

  /**
   * 【機能概要】: 統計データを取得
   * 【実装方針】: API Clientを使用してBackend APIから統計データを取得し、ストアの状態を更新
   * 【テスト対応】: TC-STORE-ST-001, TC-STORE-ST-002, TC-STORE-ST-003を通すための実装
   * 🔵 信頼性レベル: 要件定義書のfetchStatistics仕様に準拠
   */
  fetchStatistics: async (params: GetStatisticsRequest) => {
    // 【ローディング開始】: isLoadingをtrueに設定し、errorをnullにクリア 🔵
    set({ isLoading: true, error: null });

    try {
      // 【クエリパラメータ構築】: 期間パラメータをクエリ文字列に変換 🔵
      const queryParams = new URLSearchParams();
      queryParams.set('period', params.period);
      if (params.startDate) queryParams.set('startDate', params.startDate);
      if (params.endDate) queryParams.set('endDate', params.endDate);

      // 【API呼び出し】: API Clientのget()メソッドで統計データを取得 🔵
      const response = await apiClient.get<StatisticsResponse>(
        `/statistics?${queryParams.toString()}`
      );

      // 【状態更新】: statisticsを更新し、isLoadingをfalseに設定 🔵
      set({ statistics: response, isLoading: false, currentPeriod: params.period });
    } catch (error) {
      // 【エラーハンドリング】: エラーメッセージを設定し、isLoadingをfalseに設定 🔵
      const errorMessage = extractErrorMessage(error);
      set({
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  /**
   * 【機能概要】: 日付範囲とシーズンを指定して統計データを取得
   * 【実装方針】: API Clientを使用してBackend APIから統計データを取得し、ストアの状態を更新
   * 🔵 信頼性レベル: StatisticsDashboardPageとの統合用
   */
  fetchStatisticsByDateRange: async (params: GetStatisticsByDateRangeRequest) => {
    // 【ローディング開始】: isLoadingをtrueに設定し、errorをnullにクリア 🔵
    set({ isLoading: true, error: null });

    try {
      // 【クエリパラメータ構築】: 日付範囲とシーズンをクエリ文字列に変換 🔵
      const queryParams: string[] = [];
      if (params.startDate) queryParams.push(`startDate=${params.startDate}`);
      if (params.endDate) queryParams.push(`endDate=${params.endDate}`);
      if (params.season) queryParams.push(`season=${params.season}`);
      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

      // 【API呼び出し】: API Clientのget()メソッドで統計データを取得 🔵
      const response = await apiClient.get<StatisticsResponse>(`/statistics${queryString}`);

      // 【状態更新】: statisticsを更新し、isLoadingをfalseに設定 🔵
      set({
        statistics: response,
        isLoading: false,
        startDate: params.startDate || '',
        endDate: params.endDate || '',
        selectedSeason: params.season || null,
      });
    } catch (error) {
      // 【エラーハンドリング】: エラーメッセージを設定し、isLoadingをfalseに設定 🔵
      const errorMessage = extractErrorMessage(error);
      set({
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  /**
   * 【機能概要】: 期間を設定
   * 【実装方針】: currentPeriodを直接更新する同期処理
   * 【テスト対応】: TC-STORE-ST-004, TC-STORE-ST-005を通すための実装
   * 🔵 信頼性レベル: 要件定義書のsetPeriod仕様に準拠
   */
  setPeriod: (period: PeriodType) => {
    // 【期間更新】: 引数のperiodをcurrentPeriodに設定 🔵
    set({ currentPeriod: period });
  },

  /**
   * 【機能概要】: 開始日を設定
   * 【実装方針】: startDateを直接更新する同期処理
   * 🔵 信頼性レベル: StatisticsDashboardPageとの統合用
   */
  setStartDate: (date: string | null) => {
    set({ startDate: date });
  },

  /**
   * 【機能概要】: 終了日を設定
   * 【実装方針】: endDateを直接更新する同期処理
   * 🔵 信頼性レベル: StatisticsDashboardPageとの統合用
   */
  setEndDate: (date: string | null) => {
    set({ endDate: date });
  },

  /**
   * 【機能概要】: エラー状態をクリア
   * 【実装方針】: errorをnullに設定する同期処理
   * 【テスト対応】: TC-STORE-ST-006を通すための実装
   * 🔵 信頼性レベル: 要件定義書のclearError仕様に準拠
   */
  clearError: () => {
    // 【エラークリア】: errorをnullに設定 🔵
    set({ error: null });
  },

  /**
   * 【機能概要】: シーズン一覧を取得
   * 【実装方針】: Statistics APIを使用してシーズン一覧を取得し、最新シーズンを自動選択
   * 【テスト対応】: TC-STORE-ST-007〜TC-STORE-ST-010を通すための実装
   * 🔵 信頼性レベル: TASK-0027要件に基づく
   */
  fetchSeasons: async () => {
    // 【ローディング開始】: isSeasonsLoadingをtrueに設定 🔵
    set({ isSeasonsLoading: true, error: null });

    try {
      // 【API呼び出し】: シーズン一覧を取得 🔵
      const seasons = await fetchAvailableSeasons();

      // 【状態更新】: シーズン一覧と選択中シーズンを更新 🔵
      // 最新シーズン（配列の先頭）を自動選択。空の場合はnull
      const latestSeason = seasons.length > 0 ? seasons[0] : null;
      set({
        availableSeasons: seasons,
        selectedSeason: latestSeason,
        isSeasonsLoading: false,
      });
    } catch (error) {
      // 【エラーハンドリング】: エラーメッセージを設定 🔵
      const errorMessage = extractErrorMessage(error);
      set({
        error: errorMessage,
        isSeasonsLoading: false,
      });
    }
  },

  /**
   * 【機能概要】: シーズンを選択
   * 【実装方針】: 選択したシーズンを設定し、統計データを再取得
   * 【テスト対応】: TC-STORE-ST-011〜TC-STORE-ST-012を通すための実装
   * 🔵 信頼性レベル: TASK-0027要件に基づく
   */
  setSelectedSeason: async (season: number) => {
    // 【ローディング開始】: isLoadingをtrueに設定 🔵
    set({ isLoading: true, error: null, selectedSeason: season });

    try {
      // 【API呼び出し】: 指定シーズンの統計を取得 🔵
      await fetchStatisticsBySeasonApi(season);

      // 【状態更新】: ローディング終了 🔵
      set({ isLoading: false });
    } catch (error) {
      // 【エラーハンドリング】: エラーメッセージを設定 🔵
      const errorMessage = extractErrorMessage(error);
      set({
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  /**
   * 【機能概要】: 指定シーズンの統計データを取得
   * 【実装方針】: Statistics APIを使用して指定シーズンの統計を取得
   * 【テスト対応】: TC-STORE-ST-013〜TC-STORE-ST-014を通すための実装
   * 🔵 信頼性レベル: TASK-0027要件に基づく
   */
  fetchStatisticsBySeason: async (season: number) => {
    // 【ローディング開始】: isLoadingをtrueに設定 🔵
    set({ isLoading: true, error: null });

    try {
      // 【API呼び出し】: 指定シーズンの統計を取得 🔵
      await fetchStatisticsBySeasonApi(season);

      // 【状態更新】: ローディング終了 🔵
      set({ isLoading: false });
    } catch (error) {
      // 【エラーハンドリング】: エラーメッセージを設定 🔵
      const errorMessage = extractErrorMessage(error);
      set({
        error: errorMessage,
        isLoading: false,
      });
    }
  },
}));

/**
 * 【セレクタ】: パフォーマンス最適化のためのセレクタ関数群 (TASK-0027)
 * 🔵 信頼性レベル: Zustandベストプラクティスに準拠
 */

/** 統計データを取得するセレクタ */
export const selectStatistics = (state: StatisticsState) => state.statistics;

/** 選択中のシーズンを取得するセレクタ */
export const selectSelectedSeason = (state: StatisticsState) => state.selectedSeason;

/** 利用可能なシーズン一覧を取得するセレクタ */
export const selectAvailableSeasons = (state: StatisticsState) => state.availableSeasons;

/** ローディング状態を取得するセレクタ */
export const selectIsLoading = (state: StatisticsState) => state.isLoading;

/** シーズン一覧ローディング状態を取得するセレクタ */
export const selectIsSeasonsLoading = (state: StatisticsState) => state.isSeasonsLoading;

/** エラー状態を取得するセレクタ */
export const selectError = (state: StatisticsState) => state.error;

/** 開始日を取得するセレクタ */
export const selectStartDate = (state: StatisticsState) => state.startDate;

/** 終了日を取得するセレクタ */
export const selectEndDate = (state: StatisticsState) => state.endDate;

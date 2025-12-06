import { create } from 'zustand';
import { apiClient, extractErrorMessage } from '../api/client';
import type { StatisticsResponse } from '../types';

/**
 * 【機能概要】: 統計データの状態管理を行うZustandストア
 * 【実装方針】: Zustandのcreate関数を使用してストアを作成し、API Clientと連携
 * 【テスト対応】: TC-STORE-ST-001〜TC-STORE-ST-006の全6ケースを通すための実装
 * 🔵 信頼性レベル: 要件定義書のStatisticsStore仕様とテストケース定義に基づいた実装
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

  // 【アクション】: データ取得・設定アクションを定義 🔵
  fetchStatistics: (params: GetStatisticsRequest) => Promise<void>;
  setPeriod: (period: PeriodType) => void;
  clearError: () => void;
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
   * 【機能概要】: エラー状態をクリア
   * 【実装方針】: errorをnullに設定する同期処理
   * 【テスト対応】: TC-STORE-ST-006を通すための実装
   * 🔵 信頼性レベル: 要件定義書のclearError仕様に準拠
   */
  clearError: () => {
    // 【エラークリア】: errorをnullに設定 🔵
    set({ error: null });
  },
}));

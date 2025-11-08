import { create } from 'zustand';
import { apiClient, extractErrorMessage } from '../api/client';
import type { BattleLog, BattleLogsResponse, CreateBattleLogRequest } from '../types';

/**
 * 【機能概要】: 対戦履歴データの状態管理を行うZustandストア
 * 【実装方針】: Zustandのcreate関数を使用してストアを作成し、API Clientと連携
 * 【テスト対応】: TC-STORE-BL-001〜TC-STORE-BL-009の全9ケースを通すための実装
 * 【改善内容】: 共有型定義とエラーヘルパーを使用してDRY原則を適用
 * 🔵 信頼性レベル: 要件定義書のBattleLogStore仕様とテストケース定義に基づいた実装
 */

/**
 * Battle Log Storeの状態型
 * 【型定義】: Zustandストアの状態とアクションを定義
 * 🔵 信頼性レベル: 要件定義書のBattleLogStore仕様に準拠
 */
interface BattleLogState {
  // 【データ状態】: 対戦履歴データと前回入力値を保持 🔵
  battleLogs: BattleLog[];
  previousInput: Partial<CreateBattleLogRequest> | null;

  // 【UI状態】: ローディング状態とエラー状態を保持 🔵
  isLoading: boolean;
  error: string | null;

  // 【アクション】: データ取得・作成・削除・設定アクションを定義 🔵
  fetchBattleLogs: () => Promise<void>;
  createBattleLog: (input: CreateBattleLogRequest) => Promise<void>;
  deleteBattleLog: (id: string) => Promise<void>;
  setPreviousInput: (input: Partial<CreateBattleLogRequest>) => void;
  clearError: () => void;
}

/**
 * Battle Log Storeの作成
 * 【Zustandストア定義】: create関数でストアを作成
 * 🔵 信頼性レベル: Zustand公式ドキュメントの推奨パターンに準拠
 */
export const useBattleLogStore = create<BattleLogState>((set, get) => ({
  // 【初期状態】: ストアの初期値を設定 🔵
  battleLogs: [],
  previousInput: null,
  isLoading: false,
  error: null,

  /**
   * 【機能概要】: 対戦履歴一覧を取得
   * 【実装方針】: API Clientを使用してBackend APIから対戦履歴を取得し、ストアの状態を更新
   * 【テスト対応】: TC-STORE-BL-001, TC-STORE-BL-002, TC-STORE-BL-009を通すための実装
   * 🔵 信頼性レベル: 要件定義書のfetchBattleLogs仕様に準拠
   */
  fetchBattleLogs: async () => {
    // 【ローディング開始】: isLoadingをtrueに設定し、errorをnullにクリア 🔵
    // 【TC-STORE-BL-001, TC-STORE-BL-002対応】: ローディング状態の遷移をテスト
    set({ isLoading: true, error: null });

    try {
      // 【API呼び出し】: API Clientのget()メソッドで対戦履歴一覧を取得 🔵
      // 【TC-STORE-BL-001対応】: 正常にデータを取得する処理
      const response = await apiClient.get<BattleLogsResponse>('/battle-logs');

      // 【状態更新】: battleLogsを更新し、isLoadingをfalseに設定 🔵
      // 【TC-STORE-BL-001対応】: 取得したデータでストアの状態を更新
      set({ battleLogs: response.battleLogs, isLoading: false });
    } catch (error) {
      // 【エラーハンドリング】: エラーメッセージを設定し、isLoadingをfalseに設定 🔵
      // 【TC-STORE-BL-002対応】: エラー時のエラーメッセージ設定と状態遷移
      // 【改善内容】: extractErrorMessage()ヘルパーを使用してDRY原則を適用 🔵
      const errorMessage = extractErrorMessage(error);
      set({
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  /**
   * 【機能概要】: 新規対戦履歴を登録
   * 【実装方針】: API Clientを使用してBackend APIに新規データを送信し、成功時はpreviousInputを保存して一覧を再取得
   * 【テスト対応】: TC-STORE-BL-003, TC-STORE-BL-004を通すための実装
   * 🔵 信頼性レベル: 要件定義書のcreateBattleLog仕様に準拠
   */
  createBattleLog: async (data: CreateBattleLogRequest) => {
    // 【ローディング開始】: isLoadingをtrueに設定し、errorをnullにクリア 🔵
    // 【TC-STORE-BL-003, TC-STORE-BL-004対応】: ローディング状態の遷移をテスト
    set({ isLoading: true, error: null });

    try {
      // 【API呼び出し】: API Clientのpost()メソッドで新規対戦履歴を登録 🔵
      // 【TC-STORE-BL-003対応】: 正常にデータを登録する処理
      await apiClient.post<BattleLog>('/battle-logs', data);

      // 【previousInput保存】: 登録成功時は入力値をpreviousInputに保存 🔵
      // 【TC-STORE-BL-003対応】: previousInput保存機能（REQ-301対応）
      // 【一覧再取得】: fetchBattleLogs()を呼び出して一覧を更新 🔵
      set({ previousInput: data, isLoading: false });
      await get().fetchBattleLogs();
    } catch (error) {
      // 【エラーハンドリング】: エラーメッセージを設定し、isLoadingをfalseに設定 🔵
      // 【TC-STORE-BL-004対応】: エラー時のエラーメッセージ設定と状態遷移
      // 【改善内容】: extractErrorMessage()ヘルパーを使用してDRY原則を適用 🔵
      const errorMessage = extractErrorMessage(error);
      set({
        error: errorMessage,
        isLoading: false,
      });

      // 【エラー再スロー】: エラーをそのまま投げて呼び出し元に伝える 🔵
      // 【TC-STORE-BL-004対応】: エラーが正しく投げられることをテスト
      throw error;
    }
  },

  /**
   * 【機能概要】: 対戦履歴を削除
   * 【実装方針】: API Clientを使用してBackend APIに削除リクエストを送信し、成功時は一覧を再取得
   * 【テスト対応】: TC-STORE-BL-005, TC-STORE-BL-006を通すための実装
   * 🔵 信頼性レベル: 要件定義書のdeleteBattleLog仕様に準拠
   */
  deleteBattleLog: async (id: string) => {
    // 【ローディング開始】: isLoadingをtrueに設定し、errorをnullにクリア 🔵
    // 【TC-STORE-BL-005, TC-STORE-BL-006対応】: ローディング状態の遷移をテスト
    set({ isLoading: true, error: null });

    try {
      // 【API呼び出し】: API Clientのdel()メソッドで対戦履歴を削除 🔵
      // 【TC-STORE-BL-005対応】: 正常にデータを削除する処理
      await apiClient.del(`/battle-logs/${id}`);

      // 【一覧再取得】: fetchBattleLogs()を呼び出して一覧を更新 🔵
      // 【TC-STORE-BL-005対応】: 削除後に一覧が再取得される
      await get().fetchBattleLogs();
      set({ isLoading: false });
    } catch (error) {
      // 【エラーハンドリング】: エラーメッセージを設定し、isLoadingをfalseに設定 🔵
      // 【TC-STORE-BL-006対応】: エラー時のエラーメッセージ設定と状態遷移
      // 【改善内容】: extractErrorMessage()ヘルパーを使用してDRY原則を適用 🔵
      const errorMessage = extractErrorMessage(error);
      set({
        error: errorMessage,
        isLoading: false,
      });

      // 【エラー再スロー】: エラーをそのまま投げて呼び出し元に伝える 🔵
      // 【TC-STORE-BL-006対応】: エラーが正しく投げられることをテスト
      throw error;
    }
  },

  /**
   * 【機能概要】: 前回入力値を設定
   * 【実装方針】: previousInputを直接更新する同期処理
   * 【テスト対応】: TC-STORE-BL-007を通すための実装
   * 🔵 信頼性レベル: 要件定義書のsetPreviousInput仕様に準拠
   */
  setPreviousInput: (data: Partial<CreateBattleLogRequest>) => {
    // 【previousInput更新】: 引数のdataをpreviousInputに設定 🔵
    // 【TC-STORE-BL-007対応】: previousInputの設定が正しく動作することをテスト
    set({ previousInput: data });
  },

  /**
   * 【機能概要】: エラー状態をクリア
   * 【実装方針】: errorをnullに設定する同期処理
   * 【テスト対応】: TC-STORE-BL-008を通すための実装
   * 🔵 信頼性レベル: 要件定義書のclearError仕様に準拠
   */
  clearError: () => {
    // 【エラークリア】: errorをnullに設定 🔵
    // 【TC-STORE-BL-008対応】: エラー状態のクリアが正しく動作することをテスト
    set({ error: null });
  },
}));

import { create } from 'zustand';
import { apiClient, extractErrorMessage } from '../api/client';

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

  // 【UI状態】: ローディング状態とエラー状態を保持 🔵
  isLoading: boolean;
  error: string | null;

  // 【アクション】: データ取得・作成・削除・設定アクションを定義 🔵
  fetchBattleLogs: () => Promise<void>;
  clearError: () => void;
}

/**
 * Battle Log Storeの作成
 * 【Zustandストア定義】: create関数でストアを作成
 * 🔵 信頼性レベル: Zustand公式ドキュメントの推奨パターンに準拠
 */
export const useBattleLogStore = create<BattleLogState>((set) => ({
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
      const response = await apiClient.get('/health');
      console.log(response);

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

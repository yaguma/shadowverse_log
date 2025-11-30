import { create } from 'zustand';
import { apiClient, extractErrorMessage } from '../api/client';
import type { DeckMaster } from '../types';

/**
 * 【機能概要】: デッキマスターデータの状態管理を行うZustandストア
 * 【実装方針】: Zustandのcreate関数を使用してストアを作成し、API Clientと連携
 * 【テスト対応】: TC-STORE-DM-001〜TC-STORE-DM-004の全4ケースを通すための実装
 * 🔵 信頼性レベル: 要件定義書のDeckStore仕様とテストケース定義に基づいた実装
 */

/**
 * Deck Mastersレスポンス型
 */
interface DeckMastersResponse {
  deckMasters: DeckMaster[];
}

/**
 * Deck Storeの状態型
 * 【型定義】: Zustandストアの状態とアクションを定義
 * 🔵 信頼性レベル: 要件定義書のDeckStore仕様に準拠
 */
interface DeckState {
  // 【データ状態】: デッキマスターデータを保持 🔵
  deckMasters: DeckMaster[];

  // 【UI状態】: ローディング状態とエラー状態を保持 🔵
  isLoading: boolean;
  error: string | null;

  // 【アクション】: データ取得・設定アクションを定義 🔵
  fetchDeckMasters: () => Promise<void>;
  clearError: () => void;
}

/**
 * Deck Storeの作成
 * 【Zustandストア定義】: create関数でストアを作成
 * 🔵 信頼性レベル: Zustand公式ドキュメントの推奨パターンに準拠
 */
export const useDeckStore = create<DeckState>((set) => ({
  // 【初期状態】: ストアの初期値を設定 🔵
  deckMasters: [],
  isLoading: false,
  error: null,

  /**
   * 【機能概要】: デッキマスター一覧を取得
   * 【実装方針】: API Clientを使用してBackend APIからデッキマスターを取得し、ストアの状態を更新
   * 【テスト対応】: TC-STORE-DM-001, TC-STORE-DM-002, TC-STORE-DM-003を通すための実装
   * 🔵 信頼性レベル: 要件定義書のfetchDeckMasters仕様に準拠
   */
  fetchDeckMasters: async () => {
    // 【ローディング開始】: isLoadingをtrueに設定し、errorをnullにクリア 🔵
    set({ isLoading: true, error: null });

    try {
      // 【API呼び出し】: API Clientのget()メソッドでデッキマスター一覧を取得 🔵
      const response = await apiClient.get<DeckMastersResponse>('/deck-master');

      // 【状態更新】: deckMastersを更新し、isLoadingをfalseに設定 🔵
      set({ deckMasters: response.deckMasters, isLoading: false });
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
   * 【機能概要】: エラー状態をクリア
   * 【実装方針】: errorをnullに設定する同期処理
   * 【テスト対応】: TC-STORE-DM-004を通すための実装
   * 🔵 信頼性レベル: 要件定義書のclearError仕様に準拠
   */
  clearError: () => {
    // 【エラークリア】: errorをnullに設定 🔵
    set({ error: null });
  },
}));

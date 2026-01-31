import type {
  DeckMasterCreateRequest,
  DeckMasterUpdateRequest,
  DeckMasterWithUsage,
  MyDeck,
  MyDeckCreateRequest,
} from '@shadowverse-log/shared';
import { create } from 'zustand';
import { apiClient, extractErrorMessage } from '../api/client';
import type { DeckMaster } from '../types';

/**
 * 【機能概要】: デッキマスターデータの状態管理を行うZustandストア
 * 【実装方針】: Zustandのcreate関数を使用してストアを作成し、API Clientと連携
 * 【テスト対応】: TC-STORE-DM-001〜TC-STORE-DM-004の全4ケースを通すための実装
 * 【拡張】: TASK-0009 DeckMaster CRUD操作対応
 * 🔵 信頼性レベル: 要件定義書のDeckStore仕様とテストケース定義に基づいた実装
 */

/**
 * Deck Mastersレスポンス型
 */
interface DeckMastersResponse {
  deckMasters: DeckMaster[];
}

/**
 * My Decksレスポンス型
 */
interface MyDecksResponse {
  myDecks: MyDeck[];
}

/**
 * Deck Storeの状態型
 * 【型定義】: Zustandストアの状態とアクションを定義
 * 🔵 信頼性レベル: 要件定義書のDeckStore仕様に準拠
 */
interface DeckState {
  // 【データ状態】: デッキマスターデータを保持 🔵
  deckMasters: DeckMaster[];
  // 【データ状態】: マイデッキデータを保持 🔵
  myDecks: MyDeck[];
  // 【データ状態】: 使用履歴付きデッキマスターデータを保持（TASK-0009）🔵
  deckMastersWithUsage: DeckMasterWithUsage[];

  // 【UI状態】: ローディング状態とエラー状態を保持 🔵
  isLoading: boolean;
  isMyDecksLoading: boolean;
  error: string | null;
  myDecksError: string | null;
  // 【UI状態】: DeckMaster CRUD用ローディング・エラー状態（TASK-0009）🔵
  isLoadingDeckMasters: boolean;
  deckMasterError: string | null;

  // 【アクション】: データ取得・設定アクションを定義 🔵
  fetchDeckMasters: () => Promise<void>;
  fetchMyDecks: () => Promise<void>;
  clearError: () => void;
  // 【アクション】: DeckMaster CRUD操作（TASK-0009）🔵
  fetchDeckMastersWithUsage: (includeUsage?: boolean) => Promise<void>;
  addDeckMaster: (data: DeckMasterCreateRequest) => Promise<DeckMasterWithUsage>;
  updateDeckMaster: (id: string, data: DeckMasterUpdateRequest) => Promise<DeckMasterWithUsage>;
  deleteDeckMaster: (id: string) => Promise<void>;
  clearDeckMasterError: () => void;

  // 【アクション】: MyDeck CRUD操作（TASK-0017）🔵
  addMyDeck: (data: MyDeckCreateRequest) => Promise<MyDeck>;
  deleteMyDeck: (id: string) => Promise<void>;
  clearMyDecksError: () => void;
}

/**
 * Deck Storeの作成
 * 【Zustandストア定義】: create関数でストアを作成
 * 🔵 信頼性レベル: Zustand公式ドキュメントの推奨パターンに準拠
 */
export const useDeckStore = create<DeckState>((set, get) => ({
  // 【初期状態】: ストアの初期値を設定 🔵
  deckMasters: [],
  myDecks: [],
  deckMastersWithUsage: [],
  isLoading: false,
  isMyDecksLoading: false,
  isLoadingDeckMasters: false,
  error: null,
  myDecksError: null,
  deckMasterError: null,

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
   * 【機能概要】: マイデッキ一覧を取得
   * 【実装方針】: API Clientを使用してBackend APIからマイデッキを取得し、ストアの状態を更新
   * 🔵 信頼性レベル: 要件定義書のfetchMyDecks仕様に準拠
   */
  fetchMyDecks: async () => {
    // 【ローディング開始】: isMyDecksLoadingをtrueに設定し、myDecksErrorをnullにクリア 🔵
    set({ isMyDecksLoading: true, myDecksError: null });

    try {
      // 【API呼び出し】: API Clientのget()メソッドでマイデッキ一覧を取得 🔵
      const response = await apiClient.get<MyDecksResponse>('/my-decks');

      // 【状態更新】: myDecksを更新し、isMyDecksLoadingをfalseに設定 🔵
      set({ myDecks: response.myDecks, isMyDecksLoading: false });
    } catch (error) {
      // 【エラーハンドリング】: エラーメッセージを設定し、isMyDecksLoadingをfalseに設定 🔵
      const errorMessage = extractErrorMessage(error);
      set({
        myDecksError: errorMessage,
        isMyDecksLoading: false,
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
    set({ error: null, myDecksError: null });
  },

  // ==================== DeckMaster CRUD操作（TASK-0009）====================

  /**
   * 【機能概要】: 使用履歴付きデッキマスター一覧を取得
   * 【実装方針】: API Clientを使用してBackend APIからデッキマスターを取得し、ストアの状態を更新
   * 【テスト対応】: TC-STORE-DMU-001, TC-STORE-DMU-002, TC-STORE-DMU-003を通すための実装
   * 🔵 信頼性レベル: TASK-0009仕様に準拠
   */
  fetchDeckMastersWithUsage: async (_includeUsage?: boolean) => {
    // 【ローディング開始】: isLoadingDeckMastersをtrueに設定 🔵
    set({ isLoadingDeckMasters: true, deckMasterError: null });

    try {
      // 【API呼び出し】: API Clientのget()メソッドで使用履歴付きデッキマスター一覧を取得 🔵
      const response = await apiClient.get<DeckMasterWithUsage[]>(
        '/deck-masters?includeUsage=true'
      );

      // 【状態更新】: deckMastersWithUsageを更新し、isLoadingDeckMastersをfalseに設定 🔵
      set({ deckMastersWithUsage: response, isLoadingDeckMasters: false });
    } catch (error) {
      // 【エラーハンドリング】: エラーメッセージを設定し、isLoadingDeckMastersをfalseに設定 🔵
      const errorMessage = extractErrorMessage(error);
      set({
        deckMasterError: errorMessage,
        isLoadingDeckMasters: false,
      });
    }
  },

  /**
   * 【機能概要】: デッキマスターを追加
   * 【実装方針】: API Clientを使用してBackend APIにPOSTリクエストを送信し、成功時はストアに追加
   * 【テスト対応】: TC-STORE-DMU-004, TC-STORE-DMU-005を通すための実装
   * 🔵 信頼性レベル: TASK-0009仕様に準拠
   */
  addDeckMaster: async (data: DeckMasterCreateRequest): Promise<DeckMasterWithUsage> => {
    // 【エラークリア】: 操作開始時にエラーをクリア 🔵
    set({ deckMasterError: null });

    try {
      // 【API呼び出し】: API ClientのPOSTメソッドでデッキマスターを追加 🔵
      const newDeck = await apiClient.post<DeckMasterWithUsage>('/deck-masters', data);

      // 【状態更新】: deckMastersWithUsageに新しいデッキを追加 🔵
      const currentDecks = get().deckMastersWithUsage;
      set({ deckMastersWithUsage: [...currentDecks, newDeck] });

      return newDeck;
    } catch (error) {
      // 【エラーハンドリング】: エラーメッセージを設定して再throw 🔵
      const errorMessage = extractErrorMessage(error);
      set({ deckMasterError: errorMessage });
      throw error;
    }
  },

  /**
   * 【機能概要】: デッキマスターを更新
   * 【実装方針】: API Clientを使用してBackend APIにPUTリクエストを送信し、成功時はストアを更新
   * 【テスト対応】: TC-STORE-DMU-006, TC-STORE-DMU-007を通すための実装
   * 🔵 信頼性レベル: TASK-0009仕様に準拠
   */
  updateDeckMaster: async (
    id: string,
    data: DeckMasterUpdateRequest
  ): Promise<DeckMasterWithUsage> => {
    // 【エラークリア】: 操作開始時にエラーをクリア 🔵
    set({ deckMasterError: null });

    try {
      // 【API呼び出し】: API ClientのPUTメソッドでデッキマスターを更新 🔵
      const updatedDeck = await apiClient.put<DeckMasterWithUsage>(`/deck-masters/${id}`, data);

      // 【状態更新】: deckMastersWithUsage配列内の該当アイテムを更新 🔵
      const currentDecks = get().deckMastersWithUsage;
      const updatedDecks = currentDecks.map((deck) => (deck.id === id ? updatedDeck : deck));
      set({ deckMastersWithUsage: updatedDecks });

      return updatedDeck;
    } catch (error) {
      // 【エラーハンドリング】: エラーメッセージを設定して再throw 🔵
      const errorMessage = extractErrorMessage(error);
      set({ deckMasterError: errorMessage });
      throw error;
    }
  },

  /**
   * 【機能概要】: デッキマスターを削除
   * 【実装方針】: API Clientを使用してBackend APIにDELETEリクエストを送信し、成功時はストアから削除
   * 【テスト対応】: TC-STORE-DMU-008, TC-STORE-DMU-009を通すための実装
   * 🔵 信頼性レベル: TASK-0009仕様に準拠
   */
  deleteDeckMaster: async (id: string): Promise<void> => {
    // 【エラークリア】: 操作開始時にエラーをクリア 🔵
    set({ deckMasterError: null });

    try {
      // 【API呼び出し】: API ClientのDELETEメソッドでデッキマスターを削除 🔵
      await apiClient.del<void>(`/deck-masters/${id}`);

      // 【状態更新】: deckMastersWithUsage配列から削除 🔵
      const currentDecks = get().deckMastersWithUsage;
      const filteredDecks = currentDecks.filter((deck) => deck.id !== id);
      set({ deckMastersWithUsage: filteredDecks });
    } catch (error) {
      // 【エラーハンドリング】: エラーメッセージを設定して再throw 🔵
      const errorMessage = extractErrorMessage(error);
      set({ deckMasterError: errorMessage });
      throw error;
    }
  },

  /**
   * 【機能概要】: DeckMasterエラー状態をクリア
   * 【実装方針】: deckMasterErrorをnullに設定する同期処理
   * 【テスト対応】: TC-STORE-DMU-010を通すための実装
   * 🔵 信頼性レベル: TASK-0009仕様に準拠
   */
  clearDeckMasterError: () => {
    // 【エラークリア】: deckMasterErrorをnullに設定 🔵
    set({ deckMasterError: null });
  },

  // ==================== MyDeck CRUD操作（TASK-0017）====================

  /**
   * 【機能概要】: マイデッキを追加
   * 【実装方針】: API Clientを使用してBackend APIにPOSTリクエストを送信し、成功時はストアに追加
   * 【テスト対応】: TC-STORE-MD-001〜TC-STORE-MD-004を通すための実装
   * 🔵 信頼性レベル: TASK-0017仕様に準拠
   */
  addMyDeck: async (data: MyDeckCreateRequest): Promise<MyDeck> => {
    // 【ローディング開始】: isMyDecksLoadingをtrueに設定し、エラーをクリア 🔵
    set({ isMyDecksLoading: true, myDecksError: null });

    try {
      // 【API呼び出し】: API ClientのPOSTメソッドでマイデッキを追加 🔵
      const newDeck = await apiClient.post<MyDeck>('/my-decks', data);

      // 【状態更新】: myDecks配列に新しいデッキを追加 🔵
      const currentDecks = get().myDecks;
      set({ myDecks: [...currentDecks, newDeck], isMyDecksLoading: false });

      return newDeck;
    } catch (error) {
      // 【エラーハンドリング】: エラーメッセージを設定して再throw 🔵
      const errorMessage = extractErrorMessage(error);
      set({ myDecksError: errorMessage, isMyDecksLoading: false });
      throw error;
    }
  },

  /**
   * 【機能概要】: マイデッキを削除
   * 【実装方針】: API Clientを使用してBackend APIにDELETEリクエストを送信し、成功時はストアから削除
   * 【テスト対応】: TC-STORE-MD-005〜TC-STORE-MD-008を通すための実装
   * 🔵 信頼性レベル: TASK-0017仕様に準拠
   */
  deleteMyDeck: async (id: string): Promise<void> => {
    // 【ローディング開始】: isMyDecksLoadingをtrueに設定し、エラーをクリア 🔵
    set({ isMyDecksLoading: true, myDecksError: null });

    try {
      // 【API呼び出し】: API ClientのDELETEメソッドでマイデッキを削除 🔵
      await apiClient.del<void>(`/my-decks/${id}`);

      // 【状態更新】: myDecks配列から削除 🔵
      const currentDecks = get().myDecks;
      const filteredDecks = currentDecks.filter((deck) => deck.id !== id);
      set({ myDecks: filteredDecks, isMyDecksLoading: false });
    } catch (error) {
      // 【エラーハンドリング】: エラーメッセージを設定して再throw 🔵
      const errorMessage = extractErrorMessage(error);
      set({ myDecksError: errorMessage, isMyDecksLoading: false });
      throw error;
    }
  },

  /**
   * 【機能概要】: MyDecksエラー状態をクリア
   * 【実装方針】: myDecksErrorをnullに設定する同期処理
   * 【テスト対応】: TC-STORE-MD-009を通すための実装
   * 🔵 信頼性レベル: TASK-0017仕様に準拠
   */
  clearMyDecksError: () => {
    // 【エラークリア】: myDecksErrorをnullに設定 🔵
    set({ myDecksError: null });
  },
}));

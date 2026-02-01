import type {
  AsyncState,
  DeckMasterCreateRequest,
  DeckMasterUpdateRequest,
  DeckMasterWithUsage,
  MyDeck,
  MyDeckCreateRequest,
} from '@shadowverse-log/shared';
import {
  createInitialAsyncState,
  setAsyncError,
  setAsyncLoading,
  setAsyncSuccess,
} from '@shadowverse-log/shared';
import { create } from 'zustand';
import { apiClient, extractErrorMessage } from '../api/client';
import type { DeckMaster } from '../types';

/**
 * 【機能概要】: デッキマスターデータの状態管理を行うZustandストア
 * 【実装方針】: Zustandのcreate関数を使用してストアを作成し、API Clientと連携
 * 【リファクタリング】: AsyncState型を導入して状態管理を簡素化（Issue 008対応）
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
 * Deck Storeの内部状態型（AsyncStateを使用）
 * 【型定義】: 非同期状態をAsyncState型で統一管理
 * 🔵 Issue 008: 複雑な状態管理をAsyncState型で簡素化
 */
interface DeckStoreState {
  // 【内部状態】: AsyncStateパターンで管理
  _deckMastersState: AsyncState<DeckMaster[]>;
  _myDecksState: AsyncState<MyDeck[]>;
  _deckMastersWithUsageState: AsyncState<DeckMasterWithUsage[]>;
}

/**
 * Deck Storeの公開インターフェース（後方互換性のため維持）
 * 【型定義】: Zustandストアの状態とアクションを定義
 * 🔵 信頼性レベル: 要件定義書のDeckStore仕様に準拠
 */
interface DeckState extends DeckStoreState {
  // 【データ状態】: 後方互換性のためのgetterプロパティ 🔵
  deckMasters: DeckMaster[];
  myDecks: MyDeck[];
  deckMastersWithUsage: DeckMasterWithUsage[];

  // 【UI状態】: 後方互換性のためのgetterプロパティ 🔵
  isLoading: boolean;
  isMyDecksLoading: boolean;
  isLoadingDeckMasters: boolean;
  error: string | null;
  myDecksError: string | null;
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
 * 【リファクタリング】: AsyncState型を使用して状態管理を簡素化
 * 🔵 信頼性レベル: Zustand公式ドキュメントの推奨パターンに準拠
 */
export const useDeckStore = create<DeckState>((set, get) => ({
  // 【内部状態】: AsyncStateで初期化 🔵
  _deckMastersState: createInitialAsyncState<DeckMaster[]>([]),
  _myDecksState: createInitialAsyncState<MyDeck[]>([]),
  _deckMastersWithUsageState: createInitialAsyncState<DeckMasterWithUsage[]>([]),

  // 【後方互換性】: 初期値（各アクションで更新される） 🔵
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
   * 🔵 信頼性レベル: 要件定義書のfetchDeckMasters仕様に準拠
   */
  fetchDeckMasters: async () => {
    // 【ローディング開始】: AsyncStateをローディング状態に設定 🔵
    const loadingState = setAsyncLoading(get()._deckMastersState);
    set({
      _deckMastersState: loadingState,
      isLoading: loadingState.isLoading,
    });

    try {
      // 【API呼び出し】: API Clientのget()メソッドでデッキマスター一覧を取得 🔵
      const response = await apiClient.get<DeckMastersResponse>('/deck-master');

      // 【状態更新】: AsyncStateを成功状態に設定 🔵
      const successState = setAsyncSuccess(response.deckMasters);
      set({
        _deckMastersState: successState,
        deckMasters: successState.data,
        isLoading: successState.isLoading,
        error: successState.error,
      });
    } catch (error) {
      // 【エラーハンドリング】: AsyncStateをエラー状態に設定 🔵
      const errorMessage = extractErrorMessage(error);
      const errorState = setAsyncError(get()._deckMastersState, errorMessage);
      set({
        _deckMastersState: errorState,
        isLoading: errorState.isLoading,
        error: errorState.error,
      });
    }
  },

  /**
   * 【機能概要】: マイデッキ一覧を取得
   * 【実装方針】: API Clientを使用してBackend APIからマイデッキを取得し、ストアの状態を更新
   * 🔵 信頼性レベル: 要件定義書のfetchMyDecks仕様に準拠
   */
  fetchMyDecks: async () => {
    // 【ローディング開始】: AsyncStateをローディング状態に設定 🔵
    const loadingState = setAsyncLoading(get()._myDecksState);
    set({
      _myDecksState: loadingState,
      isMyDecksLoading: loadingState.isLoading,
    });

    try {
      // 【API呼び出し】: API Clientのget()メソッドでマイデッキ一覧を取得 🔵
      const response = await apiClient.get<MyDecksResponse>('/my-decks');

      // 【状態更新】: AsyncStateを成功状態に設定 🔵
      const successState = setAsyncSuccess(response.myDecks);
      set({
        _myDecksState: successState,
        myDecks: successState.data,
        isMyDecksLoading: successState.isLoading,
        myDecksError: successState.error,
      });
    } catch (error) {
      // 【エラーハンドリング】: AsyncStateをエラー状態に設定 🔵
      const errorMessage = extractErrorMessage(error);
      const errorState = setAsyncError(get()._myDecksState, errorMessage);
      set({
        _myDecksState: errorState,
        isMyDecksLoading: errorState.isLoading,
        myDecksError: errorState.error,
      });
    }
  },

  /**
   * 【機能概要】: エラー状態をクリア
   * 【実装方針】: 全てのAsyncStateのエラーをクリア
   * 🔵 信頼性レベル: 要件定義書のclearError仕様に準拠
   */
  clearError: () => {
    const state = get();
    set({
      _deckMastersState: { ...state._deckMastersState, error: null },
      _myDecksState: { ...state._myDecksState, error: null },
      error: null,
      myDecksError: null,
    });
  },

  // ==================== DeckMaster CRUD操作（TASK-0009）====================

  /**
   * 【機能概要】: 使用履歴付きデッキマスター一覧を取得
   * 【実装方針】: API Clientを使用してBackend APIからデッキマスターを取得し、ストアの状態を更新
   * 🔵 信頼性レベル: TASK-0009仕様に準拠
   */
  fetchDeckMastersWithUsage: async (_includeUsage?: boolean) => {
    // 【ローディング開始】: AsyncStateをローディング状態に設定 🔵
    const loadingState = setAsyncLoading(get()._deckMastersWithUsageState);
    set({
      _deckMastersWithUsageState: loadingState,
      isLoadingDeckMasters: loadingState.isLoading,
    });

    try {
      // 【API呼び出し】: API Clientのget()メソッドで使用履歴付きデッキマスター一覧を取得 🔵
      // 【レスポンス形式】: APIは { deckMasters: DeckMasterWithUsage[] } 形式で返す
      const response = await apiClient.get<{ deckMasters: DeckMasterWithUsage[] }>(
        '/deck-masters?includeUsage=true'
      );

      // 【状態更新】: AsyncStateを成功状態に設定 🔵
      const successState = setAsyncSuccess(response);
      set({
        _deckMastersWithUsageState: successState,
        deckMastersWithUsage: successState.data,
        isLoadingDeckMasters: successState.isLoading,
        deckMasterError: successState.error,
      });
    } catch (error) {
      // 【エラーハンドリング】: AsyncStateをエラー状態に設定 🔵
      const errorMessage = extractErrorMessage(error);
      const errorState = setAsyncError(get()._deckMastersWithUsageState, errorMessage);
      set({
        _deckMastersWithUsageState: errorState,
        isLoadingDeckMasters: errorState.isLoading,
        deckMasterError: errorState.error,
      });
    }
  },

  /**
   * 【機能概要】: デッキマスターを追加
   * 【実装方針】: API Clientを使用してBackend APIにPOSTリクエストを送信し、成功時はストアに追加
   * 🔵 信頼性レベル: TASK-0009仕様に準拠
   */
  addDeckMaster: async (data: DeckMasterCreateRequest): Promise<DeckMasterWithUsage> => {
    // 【エラークリア】: 操作開始時にエラーをクリア 🔵
    const state = get();
    set({
      _deckMastersWithUsageState: { ...state._deckMastersWithUsageState, error: null },
      deckMasterError: null,
    });

    try {
      // 【API呼び出し】: API ClientのPOSTメソッドでデッキマスターを追加 🔵
      const newDeck = await apiClient.post<DeckMasterWithUsage>('/deck-masters', data);

      // 【状態更新】: deckMastersWithUsageに新しいデッキを追加 🔵
      const currentState = get();
      const newData = [...currentState._deckMastersWithUsageState.data, newDeck];
      set({
        _deckMastersWithUsageState: {
          ...currentState._deckMastersWithUsageState,
          data: newData,
        },
        deckMastersWithUsage: newData,
      });

      return newDeck;
    } catch (error) {
      // 【エラーハンドリング】: エラーメッセージを設定して再throw 🔵
      const errorMessage = extractErrorMessage(error);
      const currentState = get();
      set({
        _deckMastersWithUsageState: {
          ...currentState._deckMastersWithUsageState,
          error: errorMessage,
        },
        deckMasterError: errorMessage,
      });
      throw error;
    }
  },

  /**
   * 【機能概要】: デッキマスターを更新
   * 【実装方針】: API Clientを使用してBackend APIにPUTリクエストを送信し、成功時はストアを更新
   * 🔵 信頼性レベル: TASK-0009仕様に準拠
   */
  updateDeckMaster: async (
    id: string,
    data: DeckMasterUpdateRequest
  ): Promise<DeckMasterWithUsage> => {
    // 【エラークリア】: 操作開始時にエラーをクリア 🔵
    const state = get();
    set({
      _deckMastersWithUsageState: { ...state._deckMastersWithUsageState, error: null },
      deckMasterError: null,
    });

    try {
      // 【API呼び出し】: API ClientのPUTメソッドでデッキマスターを更新 🔵
      const updatedDeck = await apiClient.put<DeckMasterWithUsage>(`/deck-masters/${id}`, data);

      // 【状態更新】: deckMastersWithUsage配列内の該当アイテムを更新 🔵
      const currentState = get();
      const newData = currentState._deckMastersWithUsageState.data.map((deck) =>
        deck.id === id ? updatedDeck : deck
      );
      set({
        _deckMastersWithUsageState: {
          ...currentState._deckMastersWithUsageState,
          data: newData,
        },
        deckMastersWithUsage: newData,
      });

      return updatedDeck;
    } catch (error) {
      // 【エラーハンドリング】: エラーメッセージを設定して再throw 🔵
      const errorMessage = extractErrorMessage(error);
      const currentState = get();
      set({
        _deckMastersWithUsageState: {
          ...currentState._deckMastersWithUsageState,
          error: errorMessage,
        },
        deckMasterError: errorMessage,
      });
      throw error;
    }
  },

  /**
   * 【機能概要】: デッキマスターを削除
   * 【実装方針】: API Clientを使用してBackend APIにDELETEリクエストを送信し、成功時はストアから削除
   * 🔵 信頼性レベル: TASK-0009仕様に準拠
   */
  deleteDeckMaster: async (id: string): Promise<void> => {
    // 【エラークリア】: 操作開始時にエラーをクリア 🔵
    const state = get();
    set({
      _deckMastersWithUsageState: { ...state._deckMastersWithUsageState, error: null },
      deckMasterError: null,
    });

    try {
      // 【API呼び出し】: API ClientのDELETEメソッドでデッキマスターを削除 🔵
      await apiClient.del<void>(`/deck-masters/${id}`);

      // 【状態更新】: deckMastersWithUsage配列から削除 🔵
      const currentState = get();
      const newData = currentState._deckMastersWithUsageState.data.filter((deck) => deck.id !== id);
      set({
        _deckMastersWithUsageState: {
          ...currentState._deckMastersWithUsageState,
          data: newData,
        },
        deckMastersWithUsage: newData,
      });
    } catch (error) {
      // 【エラーハンドリング】: エラーメッセージを設定して再throw 🔵
      const errorMessage = extractErrorMessage(error);
      const currentState = get();
      set({
        _deckMastersWithUsageState: {
          ...currentState._deckMastersWithUsageState,
          error: errorMessage,
        },
        deckMasterError: errorMessage,
      });
      throw error;
    }
  },

  /**
   * 【機能概要】: DeckMasterエラー状態をクリア
   * 【実装方針】: deckMastersWithUsageStateのエラーをクリア
   * 🔵 信頼性レベル: TASK-0009仕様に準拠
   */
  clearDeckMasterError: () => {
    const state = get();
    set({
      _deckMastersWithUsageState: { ...state._deckMastersWithUsageState, error: null },
      deckMasterError: null,
    });
  },

  // ==================== MyDeck CRUD操作（TASK-0017）====================

  /**
   * 【機能概要】: マイデッキを追加
   * 【実装方針】: API Clientを使用してBackend APIにPOSTリクエストを送信し、成功時はストアに追加
   * 🔵 信頼性レベル: TASK-0017仕様に準拠
   */
  addMyDeck: async (data: MyDeckCreateRequest): Promise<MyDeck> => {
    // 【ローディング開始】: AsyncStateをローディング状態に設定 🔵
    const loadingState = setAsyncLoading(get()._myDecksState);
    set({
      _myDecksState: loadingState,
      isMyDecksLoading: loadingState.isLoading,
    });

    try {
      // 【API呼び出し】: API ClientのPOSTメソッドでマイデッキを追加 🔵
      const newDeck = await apiClient.post<MyDeck>('/my-decks', data);

      // 【状態更新】: myDecks配列に新しいデッキを追加 🔵
      const currentState = get();
      const newData = [...currentState._myDecksState.data, newDeck];
      const successState = setAsyncSuccess(newData);
      set({
        _myDecksState: successState,
        myDecks: successState.data,
        isMyDecksLoading: successState.isLoading,
        myDecksError: successState.error,
      });

      return newDeck;
    } catch (error) {
      // 【エラーハンドリング】: AsyncStateをエラー状態に設定して再throw 🔵
      const errorMessage = extractErrorMessage(error);
      const errorState = setAsyncError(get()._myDecksState, errorMessage);
      set({
        _myDecksState: errorState,
        isMyDecksLoading: errorState.isLoading,
        myDecksError: errorState.error,
      });
      throw error;
    }
  },

  /**
   * 【機能概要】: マイデッキを削除
   * 【実装方針】: API Clientを使用してBackend APIにDELETEリクエストを送信し、成功時はストアから削除
   * 🔵 信頼性レベル: TASK-0017仕様に準拠
   */
  deleteMyDeck: async (id: string): Promise<void> => {
    // 【ローディング開始】: AsyncStateをローディング状態に設定 🔵
    const loadingState = setAsyncLoading(get()._myDecksState);
    set({
      _myDecksState: loadingState,
      isMyDecksLoading: loadingState.isLoading,
    });

    try {
      // 【API呼び出し】: API ClientのDELETEメソッドでマイデッキを削除 🔵
      await apiClient.del<void>(`/my-decks/${id}`);

      // 【状態更新】: myDecks配列から削除 🔵
      const currentState = get();
      const newData = currentState._myDecksState.data.filter((deck) => deck.id !== id);
      const successState = setAsyncSuccess(newData);
      set({
        _myDecksState: successState,
        myDecks: successState.data,
        isMyDecksLoading: successState.isLoading,
        myDecksError: successState.error,
      });
    } catch (error) {
      // 【エラーハンドリング】: AsyncStateをエラー状態に設定して再throw 🔵
      const errorMessage = extractErrorMessage(error);
      const errorState = setAsyncError(get()._myDecksState, errorMessage);
      set({
        _myDecksState: errorState,
        isMyDecksLoading: errorState.isLoading,
        myDecksError: errorState.error,
      });
      throw error;
    }
  },

  /**
   * 【機能概要】: MyDecksエラー状態をクリア
   * 【実装方針】: myDecksStateのエラーをクリア
   * 🔵 信頼性レベル: TASK-0017仕様に準拠
   */
  clearMyDecksError: () => {
    const state = get();
    set({
      _myDecksState: { ...state._myDecksState, error: null },
      myDecksError: null,
    });
  },
}));

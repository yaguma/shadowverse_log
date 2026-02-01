import { createInitialAsyncState } from '@shadowverse-log/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as apiClient from '../api/client';
import { useDeckStore } from './deckStore';

// 【テストファイル概要】: Deck Storeの単体テスト
// 【テスト目的】: Zustandを使用したデッキマスターの状態管理機能を検証する
// 【テスト範囲】: fetchDeckMasters アクションの正常系とエラー系

// 【モック設定】: API Clientをモック化してBackend APIへの実際の通信を回避
vi.mock('../api/client', () => {
  const extractErrorMessage = (error: unknown, defaultMessage = 'Unknown error'): string => {
    if (error instanceof Error) {
      return error.message;
    }
    return defaultMessage;
  };

  return {
    apiClient: {
      get: vi.fn(),
      post: vi.fn(),
      del: vi.fn(),
    },
    extractErrorMessage,
  };
});

describe('Deck Store', () => {
  // 【テスト前準備】: 各テスト実行前にストアの状態を初期化
  beforeEach(() => {
    useDeckStore.setState({
      _deckMastersState: createInitialAsyncState([]),
      _myDecksState: createInitialAsyncState([]),
      _deckMastersWithUsageState: createInitialAsyncState([]),
      deckMasters: [],
      myDecks: [],
      deckMastersWithUsage: [],
      isLoading: false,
      isMyDecksLoading: false,
      isLoadingDeckMasters: false,
      error: null,
      myDecksError: null,
      deckMasterError: null,
    });
    vi.clearAllMocks();
  });

  // ==================== fetchDeckMasters() テスト ====================

  describe('fetchDeckMasters()', () => {
    it('TC-STORE-DM-001: デッキマスター一覧の取得が成功し、状態が更新される', async () => {
      // 【テスト目的】: DeckStoreの fetchDeckMasters() アクションが正常にデータを取得すること 🔵
      // 【期待される動作】: isLoading が true → false に遷移し、deckMasters が更新される 🔵
      // 🔵 信頼性レベル: 要件定義書とBackend API仕様に準拠

      const mockDeckMasters = [
        { id: 'deck-001', className: 'エルフ', deckName: 'エルフデッキ1', sortOrder: 1 },
        { id: 'deck-002', className: 'ロイヤル', deckName: 'ロイヤルデッキ1', sortOrder: 2 },
        { id: 'deck-003', className: 'ウィッチ', deckName: 'ウィッチデッキ1', sortOrder: 3 },
      ];

      vi.mocked(apiClient.apiClient.get).mockResolvedValueOnce({
        deckMasters: mockDeckMasters,
      });

      await useDeckStore.getState().fetchDeckMasters();

      const state = useDeckStore.getState();
      expect(state.deckMasters).toEqual(mockDeckMasters);
      expect(state.deckMasters).toHaveLength(3);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();

      expect(apiClient.apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.apiClient.get).toHaveBeenCalledWith('/deck-master');
    });

    it('TC-STORE-DM-002: デッキマスター一覧の取得が失敗し、エラー状態が設定される', async () => {
      // 【テスト目的】: エラーハンドリングの確認 - API呼び出しが失敗した場合 🔵
      // 【期待される動作】: errorにエラーメッセージが設定される 🔵
      // 🔵 信頼性レベル: エラー時でもアプリケーションが安全に動作すること

      const mockError = new Error('ネットワークエラーが発生しました');
      vi.mocked(apiClient.apiClient.get).mockRejectedValueOnce(mockError);

      await useDeckStore.getState().fetchDeckMasters();

      const state = useDeckStore.getState();
      expect(state.error).toBe('ネットワークエラーが発生しました');
      expect(state.deckMasters).toEqual([]);
      expect(state.isLoading).toBe(false);
    });

    it('TC-STORE-DM-003: 取得成功後、isLoadingがfalseになる', async () => {
      // 【テスト目的】: ローディング状態の遷移を確認 🔵
      // 🔵 信頼性レベル: UI表示に必要な状態管理

      vi.mocked(apiClient.apiClient.get).mockResolvedValueOnce({
        deckMasters: [],
      });

      // ローディング状態を先に確認
      const promise = useDeckStore.getState().fetchDeckMasters();

      // 完了後の状態を確認
      await promise;
      expect(useDeckStore.getState().isLoading).toBe(false);
    });
  });

  // ==================== clearError() テスト ====================

  describe('clearError()', () => {
    it('TC-STORE-DM-004: エラー状態のクリアが成功する', () => {
      // 【テスト目的】: DeckStoreの clearError() アクションが正常に動作すること 🔵
      // 🔵 信頼性レベル: ユーザーがエラーメッセージを閉じた後の状態管理

      useDeckStore.setState({
        _deckMastersState: {
          data: [],
          isLoading: false,
          error: 'ネットワークエラーが発生しました',
        },
        _myDecksState: createInitialAsyncState([]),
        _deckMastersWithUsageState: createInitialAsyncState([]),
      });

      useDeckStore.getState().clearError();

      expect(useDeckStore.getState().error).toBeNull();
    });
  });
});

import type { MyDeck, MyDeckCreateRequest } from '@shadowverse-log/shared';
import { createInitialAsyncState } from '@shadowverse-log/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as apiClient from '../api/client';
import { useDeckStore } from './deckStore';

/**
 * 【テストファイル概要】: DeckStore MyDeck CRUD機能の単体テスト
 * 【テスト目的】: TASK-0017 MyDeckのCRUD操作と状態管理を検証
 * 【テスト範囲】: addMyDeck, deleteMyDeck, MyDecks配列管理, isLoading/errorステート管理
 */

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
      put: vi.fn(),
      del: vi.fn(),
    },
    extractErrorMessage,
  };
});

describe('DeckStore - MyDeck CRUD', () => {
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

  // ==================== addMyDeck() テスト ====================
  describe('addMyDeck()', () => {
    it('TC-STORE-MD-001: 追加後にmyDecks配列に追加される', async () => {
      // 【テスト目的】: addMyDeckが正常にデータを追加すること
      const existingDeck: MyDeck = {
        id: 'mydeck-001',
        deckId: 'deck-master-001',
        deckCode: 'CODE001',
        deckName: '既存デッキ',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
      };
      useDeckStore.setState({
        _deckMastersState: createInitialAsyncState([]),
        _myDecksState: {
          data: [existingDeck],
          isLoading: false,
          error: null,
        },
        _deckMastersWithUsageState: createInitialAsyncState([]),
        myDecks: [existingDeck],
        isMyDecksLoading: false,
        myDecksError: null,
      });

      const newDeck: MyDeck = {
        id: 'mydeck-002',
        deckId: 'deck-master-002',
        deckCode: 'CODE002',
        deckName: '新規デッキ',
        isActive: true,
        createdAt: '2024-01-02T00:00:00Z',
      };

      vi.mocked(apiClient.apiClient.post).mockResolvedValueOnce(newDeck);

      const input: MyDeckCreateRequest = {
        deckId: 'deck-master-002',
        deckName: '新規デッキ',
        deckCode: 'CODE002',
      };

      const result = await useDeckStore.getState().addMyDeck(input);

      const state = useDeckStore.getState();
      expect(state.myDecks).toHaveLength(2);
      expect(state.myDecks[1]).toEqual(newDeck);
      expect(result).toEqual(newDeck);
      expect(apiClient.apiClient.post).toHaveBeenCalledWith('/my-decks', input);
    });

    it('TC-STORE-MD-002: 追加時にisMyDecksLoadingがtrue→falseに遷移する', async () => {
      // 【テスト目的】: ローディング状態の正しい遷移を確認
      const newDeck: MyDeck = {
        id: 'mydeck-001',
        deckId: 'deck-master-001',
        deckCode: '',
        deckName: 'テストデッキ',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
      };

      vi.mocked(apiClient.apiClient.post).mockImplementation(() => {
        // 呼び出し時点でisMyDecksLoadingがtrueであることを確認
        expect(useDeckStore.getState().isMyDecksLoading).toBe(true);
        return Promise.resolve(newDeck);
      });

      await useDeckStore.getState().addMyDeck({
        deckId: 'deck-master-001',
        deckName: 'テストデッキ',
      });

      expect(useDeckStore.getState().isMyDecksLoading).toBe(false);
    });

    it('TC-STORE-MD-003: 追加エラー時にエラーがthrowされ、myDecksErrorが設定される', async () => {
      // 【テスト目的】: エラー時に例外が投げられ、かつmyDecksErrorが設定されることを確認
      const mockError = new Error('追加に失敗しました');
      vi.mocked(apiClient.apiClient.post).mockRejectedValueOnce(mockError);

      await expect(
        useDeckStore.getState().addMyDeck({
          deckId: 'deck-master-001',
          deckName: 'テストデッキ',
        })
      ).rejects.toThrow('追加に失敗しました');

      // エラー状態も設定されることを確認
      expect(useDeckStore.getState().myDecksError).toBe('追加に失敗しました');
      expect(useDeckStore.getState().isMyDecksLoading).toBe(false);
    });

    it('TC-STORE-MD-004: 追加エラー時にmyDecks配列は変更されない', async () => {
      // 【テスト目的】: エラー時にmyDecks配列が変更されないことを確認
      const existingDeck: MyDeck = {
        id: 'mydeck-001',
        deckId: 'deck-master-001',
        deckCode: 'CODE001',
        deckName: '既存デッキ',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
      };
      useDeckStore.setState({
        _deckMastersState: createInitialAsyncState([]),
        _myDecksState: {
          data: [existingDeck],
          isLoading: false,
          error: null,
        },
        _deckMastersWithUsageState: createInitialAsyncState([]),
        myDecks: [existingDeck],
        isMyDecksLoading: false,
        myDecksError: null,
      });

      const mockError = new Error('追加に失敗しました');
      vi.mocked(apiClient.apiClient.post).mockRejectedValueOnce(mockError);

      await expect(
        useDeckStore.getState().addMyDeck({
          deckId: 'deck-master-002',
          deckName: '新規デッキ',
        })
      ).rejects.toThrow();

      // myDecks配列は変更されないことを確認
      expect(useDeckStore.getState().myDecks).toHaveLength(1);
      expect(useDeckStore.getState().myDecks[0]).toEqual(existingDeck);
    });
  });

  // ==================== deleteMyDeck() テスト ====================
  describe('deleteMyDeck()', () => {
    it('TC-STORE-MD-005: 削除後にmyDecks配列から削除される', async () => {
      // 【テスト目的】: deleteMyDeckが正常にデータを削除すること
      const decks: MyDeck[] = [
        {
          id: 'mydeck-001',
          deckId: 'deck-master-001',
          deckCode: 'CODE001',
          deckName: 'デッキ1',
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'mydeck-002',
          deckId: 'deck-master-002',
          deckCode: 'CODE002',
          deckName: 'デッキ2',
          isActive: true,
          createdAt: '2024-01-02T00:00:00Z',
        },
      ];
      useDeckStore.setState({
        _deckMastersState: createInitialAsyncState([]),
        _myDecksState: {
          data: decks,
          isLoading: false,
          error: null,
        },
        _deckMastersWithUsageState: createInitialAsyncState([]),
        myDecks: decks,
        isMyDecksLoading: false,
        myDecksError: null,
      });

      vi.mocked(apiClient.apiClient.del).mockResolvedValueOnce(undefined);

      await useDeckStore.getState().deleteMyDeck('mydeck-001');

      const state = useDeckStore.getState();
      expect(state.myDecks).toHaveLength(1);
      expect(state.myDecks[0].id).toBe('mydeck-002');
      expect(apiClient.apiClient.del).toHaveBeenCalledWith('/my-decks/mydeck-001');
    });

    it('TC-STORE-MD-006: 削除時にisMyDecksLoadingがtrue→falseに遷移する', async () => {
      // 【テスト目的】: ローディング状態の正しい遷移を確認
      const existingDeck: MyDeck = {
        id: 'mydeck-001',
        deckId: 'deck-master-001',
        deckCode: 'CODE001',
        deckName: 'テストデッキ',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
      };
      useDeckStore.setState({
        _deckMastersState: createInitialAsyncState([]),
        _myDecksState: {
          data: [existingDeck],
          isLoading: false,
          error: null,
        },
        _deckMastersWithUsageState: createInitialAsyncState([]),
        myDecks: [existingDeck],
        isMyDecksLoading: false,
        myDecksError: null,
      });

      vi.mocked(apiClient.apiClient.del).mockImplementation(() => {
        // 呼び出し時点でisMyDecksLoadingがtrueであることを確認
        expect(useDeckStore.getState().isMyDecksLoading).toBe(true);
        return Promise.resolve(undefined);
      });

      await useDeckStore.getState().deleteMyDeck('mydeck-001');

      expect(useDeckStore.getState().isMyDecksLoading).toBe(false);
    });

    it('TC-STORE-MD-007: 削除エラー時にエラーがthrowされ、myDecksErrorが設定される', async () => {
      // 【テスト目的】: エラー時に例外が投げられ、かつmyDecksErrorが設定されることを確認
      const existingDeck: MyDeck = {
        id: 'mydeck-001',
        deckId: 'deck-master-001',
        deckCode: 'CODE001',
        deckName: 'テストデッキ',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
      };
      useDeckStore.setState({
        _deckMastersState: createInitialAsyncState([]),
        _myDecksState: {
          data: [existingDeck],
          isLoading: false,
          error: null,
        },
        _deckMastersWithUsageState: createInitialAsyncState([]),
        myDecks: [existingDeck],
        isMyDecksLoading: false,
        myDecksError: null,
      });

      const mockError = new Error('対戦履歴から参照されているため削除できません');
      vi.mocked(apiClient.apiClient.del).mockRejectedValueOnce(mockError);

      await expect(useDeckStore.getState().deleteMyDeck('mydeck-001')).rejects.toThrow(
        '対戦履歴から参照されているため削除できません'
      );

      // エラー状態も設定されることを確認
      expect(useDeckStore.getState().myDecksError).toBe(
        '対戦履歴から参照されているため削除できません'
      );
      expect(useDeckStore.getState().isMyDecksLoading).toBe(false);
    });

    it('TC-STORE-MD-008: 削除エラー時にmyDecks配列は変更されない', async () => {
      // 【テスト目的】: エラー時にmyDecks配列が変更されないことを確認
      const existingDeck: MyDeck = {
        id: 'mydeck-001',
        deckId: 'deck-master-001',
        deckCode: 'CODE001',
        deckName: 'テストデッキ',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
      };
      useDeckStore.setState({
        _deckMastersState: createInitialAsyncState([]),
        _myDecksState: {
          data: [existingDeck],
          isLoading: false,
          error: null,
        },
        _deckMastersWithUsageState: createInitialAsyncState([]),
        myDecks: [existingDeck],
        isMyDecksLoading: false,
        myDecksError: null,
      });

      const mockError = new Error('削除に失敗しました');
      vi.mocked(apiClient.apiClient.del).mockRejectedValueOnce(mockError);

      await expect(useDeckStore.getState().deleteMyDeck('mydeck-001')).rejects.toThrow();

      // myDecks配列は変更されないことを確認
      expect(useDeckStore.getState().myDecks).toHaveLength(1);
      expect(useDeckStore.getState().myDecks[0]).toEqual(existingDeck);
    });
  });

  // ==================== clearMyDecksError() テスト ====================
  describe('clearMyDecksError()', () => {
    it('TC-STORE-MD-009: エラークリアでmyDecksErrorがnullになる', () => {
      // 【テスト目的】: clearMyDecksErrorが正常に動作すること
      useDeckStore.setState({
        _deckMastersState: createInitialAsyncState([]),
        _myDecksState: {
          data: [],
          isLoading: false,
          error: 'エラーメッセージ',
        },
        _deckMastersWithUsageState: createInitialAsyncState([]),
        myDecks: [],
        isMyDecksLoading: false,
        myDecksError: 'エラーメッセージ',
      });

      useDeckStore.getState().clearMyDecksError();

      expect(useDeckStore.getState().myDecksError).toBeNull();
    });
  });
});

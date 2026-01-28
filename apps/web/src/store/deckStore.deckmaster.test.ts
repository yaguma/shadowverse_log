import type { DeckMasterWithUsage } from '@shadowverse-log/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as apiClient from '../api/client';
import { useDeckStore } from './deckStore';

/**
 * 【テストファイル概要】: DeckStore DeckMaster CRUD機能の単体テスト
 * 【テスト目的】: TASK-0009 DeckMasterのCRUD操作と状態管理を検証
 * 【テスト範囲】: fetchDeckMastersWithUsage, addDeckMaster, updateDeckMaster, deleteDeckMaster, clearDeckMasterError
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

describe('DeckStore - DeckMaster CRUD', () => {
  // 【テスト前準備】: 各テスト実行前にストアの状態を初期化
  beforeEach(() => {
    useDeckStore.setState({
      deckMastersWithUsage: [],
      isLoadingDeckMasters: false,
      deckMasterError: null,
    });
    vi.clearAllMocks();
  });

  // ==================== fetchDeckMastersWithUsage() テスト ====================
  describe('fetchDeckMastersWithUsage()', () => {
    it('TC-STORE-DMU-001: 正常取得でdeckMastersWithUsage配列に設定される', async () => {
      // 【テスト目的】: fetchDeckMastersWithUsageが正常にデータを取得すること
      const mockDeckMasters: DeckMasterWithUsage[] = [
        {
          id: 'deck-001',
          className: 'エルフ',
          deckName: 'エルフデッキ1',
          sortOrder: 1,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          usageCount: 10,
          lastUsedDate: '2024-01-15',
        },
        {
          id: 'deck-002',
          className: 'ロイヤル',
          deckName: 'ロイヤルデッキ1',
          sortOrder: 2,
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
          usageCount: 5,
          lastUsedDate: null,
        },
      ];

      vi.mocked(apiClient.apiClient.get).mockResolvedValueOnce(mockDeckMasters);

      await useDeckStore.getState().fetchDeckMastersWithUsage();

      const state = useDeckStore.getState();
      expect(state.deckMastersWithUsage).toEqual(mockDeckMasters);
      expect(state.deckMastersWithUsage).toHaveLength(2);
      expect(apiClient.apiClient.get).toHaveBeenCalledWith('/deck-masters?includeUsage=true');
    });

    it('TC-STORE-DMU-002: ローディング状態がtrue→falseに遷移する', async () => {
      // 【テスト目的】: ローディング状態の正しい遷移を確認
      vi.mocked(apiClient.apiClient.get).mockImplementation(() => {
        // 呼び出し時点でisLoadingDeckMastersがtrueであることを確認
        expect(useDeckStore.getState().isLoadingDeckMasters).toBe(true);
        return Promise.resolve([]);
      });

      await useDeckStore.getState().fetchDeckMastersWithUsage();

      expect(useDeckStore.getState().isLoadingDeckMasters).toBe(false);
    });

    it('TC-STORE-DMU-003: エラー時にdeckMasterErrorが設定される', async () => {
      // 【テスト目的】: エラーハンドリングの確認
      const mockError = new Error('ネットワークエラー');
      vi.mocked(apiClient.apiClient.get).mockRejectedValueOnce(mockError);

      await useDeckStore.getState().fetchDeckMastersWithUsage();

      const state = useDeckStore.getState();
      expect(state.deckMasterError).toBe('ネットワークエラー');
      expect(state.isLoadingDeckMasters).toBe(false);
    });
  });

  // ==================== addDeckMaster() テスト ====================
  describe('addDeckMaster()', () => {
    it('TC-STORE-DMU-004: 追加後にdeckMastersWithUsage配列に追加される', async () => {
      // 【テスト目的】: addDeckMasterが正常にデータを追加すること
      const existingDeck: DeckMasterWithUsage = {
        id: 'deck-001',
        className: 'エルフ',
        deckName: 'エルフデッキ1',
        sortOrder: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        usageCount: 0,
        lastUsedDate: null,
      };
      useDeckStore.setState({ deckMastersWithUsage: [existingDeck] });

      const newDeck: DeckMasterWithUsage = {
        id: 'deck-002',
        className: 'ロイヤル',
        deckName: 'ロイヤルデッキ1',
        sortOrder: 2,
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        usageCount: 0,
        lastUsedDate: null,
      };

      vi.mocked(apiClient.apiClient.post).mockResolvedValueOnce(newDeck);

      const result = await useDeckStore.getState().addDeckMaster({
        className: 'ロイヤル',
        deckName: 'ロイヤルデッキ1',
      });

      const state = useDeckStore.getState();
      expect(state.deckMastersWithUsage).toHaveLength(2);
      expect(state.deckMastersWithUsage[1]).toEqual(newDeck);
      expect(result).toEqual(newDeck);
      expect(apiClient.apiClient.post).toHaveBeenCalledWith('/deck-masters', {
        className: 'ロイヤル',
        deckName: 'ロイヤルデッキ1',
      });
    });

    it('TC-STORE-DMU-005: 追加エラー時にエラーがthrowされ、deckMasterErrorが設定される', async () => {
      // 【テスト目的】: エラー時に例外が投げられ、かつdeckMasterErrorが設定されることを確認
      const mockError = new Error('追加に失敗しました');
      vi.mocked(apiClient.apiClient.post).mockRejectedValueOnce(mockError);

      await expect(
        useDeckStore.getState().addDeckMaster({
          className: 'エルフ',
          deckName: 'エルフデッキ',
        })
      ).rejects.toThrow('追加に失敗しました');

      // エラー状態も設定されることを確認（fetchDeckMastersWithUsageとの一貫性）
      expect(useDeckStore.getState().deckMasterError).toBe('追加に失敗しました');
    });
  });

  // ==================== updateDeckMaster() テスト ====================
  describe('updateDeckMaster()', () => {
    it('TC-STORE-DMU-006: 更新後にdeckMastersWithUsage配列が更新される', async () => {
      // 【テスト目的】: updateDeckMasterが正常にデータを更新すること
      const existingDeck: DeckMasterWithUsage = {
        id: 'deck-001',
        className: 'エルフ',
        deckName: 'エルフデッキ1',
        sortOrder: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        usageCount: 10,
        lastUsedDate: '2024-01-15',
      };
      useDeckStore.setState({ deckMastersWithUsage: [existingDeck] });

      const updatedDeck: DeckMasterWithUsage = {
        ...existingDeck,
        deckName: 'エルフデッキ改',
        updatedAt: '2024-01-20T00:00:00Z',
      };

      vi.mocked(apiClient.apiClient.put).mockResolvedValueOnce(updatedDeck);

      const result = await useDeckStore.getState().updateDeckMaster('deck-001', {
        deckName: 'エルフデッキ改',
      });

      const state = useDeckStore.getState();
      expect(state.deckMastersWithUsage[0].deckName).toBe('エルフデッキ改');
      expect(result).toEqual(updatedDeck);
      expect(apiClient.apiClient.put).toHaveBeenCalledWith('/deck-masters/deck-001', {
        deckName: 'エルフデッキ改',
      });
    });

    it('TC-STORE-DMU-007: 更新エラー時にエラーがthrowされ、deckMasterErrorが設定される', async () => {
      // 【テスト目的】: エラー時に例外が投げられ、かつdeckMasterErrorが設定されることを確認
      const mockError = new Error('更新に失敗しました');
      vi.mocked(apiClient.apiClient.put).mockRejectedValueOnce(mockError);

      await expect(
        useDeckStore.getState().updateDeckMaster('deck-001', {
          deckName: 'エルフデッキ改',
        })
      ).rejects.toThrow('更新に失敗しました');

      // エラー状態も設定されることを確認（fetchDeckMastersWithUsageとの一貫性）
      expect(useDeckStore.getState().deckMasterError).toBe('更新に失敗しました');
    });
  });

  // ==================== deleteDeckMaster() テスト ====================
  describe('deleteDeckMaster()', () => {
    it('TC-STORE-DMU-008: 削除後にdeckMastersWithUsage配列から削除される', async () => {
      // 【テスト目的】: deleteDeckMasterが正常にデータを削除すること
      const decks: DeckMasterWithUsage[] = [
        {
          id: 'deck-001',
          className: 'エルフ',
          deckName: 'エルフデッキ1',
          sortOrder: 1,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          usageCount: 0,
          lastUsedDate: null,
        },
        {
          id: 'deck-002',
          className: 'ロイヤル',
          deckName: 'ロイヤルデッキ1',
          sortOrder: 2,
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
          usageCount: 0,
          lastUsedDate: null,
        },
      ];
      useDeckStore.setState({ deckMastersWithUsage: decks });

      vi.mocked(apiClient.apiClient.del).mockResolvedValueOnce(undefined);

      await useDeckStore.getState().deleteDeckMaster('deck-001');

      const state = useDeckStore.getState();
      expect(state.deckMastersWithUsage).toHaveLength(1);
      expect(state.deckMastersWithUsage[0].id).toBe('deck-002');
      expect(apiClient.apiClient.del).toHaveBeenCalledWith('/deck-masters/deck-001');
    });

    it('TC-STORE-DMU-009: 削除エラー時にエラーがthrowされ、deckMasterErrorが設定される', async () => {
      // 【テスト目的】: エラー時に例外が投げられ、かつdeckMasterErrorが設定されることを確認
      const mockError = new Error('削除に失敗しました');
      vi.mocked(apiClient.apiClient.del).mockRejectedValueOnce(mockError);

      await expect(useDeckStore.getState().deleteDeckMaster('deck-001')).rejects.toThrow(
        '削除に失敗しました'
      );

      // エラー状態も設定されることを確認（fetchDeckMastersWithUsageとの一貫性）
      expect(useDeckStore.getState().deckMasterError).toBe('削除に失敗しました');
    });
  });

  // ==================== clearDeckMasterError() テスト ====================
  describe('clearDeckMasterError()', () => {
    it('TC-STORE-DMU-010: エラークリアでdeckMasterErrorがnullになる', () => {
      // 【テスト目的】: clearDeckMasterErrorが正常に動作すること
      useDeckStore.setState({ deckMasterError: 'エラーメッセージ' });

      useDeckStore.getState().clearDeckMasterError();

      expect(useDeckStore.getState().deckMasterError).toBeNull();
    });
  });
});

/**
 * MyDeck APIクライアント関数の単体テスト
 * 【テストファイル概要】: TASK-0004 - APIクライアント共通処理拡張
 * 【テスト目的】: MyDeckのCRUD操作を行うAPI関数の動作を検証する
 */

import type { MyDeck } from '@shadowverse-log/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearCache } from './client';
import { createMyDeck, deleteMyDeck, fetchMyDecks } from './my-deck';

describe('MyDeck API Client', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    // 【キャッシュクリア】: テスト間のキャッシュ干渉を防ぐ
    clearCache();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==================== fetchMyDecks テスト ====================

  describe('fetchMyDecks', () => {
    it('正常系: 使用デッキ一覧を取得できること', async () => {
      // 【テスト目的】: fetchMyDecks()が正常にGETリクエストを送信し、MyDeck[]を返すこと
      const mockMyDecks: MyDeck[] = [
        {
          id: 'md-001',
          deckId: 'dm-001',
          deckCode: 'abc123',
          deckName: 'メインエルフ',
          isActive: true,
          createdAt: '2025-01-25T10:00:00Z',
        },
        {
          id: 'md-002',
          deckId: 'dm-002',
          deckCode: 'def456',
          deckName: 'サブロイヤル',
          isActive: false,
          createdAt: '2025-01-26T10:00:00Z',
        },
      ];

      const mockResponse = {
        success: true,
        data: mockMyDecks,
        meta: { timestamp: '2025-01-27T12:00:00Z', requestId: 'req-001' },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await fetchMyDecks();

      expect(result).toEqual(mockMyDecks);
      expect(result).toHaveLength(2);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/my-decks'),
        expect.any(Object)
      );
    });
  });

  // ==================== createMyDeck テスト ====================

  describe('createMyDeck', () => {
    it('正常系: 使用デッキを追加できること', async () => {
      // 【テスト目的】: createMyDeck()が正常にPOSTリクエストを送信し、作成されたMyDeckを返すこと
      const requestData = {
        deckId: 'dm-001',
        deckName: '新しいエルフデッキ',
        deckCode: 'xyz789',
      };

      const mockCreatedMyDeck: MyDeck = {
        id: 'md-003',
        deckId: 'dm-001',
        deckCode: 'xyz789',
        deckName: '新しいエルフデッキ',
        isActive: true,
        createdAt: '2025-01-27T12:00:00Z',
      };

      const mockResponse = {
        success: true,
        data: mockCreatedMyDeck,
        meta: { timestamp: '2025-01-27T12:00:00Z', requestId: 'req-002' },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await createMyDeck(requestData);

      expect(result).toEqual(mockCreatedMyDeck);
      expect(result.id).toBe('md-003');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/my-decks'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestData),
        })
      );
    });

    it('正常系: デッキコードなしで使用デッキを追加できること', async () => {
      // 【テスト目的】: deckCodeが任意であることを確認
      const requestData = {
        deckId: 'dm-002',
        deckName: 'デッキコードなしロイヤル',
      };

      const mockCreatedMyDeck: MyDeck = {
        id: 'md-004',
        deckId: 'dm-002',
        deckCode: '',
        deckName: 'デッキコードなしロイヤル',
        isActive: true,
        createdAt: '2025-01-27T12:00:00Z',
      };

      const mockResponse = {
        success: true,
        data: mockCreatedMyDeck,
        meta: { timestamp: '2025-01-27T12:00:00Z', requestId: 'req-003' },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await createMyDeck(requestData);

      expect(result).toEqual(mockCreatedMyDeck);
      expect(result.deckCode).toBe('');
    });

    it('異常系: ValidationError時にエラーがスローされること', async () => {
      // 【テスト目的】: バリデーションエラー時に適切なエラーメッセージがスローされること
      const requestData = {
        deckId: '',
        deckName: '',
      };

      const mockErrorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'デッキ名は必須です',
          details: [{ field: 'deckName', constraint: 'required', value: '' }],
        },
        meta: { timestamp: '2025-01-27T12:00:00Z', requestId: 'req-004' },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockErrorResponse,
      } as Response);

      await expect(createMyDeck(requestData)).rejects.toThrow('デッキ名は必須です');
    });
  });

  // ==================== deleteMyDeck テスト ====================

  describe('deleteMyDeck', () => {
    it('正常系: 使用デッキを削除できること', async () => {
      // 【テスト目的】: deleteMyDeck()が正常にDELETEリクエストを送信すること
      const id = 'md-001';

      const mockResponse = {
        success: true,
        data: { message: '使用デッキを削除しました' },
        meta: { timestamp: '2025-01-27T12:00:00Z', requestId: 'req-005' },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await expect(deleteMyDeck(id)).resolves.not.toThrow();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/my-decks/md-001'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('異常系: DeleteConstraintError時にエラーがスローされること', async () => {
      // 【テスト目的】: 削除制約エラー時に適切なエラーメッセージがスローされること
      const id = 'md-001';

      const mockErrorResponse = {
        success: false,
        error: {
          code: 'DELETE_CONSTRAINT_ERROR',
          message: 'この使用デッキは3件の対戦履歴で使用されているため削除できません',
          details: {
            entityType: 'myDeck',
            entityId: 'md-001',
            referencedBy: 'battleLogs',
            referenceCount: 3,
          },
        },
        meta: { timestamp: '2025-01-27T12:00:00Z', requestId: 'req-006' },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockErrorResponse,
      } as Response);

      await expect(deleteMyDeck(id)).rejects.toThrow(
        'この使用デッキは3件の対戦履歴で使用されているため削除できません'
      );
    });
  });
});

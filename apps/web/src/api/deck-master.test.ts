/**
 * DeckMaster APIクライアント関数の単体テスト
 * 【テストファイル概要】: TASK-0004 - APIクライアント共通処理拡張
 * 【テスト目的】: DeckMasterのCRUD操作を行うAPI関数の動作を検証する
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchDeckMasters,
  fetchDeckMastersWithUsage,
  createDeckMaster,
  updateDeckMaster,
  deleteDeckMaster,
} from './deck-master';
import { clearCache } from './client';
import type { DeckMaster, DeckMasterWithUsage } from '@shadowverse-log/shared';

describe('DeckMaster API Client', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    // 【キャッシュクリア】: テスト間のキャッシュ干渉を防ぐ
    clearCache();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==================== fetchDeckMasters テスト ====================

  describe('fetchDeckMasters', () => {
    it('正常系: デッキ種別一覧を取得できること', async () => {
      // 【テスト目的】: fetchDeckMasters()が正常にGETリクエストを送信し、DeckMaster[]を返すこと
      const mockDeckMasters: DeckMaster[] = [
        { id: 'dm-001', className: 'エルフ', deckName: 'フェアリーエルフ', sortOrder: 1 },
        { id: 'dm-002', className: 'ロイヤル', deckName: '連携ロイヤル', sortOrder: 2 },
      ];

      const mockResponse = {
        success: true,
        data: mockDeckMasters,
        meta: { timestamp: '2025-01-27T12:00:00Z', requestId: 'req-001' },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await fetchDeckMasters();

      expect(result).toEqual(mockDeckMasters);
      expect(result).toHaveLength(2);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/deck-masters'),
        expect.any(Object)
      );
    });

    it('正常系: includeUsageパラメータ付きでリクエストできること', async () => {
      // 【テスト目的】: includeUsage=trueの場合、クエリパラメータが付加されること
      const mockDeckMastersWithUsage: DeckMasterWithUsage[] = [
        {
          id: 'dm-001',
          className: 'エルフ',
          deckName: 'フェアリーエルフ',
          sortOrder: 1,
          lastUsedDate: '2025-01-25',
          usageCount: 10,
        },
      ];

      const mockResponse = {
        success: true,
        data: mockDeckMastersWithUsage,
        meta: { timestamp: '2025-01-27T12:00:00Z', requestId: 'req-002' },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await fetchDeckMasters({ includeUsage: true });

      expect(result).toEqual(mockDeckMastersWithUsage);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/deck-masters?includeUsage=true'),
        expect.any(Object)
      );
    });
  });

  // ==================== fetchDeckMastersWithUsage テスト ====================

  describe('fetchDeckMastersWithUsage', () => {
    it('正常系: 使用履歴付きデッキ種別一覧を取得できること', async () => {
      // 【テスト目的】: fetchDeckMastersWithUsage()が正常にDeckMasterWithUsage[]を返すこと
      const mockDeckMastersWithUsage: DeckMasterWithUsage[] = [
        {
          id: 'dm-001',
          className: 'エルフ',
          deckName: 'フェアリーエルフ',
          sortOrder: 1,
          lastUsedDate: '2025-01-25',
          usageCount: 10,
        },
        {
          id: 'dm-002',
          className: 'ロイヤル',
          deckName: '連携ロイヤル',
          sortOrder: 2,
          lastUsedDate: null,
          usageCount: 0,
        },
      ];

      const mockResponse = {
        success: true,
        data: mockDeckMastersWithUsage,
        meta: { timestamp: '2025-01-27T12:00:00Z', requestId: 'req-003' },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await fetchDeckMastersWithUsage();

      expect(result).toEqual(mockDeckMastersWithUsage);
      expect(result[0].lastUsedDate).toBe('2025-01-25');
      expect(result[0].usageCount).toBe(10);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/deck-masters?includeUsage=true'),
        expect.any(Object)
      );
    });
  });

  // ==================== createDeckMaster テスト ====================

  describe('createDeckMaster', () => {
    it('正常系: デッキ種別を追加できること', async () => {
      // 【テスト目的】: createDeckMaster()が正常にPOSTリクエストを送信し、作成されたDeckMasterを返すこと
      const requestData = {
        className: 'ウィッチ',
        deckName: '秘術ウィッチ',
      };

      const mockCreatedDeckMaster: DeckMaster = {
        id: 'dm-003',
        className: 'ウィッチ',
        deckName: '秘術ウィッチ',
        sortOrder: 3,
      };

      const mockResponse = {
        success: true,
        data: mockCreatedDeckMaster,
        meta: { timestamp: '2025-01-27T12:00:00Z', requestId: 'req-004' },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await createDeckMaster(requestData);

      expect(result).toEqual(mockCreatedDeckMaster);
      expect(result.id).toBe('dm-003');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/deck-masters'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestData),
        })
      );
    });

    it('異常系: ValidationError時にエラーがスローされること', async () => {
      // 【テスト目的】: バリデーションエラー時に適切なエラーメッセージがスローされること
      const requestData = {
        className: '',
        deckName: '',
      };

      const mockErrorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'デッキ名は必須です',
          details: [
            { field: 'deckName', constraint: 'required', value: '' },
          ],
        },
        meta: { timestamp: '2025-01-27T12:00:00Z', requestId: 'req-005' },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockErrorResponse,
      } as Response);

      await expect(createDeckMaster(requestData)).rejects.toThrow('デッキ名は必須です');
    });
  });

  // ==================== updateDeckMaster テスト ====================

  describe('updateDeckMaster', () => {
    it('正常系: デッキ種別を更新できること', async () => {
      // 【テスト目的】: updateDeckMaster()が正常にPUTリクエストを送信し、更新されたDeckMasterを返すこと
      const id = 'dm-001';
      const requestData = {
        deckName: 'フェアリーエルフ改',
      };

      const mockUpdatedDeckMaster: DeckMaster = {
        id: 'dm-001',
        className: 'エルフ',
        deckName: 'フェアリーエルフ改',
        sortOrder: 1,
      };

      const mockResponse = {
        success: true,
        data: mockUpdatedDeckMaster,
        meta: { timestamp: '2025-01-27T12:00:00Z', requestId: 'req-006' },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await updateDeckMaster(id, requestData);

      expect(result).toEqual(mockUpdatedDeckMaster);
      expect(result.deckName).toBe('フェアリーエルフ改');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/deck-masters/dm-001'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(requestData),
        })
      );
    });
  });

  // ==================== deleteDeckMaster テスト ====================

  describe('deleteDeckMaster', () => {
    it('正常系: デッキ種別を削除できること', async () => {
      // 【テスト目的】: deleteDeckMaster()が正常にDELETEリクエストを送信すること
      const id = 'dm-001';

      const mockResponse = {
        success: true,
        data: { message: 'デッキ種別を削除しました' },
        meta: { timestamp: '2025-01-27T12:00:00Z', requestId: 'req-007' },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await expect(deleteDeckMaster(id)).resolves.not.toThrow();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/deck-masters/dm-001'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('異常系: DeleteConstraintError時にエラーがスローされること', async () => {
      // 【テスト目的】: 削除制約エラー時に適切なエラーメッセージがスローされること
      const id = 'dm-001';

      const mockErrorResponse = {
        success: false,
        error: {
          code: 'DELETE_CONSTRAINT_ERROR',
          message: 'このデッキ種別は5件の対戦履歴で使用されているため削除できません',
          details: {
            entityType: 'deckMaster',
            entityId: 'dm-001',
            referencedBy: 'battleLogs',
            referenceCount: 5,
          },
        },
        meta: { timestamp: '2025-01-27T12:00:00Z', requestId: 'req-008' },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockErrorResponse,
      } as Response);

      await expect(deleteDeckMaster(id)).rejects.toThrow(
        'このデッキ種別は5件の対戦履歴で使用されているため削除できません'
      );
    });
  });
});

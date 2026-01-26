/**
 * Statistics APIクライアント関数の単体テスト
 * 【テストファイル概要】: TASK-0004 - APIクライアント共通処理拡張
 * 【テスト目的】: 統計データ取得APIの動作を検証する
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchAvailableSeasons,
  fetchStatistics,
  fetchStatisticsBySeason,
} from './statistics';
import { clearCache } from './client';
import type { SeasonStatistics } from '@shadowverse-log/shared';

describe('Statistics API Client', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    // 【キャッシュクリア】: テスト間のキャッシュ干渉を防ぐ
    clearCache();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==================== fetchAvailableSeasons テスト ====================

  describe('fetchAvailableSeasons', () => {
    it('正常系: 利用可能なシーズン一覧を取得できること', async () => {
      // 【テスト目的】: fetchAvailableSeasons()が正常にGETリクエストを送信し、number[]を返すこと
      const mockSeasons: number[] = [1, 2, 3, 4, 5];

      const mockResponse = {
        success: true,
        data: mockSeasons,
        meta: { timestamp: '2025-01-27T12:00:00Z', requestId: 'req-001' },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await fetchAvailableSeasons();

      expect(result).toEqual(mockSeasons);
      expect(result).toHaveLength(5);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/statistics/seasons'),
        expect.any(Object)
      );
    });

    it('正常系: シーズンデータがない場合に空配列を返すこと', async () => {
      // 【テスト目的】: データがない場合でも正常に処理されること
      const mockSeasons: number[] = [];

      const mockResponse = {
        success: true,
        data: mockSeasons,
        meta: { timestamp: '2025-01-27T12:00:00Z', requestId: 'req-002' },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await fetchAvailableSeasons();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  // ==================== fetchStatistics テスト ====================

  describe('fetchStatistics', () => {
    it('正常系: シーズン指定なしで統計データを取得できること', async () => {
      // 【テスト目的】: fetchStatistics()が正常にGETリクエストを送信し、SeasonStatisticsを返すこと
      const mockStatistics: SeasonStatistics = {
        season: 5,
        totalMatches: 100,
        wins: 60,
        losses: 40,
        winRate: 60.0,
        firstWinRate: 65.0,
        secondWinRate: 55.0,
      };

      const mockResponse = {
        success: true,
        data: mockStatistics,
        meta: { timestamp: '2025-01-27T12:00:00Z', requestId: 'req-003' },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await fetchStatistics();

      expect(result).toEqual(mockStatistics);
      expect(result.season).toBe(5);
      expect(result.winRate).toBe(60.0);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/statistics$/),
        expect.any(Object)
      );
    });

    it('正常系: シーズン指定ありで統計データを取得できること', async () => {
      // 【テスト目的】: season パラメータが正しくクエリ文字列に含まれること
      const mockStatistics: SeasonStatistics = {
        season: 1,
        totalMatches: 50,
        wins: 30,
        losses: 20,
        winRate: 60.0,
        firstWinRate: 62.0,
        secondWinRate: 58.0,
      };

      const mockResponse = {
        success: true,
        data: mockStatistics,
        meta: { timestamp: '2025-01-27T12:00:00Z', requestId: 'req-004' },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await fetchStatistics({ season: 1 });

      expect(result).toEqual(mockStatistics);
      expect(result.season).toBe(1);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/statistics?season=1'),
        expect.any(Object)
      );
    });
  });

  // ==================== fetchStatisticsBySeason テスト ====================

  describe('fetchStatisticsBySeason', () => {
    it('正常系: 指定シーズンの統計データを取得できること', async () => {
      // 【テスト目的】: fetchStatisticsBySeason()がfetchStatistics({ season })を呼び出すこと
      const mockStatistics: SeasonStatistics = {
        season: 3,
        totalMatches: 75,
        wins: 45,
        losses: 30,
        winRate: 60.0,
        firstWinRate: 63.0,
        secondWinRate: 57.0,
      };

      const mockResponse = {
        success: true,
        data: mockStatistics,
        meta: { timestamp: '2025-01-27T12:00:00Z', requestId: 'req-005' },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await fetchStatisticsBySeason(3);

      expect(result).toEqual(mockStatistics);
      expect(result.season).toBe(3);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/statistics?season=3'),
        expect.any(Object)
      );
    });
  });
});

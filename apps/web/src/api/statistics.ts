/**
 * Statistics APIクライアント関数
 * 【機能概要】: シーズン別統計データ取得のAPI関数群
 * 【TASK-0004】: APIクライアント共通処理拡張
 * 🔵 信頼性レベル: requirements.md REQ-EXT-203〜REQ-EXT-205対応
 */

import { apiClient } from './client';
import type { SeasonStatistics, StatisticsQueryParams } from '@shadowverse-log/shared';

/**
 * 【機能概要】: 利用可能なシーズン一覧を取得
 * 【実装方針】: GETリクエストを送信し、シーズン番号の配列を返す
 * 🔵 信頼性レベル: requirements.md REQ-EXT-205対応
 *
 * @returns Promise<number[]> - シーズン番号の配列
 */
export async function fetchAvailableSeasons(): Promise<number[]> {
  return apiClient.get<number[]>('/statistics/seasons');
}

/**
 * 【機能概要】: 統計データを取得
 * 【実装方針】: シーズン指定がある場合はクエリパラメータに含める
 * 🔵 信頼性レベル: requirements.md REQ-EXT-203対応
 *
 * @param params - クエリパラメータ（season: シーズン番号、省略時は最新シーズン）
 * @returns Promise<SeasonStatistics> - シーズン統計データ
 */
export async function fetchStatistics(
  params?: StatisticsQueryParams
): Promise<SeasonStatistics> {
  const queryString = params?.season ? `?season=${params.season}` : '';
  return apiClient.get<SeasonStatistics>(`/statistics${queryString}`);
}

/**
 * 【機能概要】: 指定シーズンの統計データを取得
 * 【実装方針】: fetchStatisticsにseasonパラメータを渡す
 * 🔵 信頼性レベル: requirements.md REQ-EXT-204対応
 *
 * @param season - シーズン番号
 * @returns Promise<SeasonStatistics> - 指定シーズンの統計データ
 */
export async function fetchStatisticsBySeason(season: number): Promise<SeasonStatistics> {
  return fetchStatistics({ season });
}

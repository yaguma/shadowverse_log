/**
 * DeckMaster APIクライアント関数
 * 【機能概要】: デッキ種別（相手デッキ）のCRUD操作を行うAPI関数群
 * 【TASK-0004】: APIクライアント共通処理拡張
 * 🔵 信頼性レベル: architecture.md API設計に基づく
 */

import type {
  DeckMaster,
  DeckMasterCreateRequest,
  DeckMasterQueryParams,
  DeckMasterUpdateRequest,
  DeckMasterWithUsage,
} from '@shadowverse-log/shared';
import { apiClient } from './client';

/**
 * 【機能概要】: デッキ種別一覧を取得
 * 【実装方針】: includeUsageパラメータに応じてクエリ文字列を付加
 * 🔵 信頼性レベル: architecture.md API設計に基づく
 *
 * @param params - クエリパラメータ（includeUsage: 使用履歴を含めるか）
 * @returns Promise<DeckMaster[]> - デッキ種別一覧
 */
export async function fetchDeckMasters(params?: DeckMasterQueryParams): Promise<DeckMaster[]> {
  const queryString = params?.includeUsage ? '?includeUsage=true' : '';
  return apiClient.get<DeckMaster[]>(`/deck-masters${queryString}`);
}

/**
 * 【機能概要】: 使用履歴付きデッキ種別一覧を取得
 * 【実装方針】: fetchDeckMastersにincludeUsage=trueを指定
 * 🔵 信頼性レベル: architecture.md API設計に基づく
 *
 * @returns Promise<DeckMasterWithUsage[]> - 使用履歴付きデッキ種別一覧
 */
export async function fetchDeckMastersWithUsage(): Promise<DeckMasterWithUsage[]> {
  return apiClient.get<DeckMasterWithUsage[]>('/deck-masters?includeUsage=true');
}

/**
 * 【機能概要】: デッキ種別を追加
 * 【実装方針】: POSTリクエストを送信し、作成されたデッキ種別を返す
 * 🔵 信頼性レベル: architecture.md API設計に基づく
 *
 * @param data - 追加データ（className, deckName）
 * @returns Promise<DeckMaster> - 作成されたデッキ種別
 */
export async function createDeckMaster(data: DeckMasterCreateRequest): Promise<DeckMaster> {
  return apiClient.post<DeckMaster>('/deck-masters', data);
}

/**
 * 【機能概要】: デッキ種別を更新
 * 【実装方針】: PUTリクエストを送信し、更新されたデッキ種別を返す
 * 🔵 信頼性レベル: architecture.md API設計に基づく
 *
 * @param id - デッキ種別ID
 * @param data - 更新データ（deckName）- classNameは変更不可
 * @returns Promise<DeckMaster> - 更新されたデッキ種別
 */
export async function updateDeckMaster(
  id: string,
  data: DeckMasterUpdateRequest
): Promise<DeckMaster> {
  return apiClient.put<DeckMaster>(`/deck-masters/${id}`, data);
}

/**
 * 【機能概要】: デッキ種別を削除
 * 【実装方針】: DELETEリクエストを送信
 * 【注意】: 対戦履歴で参照されている場合はDeleteConstraintErrorが発生
 * 🔵 信頼性レベル: architecture.md API設計に基づく
 *
 * @param id - デッキ種別ID
 * @returns Promise<void>
 */
export async function deleteDeckMaster(id: string): Promise<void> {
  return apiClient.del<void>(`/deck-masters/${id}`);
}

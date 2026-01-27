/**
 * MyDeck APIクライアント関数
 * 【機能概要】: 使用デッキのCRUD操作を行うAPI関数群
 * 【TASK-0004】: APIクライアント共通処理拡張
 * 🔵 信頼性レベル: architecture.md API設計に基づく
 */

import { apiClient } from './client';
import type { MyDeck, MyDeckCreateRequest } from '@shadowverse-log/shared';

/**
 * 【機能概要】: 使用デッキ一覧を取得
 * 【実装方針】: GETリクエストを送信し、デッキ一覧を返す
 * 🔵 信頼性レベル: architecture.md API設計に基づく
 *
 * @returns Promise<MyDeck[]> - 使用デッキ一覧
 */
export async function fetchMyDecks(): Promise<MyDeck[]> {
  return apiClient.get<MyDeck[]>('/my-decks');
}

/**
 * 【機能概要】: 使用デッキを追加
 * 【実装方針】: POSTリクエストを送信し、作成された使用デッキを返す
 * 🔵 信頼性レベル: architecture.md API設計に基づく
 *
 * @param data - 追加データ（deckId, deckName, deckCode?）
 * @returns Promise<MyDeck> - 作成された使用デッキ
 */
export async function createMyDeck(data: MyDeckCreateRequest): Promise<MyDeck> {
  return apiClient.post<MyDeck>('/my-decks', data);
}

/**
 * 【機能概要】: 使用デッキを削除
 * 【実装方針】: DELETEリクエストを送信
 * 【注意】: 対戦履歴で参照されている場合はDeleteConstraintErrorが発生
 * 🔵 信頼性レベル: architecture.md API設計に基づく
 *
 * @param id - 使用デッキID
 * @returns Promise<void>
 */
export async function deleteMyDeck(id: string): Promise<void> {
  return apiClient.del<void>(`/my-decks/${id}`);
}

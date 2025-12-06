/**
 * マイデッキエンティティ
 */
export interface MyDeck {
  /** デッキID */
  id: string;
  /** デッキマスターID */
  deckId: string;
  /** デッキコード */
  deckCode: string;
  /** デッキ名 */
  deckName: string;
  /** 使用中フラグ */
  isActive: boolean;
  /** ユーザーID（Phase 2で必須化予定） */
  userId?: string;
  /** 作成日時 (ISO 8601形式) */
  createdAt: string;
  /** 更新日時 */
  updatedAt?: string;
}

/**
 * マイデッキ登録リクエスト型
 */
export interface CreateMyDeckRequest {
  /** デッキコード */
  deckCode: string;
  /** デッキ名 */
  deckName: string;
  /** 使用中フラグ（省略時はtrue） */
  isActive?: boolean;
}

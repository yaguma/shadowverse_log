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
 * マイデッキ登録リクエスト型（既存互換）
 */
export interface CreateMyDeckRequest {
  /** デッキコード */
  deckCode: string;
  /** デッキ名 */
  deckName: string;
  /** 使用中フラグ（省略時はtrue） */
  isActive?: boolean;
}

/**
 * 使用デッキ追加リクエスト
 * REQ-EXT-101 ~ REQ-EXT-107 対応
 */
export interface MyDeckCreateRequest {
  /** デッキ種別ID（DeckMasterのid） */
  deckId: string;
  /** デッキ名（自由入力） */
  deckName: string;
  /** デッキコード（任意、バリデーションなし） */
  deckCode?: string;
}

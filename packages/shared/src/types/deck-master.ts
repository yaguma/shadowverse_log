/**
 * デッキマスターエンティティ（相手デッキ）
 */
export interface DeckMaster {
  /** デッキID */
  id: string;
  /** クラス名 */
  className: string;
  /** デッキ名 */
  deckName: string;
  /** ソート順 */
  sortOrder: number;
  /** 作成日時 */
  createdAt?: string;
  /** 更新日時 */
  updatedAt?: string;
}

/**
 * 使用履歴付きデッキ種別
 * REQ-EXT-302 対応（相手デッキ選択肢のソート用）
 */
export interface DeckMasterWithUsage extends DeckMaster {
  /** 最後に対戦相手として使用された日付 */
  lastUsedDate: string | null;
  /** 対戦相手として使用された回数 */
  usageCount: number;
}

/**
 * デッキマスター登録リクエスト型（既存互換）
 */
export interface CreateDeckMasterRequest {
  /** クラス名 */
  className: string;
  /** デッキ名 */
  deckName: string;
  /** ソート順 */
  sortOrder: number;
}

/**
 * デッキ種別追加リクエスト
 * REQ-EXT-001 ~ REQ-EXT-005 対応
 */
export interface DeckMasterCreateRequest {
  /** クラス名（選択式） */
  className: string;
  /** デッキ名（自由入力） */
  deckName: string;
}

/**
 * デッキ種別更新リクエスト
 * REQ-EXT-006 ~ REQ-EXT-007 対応
 */
export interface DeckMasterUpdateRequest {
  /** デッキ名（自由入力）- classNameは変更不可 */
  deckName: string;
}

/**
 * デッキ種別取得リクエストパラメータ
 * REQ-EXT-302 対応
 */
export interface DeckMasterQueryParams {
  /** 使用履歴情報を含めるか */
  includeUsage?: boolean;
}

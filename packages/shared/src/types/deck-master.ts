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
 * 使用履歴付きデッキマスター
 * 相手デッキ選択肢のソート用に、最終使用日と使用回数を保持
 */
export interface DeckMasterWithUsage extends DeckMaster {
  /** 最後に対戦相手として使用された日付 */
  lastUsedDate: string | null;
  /** 対戦相手として使用された回数 */
  usageCount: number;
}

/**
 * デッキマスター登録リクエスト型
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
 * デッキマスター作成リクエスト型（新規）
 */
export interface DeckMasterCreateRequest {
  /** クラス名 */
  className: string;
  /** デッキ名 */
  deckName: string;
}

/**
 * デッキマスター更新リクエスト型
 */
export interface DeckMasterUpdateRequest {
  /** デッキ名 */
  deckName: string;
}

/**
 * デッキマスター取得クエリパラメータ
 */
export interface DeckMasterQueryParams {
  /** 使用履歴を含めるかどうか */
  includeUsage?: boolean;
}

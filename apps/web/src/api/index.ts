/**
 * APIクライアントモジュールのエクスポート
 * 【TASK-0004】: APIクライアント共通処理拡張
 * 🔵 信頼性レベル: 既存パターンに従う
 */

// APIクライアント基盤
export { apiClient, clearCache, setAuthTokenGetter, extractErrorMessage } from './client';

// DeckMaster API
export {
  fetchDeckMasters,
  fetchDeckMastersWithUsage,
  createDeckMaster,
  updateDeckMaster,
  deleteDeckMaster,
} from './deck-master';

// MyDeck API
export { fetchMyDecks, createMyDeck, deleteMyDeck } from './my-deck';

// Statistics API
export { fetchAvailableSeasons, fetchStatistics, fetchStatisticsBySeason } from './statistics';

// エラーハンドリング
export {
  isValidationError,
  isDeleteConstraintError,
  translateValidationConstraint,
  getValidationErrorMessages,
  translateDeleteConstraintError,
  translateApiError,
  getReferenceCount,
  getEntityType,
} from './error-handler';

/**
 * APIクライアントモジュールのエクスポート
 * 【TASK-0004】: APIクライアント共通処理拡張
 * 🔵 信頼性レベル: 既存パターンに従う
 */

// APIクライアント基盤
export { apiClient, clearCache, extractErrorMessage, setAuthTokenGetter } from './client';

// DeckMaster API
export {
  createDeckMaster,
  deleteDeckMaster,
  fetchDeckMasters,
  fetchDeckMastersWithUsage,
  updateDeckMaster,
} from './deck-master';
// エラーハンドリング
export {
  getEntityType,
  getReferenceCount,
  getValidationErrorMessages,
  isDeleteConstraintError,
  isValidationError,
  translateApiError,
  translateDeleteConstraintError,
  translateValidationConstraint,
} from './error-handler';
// MyDeck API
export { createMyDeck, deleteMyDeck, fetchMyDecks } from './my-deck';
// Statistics API
export { fetchAvailableSeasons, fetchStatistics, fetchStatisticsBySeason } from './statistics';

import type { DeckMaster, DeckMasterCreateRequest, DeckMasterUpdateRequest, DeckMasterWithUsage } from './deck-master.js';
import type { MyDeck, MyDeckCreateRequest } from './my-deck.js';
import type { SeasonStatistics } from './statistics.js';

/**
 * デッキ管理Store型
 */
export interface DeckStore {
  // 状態
  /** デッキマスター一覧 */
  deckMasters: DeckMaster[];
  /** 使用履歴付きデッキマスター一覧 */
  deckMastersWithUsage: DeckMasterWithUsage[];
  /** マイデッキ一覧 */
  myDecks: MyDeck[];
  /** ローディング状態 */
  isLoading: boolean;
  /** エラーメッセージ */
  error: string | null;

  // アクション
  /** デッキマスター一覧を取得 */
  fetchDeckMasters: () => Promise<void>;
  /** 使用履歴付きデッキマスター一覧を取得 */
  fetchDeckMastersWithUsage: () => Promise<void>;
  /** マイデッキ一覧を取得 */
  fetchMyDecks: () => Promise<void>;
  /** デッキマスターを追加 */
  addDeckMaster: (data: DeckMasterCreateRequest) => Promise<void>;
  /** デッキマスターを更新 */
  updateDeckMaster: (id: string, data: DeckMasterUpdateRequest) => Promise<void>;
  /** デッキマスターを削除 */
  deleteDeckMaster: (id: string) => Promise<void>;
  /** マイデッキを追加 */
  addMyDeck: (data: MyDeckCreateRequest) => Promise<void>;
  /** マイデッキを削除 */
  deleteMyDeck: (id: string) => Promise<void>;
  /** エラーをクリア */
  clearError: () => void;
}

/**
 * 統計Store型
 */
export interface StatisticsStore {
  // 状態
  /** シーズン統計 */
  statistics: SeasonStatistics | null;
  /** 選択中のシーズン */
  selectedSeason: number | null;
  /** 利用可能なシーズン一覧 */
  availableSeasons: number[];
  /** ローディング状態 */
  isLoading: boolean;
  /** エラーメッセージ */
  error: string | null;

  // アクション
  /** 統計を取得 */
  fetchStatistics: () => Promise<void>;
  /** 利用可能なシーズン一覧を取得 */
  fetchSeasons: () => Promise<void>;
  /** シーズンを選択 */
  setSelectedSeason: (season: number) => void;
  /** 指定シーズンの統計を取得 */
  fetchStatisticsBySeason: (season: number) => Promise<void>;
  /** エラーをクリア */
  clearError: () => void;
}

/**
 * Zustand Store 型定義
 *
 * DeckStore: デッキ管理用Store
 * StatisticsStore: 統計管理用Store
 */

import type { DeckMaster, DeckMasterWithUsage, DeckMasterCreateRequest, DeckMasterUpdateRequest } from './deck-master.js';
import type { MyDeck, MyDeckCreateRequest } from './my-deck.js';
import type { SeasonStatistics } from './statistics.js';

/**
 * デッキStore状態・アクション
 */
export interface DeckStore {
  // === 状態 ===
  /** デッキ種別一覧 */
  deckMasters: DeckMaster[];
  /** 使用履歴付きデッキ種別一覧（相手デッキ選択用） */
  deckMastersWithUsage: DeckMasterWithUsage[];
  /** 使用デッキ一覧 */
  myDecks: MyDeck[];
  /** ローディング状態 */
  isLoading: boolean;
  /** エラーメッセージ */
  error: string | null;

  // === 既存アクション ===
  /** デッキ種別一覧を取得 */
  fetchDeckMasters: () => Promise<void>;
  /** 使用デッキ一覧を取得 */
  fetchMyDecks: () => Promise<void>;

  // === 新規アクション（DeckMaster CRUD）===
  /** 使用履歴付きデッキ種別一覧を取得 */
  fetchDeckMastersWithUsage: () => Promise<void>;
  /** デッキ種別を追加 */
  addDeckMaster: (data: DeckMasterCreateRequest) => Promise<void>;
  /** デッキ種別を更新 */
  updateDeckMaster: (id: string, data: DeckMasterUpdateRequest) => Promise<void>;
  /** デッキ種別を削除 */
  deleteDeckMaster: (id: string) => Promise<void>;

  // === 新規アクション（MyDeck CRUD）===
  /** 使用デッキを追加 */
  addMyDeck: (data: MyDeckCreateRequest) => Promise<void>;
  /** 使用デッキを削除 */
  deleteMyDeck: (id: string) => Promise<void>;

  // === ユーティリティ ===
  /** エラーをクリア */
  clearError: () => void;
}

/**
 * 統計Store状態・アクション
 */
export interface StatisticsStore {
  // === 状態 ===
  /** 統計データ */
  statistics: SeasonStatistics | null;
  /** 選択中のシーズン */
  selectedSeason: number | null;
  /** 利用可能なシーズン一覧 */
  availableSeasons: number[];
  /** ローディング状態 */
  isLoading: boolean;
  /** エラーメッセージ */
  error: string | null;

  // === 既存アクション ===
  /** 統計を取得（最新シーズン） */
  fetchStatistics: () => Promise<void>;

  // === 新規アクション ===
  /** シーズン一覧を取得 */
  fetchSeasons: () => Promise<void>;
  /** 選択シーズンを設定 */
  setSelectedSeason: (season: number) => void;
  /** 指定シーズンの統計を取得 */
  fetchStatisticsBySeason: (season: number) => Promise<void>;

  // === ユーティリティ ===
  /** エラーをクリア */
  clearError: () => void;
}

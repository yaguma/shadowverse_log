/**
 * デッキ管理機能拡張 TypeScript インターフェース定義
 *
 * 作成日: 2025-01-26
 * 関連要件定義: docs/spec/deck-management-extension/requirements.md
 * ベースインターフェース: docs/design/shadowverse-battle-log/interfaces.ts
 *
 * 【信頼性レベル凡例】:
 * - 🔵 青信号: ユーザヒアリング・設計文書を参考にした確実な定義
 * - 🟡 黄信号: ユーザヒアリング・設計文書から妥当な推測による定義
 * - 🔴 赤信号: ユーザヒアリング・設計文書にない推測による定義
 */

// ============================================
// 1. エンティティ定義（既存 - 変更なし）🔵
// ============================================

/**
 * デッキ種別マスター
 * REQ-EXT-001 ~ REQ-EXT-008 対応
 */
export interface DeckMaster {
  /** 一意識別子（UUID自動採番） */
  id: string;
  /** クラス名（エルフ、ロイヤル、ウィッチ等） */
  className: string;
  /** デッキ名（自由入力） */
  deckName: string;
  /** ソート順（自動採番） */
  sortOrder: number;
  /** 作成日時 */
  createdAt?: string;
  /** 更新日時 */
  updatedAt?: string;
}

/**
 * 使用デッキ
 * REQ-EXT-101 ~ REQ-EXT-108 対応
 */
export interface MyDeck {
  /** 一意識別子（UUID自動採番） */
  id: string;
  /** デッキ種別ID（DeckMasterのid参照） */
  deckId: string;
  /** デッキコード（シャドウバース公式コード、空白可） */
  deckCode: string;
  /** デッキ名（自由入力） */
  deckName: string;
  /** アクティブフラグ（true固定） */
  isActive: boolean;
  /** ユーザーID（将来の拡張用） */
  userId?: string;
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt?: string;
}

/**
 * 対戦履歴（既存 - 変更なし）
 */
export interface BattleLog {
  /** 一意識別子 */
  id: string;
  /** シーズン番号 */
  season: number;
  /** 対戦日（YYYY-MM-DD形式） */
  battleDate: string;
  /** 使用デッキID（MyDeckのid参照） */
  myDeckId: string;
  /** 相手デッキID（DeckMasterのid参照） */
  opponentDeckId: string;
  /** 先攻フラグ */
  isFirst: boolean;
  /** 対戦結果 */
  result: "win" | "lose";
  /** メモ */
  memo?: string;
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt?: string;
}

// ============================================
// 2. 拡張エンティティ定義（新規）🔵
// ============================================

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
 * シーズン統計情報
 * REQ-EXT-203 ~ REQ-EXT-205 対応
 */
export interface SeasonStatistics {
  /** シーズン番号 */
  season: number;
  /** 総対戦数 */
  totalMatches: number;
  /** 勝利数 */
  wins: number;
  /** 敗北数 */
  losses: number;
  /** 勝率（パーセント） */
  winRate: number;
  /** 先攻勝率 */
  firstWinRate: number;
  /** 後攻勝率 */
  secondWinRate: number;
}

// ============================================
// 3. API リクエスト型定義 🔵
// ============================================

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

/**
 * 統計取得リクエストパラメータ
 * REQ-EXT-203 ~ REQ-EXT-205 対応
 */
export interface StatisticsQueryParams {
  /** シーズン番号（省略時は最新シーズン） */
  season?: number;
}

/**
 * デッキ種別取得リクエストパラメータ
 * REQ-EXT-302 対応
 */
export interface DeckMasterQueryParams {
  /** 使用履歴情報を含めるか */
  includeUsage?: boolean;
}

// ============================================
// 4. API レスポンス型定義 🔵
// ============================================

/**
 * 汎用APIレスポンス
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: {
    timestamp: string;
  };
}

/**
 * APIエラー
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * バリデーションエラー
 * REQ-EXT-403 対応
 */
export interface ValidationError extends ApiError {
  code: "VALIDATION_ERROR";
  details: {
    field: string;
    constraint: string;
    value: unknown;
  }[];
}

/**
 * 削除制約エラー
 * REQ-EXT-401, REQ-EXT-402 対応
 */
export interface DeleteConstraintError extends ApiError {
  code: "DELETE_CONSTRAINT_ERROR";
  details: {
    entityType: "deckMaster" | "myDeck";
    entityId: string;
    referencedBy: "battleLogs";
    referenceCount: number;
  };
}

/**
 * デッキ種別一覧レスポンス
 */
export type DeckMasterListResponse = ApiResponse<DeckMaster[]>;

/**
 * 使用履歴付きデッキ種別一覧レスポンス
 */
export type DeckMasterWithUsageListResponse = ApiResponse<DeckMasterWithUsage[]>;

/**
 * デッキ種別単体レスポンス
 */
export type DeckMasterResponse = ApiResponse<DeckMaster>;

/**
 * 使用デッキ一覧レスポンス
 */
export type MyDeckListResponse = ApiResponse<MyDeck[]>;

/**
 * 使用デッキ単体レスポンス
 */
export type MyDeckResponse = ApiResponse<MyDeck>;

/**
 * シーズン一覧レスポンス
 */
export type SeasonsResponse = ApiResponse<number[]>;

/**
 * 統計レスポンス
 */
export type StatisticsResponse = ApiResponse<SeasonStatistics>;

// ============================================
// 5. Zustand Store 型定義 🔵
// ============================================

/**
 * デッキStore状態・アクション
 * 既存DeckStoreの拡張
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
 * 既存StatisticsStoreの拡張
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

// ============================================
// 6. コンポーネントProps型定義 🔵
// ============================================

/**
 * デッキ種別ダイアログProps
 */
export interface DeckMasterDialogProps {
  /** ダイアログ表示状態 */
  open: boolean;
  /** ダイアログを閉じるハンドラ */
  onClose: () => void;
  /** 編集対象（新規作成時はundefined） */
  editTarget?: DeckMaster;
  /** 利用可能なクラス名一覧 */
  availableClassNames: string[];
}

/**
 * デッキ種別一覧Props
 */
export interface DeckMasterListProps {
  /** 空リスト時のメッセージ（REQ-EXT-501対応） */
  emptyMessage?: string;
}

/**
 * デッキ種別アイテムProps
 */
export interface DeckMasterItemProps {
  /** デッキ種別データ */
  deckMaster: DeckMaster;
  /** 編集ボタンクリックハンドラ */
  onEdit: (deckMaster: DeckMaster) => void;
  /** 削除ボタンクリックハンドラ */
  onDelete: (id: string) => void;
  /** 削除可能かどうか（参照されている場合はfalse） */
  canDelete: boolean;
}

/**
 * 使用デッキダイアログProps
 */
export interface MyDeckDialogProps {
  /** ダイアログ表示状態 */
  open: boolean;
  /** ダイアログを閉じるハンドラ */
  onClose: () => void;
  /** デッキ種別一覧（クラス名選択用） */
  deckMasters: DeckMaster[];
}

/**
 * 使用デッキ一覧Props
 */
export interface MyDeckListProps {
  /** 空リスト時のメッセージ（REQ-EXT-502対応） */
  emptyMessage?: string;
}

/**
 * 使用デッキアイテムProps
 */
export interface MyDeckItemProps {
  /** 使用デッキデータ */
  myDeck: MyDeck;
  /** 関連デッキ種別（クラス名表示用） */
  deckMaster?: DeckMaster;
  /** 削除ボタンクリックハンドラ */
  onDelete: (id: string) => void;
  /** 削除可能かどうか（参照されている場合はfalse） */
  canDelete: boolean;
}

/**
 * 対戦履歴登録ダイアログProps（既存 - 改善対応）
 * REQ-EXT-301, REQ-EXT-302 対応
 */
export interface BattleLogDialogProps {
  /** ダイアログ表示状態 */
  open: boolean;
  /** ダイアログを閉じるハンドラ */
  onClose: () => void;
  /** 登録成功時のコールバック */
  onSuccess?: () => void;
  /** 編集対象（新規作成時はundefined） */
  editTarget?: BattleLog;
}

/**
 * 統計画面Props
 * REQ-EXT-201 ~ REQ-EXT-205 対応
 */
export interface StatisticsPageProps {
  /** 初期選択シーズン（省略時は最新） */
  initialSeason?: number;
}

// ============================================
// 7. フォーム入力型定義 🔵
// ============================================

/**
 * デッキ種別フォーム入力
 */
export interface DeckMasterFormInput {
  /** クラス名 */
  className: string;
  /** デッキ名 */
  deckName: string;
}

/**
 * 使用デッキフォーム入力
 */
export interface MyDeckFormInput {
  /** デッキ種別ID */
  deckId: string;
  /** デッキ名 */
  deckName: string;
  /** デッキコード（任意） */
  deckCode: string;
}

/**
 * 対戦履歴フォーム入力（改善対応）
 */
export interface BattleLogFormInput {
  /** シーズン */
  season: number;
  /** 対戦日 */
  battleDate: string;
  /** 使用デッキID */
  myDeckId: string;
  /** 相手デッキID */
  opponentDeckId: string;
  /** 先攻フラグ */
  isFirst: boolean;
  /** 対戦結果 */
  result: "win" | "lose";
  /** メモ */
  memo: string;
}

// ============================================
// 8. 定数定義 🔵
// ============================================

/**
 * シャドウバースのクラス名一覧
 */
export const CLASS_NAMES = [
  "エルフ",
  "ロイヤル",
  "ウィッチ",
  "ドラゴン",
  "ナイトメア",
  "ビショップ",
  "ネメシス",
] as const;

export type ClassName = (typeof CLASS_NAMES)[number];

/**
 * APIエラーコード
 */
export const API_ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  DELETE_CONSTRAINT_ERROR: "DELETE_CONSTRAINT_ERROR",
  NOT_FOUND: "NOT_FOUND",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

// ============================================
// 信頼性レベルサマリー
// ============================================
// 🔵 青信号: 全定義 (100%)
// 🟡 黄信号: 0件 (0%)
// 🔴 赤信号: 0件 (0%)
//
// 品質評価: 高品質（すべての定義がユーザヒアリングと既存設計に基づく）
// ============================================

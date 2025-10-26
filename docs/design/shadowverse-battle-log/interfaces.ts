/**
 * シャドウバース対戦履歴管理 TypeScript 型定義
 *
 * このファイルは、フロントエンド (React) とバックエンド (Azure Functions) で共有する型定義です。
 *
 * 【信頼性レベル凡例】:
 * 🔵 青信号: EARS要件定義書・設計文書を参考にしてほぼ推測していない場合
 * 🟡 黄信号: EARS要件定義書・設計文書から妥当な推測の場合
 * 🔴 赤信号: EARS要件定義書・設計文書にない推測の場合
 */

// ==============================================================================
// ドメインエンティティ (既存データ構造に基づく)
// ==============================================================================

/**
 * 対戦履歴エンティティ
 * 🔵 既存データ構造 (battle-logs.json) とREQ-002より
 */
export interface BattleLog {
  /** 対戦履歴ID (自動採番) */
  id: string;

  /** 対戦日付 (YYYY/MM/DD形式) */
  date: string;

  /** 対戦タイプ */
  battleType: BattleType;

  /** ランク */
  rank: Rank;

  /** グループ (ランク内の細分化) */
  group: Group;

  /** マイデッキID (my-decks.json への参照) */
  myDeckId: string;

  /** ターン (先行/後攻) */
  turn: Turn;

  /** 対戦結果 */
  result: BattleResult;

  /** 相手デッキID (deck-master.json への参照) */
  opponentDeckId: string;
}

/**
 * 対戦タイプ
 * 🔵 REQ-002より
 */
export type BattleType = "ランクマッチ" | "対戦台" | "ロビー大会";

/**
 * ランク
 * 🔵 REQ-002より
 * 🟡 "トパーズ" を追加（シャドウバースの標準ランク）
 */
export type Rank = "サファイア" | "ダイアモンド" | "ルビー" | "トパーズ" | "-";

/**
 * グループ (ランク内の細分化)
 * 🔵 REQ-002より
 * 🟡 "AA", "AAA", "Master" を追加（シャドウバースの標準グループ）
 */
export type Group = "A" | "AA" | "AAA" | "Master" | "-";

/**
 * ターン
 * 🔵 REQ-002より
 */
export type Turn = "先行" | "後攻";

/**
 * 対戦結果
 * 🔵 REQ-002より
 */
export type BattleResult = "WIN" | "LOSE";

// ------------------------------------------------------------------------------

/**
 * デッキマスターエンティティ (対戦相手のデッキタイプ)
 * 🔵 既存データ構造 (deck-master.json) より
 */
export interface DeckMaster {
  /** デッキID */
  id: string;

  /** クラス名 (例: ウィッチ, ロイヤル) */
  className: string;

  /** デッキ名 (例: 土スペルウィッチ) */
  deckName: string;

  /** ソート順 */
  sortOrder: number;
}

// ------------------------------------------------------------------------------

/**
 * マイデッキエンティティ (ユーザーが使用するデッキ)
 * 🔵 既存データ構造 (my-decks.json) より
 */
export interface MyDeck {
  /** デッキID */
  id: string;

  /** デッキマスターID (deck-master.json への参照) */
  deckId: string;

  /** デッキコード (シャドウバースの公式デッキコード) */
  deckCode: string;

  /** デッキ名 (ユーザー設定) */
  deckName: string;

  /** アクティブフラグ (現在使用中かどうか) */
  isActive: boolean;

  /** 作成日時 (ISO 8601形式) */
  createdAt: string;
}

// ==============================================================================
// API リクエスト/レスポンス型
// ==============================================================================

/**
 * 共通APIレスポンス型
 * 🔵 architecture.md のAPI設計より
 */
export interface ApiResponse<T> {
  /** 成功フラグ */
  success: boolean;

  /** レスポンスデータ (成功時) */
  data?: T;

  /** エラー情報 (失敗時) */
  error?: ApiError;

  /** メタ情報 (オプション) */
  meta?: ApiMeta;
}

/**
 * APIエラー型
 * 🟡 一般的なAPI設計から妥当な推測
 */
export interface ApiError {
  /** エラーコード */
  code: string;

  /** エラーメッセージ */
  message: string;

  /** 詳細情報 (オプション) */
  details?: unknown;
}

/**
 * APIメタ情報型
 * 🟡 一般的なAPI設計から妥当な推測
 */
export interface ApiMeta {
  /** タイムスタンプ (ISO 8601形式) */
  timestamp: string;

  /** ページネーション情報 (オプション) */
  pagination?: {
    total: number;
    page: number;
    limit: number;
  };
}

// ------------------------------------------------------------------------------
// Phase 1: 対戦履歴API
// ------------------------------------------------------------------------------

/**
 * 対戦履歴作成リクエスト
 * 🔵 REQ-001〜005より
 */
export interface CreateBattleLogRequest {
  date: string;
  battleType: BattleType;
  rank: Rank;
  group: Group;
  myDeckId: string;
  turn: Turn;
  result: BattleResult;
  opponentDeckId: string;
}

/**
 * 対戦履歴作成レスポンス
 * 🔵 REQ-005より
 */
export type CreateBattleLogResponse = ApiResponse<BattleLog>;

/**
 * 対戦履歴一覧取得リクエスト (クエリパラメータ)
 * 🔵 REQ-101〜103より
 */
export interface GetBattleLogsRequest {
  /** 期間 (1week | 1month | 3month | all) */
  period?: "1week" | "1month" | "3month" | "all";

  /** 取得件数制限 */
  limit?: number;

  /** オフセット (ページネーション用) */
  offset?: number;
}

/**
 * 対戦履歴一覧取得レスポンス
 * 🔵 REQ-101〜106より
 * 🟡 デッキ名を含めたレスポンス型を追加（クライアント側でのデッキマスター結合を不要にする）
 */
export interface BattleLogWithDeckNames extends BattleLog {
  /** マイデッキ名 (deck-master.json から取得) */
  myDeckName: string;

  /** 相手デッキ名 (deck-master.json から取得) */
  opponentDeckName: string;
}

export type GetBattleLogsResponse = ApiResponse<BattleLogWithDeckNames[]>;

/**
 * 対戦履歴削除レスポンス
 * 🔵 REQ-105より
 */
export type DeleteBattleLogResponse = ApiResponse<{ deleted: boolean }>;

// ------------------------------------------------------------------------------
// Phase 1: 統計API
// ------------------------------------------------------------------------------

/**
 * 統計取得リクエスト (クエリパラメータ)
 * 🔵 REQ-202より
 */
export interface GetStatisticsRequest {
  /** 集計期間 */
  period: "1week" | "1month" | "3month" | "all" | "custom";

  /** カスタム期間の開始日 (period=customの場合のみ) */
  startDate?: string;

  /** カスタム期間の終了日 (period=customの場合のみ) */
  endDate?: string;
}

/**
 * 統計データ
 * 🔵 REQ-203〜204より
 */
export interface StatisticsData {
  /** 全体勝率 */
  overall: OverallWinRate;

  /** デッキタイプ別勝率 (自分のデッキ) */
  byMyDeck: DeckWinRate[];

  /** 対戦相手デッキ別勝率 */
  byOpponentDeck: DeckWinRate[];

  /** ランク帯別成績 */
  byRank: RankStats[];

  /** 対戦相手デッキ分布 (円グラフ用) */
  opponentDistribution: DeckDistribution[];
}

/**
 * 全体勝率
 * 🔵 REQ-203より
 */
export interface OverallWinRate {
  /** 総試合数 */
  total: number;

  /** 勝利数 */
  wins: number;

  /** 敗北数 */
  losses: number;

  /** 勝率 (0.0 ~ 1.0) */
  winRate: number;
}

/**
 * デッキ別勝率
 * 🔵 REQ-203より
 */
export interface DeckWinRate {
  /** デッキID */
  deckId: string;

  /** デッキ名 */
  deckName: string;

  /** 試合数 */
  total: number;

  /** 勝利数 */
  wins: number;

  /** 敗北数 */
  losses: number;

  /** 勝率 (0.0 ~ 1.0) */
  winRate: number;
}

/**
 * ランク帯別成績
 * 🔵 REQ-203より
 */
export interface RankStats {
  /** ランク */
  rank: Rank;

  /** 試合数 */
  total: number;

  /** 勝利数 */
  wins: number;

  /** 敗北数 */
  losses: number;

  /** 勝率 (0.0 ~ 1.0) */
  winRate: number;
}

/**
 * デッキ分布 (円グラフ用)
 * 🔵 REQ-204より
 */
export interface DeckDistribution {
  /** デッキID */
  deckId: string;

  /** デッキ名 */
  deckName: string;

  /** 対戦回数 */
  count: number;

  /** 割合 (0.0 ~ 1.0) */
  percentage: number;
}

/**
 * 統計取得レスポンス
 * 🔵 REQ-201〜205より
 */
export type GetStatisticsResponse = ApiResponse<StatisticsData>;

// ------------------------------------------------------------------------------
// Phase 1: インポートAPI
// ------------------------------------------------------------------------------

/**
 * インポートリクエスト
 * 🔵 REQ-301〜303より
 */
export interface ImportDataRequest {
  /** インポートデータ (BattleLog配列) */
  data: BattleLog[];

  /** フォーマット */
  format: "json" | "csv";

  /** インポートモード (重複時の動作) */
  mode?: "overwrite" | "skip";
}

/**
 * インポート結果
 * 🔵 REQ-301〜303より
 * 🟡 詳細な結果情報を追加
 */
export interface ImportResult {
  /** インポート成功件数 */
  imported: number;

  /** スキップ件数 */
  skipped: number;

  /** 総件数 */
  total: number;

  /** エラー詳細 (オプション) */
  errors?: ImportError[];
}

/**
 * インポートエラー詳細
 * 🟡 エラーハンドリング要件から妥当な推測
 */
export interface ImportError {
  /** 行番号 (CSVの場合) */
  line?: number;

  /** フィールド名 */
  field?: string;

  /** エラーメッセージ */
  message: string;
}

/**
 * インポートレスポンス
 * 🔵 REQ-301〜303より
 */
export type ImportDataResponse = ApiResponse<ImportResult>;

// ==============================================================================
// Phase 2: マイデッキ管理API
// ==============================================================================

/**
 * マイデッキ作成リクエスト
 * 🔵 REQ-801〜802より
 */
export interface CreateMyDeckRequest {
  deckId: string;
  deckCode: string;
  deckName: string;
}

/**
 * マイデッキ作成レスポンス
 * 🔵 REQ-801〜802より
 */
export type CreateMyDeckResponse = ApiResponse<MyDeck>;

/**
 * マイデッキ更新リクエスト
 * 🔵 REQ-802より
 */
export interface UpdateMyDeckRequest {
  deckCode?: string;
  deckName?: string;
  isActive?: boolean;
}

/**
 * マイデッキ更新レスポンス
 * 🔵 REQ-802より
 */
export type UpdateMyDeckResponse = ApiResponse<MyDeck>;

/**
 * マイデッキ削除レスポンス
 * 🔵 REQ-802より
 */
export type DeleteMyDeckResponse = ApiResponse<{ deleted: boolean }>;

/**
 * マイデッキ一覧取得レスポンス
 * 🔵 REQ-801より
 */
export type GetMyDecksResponse = ApiResponse<MyDeck[]>;

// ==============================================================================
// Phase 2: デッキマスター管理API
// ==============================================================================

/**
 * デッキマスター作成リクエスト
 * 🔵 REQ-901より
 */
export interface CreateDeckMasterRequest {
  className: string;
  deckName: string;
  sortOrder?: number;
}

/**
 * デッキマスター作成レスポンス
 * 🔵 REQ-901より
 */
export type CreateDeckMasterResponse = ApiResponse<DeckMaster>;

/**
 * デッキマスター更新リクエスト
 * 🔵 REQ-902より
 */
export interface UpdateDeckMasterRequest {
  className?: string;
  deckName?: string;
  sortOrder?: number;
}

/**
 * デッキマスター更新レスポンス
 * 🔵 REQ-902より
 */
export type UpdateDeckMasterResponse = ApiResponse<DeckMaster>;

/**
 * デッキマスター削除レスポンス
 * 🔵 REQ-902より
 */
export type DeleteDeckMasterResponse = ApiResponse<{ deleted: boolean }>;

/**
 * デッキマスター一覧取得レスポンス
 * 🔵 REQ-901より
 */
export type GetDeckMastersResponse = ApiResponse<DeckMaster[]>;

// ==============================================================================
// Phase 2: エクスポートAPI
// ==============================================================================

/**
 * エクスポートリクエスト
 * 🔵 REQ-1001〜1002より
 */
export interface ExportDataRequest {
  /** エクスポート形式 */
  format: "json" | "csv";

  /** エクスポート対象期間 (オプション) */
  period?: "1week" | "1month" | "3month" | "all";
}

/**
 * エクスポートレスポンス (ファイルダウンロード)
 * 🔵 REQ-1001〜1002より
 * 🟡 Blob形式でのレスポンスを想定
 */
export type ExportDataResponse = Blob;

// ==============================================================================
// フロントエンド専用型 (Zustand State)
// ==============================================================================

/**
 * 対戦履歴ストア状態
 * 🟡 Zustand状態管理の設計から妥当な推測
 */
export interface BattleLogStore {
  /** 対戦履歴リスト */
  battleLogs: BattleLogWithDeckNames[];

  /** ローディング状態 */
  isLoading: boolean;

  /** エラーメッセージ */
  error: string | null;

  /** 前回入力値 (REQ-003: 入力値引き継ぎ用) */
  previousInput: CreateBattleLogRequest | null;

  /** アクション: 対戦履歴一覧取得 */
  fetchBattleLogs: (params?: GetBattleLogsRequest) => Promise<void>;

  /** アクション: 対戦履歴登録 */
  createBattleLog: (data: CreateBattleLogRequest) => Promise<void>;

  /** アクション: 対戦履歴削除 */
  deleteBattleLog: (id: string) => Promise<void>;

  /** アクション: 前回入力値を保存 */
  setPreviousInput: (data: CreateBattleLogRequest) => void;
}

/**
 * 統計ストア状態
 * 🟡 Zustand状態管理の設計から妥当な推測
 */
export interface StatisticsStore {
  /** 統計データ */
  statistics: StatisticsData | null;

  /** ローディング状態 */
  isLoading: boolean;

  /** エラーメッセージ */
  error: string | null;

  /** 現在の期間設定 */
  currentPeriod: GetStatisticsRequest["period"];

  /** アクション: 統計データ取得 */
  fetchStatistics: (params: GetStatisticsRequest) => Promise<void>;

  /** アクション: 期間変更 */
  setPeriod: (period: GetStatisticsRequest["period"]) => void;
}

/**
 * デッキストア状態
 * 🟡 Zustand状態管理の設計から妥当な推測
 */
export interface DeckStore {
  /** デッキマスターリスト */
  deckMasters: DeckMaster[];

  /** マイデッキリスト (Phase 2) */
  myDecks: MyDeck[];

  /** ローディング状態 */
  isLoading: boolean;

  /** エラーメッセージ */
  error: string | null;

  /** アクション: デッキマスター取得 */
  fetchDeckMasters: () => Promise<void>;

  /** アクション: マイデッキ取得 (Phase 2) */
  fetchMyDecks: () => Promise<void>;

  /** アクション: マイデッキ作成 (Phase 2) */
  createMyDeck: (data: CreateMyDeckRequest) => Promise<void>;

  /** アクション: マイデッキ削除 (Phase 2) */
  deleteMyDeck: (id: string) => Promise<void>;
}

// ==============================================================================
// ユーティリティ型
// ==============================================================================

/**
 * バリデーションエラー型
 * 🟡 バリデーション要件から妥当な推測
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * フォーム状態型
 * 🟡 フロントエンド実装の一般的な型定義
 */
export interface FormState<T> {
  values: T;
  errors: Record<keyof T, string | null>;
  touched: Record<keyof T, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
}

/**
 * ページネーション型
 * 🟡 将来の拡張性を考慮
 */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ==============================================================================
// 定数
// ==============================================================================

/**
 * 対戦タイプ一覧
 * 🔵 REQ-002より
 */
export const BATTLE_TYPES: readonly BattleType[] = [
  "ランクマッチ",
  "対戦台",
  "ロビー大会",
] as const;

/**
 * ランク一覧
 * 🔵 REQ-002より
 */
export const RANKS: readonly Rank[] = [
  "サファイア",
  "ダイアモンド",
  "ルビー",
  "トパーズ",
  "-",
] as const;

/**
 * グループ一覧
 * 🔵 REQ-002より
 */
export const GROUPS: readonly Group[] = [
  "A",
  "AA",
  "AAA",
  "Master",
  "-",
] as const;

/**
 * ターン一覧
 * 🔵 REQ-002より
 */
export const TURNS: readonly Turn[] = ["先行", "後攻"] as const;

/**
 * 対戦結果一覧
 * 🔵 REQ-002より
 */
export const BATTLE_RESULTS: readonly BattleResult[] = ["WIN", "LOSE"] as const;

/**
 * 集計期間一覧
 * 🔵 REQ-202より
 */
export const STATISTICS_PERIODS = [
  "1week",
  "1month",
  "3month",
  "all",
  "custom",
] as const;

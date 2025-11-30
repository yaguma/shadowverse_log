/**
 * インポートAPI型定義
 * TASK-0031: インポートAPI実装
 */

/**
 * インポートフォーマット
 */
export type ImportFormat = 'json' | 'csv';

/**
 * インポートリクエスト
 */
export interface ImportRequest {
  format: ImportFormat;
  data: string;
}

/**
 * インポートレスポンス
 */
export interface ImportResponse {
  imported: number;
  skipped: number;
  errors: number;
  details?: {
    skippedIds?: string[];
    errorDetails?: Array<{
      line: number;
      field: string;
      error: string;
    }>;
  };
}

/**
 * インポート用対戦履歴入力
 */
export interface ImportBattleLogInput {
  id?: string;
  date: string;
  battleType: string;
  rank: string;
  group: string;
  myDeckId: string;
  turn: string;
  result: string;
  opponentDeckId: string;
}

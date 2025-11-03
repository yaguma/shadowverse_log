/**
 * ImportService - データインポートビジネスロジックサービス
 *
 * JSON/CSV形式のデータインポート機能を提供
 * 重複チェック、バリデーション、ID自動生成を実装
 */

import { z } from 'zod';
import type { BlobStorageClient } from '../storage/blobStorageClient';
import type { BattleLog } from '../types';
import { isFutureDate } from '../utils/validation';

/**
 * エラーメッセージ定数
 */
const ERROR_MESSAGES = {
  INVALID_JSON: '無効なJSON形式です',
  NOT_ARRAY: 'JSONデータは配列である必要があります',
  EMPTY_CSV: 'CSVデータが空です',
  MISSING_HEADERS: '必須ヘッダーが不足しています',
  COLUMN_MISMATCH: 'カラム数が一致しません',
  BLOB_CONNECTION_ERROR: 'Blob Storageへの接続に失敗しました',
  BLOB_SAVE_ERROR: '対戦履歴の保存に失敗しました',
  UNKNOWN_ERROR: '不明なエラー',
} as const;

/**
 * 必須CSVヘッダー定数
 */
const REQUIRED_CSV_HEADERS = [
  'date',
  'battleType',
  'rank',
  'group',
  'myDeckId',
  'turn',
  'result',
  'opponentDeckId',
] as const;

/**
 * ID生成プレフィックス
 */
const ID_PREFIX = 'log_import';

/**
 * 日付形式を変換（YYYY-MM-DD → YYYY/MM/DD）
 */
function convertDateFormat(date: string): string {
  return date.replace(/-/g, '/');
}

/**
 * CSV行データの型定義
 */
interface CsvRowData {
  [key: string]: string | undefined;
}

/**
 * 対戦履歴作成リクエストのZodバリデーションスキーマ
 * battleLogService.ts の createBattleLogSchema と同一
 */
export const createBattleLogSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式で入力してください')
    .refine((date) => !isFutureDate(date), {
      message: '未来の日付は入力できません',
    }),

  battleType: z.enum(['ランクマッチ', '対戦台', 'ロビー大会'], {
    errorMap: () => ({ message: '対戦タイプが不正です' }),
  }),

  rank: z.enum(['サファイア', 'ダイアモンド', 'ルビー', 'トパーズ', '-'], {
    errorMap: () => ({ message: 'ランクが不正です' }),
  }),

  group: z.enum(['A', 'AA', 'AAA', 'Master', '-'], {
    errorMap: () => ({ message: 'グループが不正です' }),
  }),

  myDeckId: z.string().min(1, 'マイデッキIDは必須です'),

  turn: z.enum(['先攻', '後攻'], {
    errorMap: () => ({ message: 'ターンが不正です' }),
  }),

  result: z.enum(['勝ち', '負け'], {
    errorMap: () => ({ message: '対戦結果が不正です' }),
  }),

  opponentDeckId: z.string().min(1, '相手デッキIDは必須です'),
});

/**
 * インポート結果の型定義
 */
export interface ImportResult {
  /** 正常にインポートされた件数 */
  imported: number;
  /** 重複によりスキップされた件数 */
  skipped: number;
  /** バリデーションエラー件数 */
  errors: number;
  /** 詳細情報 */
  details: {
    /** スキップされたID一覧 */
    skippedIds?: string[];
    /** エラー詳細 */
    errorDetails?: Array<{
      line: number;
      field: string;
      error: string;
    }>;
  };
}

/**
 * ImportService クラス
 *
 * データインポート機能を提供するサービスクラス
 */
export class ImportService {
  /**
   * コンストラクタ
   *
   * @param blobClient - BlobStorageClient インスタンス
   */
  constructor(private blobClient: BlobStorageClient) {}

  /**
   * JSONデータをインポート
   *
   * @param jsonData - JSON文字列データ
   * @returns インポート結果
   * @throws Error - JSON形式エラー、配列でない場合
   */
  async importFromJson(jsonData: string): Promise<ImportResult> {
    try {
      // JSONパース
      const data = JSON.parse(jsonData);

      // 配列チェック
      if (!Array.isArray(data)) {
        throw new Error(ERROR_MESSAGES.NOT_ARRAY);
      }

      // インポート実行
      return await this.importBattleLogs(data, false);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(ERROR_MESSAGES.INVALID_JSON);
      }
      throw error;
    }
  }

  /**
   * CSVデータをインポート
   *
   * @param csvData - CSV文字列データ
   * @returns インポート結果
   * @throws Error - CSV形式エラー、必須ヘッダー不足
   */
  async importFromCsv(csvData: string): Promise<ImportResult> {
    const trimmedData = csvData.trim();

    // 空データチェック
    if (!trimmedData) {
      throw new Error(ERROR_MESSAGES.EMPTY_CSV);
    }

    const lines = trimmedData.split('\n');

    // 最低1行必要（ヘッダー）
    if (lines.length < 1) {
      throw new Error(ERROR_MESSAGES.EMPTY_CSV);
    }

    // ヘッダー解析
    const firstLine = lines[0];
    if (!firstLine) {
      throw new Error(ERROR_MESSAGES.EMPTY_CSV);
    }
    const headers = this.parseCsvHeaders(firstLine);

    // データ行を解析
    const parseResult = this.parseCsvRows(lines, headers);

    // パースエラーがある場合は即座に返却
    if (parseResult.errorDetails.length > 0) {
      return {
        imported: 0,
        skipped: 0,
        errors: parseResult.errorDetails.length,
        details: { errorDetails: parseResult.errorDetails },
      };
    }

    // インポート実行（CSV形式なので isCsv = true を渡す）
    return await this.importBattleLogs(parseResult.battleLogs, true);
  }

  /**
   * CSVヘッダーを解析
   *
   * @param headerLine - ヘッダー行
   * @returns ヘッダー配列
   * @throws Error - 必須ヘッダーが不足している場合
   */
  private parseCsvHeaders(headerLine: string): string[] {
    const headers = headerLine.split(',').map((h) => h.trim());

    // 必須ヘッダーチェック
    const missingHeaders = REQUIRED_CSV_HEADERS.filter((h) => !headers.includes(h));

    if (missingHeaders.length > 0) {
      throw new Error(`${ERROR_MESSAGES.MISSING_HEADERS}: ${missingHeaders.join(', ')}`);
    }

    return headers;
  }

  /**
   * CSVデータ行を解析
   *
   * @param lines - CSV全行
   * @param headers - ヘッダー配列
   * @returns 解析結果
   */
  private parseCsvRows(
    lines: string[],
    headers: string[]
  ): {
    battleLogs: CsvRowData[];
    errorDetails: Array<{ line: number; field: string; error: string }>;
  } {
    const battleLogs: CsvRowData[] = [];
    const errorDetails: Array<{ line: number; field: string; error: string }> = [];

    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i];
      if (!currentLine) continue; // 空行はスキップ
      const line = currentLine.trim();
      if (!line) continue; // 空行はスキップ

      const values = line.split(',').map((v) => v.trim());

      // カラム数チェック
      if (values.length !== headers.length) {
        errorDetails.push({
          line: i + 1,
          field: 'columns',
          error: ERROR_MESSAGES.COLUMN_MISMATCH,
        });
        continue;
      }

      // オブジェクトに変換
      const log: CsvRowData = {};
      headers.forEach((header, index) => {
        log[header] = values[index];
      });

      battleLogs.push(log);
    }

    return { battleLogs, errorDetails };
  }

  /**
   * 対戦履歴をインポート（共通処理）
   *
   * @param data - インポート対象データ配列
   * @param isCsv - CSV形式かどうか（行番号計算用）
   * @returns インポート結果
   */
  private async importBattleLogs(data: CsvRowData[], isCsv: boolean): Promise<ImportResult> {
    // Blob Storageから既存データを取得
    const existingLogs = await this.loadExistingLogs();
    const existingIds = new Set(existingLogs.map((log) => log.id));

    const imported: BattleLog[] = [];
    const skippedIds: string[] = [];
    const errorDetails: Array<{ line: number; field: string; error: string }> = [];
    const errorRecords = new Set<number>(); // エラーが発生したレコード番号を記録

    // 各レコードを処理
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      if (!item) continue;
      const lineNumber = this.calculateLineNumber(i, isCsv);

      const processResult = this.processRecord(item, i, lineNumber, existingIds);

      if (processResult.type === 'imported') {
        imported.push(processResult.log);
        existingIds.add(processResult.log.id);
      } else if (processResult.type === 'skipped') {
        skippedIds.push(processResult.id);
      } else if (processResult.type === 'error') {
        errorRecords.add(lineNumber);
        errorDetails.push(...processResult.errors);
      }
    }

    // データ保存
    if (imported.length > 0) {
      await this.saveBattleLogs(existingLogs, imported);
    }

    // 結果返却
    return this.buildImportResult(imported.length, skippedIds, errorRecords.size, errorDetails);
  }

  /**
   * 既存の対戦履歴を読み込む
   *
   * @returns 既存の対戦履歴
   * @throws Error - Blob Storageへの接続に失敗した場合
   */
  private async loadExistingLogs(): Promise<BattleLog[]> {
    try {
      return await this.blobClient.getBattleLogs();
    } catch (error) {
      throw new Error(ERROR_MESSAGES.BLOB_CONNECTION_ERROR);
    }
  }

  /**
   * 行番号を計算
   *
   * @param index - 配列インデックス
   * @param isCsv - CSV形式かどうか
   * @returns 行番号
   */
  private calculateLineNumber(index: number, isCsv: boolean): number {
    // JSONの場合: index + 1（配列インデックス + 1）
    // CSVの場合: index + 2（ヘッダー行 + 配列インデックス + 1）
    return isCsv ? index + 2 : index + 1;
  }

  /**
   * レコードを処理
   *
   * @param item - 処理対象レコード
   * @param index - 配列インデックス
   * @param lineNumber - 行番号
   * @param existingIds - 既存ID集合
   * @returns 処理結果
   */
  private processRecord(
    item: CsvRowData,
    index: number,
    lineNumber: number,
    existingIds: Set<string>
  ):
    | { type: 'imported'; log: BattleLog }
    | { type: 'skipped'; id: string }
    | { type: 'error'; errors: Array<{ line: number; field: string; error: string }> } {
    try {
      // バリデーション
      const validatedData = createBattleLogSchema.parse(item);

      // ID重複チェック
      if (item.id && existingIds.has(item.id)) {
        return { type: 'skipped', id: item.id };
      }

      // BattleLog作成
      const log = this.createBattleLog(item.id, validatedData, index);

      return { type: 'imported', log };
    } catch (error) {
      // バリデーションエラー処理
      const errors = this.collectValidationErrors(error, lineNumber);
      return { type: 'error', errors };
    }
  }

  /**
   * BattleLogオブジェクトを作成
   *
   * @param customId - カスタムID（オプション）
   * @param validatedData - バリデーション済みデータ
   * @param index - 配列インデックス
   * @returns BattleLogオブジェクト
   */
  private createBattleLog(
    customId: string | undefined,
    validatedData: z.infer<typeof createBattleLogSchema>,
    index: number
  ): BattleLog {
    // ID自動生成
    const id = customId || `${ID_PREFIX}_${Date.now()}_${index}`;

    return {
      id,
      date: convertDateFormat(validatedData.date),
      battleType: validatedData.battleType,
      rank: validatedData.rank,
      group: validatedData.group,
      myDeckId: validatedData.myDeckId,
      turn: validatedData.turn,
      result: validatedData.result,
      opponentDeckId: validatedData.opponentDeckId,
    };
  }

  /**
   * バリデーションエラーを収集
   *
   * @param error - エラーオブジェクト
   * @param lineNumber - 行番号
   * @returns エラー詳細配列
   */
  private collectValidationErrors(
    error: unknown,
    lineNumber: number
  ): Array<{ line: number; field: string; error: string }> {
    const errors: Array<{ line: number; field: string; error: string }> = [];

    if (error instanceof z.ZodError) {
      for (const err of error.errors) {
        errors.push({
          line: lineNumber,
          field: err.path.join('.'),
          error: err.message,
        });
      }
    } else {
      errors.push({
        line: lineNumber,
        field: 'unknown',
        error: error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR,
      });
    }

    return errors;
  }

  /**
   * 対戦履歴を保存
   *
   * @param existingLogs - 既存の対戦履歴
   * @param imported - インポートされた対戦履歴
   * @throws Error - 保存に失敗した場合
   */
  private async saveBattleLogs(existingLogs: BattleLog[], imported: BattleLog[]): Promise<void> {
    try {
      const updatedLogs = [...existingLogs, ...imported];
      await this.blobClient.saveBattleLogs(updatedLogs);
    } catch (error) {
      throw new Error(ERROR_MESSAGES.BLOB_SAVE_ERROR);
    }
  }

  /**
   * インポート結果を構築
   *
   * @param importedCount - インポート件数
   * @param skippedIds - スキップされたID配列
   * @param errorCount - エラー件数
   * @param errorDetails - エラー詳細配列
   * @returns インポート結果
   */
  private buildImportResult(
    importedCount: number,
    skippedIds: string[],
    errorCount: number,
    errorDetails: Array<{ line: number; field: string; error: string }>
  ): ImportResult {
    return {
      imported: importedCount,
      skipped: skippedIds.length,
      errors: errorCount,
      details: {
        skippedIds: skippedIds.length > 0 ? skippedIds : undefined,
        errorDetails: errorDetails.length > 0 ? errorDetails : undefined,
      },
    };
  }
}

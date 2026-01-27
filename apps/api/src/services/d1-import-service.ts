/**
 * D1ImportService - データインポートビジネスロジックサービス
 * TASK-0031: インポートAPI実装
 *
 * @description D1データベースを使用したJSON/CSV形式のデータインポート機能を提供
 */
import { z } from 'zod';
import { inArray } from 'drizzle-orm';
import type { Database } from '../db';
import { battleLogs } from '../db/schema/battle-logs';
import type { ImportResponse, ImportBattleLogInput } from '../types/import';
import { parseJSON, parseCSV } from '../utils/parser';
import { getNowInJST } from '../utils/date';

/**
 * バリデーションスキーマ
 */
const importBattleLogSchema = z.object({
  id: z.string().optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式で入力してください')
    .refine(
      (date) => {
        const inputDate = new Date(date);
        const today = getNowInJST();
        today.setHours(23, 59, 59, 999);
        return inputDate <= today;
      },
      { message: '未来の日付は入力できません' }
    ),
  battleType: z.enum(['ランクマッチ', '対戦台', 'ロビー大会'], {
    error: '対戦タイプが不正です',
  }),
  rank: z.enum(['サファイア', 'ダイアモンド', 'ルビー', 'トパーズ', '-'], {
    error: 'ランクが不正です',
  }),
  group: z.string().min(1, 'グループは必須です'),
  myDeckId: z.string().min(1, 'マイデッキIDは必須です'),
  turn: z.enum(['先攻', '後攻'], {
    error: 'ターンが不正です',
  }),
  result: z.enum(['勝ち', '負け'], {
    error: '対戦結果が不正です',
  }),
  opponentDeckId: z.string().min(1, '相手デッキIDは必須です'),
});

/**
 * ID生成プレフィックス
 */
const ID_PREFIX = 'log_import';

/**
 * D1ImportService クラス
 *
 * D1データベースを使用したデータインポート機能を提供
 */
export class D1ImportService {
  constructor(private db: Database) {}

  /**
   * JSONデータをインポート
   *
   * @param jsonData - JSON文字列データ
   * @returns インポート結果
   * @throws Error - JSON形式エラー
   */
  async importFromJson(jsonData: string): Promise<ImportResponse> {
    const data = parseJSON(jsonData);
    return await this.importBattleLogs(data, false);
  }

  /**
   * CSVデータをインポート
   *
   * @param csvData - CSV文字列データ
   * @returns インポート結果
   * @throws Error - CSV形式エラー
   */
  async importFromCsv(csvData: string): Promise<ImportResponse> {
    const data = parseCSV(csvData);
    return await this.importBattleLogs(data, true);
  }

  /**
   * 対戦履歴をインポート（共通処理）
   *
   * @param data - インポート対象データ配列
   * @param isCsv - CSV形式かどうか（行番号計算用）
   * @returns インポート結果
   */
  private async importBattleLogs(
    data: ImportBattleLogInput[],
    isCsv: boolean
  ): Promise<ImportResponse> {
    if (data.length === 0) {
      return {
        imported: 0,
        skipped: 0,
        errors: 0,
        details: {},
      };
    }

    // 既存IDを取得
    const existingIds = await this.getExistingIds(data);

    let imported = 0;
    let skipped = 0;
    const errorDetails: Array<{ line: number; field: string; error: string }> = [];

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      if (!item) continue;

      const lineNumber = this.calculateLineNumber(i, isCsv);

      // バリデーション
      const validation = importBattleLogSchema.safeParse(item);

      if (!validation.success) {
        // バリデーションエラー (Zod v4では issues を使用)
        const issues = validation.error.issues || [];
        for (const err of issues) {
          errorDetails.push({
            line: lineNumber,
            field: err.path.join('.') || 'unknown',
            error: err.message,
          });
        }
        continue;
      }

      const validatedData = validation.data;

      // 重複チェック
      if (validatedData.id && existingIds.has(validatedData.id)) {
        skipped++;
        continue;
      }

      // ID自動生成
      const id = validatedData.id || `${ID_PREFIX}_${Date.now()}_${i}`;

      // INSERT
      try {
        await this.db.insert(battleLogs).values({
          id,
          date: validatedData.date,
          battleType: validatedData.battleType,
          rank: validatedData.rank,
          groupName: validatedData.group,
          myDeckId: validatedData.myDeckId,
          turn: validatedData.turn,
          result: validatedData.result,
          opponentDeckId: validatedData.opponentDeckId,
        });
        imported++;
        existingIds.add(id);
      } catch {
        // INSERT失敗（重複キーなど）
        skipped++;
      }
    }

    return {
      imported,
      skipped,
      errors: errorDetails.length > 0 ? errorDetails.length : 0,
      details: errorDetails.length > 0 ? { errorDetails } : {},
    };
  }

  /**
   * SQLiteのプレースホルダー制限を考慮したバッチサイズ
   * D1/SQLiteでは999が安全な上限
   */
  private readonly BATCH_SIZE = 100;

  /**
   * 既存のIDを取得
   * SQLiteのプレースホルダー制限（SQLITE_MAX_VARIABLE_NUMBER）を回避するため
   * バッチ処理で取得する
   *
   * @param data - チェック対象データ
   * @returns 既存IDのSet
   */
  private async getExistingIds(data: ImportBattleLogInput[]): Promise<Set<string>> {
    const inputIds = data.filter((d) => d.id).map((d) => d.id as string);

    if (inputIds.length === 0) {
      return new Set();
    }

    const existingIds = new Set<string>();

    // バッチ処理でIDをチェック
    for (let i = 0; i < inputIds.length; i += this.BATCH_SIZE) {
      const batchIds = inputIds.slice(i, i + this.BATCH_SIZE);

      const existingRecords = await this.db
        .select({ id: battleLogs.id })
        .from(battleLogs)
        .where(inArray(battleLogs.id, batchIds));

      for (const record of existingRecords) {
        existingIds.add(record.id);
      }
    }

    return existingIds;
  }

  /**
   * 行番号を計算
   *
   * @param index - 配列インデックス
   * @param isCsv - CSV形式かどうか
   * @returns 行番号
   */
  private calculateLineNumber(index: number, isCsv: boolean): number {
    return isCsv ? index + 2 : index + 1;
  }
}

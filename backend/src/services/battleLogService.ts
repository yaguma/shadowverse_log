/**
 * BattleLogService - 対戦履歴ビジネスロジックサービス
 *
 * 対戦履歴の作成、バリデーション、ID生成を管理するサービスクラス
 */

import { z } from 'zod';
import type { BlobStorageClient } from '../storage/blobStorageClient';
import type { BattleLog } from '../types';
import { generateBattleLogId } from '../utils/idGenerator';
import { isFutureDate } from '../utils/validation';

/**
 * 今日の日付をYYYY-MM-DD形式で取得
 *
 * @returns 今日の日付文字列（YYYY-MM-DD形式）
 */
function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0] as string;
}

/**
 * 日付形式を変換（YYYY-MM-DD → YYYY/MM/DD）
 *
 * @param date - YYYY-MM-DD形式の日付文字列
 * @returns YYYY/MM/DD形式の日付文字列
 *
 * @example
 * convertDateFormat('2025-01-24') // '2025/01/24'
 */
function convertDateFormat(date: string): string {
  return date.replace(/-/g, '/');
}

/**
 * 対戦履歴作成リクエストのZodバリデーションスキーマ
 *
 * REQ-002, REQ-004, REQ-401, REQ-402 に対応
 */
const createBattleLogSchema = z.object({
  // 日付（オプショナル: デフォルトは今日）
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式で入力してください')
    .refine((date) => !isFutureDate(date), {
      message: '未来の日付は入力できません',
    })
    .default(getTodayDateString),

  // 対戦タイプ（必須）
  battleType: z.enum(['ランクマッチ', '対戦台', 'ロビー大会'], {
    errorMap: () => ({ message: '対戦タイプが不正です' }),
  }),

  // ランク（必須）
  rank: z.enum(['サファイア', 'ダイアモンド', 'ルビー', 'トパーズ', '-'], {
    errorMap: () => ({ message: 'ランクが不正です' }),
  }),

  // グループ（必須）
  group: z.enum(['A', 'AA', 'AAA', 'Master', '-'], {
    errorMap: () => ({ message: 'グループが不正です' }),
  }),

  // マイデッキID（必須、空文字列不可）
  myDeckId: z.string().min(1, 'マイデッキIDは必須です'),

  // ターン（必須）
  turn: z.enum(['先攻', '後攻'], {
    errorMap: () => ({ message: 'ターンが不正です' }),
  }),

  // 対戦結果（必須）
  result: z.enum(['勝ち', '負け'], {
    errorMap: () => ({ message: '対戦結果が不正です' }),
  }),

  // 相手デッキID（必須、空文字列不可）
  opponentDeckId: z.string().min(1, '相手デッキIDは必須です'),
});

/**
 * 対戦履歴作成リクエストの型
 */
export type CreateBattleLogRequest = z.input<typeof createBattleLogSchema>;

/**
 * BattleLogService クラス
 *
 * 対戦履歴の作成・管理を担当するサービスクラス
 */
export class BattleLogService {
  /**
   * コンストラクタ
   *
   * @param blobClient - BlobStorageClient インスタンス
   */
  constructor(private blobClient: BlobStorageClient) {}

  /**
   * 対戦履歴を作成
   *
   * @param input - 対戦履歴作成リクエスト
   * @returns 作成された対戦履歴
   * @throws ZodError - バリデーションエラー
   * @throws Error - Blob Storage エラー
   */
  async createBattleLog(input: CreateBattleLogRequest): Promise<BattleLog> {
    // 1. バリデーション
    const validated = createBattleLogSchema.parse(input);

    // 2. 既存ログを取得
    const existingLogs = await this.blobClient.getBattleLogs();

    // 3. ID生成
    const id = generateBattleLogId(existingLogs, validated.date);

    // 4. 新規ログ作成（日付形式を YYYY-MM-DD → YYYY/MM/DD に変換）
    const newLog: BattleLog = {
      id,
      date: convertDateFormat(validated.date),
      battleType: validated.battleType,
      rank: validated.rank,
      group: validated.group,
      myDeckId: validated.myDeckId,
      turn: validated.turn,
      result: validated.result,
      opponentDeckId: validated.opponentDeckId,
    };

    // 5. Blob Storage に保存
    const updatedLogs = [...existingLogs, newLog];
    await this.blobClient.saveBattleLogs(updatedLogs);

    // 6. 作成されたログを返却
    return newLog;
  }
}

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
 * 対戦履歴一覧取得パラメータのZodバリデーションスキーマ
 * 🔵 信頼性レベル: 青信号（requirements.md L52-58より）
 *
 * REQ-101, REQ-103に対応
 */
const getBattleLogsSchema = z.object({
  // limit: 1ページあたりの取得件数（デフォルト: 100, 範囲: 1〜1000）
  limit: z
    .number()
    .int()
    .min(1, 'limitは1から1000の間で指定してください')
    .max(1000, 'limitは1から1000の間で指定してください')
    .default(100),

  // offset: スキップする件数（デフォルト: 0, 範囲: 0以上）
  offset: z.number().int().min(0, 'offsetは0以上で指定してください').default(0),

  // sortBy: ソートキー（デフォルト: "date"）
  sortBy: z.string().default('date'),

  // sortOrder: ソート順（デフォルト: "desc"）
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * 対戦履歴一覧取得パラメータの型
 */
export type GetBattleLogsParams = z.input<typeof getBattleLogsSchema>;

/**
 * デッキ名付き対戦履歴
 * 🔵 信頼性レベル: 青信号（requirements.md L63-88より）
 */
export interface BattleLogWithDeckNames extends BattleLog {
  /** マイデッキ名 */
  myDeckName: string;
  /** 相手デッキ名 */
  opponentDeckName: string;
}

/**
 * 対戦履歴一覧レスポンス
 * 🔵 信頼性レベル: 青信号（requirements.md L63-88より）
 */
export interface BattleLogsWithDeckNamesResponse {
  /** デッキ名付きの対戦履歴 */
  battleLogs: BattleLogWithDeckNames[];
  /** 総件数 */
  total: number;
  /** 適用されたlimit値 */
  limit: number;
  /** 適用されたoffset値 */
  offset: number;
}

/**
 * 削除レスポンス
 * 🔵 信頼性レベル: 青信号（requirements.md L99-112より）
 */
export interface DeleteBattleLogResponse {
  /** 削除されたID */
  deletedId: string;
}

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

  /**
   * 【機能概要】: 対戦履歴一覧をデッキ名付きで取得する
   * 【実装方針】: テストを通すための最小実装。ページネーション、ソート、デッキ名joinを実装
   * 【テスト対応】: TC-001〜TC-006, TC-101〜TC-103, TC-105, TC-201〜TC-204 を通すための実装
   * 🔵 信頼性レベル: 青信号（requirements.md L129-148、memo.md L136-168より）
   *
   * @param input - 対戦履歴一覧取得パラメータ
   * @returns デッキ名付き対戦履歴一覧
   * @throws ZodError - バリデーションエラー
   * @throws Error - Blob Storage エラー
   */
  async getBattleLogsWithDeckNames(
    input: GetBattleLogsParams
  ): Promise<BattleLogsWithDeckNamesResponse> {
    // 【入力値検証】: パラメータのバリデーション（limit, offset範囲チェック）
    // 🔵 信頼性レベル: 青信号（requirements.md L52-58より）
    const validated = getBattleLogsSchema.parse(input);

    // 【データ取得】: Promise.allで並列取得（パフォーマンス最適化）
    // 🔵 信頼性レベル: 青信号（requirements.md L133-134, memo.md L200-202より）
    const [battleLogs, myDecks, deckMasters] = await Promise.all([
      this.blobClient.getBattleLogs(),
      this.blobClient.getMyDecks(),
      this.blobClient.getDeckMasters(),
    ]);

    // 【デッキ名マップ作成】: デッキIDをMapに変換（O(1)高速検索用）
    // 🔵 信頼性レベル: 青信号（requirements.md L164, memo.md L200-202より）
    const myDeckMap = new Map(myDecks.map((deck) => [deck.id, deck.deckName]));
    const deckMasterMap = new Map(deckMasters.map((deck) => [deck.id, deck.deckName]));

    // 【ソート処理】: 指定されたキー・順序でソート
    // 🔵 信頼性レベル: 青信号（requirements.md L136-139より）
    const sortedLogs = [...battleLogs].sort((a, b) => {
      const aValue = a[validated.sortBy as keyof BattleLog];
      const bValue = b[validated.sortBy as keyof BattleLog];

      // 【ソート順制御】: asc/descの切り替え
      if (validated.sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    // 【ページネーション処理】: offset〜offset+limit件を切り出し
    // 🔵 信頼性レベル: 青信号（requirements.md L141より）
    const paginatedLogs = sortedLogs.slice(validated.offset, validated.offset + validated.limit);

    // 【デッキ名付与】: Map.get()で各ログにデッキ名を追加、存在しない場合は"不明なデッキ"
    // 🔵 信頼性レベル: 青信号（requirements.md L142-143, L285-287より）
    const logsWithDeckNames: BattleLogWithDeckNames[] = paginatedLogs.map((log) => ({
      ...log,
      myDeckName: myDeckMap.get(log.myDeckId) ?? '不明なデッキ', // 【デフォルト値】: デッキIDが見つからない場合
      opponentDeckName: deckMasterMap.get(log.opponentDeckId) ?? '不明なデッキ', // 【デフォルト値】: デッキIDが見つからない場合
    }));

    // 【レスポンス返却】: ページネーション情報を含むレスポンス
    // 🔵 信頼性レベル: 青信号（requirements.md L63-88より）
    return {
      battleLogs: logsWithDeckNames,
      total: sortedLogs.length, // 【総件数】: ソート後の全件数
      limit: validated.limit,
      offset: validated.offset,
    };
  }

  /**
   * 【機能概要】: 指定されたIDの対戦履歴を削除する
   * 【実装方針】: テストを通すための最小実装。findIndex → splice → saveの流れ
   * 【テスト対応】: TC-007, TC-104, TC-106 を通すための実装
   * 🔵 信頼性レベル: 青信号（requirements.md L141-148, memo.md L170-186より）
   *
   * @param id - 削除対象の対戦履歴ID（log_YYYYMMDD_NNN形式）
   * @returns 削除されたID
   * @throws Error - 対戦履歴が見つからない場合（404）
   * @throws Error - Blob Storage エラー
   */
  async deleteBattleLog(id: string): Promise<DeleteBattleLogResponse> {
    // 【既存ログ取得】: 全件取得して対象を検索
    // 🔵 信頼性レベル: 青信号（memo.md L180-181より）
    const battleLogs = await this.blobClient.getBattleLogs();

    // 【対象検索】: findIndex()で対象IDを検索
    // 🔵 信頼性レベル: 青信号（memo.md L182より）
    const targetIndex = battleLogs.findIndex((log) => log.id === id);

    // 【存在チェック】: 見つからなければエラー（404）
    // 🔵 信頼性レベル: 青信号（requirements.md L114-127, memo.md L183より）
    if (targetIndex === -1) {
      throw new Error(`対戦履歴が見つかりません: ${id}`); // 【エラー処理】: テストで期待されるエラーメッセージ
    }

    // 【削除処理】: splice()で配列から削除
    // 🔵 信頼性レベル: 青信号（memo.md L184より）
    battleLogs.splice(targetIndex, 1);

    // 【保存処理】: saveBattleLogs()で保存
    // 🔵 信頼性レベル: 青信号（memo.md L185より）
    await this.blobClient.saveBattleLogs(battleLogs);

    // 【結果返却】: 削除IDをレスポンス返却
    // 🔵 信頼性レベル: 青信号（requirements.md L99-112, memo.md L186より）
    return {
      deletedId: id,
    };
  }
}

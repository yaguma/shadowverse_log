/**
 * ID生成関数
 *
 * 対戦履歴のIDを自動生成するロジックを提供
 */

import type { BattleLog } from '../types';

/**
 * 対戦履歴IDを生成する関数
 *
 * 形式: log_YYYYMMDD_NNN
 * - YYYYMMDD: 日付部分（ハイフンなし）
 * - NNN: 同日の連番（3桁ゼロパディング）
 *
 * @param existingLogs - 既存の対戦履歴配列
 * @param date - 新規登録する日付（YYYY-MM-DD形式）
 * @returns 生成されたID（例: log_20250124_001）
 *
 * @example
 * // 既存ログなし
 * generateBattleLogId([], '2025-01-24') // 'log_20250124_001'
 *
 * // 既存ログあり（同日に2件）
 * generateBattleLogId([
 *   { id: 'log_20250124_001', ... },
 *   { id: 'log_20250124_002', ... }
 * ], '2025-01-24') // 'log_20250124_003'
 *
 * // 連番が飛んでいる場合（最大値から+1）
 * generateBattleLogId([
 *   { id: 'log_20250124_001', ... },
 *   { id: 'log_20250124_005', ... }
 * ], '2025-01-24') // 'log_20250124_006'
 */
/**
 * 日付文字列を正規化してYYYYMMDD形式に変換
 *
 * @param dateString - YYYY-MM-DD または YYYY/MM/DD 形式の日付文字列
 * @returns YYYYMMDD形式の日付文字列
 *
 * @example
 * normalizeDateToYYYYMMDD('2025-01-24') // '20250124'
 * normalizeDateToYYYYMMDD('2025/01/24') // '20250124'
 */
function normalizeDateToYYYYMMDD(dateString: string): string {
  return dateString.replace(/[-/]/g, '');
}

/**
 * ログIDから連番を抽出
 *
 * @param logId - ログID（log_YYYYMMDD_NNN形式）
 * @returns 連番（数値）。抽出できない場合は0
 *
 * @example
 * extractSequenceFromLogId('log_20250124_001') // 1
 * extractSequenceFromLogId('log_20250124_042') // 42
 * extractSequenceFromLogId('invalid-id') // 0
 */
function extractSequenceFromLogId(logId: string): number {
  const match = logId.match(/log_\d{8}_(\d+)$/);
  return match?.[1] ? Number.parseInt(match[1], 10) : 0;
}

export function generateBattleLogId(existingLogs: BattleLog[], date: string): string {
  // 日付をYYYYMMDD形式に正規化
  const datePrefix = normalizeDateToYYYYMMDD(date);

  // 同日のログをフィルタリング（IDプレフィックスまたは日付で判定）
  const sameDateLogs = existingLogs.filter((log) => {
    const logDatePrefix = normalizeDateToYYYYMMDD(log.date);
    return log.id.startsWith(`log_${datePrefix}`) || logDatePrefix === datePrefix;
  });

  // 同日のログから最大連番を取得（関数型スタイル）
  const maxSequence = sameDateLogs.length > 0
    ? Math.max(...sameDateLogs.map((log) => extractSequenceFromLogId(log.id)))
    : 0;

  // 新規連番は最大連番+1
  const newSequence = maxSequence + 1;

  // 連番を3桁ゼロパディング（4桁以上の場合はそのまま）
  const paddedSequence = newSequence.toString().padStart(3, '0');

  // ID生成: log_YYYYMMDD_NNN
  return `log_${datePrefix}_${paddedSequence}`;
}

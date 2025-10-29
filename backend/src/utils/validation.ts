/**
 * バリデーション関数
 *
 * 未来日付チェックなどのカスタムバリデーションロジックを提供
 */

/**
 * 未来日付をチェックする関数
 *
 * @param dateString - チェックする日付文字列（YYYY-MM-DD形式）
 * @returns 未来日付の場合true、そうでない場合false
 *
 * @example
 * isFutureDate('2099-12-31') // true（未来日付）
 * isFutureDate('2025-10-29') // false（今日の日付の場合）
 * isFutureDate('2025-10-28') // false（過去日付）
 *
 * @remarks
 * - 無効な日付形式（例: "2025-02-30"）は自動補正されるため、事前にフォーマット検証が必要
 * - ローカルタイムゾーンで判定（サーバー環境のタイムゾーン設定に依存）
 * - 今日の日付は「未来ではない」と判定（23:59:59.999まで今日として扱う）
 */
export function isFutureDate(dateString: string): boolean {
  // 入力日付をDateオブジェクトに変換
  const inputDate = new Date(dateString);

  // 無効な日付の場合、未来日付ではないとみなす（バリデーションはZodで行う想定）
  // 例: "2025-13-01" は Date() で自動補正されるが、ここでは異常値として扱わない
  if (Number.isNaN(inputDate.getTime())) {
    return false;
  }

  // 今日の日付を取得（時刻を23:59:59.999に設定して、今日いっぱいまで許容）
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  // 入力日付が今日の終わりより後の場合、未来日付と判定
  return inputDate > today;
}

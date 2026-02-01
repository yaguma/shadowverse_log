/**
 * バリデーションユーティリティ
 *
 * 共通のバリデーション関数を提供
 * Issue 2: UUID検証ロジックの一元化
 */

/**
 * UUID形式のバリデーション正規表現
 * RFC 4122 準拠: バージョン1-5のUUIDをサポート
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * 文字列がUUID形式かどうかを検証
 * @param id - 検証対象の文字列
 * @returns UUID形式であればtrue
 */
export function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

/**
 * 日付文字列がYYYY-MM-DD形式かどうかを検証
 * @param date - 検証対象の文字列
 * @returns 日付形式であればtrue
 */
export function isValidDateFormat(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

/**
 * 日付文字列が有効な日付かどうかを検証
 * Issue 9: 日付バリデーションの強化
 * @param date - YYYY-MM-DD形式の日付文字列
 * @returns 有効な日付であればtrue
 */
export function isValidDate(date: string): boolean {
  if (!isValidDateFormat(date)) {
    return false;
  }

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return false;
  }

  // 入力された日付と解析後の日付が一致するか確認
  // これにより2025-13-45のような無効な日付を検出できる
  const [year, month, day] = date.split('-').map(Number);
  return (
    parsedDate.getFullYear() === year &&
    parsedDate.getMonth() + 1 === month &&
    parsedDate.getDate() === day
  );
}

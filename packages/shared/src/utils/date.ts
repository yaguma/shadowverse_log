/**
 * 日付ユーティリティ関数
 * 日本時間（JST、UTC+9）での日付処理を提供
 *
 * Intl.DateTimeFormatを使用した正確なタイムゾーン処理
 */

/**
 * 日本時間での今日の日付をYYYY-MM-DD形式で取得
 * Intl.DateTimeFormatを使用して正確にJSTの日付を取得
 * @returns 今日の日付（YYYY-MM-DD形式）
 */
export const getTodayInJST = (): string => {
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date())
    .replace(/\//g, '-');
};

/**
 * 日本時間での現在日時をDate オブジェクトで取得
 * 注意: このDateオブジェクトはUTCとして表現されていますが、
 * 値はJSTの日時を表しています。日付の比較に使用してください。
 * @returns 日本時間の日時情報を持つDateオブジェクト
 */
export const getNowInJST = (): Date => {
  const formatter = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(new Date());
  const getValue = (type: string): number => {
    const part = parts.find((p) => p.type === type);
    return part ? Number.parseInt(part.value, 10) : 0;
  };

  return new Date(
    getValue('year'),
    getValue('month') - 1,
    getValue('day'),
    getValue('hour'),
    getValue('minute'),
    getValue('second')
  );
};

/**
 * 指定した日付から指定日数前の日付をYYYY-MM-DD形式で取得
 * @param date - 基準日（YYYY-MM-DD形式）
 * @param days - 遡る日数
 * @returns 指定日数前の日付（YYYY-MM-DD形式）
 */
export const getDateBeforeDays = (date: string, days: number): string => {
  const baseDate = new Date(date);
  baseDate.setDate(baseDate.getDate() - days);
  return baseDate.toISOString().split('T')[0] || '';
};

/**
 * 指定した日付から指定日数後の日付をYYYY-MM-DD形式で取得
 * @param date - 基準日（YYYY-MM-DD形式）
 * @param days - 進める日数
 * @returns 指定日数後の日付（YYYY-MM-DD形式）
 */
export const getDateAfterDays = (date: string, days: number): string => {
  const baseDate = new Date(date);
  baseDate.setDate(baseDate.getDate() + days);
  return baseDate.toISOString().split('T')[0] || '';
};

/**
 * 日付文字列をフォーマット変換
 * @param date - 日付文字列（YYYY-MM-DD形式）
 * @param format - 出力フォーマット（'slash' = YYYY/MM/DD, 'hyphen' = YYYY-MM-DD）
 * @returns フォーマット変換後の日付文字列
 */
export const formatDate = (date: string, format: 'slash' | 'hyphen' = 'hyphen'): string => {
  if (format === 'slash') {
    return date.replace(/-/g, '/');
  }
  return date.replace(/\//g, '-');
};

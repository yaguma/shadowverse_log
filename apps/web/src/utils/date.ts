/**
 * 日付ユーティリティ関数
 * 日本時間（JST、UTC+9）での日付処理を提供
 */

/**
 * 日本時間での今日の日付をYYYY-MM-DD形式で取得
 * @returns 今日の日付（YYYY-MM-DD形式）
 */
export const getTodayInJST = (): string => {
  const now = new Date();
  // UTC時刻に9時間（日本時間のオフセット）を加算
  const jstOffset = 9 * 60 * 60 * 1000; // 9時間をミリ秒に変換
  const jstDate = new Date(now.getTime() + jstOffset);
  return jstDate.toISOString().split('T')[0] || '';
};

/**
 * 日本時間での現在日時をDate オブジェクトで取得
 * @returns 日本時間のDateオブジェクト（UTCとして表現されているが値はJST）
 */
export const getNowInJST = (): Date => {
  const now = new Date();
  const jstOffset = 9 * 60 * 60 * 1000;
  return new Date(now.getTime() + jstOffset);
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

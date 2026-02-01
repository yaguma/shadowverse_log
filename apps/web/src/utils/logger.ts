/**
 * 【機能概要】: 開発環境限定のロガーユーティリティ
 * 【実装方針】: import.meta.env.DEV を使用して開発環境のみログ出力
 * 【設計理由】: 本番環境でユーザーのコンソールに不要なログを表示しないため
 */

/**
 * 開発環境限定のロガー
 * 本番環境ではログ出力を行わない
 */
export const logger = {
  /**
   * 警告ログを出力（開発環境のみ）
   * @param args - ログに出力する値
   */
  warn: (...args: unknown[]): void => {
    if (import.meta.env.DEV) {
      console.warn(...args);
    }
  },

  /**
   * エラーログを出力（開発環境のみ）
   * @param args - ログに出力する値
   */
  error: (...args: unknown[]): void => {
    if (import.meta.env.DEV) {
      console.error(...args);
    }
  },

  /**
   * 情報ログを出力（開発環境のみ）
   * @param args - ログに出力する値
   */
  info: (...args: unknown[]): void => {
    if (import.meta.env.DEV) {
      console.info(...args);
    }
  },

  /**
   * デバッグログを出力（開発環境のみ）
   * @param args - ログに出力する値
   */
  debug: (...args: unknown[]): void => {
    if (import.meta.env.DEV) {
      console.debug(...args);
    }
  },
};

/**
 * 汎用非同期状態管理型
 *
 * @description
 * 非同期データの状態（データ、ローディング、エラー）を一元管理するための型定義
 * 複数のloading/error変数を持つ代わりに、この型を使用して状態管理を簡素化する
 *
 * @example
 * ```typescript
 * interface DeckState {
 *   deckMasters: AsyncState<DeckMaster[]>;
 *   myDecks: AsyncState<MyDeck[]>;
 * }
 * ```
 */

/**
 * 非同期状態を表すジェネリック型
 * @template T - データの型
 */
export interface AsyncState<T> {
  /** データ */
  data: T;
  /** ローディング中かどうか */
  isLoading: boolean;
  /** エラーメッセージ（エラーがない場合はnull） */
  error: string | null;
}

/**
 * 初期AsyncStateを作成するヘルパー関数
 * @template T - データの型
 * @param initial - 初期データ
 * @returns 初期AsyncState
 */
export const createInitialAsyncState = <T>(initial: T): AsyncState<T> => ({
  data: initial,
  isLoading: false,
  error: null,
});

/**
 * ローディング状態に設定するヘルパー関数
 * @template T - データの型
 * @param state - 現在のAsyncState
 * @returns ローディング状態のAsyncState
 */
export const setAsyncLoading = <T>(state: AsyncState<T>): AsyncState<T> => ({
  ...state,
  isLoading: true,
  error: null,
});

/**
 * 成功状態に設定するヘルパー関数
 * @template T - データの型
 * @param data - 取得したデータ
 * @returns 成功状態のAsyncState
 */
export const setAsyncSuccess = <T>(data: T): AsyncState<T> => ({
  data,
  isLoading: false,
  error: null,
});

/**
 * エラー状態に設定するヘルパー関数
 * @template T - データの型
 * @param state - 現在のAsyncState
 * @param error - エラーメッセージ
 * @returns エラー状態のAsyncState
 */
export const setAsyncError = <T>(state: AsyncState<T>, error: string): AsyncState<T> => ({
  ...state,
  isLoading: false,
  error,
});

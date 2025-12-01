/**
 * LoginButton - ログインボタンコンポーネント
 * TASK-0040: 認証フロー実装
 *
 * @description 認証状態に応じてログイン/ログアウトボタンを表示
 * 🔵 信頼性レベル: 青信号（cloudflare-migration-phase4-part1.md より）
 */
import { useAuth } from '../../auth/AuthContext';

/**
 * ログインボタンコンポーネント
 *
 * @description 認証状態に応じてログイン/ログアウトボタンを表示
 * - 未認証時: 「ログイン」ボタンを表示
 * - 認証済み時: ユーザーメールアドレスと「ログアウト」ボタンを表示
 */
export function LoginButton() {
  const { isAuthenticated, user, login, logout } = useAuth();

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-700">{user.email}</span>
        <button
          type="button"
          onClick={logout}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          ログアウト
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={login}
      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      ログイン
    </button>
  );
}

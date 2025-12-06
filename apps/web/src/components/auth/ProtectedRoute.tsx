/**
 * ProtectedRoute - 保護されたルートコンポーネント
 * TASK-0040: 認証フロー実装
 *
 * @description 認証が必要なルートをガード
 * 🔵 信頼性レベル: 青信号（cloudflare-migration-phase4-part1.md より）
 */
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * 保護されたルートコンポーネント
 *
 * @description 認証が必要なルートをガードするコンポーネント
 * - 認証済み: 子コンポーネントを表示
 * - 未認証: /loginにリダイレクト
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

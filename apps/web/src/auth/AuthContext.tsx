/**
 * AuthContext - Cloudflare Access認証コンテキスト
 * TASK-0040: 認証フロー実装
 *
 * @description Cloudflare Accessを使用した認証状態の管理
 * 🔵 信頼性レベル: 青信号（cloudflare-migration-phase4-part1.md より）
 */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

/**
 * 認証済みユーザー情報
 */
export interface AuthUser {
  /** ユーザーID (Cloudflare Access sub claim) */
  id: string;
  /** メールアドレス */
  email: string;
}

/**
 * 認証コンテキストの型定義
 */
export interface AuthContextType {
  /** 認証済みかどうか */
  isAuthenticated: boolean;
  /** ユーザー情報 */
  user: AuthUser | null;
  /** ログイン関数 */
  login: () => void;
  /** ログアウト関数 */
  logout: () => void;
  /** トークン取得関数 */
  getToken: () => string | null;
}

/**
 * 認証コンテキスト
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Cookieからトークンを取得
 */
function getTokenFromCookie(): string | null {
  const cookies = document.cookie.split(';');
  const authCookie = cookies.find((c) => c.trim().startsWith('CF-Authorization='));
  return authCookie ? (authCookie.split('=')[1] ?? null) : null;
}

/**
 * 認証プロバイダーコンポーネント
 *
 * @description Cloudflare Accessの認証状態を管理するプロバイダー
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  // 認証状態のチェック
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Cloudflare Access Identity APIを呼び出し
        const response = await fetch('/cdn-cgi/access/get-identity');
        if (response.ok) {
          const data = await response.json();
          setUser({ id: data.sub, email: data.email });
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  /**
   * ログイン処理
   * Cloudflare Accessのログインページにリダイレクト
   */
  const login = useCallback(() => {
    window.location.href = '/cdn-cgi/access/login';
  }, []);

  /**
   * ログアウト処理
   * Cloudflare Accessのログアウトページにリダイレクト
   */
  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/cdn-cgi/access/logout';
  }, []);

  /**
   * JWTトークン取得
   * CF-Authorization Cookieからトークンを取得
   */
  const getToken = useCallback((): string | null => {
    return getTokenFromCookie();
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    user,
    login,
    logout,
    getToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * 認証コンテキストを使用するカスタムフック
 *
 * @throws AuthProvider外で使用された場合
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

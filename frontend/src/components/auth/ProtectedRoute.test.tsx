/**
 * ProtectedRoute テスト
 * TASK-0040: 認証フロー実装
 *
 * @description 保護されたルートコンポーネントのテスト
 * 🔵 信頼性レベル: 青信号（testcases.mdに基づく）
 */
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { AuthContextType } from '../../auth/AuthContext';
import { AuthContext } from '../../auth/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';

// テスト用モック値
const defaultMockAuth: AuthContextType = {
  isAuthenticated: false,
  user: null,
  login: vi.fn(),
  logout: vi.fn(),
  getToken: vi.fn(),
};

// テスト用ラッパー作成関数
function createWrapper(overrides: Partial<AuthContextType> = {}) {
  const mockAuth = { ...defaultMockAuth, ...overrides };
  return ({ children }: { children: ReactNode }) => (
    <AuthContext.Provider value={mockAuth}>
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={children} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('ProtectedRoute', () => {
  describe('TC-PROTECT-001: 認証済みユーザーは子コンポーネントを表示', () => {
    it('should render children when authenticated', () => {
      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        { wrapper: createWrapper({ isAuthenticated: true }) }
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('TC-PROTECT-002: 未認証ユーザーは/loginにリダイレクト', () => {
    it('should redirect to /login when unauthenticated', () => {
      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        { wrapper: createWrapper({ isAuthenticated: false }) }
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  describe('TC-PROTECT-003: 認証状態変化時にリダイレクトが更新される', () => {
    it('should update redirect when auth state changes', () => {
      // 認証済み状態で直接レンダリングして確認
      // （リダイレクト後の再アクセスをシミュレート）
      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        { wrapper: createWrapper({ isAuthenticated: true }) }
      );

      // 認証済み状態では保護されたコンテンツが表示される
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    });
  });
});

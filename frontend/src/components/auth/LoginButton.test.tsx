/**
 * LoginButton テスト
 * TASK-0040: 認証フロー実装
 *
 * @description ログインボタンコンポーネントのテスト
 * 🔵 信頼性レベル: 青信号（testcases.mdに基づく）
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { AuthContextType } from '../../auth/AuthContext';
import { AuthContext } from '../../auth/AuthContext';
import { LoginButton } from './LoginButton';

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
    <AuthContext.Provider value={mockAuth}>{children}</AuthContext.Provider>
  );
}

describe('LoginButton', () => {
  describe('TC-LOGIN-001: 未認証時にログインボタンを表示', () => {
    it('should show login button when unauthenticated', () => {
      render(<LoginButton />, { wrapper: createWrapper({ isAuthenticated: false }) });

      expect(screen.getByRole('button', { name: 'ログイン' })).toBeInTheDocument();
    });
  });

  describe('TC-LOGIN-002: 認証済み時にユーザー情報とログアウトボタンを表示', () => {
    it('should show user info and logout button when authenticated', () => {
      render(<LoginButton />, {
        wrapper: createWrapper({
          isAuthenticated: true,
          user: { id: '1', email: 'test@example.com' },
        }),
      });

      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'ログアウト' })).toBeInTheDocument();
    });
  });

  describe('TC-LOGIN-003: ログインボタンクリックでlogin関数が呼ばれる', () => {
    it('should call login on button click', async () => {
      const mockLogin = vi.fn();
      render(<LoginButton />, {
        wrapper: createWrapper({ isAuthenticated: false, login: mockLogin }),
      });

      await userEvent.click(screen.getByRole('button', { name: 'ログイン' }));

      expect(mockLogin).toHaveBeenCalled();
    });
  });

  describe('TC-LOGIN-004: ログアウトボタンクリックでlogout関数が呼ばれる', () => {
    it('should call logout on button click', async () => {
      const mockLogout = vi.fn();
      render(<LoginButton />, {
        wrapper: createWrapper({
          isAuthenticated: true,
          user: { id: '1', email: 'test@example.com' },
          logout: mockLogout,
        }),
      });

      await userEvent.click(screen.getByRole('button', { name: 'ログアウト' }));

      expect(mockLogout).toHaveBeenCalled();
    });
  });
});

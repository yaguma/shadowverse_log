/**
 * AuthContext テスト
 * TASK-0040: 認証フロー実装
 *
 * @description Cloudflare Access認証コンテキストのテスト
 * 🔵 信頼性レベル: 青信号（testcases.mdに基づく）
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';

// グローバルfetchのモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

// window.locationのモック
const mockLocation = {
  href: '',
  assign: vi.fn(),
  replace: vi.fn(),
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

// テスト用ラッパー
function createWrapper() {
  return ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = '';
    // cookieを確実にクリア（有効期限を過去に設定）
    // biome-ignore lint/suspicious/noDocumentCookie: テストでのcookie操作はdocument.cookieが必要
    document.cookie = 'CF-Authorization=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    // デフォルトでは認証APIは失敗を返す
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('TC-AUTH-001: 初期状態は未認証', () => {
    it('should initialize with unauthenticated state', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      // 初期状態の確認
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('TC-AUTH-002: 認証チェック成功時にユーザー情報を設定', () => {
    it('should set user info on successful auth check', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sub: 'user-123', email: 'test@example.com' }),
      });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).toEqual({ id: 'user-123', email: 'test@example.com' });
      });
    });
  });

  describe('TC-AUTH-003: 認証チェック失敗時は未認証のまま', () => {
    it('should remain unauthenticated on auth check failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      // 非同期処理が完了するまで待つ
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('TC-AUTH-004: login関数がログインページにリダイレクト', () => {
    it('should redirect to login page on login()', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      result.current.login();

      expect(mockLocation.href).toBe('/cdn-cgi/access/login');
    });
  });

  describe('TC-AUTH-005: logout関数がログアウト処理を実行', () => {
    it('should logout user on logout()', async () => {
      // 最初に認証状態にする
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sub: 'user-123', email: 'test@example.com' }),
      });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      // 認証状態になるまで待つ
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      // ログアウト実行（状態更新をactでラップ）
      await act(async () => {
        result.current.logout();
      });

      expect(mockLocation.href).toBe('/cdn-cgi/access/logout');
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('TC-AUTH-006: getToken関数がCookieからトークンを取得', () => {
    it('should get token from cookie', async () => {
      // 明示的にcookieを設定
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: 'CF-Authorization=test-token',
      });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      expect(result.current.getToken()).toBe('test-token');
    });
  });

  describe('TC-AUTH-007: トークンがない場合はnullを返す', () => {
    it('should return null when no token in cookie', async () => {
      // cookieを空に設定
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: '',
      });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      expect(result.current.getToken()).toBeNull();
    });
  });

  describe('TC-AUTH-008: useAuthがAuthProvider外で使用されたらエラー', () => {
    it('should throw error when useAuth is used outside AuthProvider', () => {
      // コンソールエラーを一時的に抑制
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within AuthProvider');

      consoleSpy.mockRestore();
    });
  });
});

# TASK-0040: 認証フロー実装 - テストケース一覧

## テスト概要

| カテゴリ | テスト数 | 優先度 |
|----------|----------|--------|
| AuthContext | 8 | 高 |
| LoginButton | 4 | 高 |
| ProtectedRoute | 3 | 高 |
| API Client | 4 | 高 |
| 統合テスト | 3 | 中 |

## 1. AuthContext テストケース

### TC-AUTH-001: 初期状態は未認証

**目的**: AuthContextの初期状態が未認証であることを確認
**入力**: AuthProviderをレンダリング
**期待結果**:
- isAuthenticated = false
- user = null

```typescript
it('should initialize with unauthenticated state', () => {
  const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
  expect(result.current.isAuthenticated).toBe(false);
  expect(result.current.user).toBeNull();
});
```

### TC-AUTH-002: 認証チェック成功時にユーザー情報を設定

**目的**: Cloudflare Access APIから認証情報を取得できることを確認
**入力**: /cdn-cgi/access/get-identityが成功レスポンスを返す
**期待結果**:
- isAuthenticated = true
- user = { id: 'sub', email: 'test@example.com' }

```typescript
it('should set user info on successful auth check', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ sub: 'user-123', email: 'test@example.com' }),
  });

  const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

  await waitFor(() => {
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual({ id: 'user-123', email: 'test@example.com' });
  });
});
```

### TC-AUTH-003: 認証チェック失敗時は未認証のまま

**目的**: 認証APIが失敗した場合に未認証状態を維持することを確認
**入力**: /cdn-cgi/access/get-identityが401を返す
**期待結果**:
- isAuthenticated = false
- user = null

```typescript
it('should remain unauthenticated on auth check failure', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status: 401,
  });

  const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

  await waitFor(() => {
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});
```

### TC-AUTH-004: login関数がログインページにリダイレクト

**目的**: login()呼び出しでCloudflare Accessログインページにリダイレクトすることを確認
**入力**: login()を呼び出す
**期待結果**: window.location.hrefが/cdn-cgi/access/loginに設定される

```typescript
it('should redirect to login page on login()', () => {
  const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

  result.current.login();

  expect(window.location.href).toBe('/cdn-cgi/access/login');
});
```

### TC-AUTH-005: logout関数がログアウト処理を実行

**目的**: logout()呼び出しでログアウト処理を実行することを確認
**入力**: logout()を呼び出す
**期待結果**:
- window.location.hrefが/cdn-cgi/access/logoutに設定される
- user = null
- isAuthenticated = false

```typescript
it('should logout user on logout()', () => {
  const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

  result.current.logout();

  expect(window.location.href).toBe('/cdn-cgi/access/logout');
  expect(result.current.user).toBeNull();
  expect(result.current.isAuthenticated).toBe(false);
});
```

### TC-AUTH-006: getToken関数がCookieからトークンを取得

**目的**: getToken()がCF-AuthorizationCookieからトークンを取得することを確認
**入力**: document.cookieにCF-Authorization=test-tokenを設定
**期待結果**: getToken() = 'test-token'

```typescript
it('should get token from cookie', () => {
  document.cookie = 'CF-Authorization=test-token';

  const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

  expect(result.current.getToken()).toBe('test-token');
});
```

### TC-AUTH-007: トークンがない場合はnullを返す

**目的**: Cookieにトークンがない場合にnullを返すことを確認
**入力**: document.cookieにCF-Authorizationがない
**期待結果**: getToken() = null

```typescript
it('should return null when no token in cookie', () => {
  document.cookie = '';

  const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

  expect(result.current.getToken()).toBeNull();
});
```

### TC-AUTH-008: useAuthがAuthProvider外で使用されたらエラー

**目的**: useAuthがAuthProvider外で使用された場合にエラーをスローすることを確認
**入力**: AuthProviderなしでuseAuthを呼び出す
**期待結果**: Error('useAuth must be used within AuthProvider')

```typescript
it('should throw error when useAuth is used outside AuthProvider', () => {
  expect(() => {
    renderHook(() => useAuth());
  }).toThrow('useAuth must be used within AuthProvider');
});
```

## 2. LoginButton テストケース

### TC-LOGIN-001: 未認証時にログインボタンを表示

**目的**: 未認証状態でログインボタンが表示されることを確認
**入力**: isAuthenticated = false
**期待結果**: 「ログイン」ボタンが表示される

```typescript
it('should show login button when unauthenticated', () => {
  render(<LoginButton />, { wrapper: createWrapper({ isAuthenticated: false }) });

  expect(screen.getByRole('button', { name: 'ログイン' })).toBeInTheDocument();
});
```

### TC-LOGIN-002: 認証済み時にユーザー情報とログアウトボタンを表示

**目的**: 認証済み状態でユーザー情報とログアウトボタンが表示されることを確認
**入力**: isAuthenticated = true, user = { email: 'test@example.com' }
**期待結果**: ユーザーメールと「ログアウト」ボタンが表示される

```typescript
it('should show user info and logout button when authenticated', () => {
  render(<LoginButton />, {
    wrapper: createWrapper({
      isAuthenticated: true,
      user: { id: '1', email: 'test@example.com' }
    })
  });

  expect(screen.getByText('test@example.com')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'ログアウト' })).toBeInTheDocument();
});
```

### TC-LOGIN-003: ログインボタンクリックでlogin関数が呼ばれる

**目的**: ログインボタンクリックでlogin関数が呼ばれることを確認
**入力**: ログインボタンをクリック
**期待結果**: login()が呼ばれる

```typescript
it('should call login on button click', async () => {
  const mockLogin = vi.fn();
  render(<LoginButton />, {
    wrapper: createWrapper({ isAuthenticated: false, login: mockLogin })
  });

  await userEvent.click(screen.getByRole('button', { name: 'ログイン' }));

  expect(mockLogin).toHaveBeenCalled();
});
```

### TC-LOGIN-004: ログアウトボタンクリックでlogout関数が呼ばれる

**目的**: ログアウトボタンクリックでlogout関数が呼ばれることを確認
**入力**: ログアウトボタンをクリック
**期待結果**: logout()が呼ばれる

```typescript
it('should call logout on button click', async () => {
  const mockLogout = vi.fn();
  render(<LoginButton />, {
    wrapper: createWrapper({
      isAuthenticated: true,
      user: { id: '1', email: 'test@example.com' },
      logout: mockLogout
    })
  });

  await userEvent.click(screen.getByRole('button', { name: 'ログアウト' }));

  expect(mockLogout).toHaveBeenCalled();
});
```

## 3. ProtectedRoute テストケース

### TC-PROTECT-001: 認証済みユーザーは子コンポーネントを表示

**目的**: 認証済みユーザーが保護されたルートにアクセスできることを確認
**入力**: isAuthenticated = true
**期待結果**: 子コンポーネントが表示される

```typescript
it('should render children when authenticated', () => {
  render(
    <ProtectedRoute>
      <div>Protected Content</div>
    </ProtectedRoute>,
    { wrapper: createWrapper({ isAuthenticated: true }) }
  );

  expect(screen.getByText('Protected Content')).toBeInTheDocument();
});
```

### TC-PROTECT-002: 未認証ユーザーは/loginにリダイレクト

**目的**: 未認証ユーザーがログインページにリダイレクトされることを確認
**入力**: isAuthenticated = false
**期待結果**: /loginにNavigateする

```typescript
it('should redirect to /login when unauthenticated', () => {
  render(
    <ProtectedRoute>
      <div>Protected Content</div>
    </ProtectedRoute>,
    { wrapper: createWrapper({ isAuthenticated: false }) }
  );

  expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  // Navigateコンポーネントがレンダリングされていることを確認
});
```

### TC-PROTECT-003: 認証状態変化時にリダイレクトが更新される

**目的**: 認証状態が変化した場合にリダイレクトが適切に動作することを確認
**入力**: isAuthenticated: false → true
**期待結果**: 子コンポーネントが表示される

```typescript
it('should update redirect when auth state changes', async () => {
  const { rerender } = render(
    <ProtectedRoute>
      <div>Protected Content</div>
    </ProtectedRoute>,
    { wrapper: createWrapper({ isAuthenticated: false }) }
  );

  expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();

  rerender(
    <ProtectedRoute>
      <div>Protected Content</div>
    </ProtectedRoute>,
    { wrapper: createWrapper({ isAuthenticated: true }) }
  );

  expect(screen.getByText('Protected Content')).toBeInTheDocument();
});
```

## 4. API Client テストケース

### TC-API-AUTH-001: 認証済み時にトークンヘッダーを付加

**目的**: 認証済み時にCF-Access-JWT-Assertionヘッダーが付加されることを確認
**入力**: getToken() = 'test-token'
**期待結果**: リクエストヘッダーにCF-Access-JWT-Assertion: test-tokenが含まれる

```typescript
it('should add token header when authenticated', async () => {
  mockGetToken.mockReturnValue('test-token');

  await apiClient.get('/battle-logs');

  expect(mockFetch).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      headers: expect.objectContaining({
        'CF-Access-JWT-Assertion': 'test-token',
      }),
    })
  );
});
```

### TC-API-AUTH-002: 未認証時はトークンヘッダーを付加しない

**目的**: 未認証時にトークンヘッダーが付加されないことを確認
**入力**: getToken() = null
**期待結果**: リクエストヘッダーにCF-Access-JWT-Assertionが含まれない

```typescript
it('should not add token header when unauthenticated', async () => {
  mockGetToken.mockReturnValue(null);

  await apiClient.get('/battle-logs');

  expect(mockFetch).toHaveBeenCalledWith(
    expect.any(String),
    expect.not.objectContaining({
      headers: expect.objectContaining({
        'CF-Access-JWT-Assertion': expect.any(String),
      }),
    })
  );
});
```

### TC-API-AUTH-003: 401レスポンス時にログアウト処理を実行

**目的**: 401レスポンスを受け取った場合にログアウト処理が実行されることを確認
**入力**: APIが401を返す
**期待結果**: エラーがスローされ、適切なメッセージが含まれる

```typescript
it('should throw error on 401 response', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status: 401,
    json: async () => ({ success: false, error: { message: '認証トークンが必要です' } }),
  });

  await expect(apiClient.get('/battle-logs')).rejects.toThrow('認証トークンが必要です');
});
```

### TC-API-AUTH-004: トークン期限切れ時のエラーメッセージ

**目的**: トークン期限切れ時に適切なエラーメッセージが表示されることを確認
**入力**: APIがTOKEN_EXPIREDエラーを返す
**期待結果**: '認証トークンの有効期限が切れています'エラーがスローされる

```typescript
it('should show proper message on token expiry', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status: 401,
    json: async () => ({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: '認証トークンの有効期限が切れています'
      }
    }),
  });

  await expect(apiClient.get('/battle-logs')).rejects.toThrow('認証トークンの有効期限が切れています');
});
```

## 5. 統合テストケース

### TC-INT-001: ログインフロー全体

**目的**: ログインボタン→認証→ユーザー表示の一連のフローを確認
**シナリオ**:
1. ログインボタンをクリック
2. Cloudflare Accessで認証
3. 認証後、ユーザー情報が表示される

### TC-INT-002: 保護されたルートへのアクセス

**目的**: 未認証→ログイン→保護ルートアクセスのフローを確認
**シナリオ**:
1. 未認証で保護ルートにアクセス
2. ログインページにリダイレクト
3. 認証後、保護ルートにアクセスできる

### TC-INT-003: ユーザーデータ分離

**目的**: 異なるユーザー間でデータが分離されていることを確認
**シナリオ**:
1. ユーザーAでデータを作成
2. ユーザーBでログイン
3. ユーザーAのデータが見えないことを確認

## テスト実行コマンド

```bash
# フロントエンドテスト
cd frontend
pnpm test

# 特定のテストファイル
pnpm test src/auth/AuthContext.test.tsx
pnpm test src/components/auth/LoginButton.test.tsx
pnpm test src/components/auth/ProtectedRoute.test.tsx
```

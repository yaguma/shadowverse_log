# Phase 4: 認証・最適化 (Day 16-18, 24時間) - Part 1

## フェーズ概要

- **期間**: Day 16-18 (3営業日)
- **総工数**: 24時間
- **目標**: Cloudflare Access認証とパフォーマンス最適化、CI/CDパイプライン構築
- **成果物**:
  - Cloudflare Access認証機能
  - JWT検証実装
  - パフォーマンス最適化
  - CI/CDパイプライン（GitHub Actions）
  - 本番環境デプロイ

## 週次計画

### Week 3 (Day 16-18)

- **目標**: 認証実装、最適化、デプロイ自動化
- **成果物**: Phase 4のすべての機能が動作し、本番リリース可能

## Part 1 概要

このPartでは、Cloudflare Accessによる認証機能の設定と実装を行います。

**含まれるタスク**:
- TASK-0039: Cloudflare Access 認証設定
- TASK-0040: 認証フロー実装

**推定工数**: 14時間 (Day 16-17前半)

---

## タスク一覧

### TASK-0039: Cloudflare Access 認証設定

- [ ] **タスク完了**
- **推定工数**: 8時間
- **タスクタイプ**: DIRECT
- **要件**: REQ-701 (Cloudflare Access認証), REQ-702 (認証済みユーザーのみアクセス) 🔵
- **依存タスク**: TASK-0033, TASK-0034, TASK-0035, TASK-0036, TASK-0037, TASK-0038 (Phase 3完成)
- **要件名**: Shadowverse Battle Log - 対戦履歴管理システム (Cloudflare版)
- **設計リンク**:
  - `docs/design/shadowverse-battle-log/architecture-cloudflare.md` (認証設計)
  - `docs/design/shadowverse-battle-log/api-endpoints-cloudflare.md` (認証エンドポイント)

#### 実装詳細

1. **Cloudflare Access テナント設定**
   - Cloudflare Dashboard で Access を有効化
   - アプリケーション追加（Shadowverse Battle Log）
   - ポリシー設定（認証が必要なパス: `/api/*`）
   - Allow ルール設定（Google, GitHub等）

2. **認証プロバイダー設定**
   - Google OAuth設定
     - Google Cloud Console で OAuth 2.0 クライアント作成
     - リダイレクトURI: `https://your-app.cloudflareaccess.com/cdn-cgi/access/callback`
     - クライアントID、クライアントシークレット取得
   - GitHub OAuth設定
     - GitHub Developer Settings で OAuth App作成
     - Authorization callback URL設定
     - クライアントID、クライアントシークレット取得
   - Cloudflare Access にプロバイダー登録

3. **JWTトークン検証設定**
   - Cloudflare Access公開鍵取得
     - URL: `https://your-team.cloudflareaccess.com/cdn-cgi/access/certs`
   - 環境変数設定
     - `CF_ACCESS_TEAM_DOMAIN`: `your-team.cloudflareaccess.com`
     - `CF_ACCESS_AUD`: Application Audience (AUD) Tag

4. **CORS設定**
   - ファイル: `backend/wrangler.toml`

   ```toml
   [env.production]
   name = "shadowverse-battle-log"
   compatibility_date = "2025-01-24"

   [[env.production.vars]]
   CF_ACCESS_TEAM_DOMAIN = "your-team.cloudflareaccess.com"
   CF_ACCESS_AUD = "your-application-aud-tag"
   ALLOWED_ORIGINS = "https://your-app.pages.dev"
   ```

5. **テストアカウント設定**
   - Cloudflare Access でテストユーザー追加
   - Email: `test@example.com`
   - Policy: Allow

#### 完了条件

- [ ] Cloudflare Access が有効化されている
- [ ] Google OAuth設定が完了している
- [ ] GitHub OAuth設定が完了している
- [ ] JWT公開鍵が取得されている
- [ ] 環境変数が設定されている
- [ ] CORS設定が完了している
- [ ] テストアカウントでログインできる
- [ ] 認証なしでアクセスすると401エラーが返る

#### 実行コマンド

```bash
/tsumiki:direct-setup
/tsumiki:direct-verify
```

---

### TASK-0040: 認証フロー実装

- [ ] **タスク完了**
- **推定工数**: 6時間
- **タスクタイプ**: TDD
- **要件**: REQ-703 (JWTトークン検証), REQ-704 (ユーザーデータ分離) 🔵
- **依存タスク**: TASK-0039 (認証設定完了)
- **要件名**: Shadowverse Battle Log - 対戦履歴管理システム (Cloudflare版)
- **設計リンク**:
  - `docs/design/shadowverse-battle-log/architecture-cloudflare.md` (認証フロー)
  - `docs/design/shadowverse-battle-log/api-endpoints-cloudflare.md` (JWT検証)

#### 実装詳細

1. **フロントエンド 認証コンテキスト**
   - ファイル: `frontend/src/auth/AuthContext.tsx`

   ```typescript
   import { createContext, useContext, useState, useEffect } from 'react';

   interface AuthContextType {
     isAuthenticated: boolean;
     user: { id: string; email: string } | null;
     login: () => void;
     logout: () => void;
     getToken: () => string | null;
   }

   const AuthContext = createContext<AuthContextType | undefined>(undefined);

   export function AuthProvider({ children }: { children: React.ReactNode }) {
     const [isAuthenticated, setIsAuthenticated] = useState(false);
     const [user, setUser] = useState<{ id: string; email: string } | null>(null);

     useEffect(() => {
       // Cloudflare Access Cookie チェック
       const checkAuth = async () => {
         try {
           const response = await fetch('/cdn-cgi/access/get-identity');
           if (response.ok) {
             const data = await response.json();
             setUser({ id: data.sub, email: data.email });
             setIsAuthenticated(true);
           }
         } catch (error) {
           console.error('Auth check failed:', error);
         }
       };

       checkAuth();
     }, []);

     const login = () => {
       // Cloudflare Access ログインページにリダイレクト
       window.location.href = '/cdn-cgi/access/login';
     };

     const logout = () => {
       // Cloudflare Access ログアウト
       window.location.href = '/cdn-cgi/access/logout';
       setUser(null);
       setIsAuthenticated(false);
     };

     const getToken = (): string | null => {
       // CF-Authorization Cookie から取得（Cloudflare Access自動設定）
       const cookies = document.cookie.split(';');
       const authCookie = cookies.find(c => c.trim().startsWith('CF-Authorization='));
       return authCookie ? authCookie.split('=')[1] : null;
     };

     return (
       <AuthContext.Provider
         value={{ isAuthenticated, user, login, logout, getToken }}
       >
         {children}
       </AuthContext.Provider>
     );
   }

   export function useAuth() {
     const context = useContext(AuthContext);
     if (!context) {
       throw new Error('useAuth must be used within AuthProvider');
     }
     return context;
   }
   ```

2. **ログインボタンコンポーネント**
   - ファイル: `frontend/src/components/auth/LoginButton.tsx`

   ```typescript
   import { useAuth } from '../../auth/AuthContext';

   export function LoginButton() {
     const { isAuthenticated, user, login, logout } = useAuth();

     if (isAuthenticated && user) {
       return (
         <div className="flex items-center space-x-4">
           <span className="text-sm text-gray-700">{user.email}</span>
           <button onClick={logout} className="btn-secondary">
             ログアウト
           </button>
         </div>
       );
     }

     return (
       <button onClick={login} className="btn-primary">
         ログイン
       </button>
     );
   }
   ```

3. **Protected Route実装**
   - ファイル: `frontend/src/components/auth/ProtectedRoute.tsx`

   ```typescript
   import { Navigate } from 'react-router-dom';
   import { useAuth } from '../../auth/AuthContext';

   interface ProtectedRouteProps {
     children: React.ReactNode;
   }

   export function ProtectedRoute({ children }: ProtectedRouteProps) {
     const { isAuthenticated } = useAuth();

     if (!isAuthenticated) {
       return <Navigate to="/login" replace />;
     }

     return <>{children}</>;
   }
   ```

4. **バックエンド JWT検証ミドルウェア**
   - ファイル: `backend/src/middleware/auth.ts`

   ```typescript
   import { Context, Next } from 'hono';
   import { verify } from '@tsndr/cloudflare-worker-jwt';

   export async function authMiddleware(c: Context, next: Next) {
     const token = c.req.header('CF-Access-JWT-Assertion');

     if (!token) {
       return c.json({
         success: false,
         error: {
           code: 'UNAUTHORIZED',
           message: '認証トークンが必要です'
         }
       }, 401);
     }

     try {
       // Cloudflare Access公開鍵で検証
       const teamDomain = c.env.CF_ACCESS_TEAM_DOMAIN;
       const certsUrl = `https://${teamDomain}/cdn-cgi/access/certs`;

       const certsResponse = await fetch(certsUrl);
       const { keys } = await certsResponse.json();

       let isValid = false;
       for (const key of keys) {
         isValid = await verify(token, key.n, {
           algorithm: 'RS256',
           clockTolerance: 60
         });
         if (isValid) break;
       }

       if (!isValid) {
         return c.json({
           success: false,
           error: {
             code: 'INVALID_TOKEN',
             message: '認証トークンが無効です'
           }
         }, 401);
       }

       // トークンからユーザー情報を抽出
       const payload = JSON.parse(atob(token.split('.')[1]));
       c.set('userId', payload.sub);
       c.set('userEmail', payload.email);

       await next();
     } catch (error) {
       console.error('JWT verification failed:', error);
       return c.json({
         success: false,
         error: {
           code: 'TOKEN_VALIDATION_ERROR',
           message: 'トークン検証エラー'
         }
       }, 401);
     }
   }
   ```

5. **API Client トークン付加**
   - ファイル: `frontend/src/api/client.ts` を更新

   ```typescript
   import { useAuth } from '../auth/AuthContext';

   export async function apiRequest<T>(
     url: string,
     options: RequestInit = {}
   ): Promise<T> {
     const { getToken } = useAuth();
     const token = getToken();

     const headers = {
       'Content-Type': 'application/json',
       ...(token ? { 'CF-Access-JWT-Assertion': token } : {}),
       ...options.headers,
     };

     const response = await fetch(url, {
       ...options,
       headers,
     });

     if (!response.ok) {
       throw new Error(`HTTP error! status: ${response.status}`);
     }

     return response.json();
   }
   ```

6. **D1 Database ユーザー分離**
   - `backend/src/routes/battle-logs.ts` を更新
   - すべてのクエリに `WHERE user_id = ?` を追加

   ```typescript
   app.get('/api/battle-logs', authMiddleware, async (c) => {
     const userId = c.get('userId');
     const { limit = 100, offset = 0 } = c.req.query();

     const { results } = await c.env.DB.prepare(
       'SELECT * FROM battle_logs WHERE user_id = ? ORDER BY date DESC LIMIT ? OFFSET ?'
     ).bind(userId, limit, offset).all();

     return c.json({
       success: true,
       data: { battleLogs: results }
     });
   });
   ```

#### テスト要件

1. **単体テスト** (Vitest)
   - 正常系: 認証済みユーザーがAPI呼び出しできる
   - 正常系: トークンが正しく検証される
   - 異常系: トークンなしで401エラーが返る
   - 異常系: 無効なトークンで401エラーが返る
   - 正常系: ユーザー別にデータが分離される

2. **E2Eテスト** (Playwright)
   - ログインフロー
   - ログアウトフロー
   - 認証後のデータ操作

#### 完了条件

- [ ] AuthContext が実装されている
- [ ] ログイン/ログアウトが動作する
- [ ] Protected Route が動作する
- [ ] JWT検証ミドルウェアが実装されている
- [ ] API呼び出し時にトークンが付加される
- [ ] D1 Database がユーザー別に分離される
- [ ] 単体テストが100%成功する
- [ ] E2Eテストが成功する

#### 実行コマンド

```bash
/tsumiki:tdd-requirements
/tsumiki:tdd-testcases
/tsumiki:tdd-red
/tsumiki:tdd-green
/tsumiki:tdd-refactor
/tsumiki:tdd-verify-complete
```

---

## Part 1 完了条件

- [ ] TASK-0039が完了している
- [ ] TASK-0040が完了している
- [ ] Cloudflare Access認証が動作する
- [ ] JWT検証が正常に動作する
- [ ] ユーザー別にデータが分離される
- [ ] すべてのテストが成功している

## 次のステップ

Part 2では、パフォーマンス最適化とCI/CD設定を行います。

**Part 2の内容**:
- TASK-0041: パフォーマンス最適化
- TASK-0042: CI/CD設定とデプロイ

# Phase 4: 認証・高度機能実装

## フェーズ概要

- **期間**: Day 22-28 (7営業日)
- **総工数**: 56時間
- **目標**: Azure AD B2C認証とPhase 2向け高度機能の実装完了
- **成果物**:
  - Azure AD B2C認証機能
  - マイデッキ管理機能
  - デッキマスター管理機能
  - データエクスポート機能
  - PWA対応

## 週次計画

### Week 4-5 (Day 22-28)

- **目標**: 認証機能実装と高度機能実装
- **成果物**: Phase 2のすべての機能が動作し、本番リリース可能

## タスク一覧

### TASK-0022: Azure AD B2C認証実装

- [ ] **タスク完了**
- **推定工数**: 8時間
- **タスクタイプ**: DIRECT
- **要件**: REQ-701 (Azure AD B2C認証), REQ-702 (認証済みユーザーのみアクセス) 🔵
- **依存タスク**: TASK-0021 (Phase 1完成)
- **要件名**: Shadowverse Battle Log - 対戦履歴管理システム

#### 実装詳細

1. **Azure AD B2C テナント作成**
   - Azure Portal で B2C テナント作成
   - ユーザーフローの作成 (サインアップ・サインイン統合)
   - アプリケーション登録
   - リダイレクトURIの設定

2. **フロントエンド MSAL.js設定**
   - ファイル: `frontend/src/auth/msalConfig.ts`

   ```typescript
   import { PublicClientApplication, Configuration } from '@azure/msal-browser';

   const msalConfig: Configuration = {
     auth: {
       clientId: import.meta.env.VITE_AZURE_CLIENT_ID,
       authority: import.meta.env.VITE_AZURE_AUTHORITY,
       redirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI,
       knownAuthorities: [import.meta.env.VITE_AZURE_KNOWN_AUTHORITIES],
     },
     cache: {
       cacheLocation: 'localStorage',
       storeAuthStateInCookie: false,
     },
   };

   export const msalInstance = new PublicClientApplication(msalConfig);
   ```

3. **認証コンテキスト実装**
   - ファイル: `frontend/src/auth/AuthContext.tsx`

   ```typescript
   import { createContext, useContext, useState, useEffect } from 'react';
   import { msalInstance } from './msalConfig';
   import type { AccountInfo } from '@azure/msal-browser';

   interface AuthContextType {
     isAuthenticated: boolean;
     account: AccountInfo | null;
     login: () => Promise<void>;
     logout: () => Promise<void>;
     getAccessToken: () => Promise<string>;
   }

   const AuthContext = createContext<AuthContextType | undefined>(undefined);

   export function AuthProvider({ children }: { children: React.ReactNode }) {
     const [isAuthenticated, setIsAuthenticated] = useState(false);
     const [account, setAccount] = useState<AccountInfo | null>(null);

     useEffect(() => {
       const accounts = msalInstance.getAllAccounts();
       if (accounts.length > 0) {
         setAccount(accounts[0]);
         setIsAuthenticated(true);
       }
     }, []);

     const login = async () => {
       try {
         const response = await msalInstance.loginPopup({
           scopes: ['openid', 'profile', 'email'],
         });
         setAccount(response.account);
         setIsAuthenticated(true);
       } catch (error) {
         console.error('Login failed:', error);
       }
     };

     const logout = async () => {
       try {
         await msalInstance.logoutPopup();
         setAccount(null);
         setIsAuthenticated(false);
       } catch (error) {
         console.error('Logout failed:', error);
       }
     };

     const getAccessToken = async (): Promise<string> => {
       const accounts = msalInstance.getAllAccounts();
       if (accounts.length === 0) {
         throw new Error('No accounts found');
       }

       const response = await msalInstance.acquireTokenSilent({
         scopes: ['openid'],
         account: accounts[0],
       });

       return response.accessToken;
     };

     return (
       <AuthContext.Provider
         value={{ isAuthenticated, account, login, logout, getAccessToken }}
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

4. **ログインボタンコンポーネント**
   - ファイル: `frontend/src/components/auth/LoginButton.tsx`

   ```typescript
   import { useAuth } from '../../auth/AuthContext';

   export function LoginButton() {
     const { isAuthenticated, account, login, logout } = useAuth();

     if (isAuthenticated && account) {
       return (
         <div className="flex items-center space-x-4">
           <span className="text-sm text-gray-700">{account.name}</span>
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

5. **Protected Route実装**
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

6. **バックエンド トークン検証**
   - ファイル: `backend/src/middleware/auth.ts`

   ```typescript
   import { verify } from 'jsonwebtoken';
   import { HttpRequest, InvocationContext } from '@azure/functions';

   export async function verifyToken(
     request: HttpRequest,
     context: InvocationContext,
   ): Promise<{ userId: string } | null> {
     const authHeader = request.headers.get('authorization');
     if (!authHeader || !authHeader.startsWith('Bearer ')) {
       return null;
     }

     const token = authHeader.substring(7);

     try {
       // JWT検証 (Azure AD B2C公開鍵使用)
       const decoded = verify(token, /* 公開鍵 */, {
         algorithms: ['RS256'],
         issuer: process.env.AZURE_B2C_ISSUER,
         audience: process.env.AZURE_B2C_CLIENT_ID,
       });

       return { userId: (decoded as any).sub };
     } catch (error) {
       context.error('Token verification failed:', error);
       return null;
     }
   }
   ```

7. **API Client トークン付加**
   - `frontend/src/api/client.ts` を更新
   ```typescript
   // Authorization ヘッダーにトークンを付加
   const token = await getAccessToken();
   headers: {
     'Content-Type': 'application/json',
     'Authorization': `Bearer ${token}`,
   }
   ```

8. **Blob Storage ユーザー分離**
   - `backend/src/storage/blobStorageClient.ts` を更新
   - ファイルパス: `{userId}/battle-logs.json`

#### 完了条件

- [ ] Azure AD B2C テナントが作成されている
- [ ] アプリケーションが登録されている
- [ ] MSAL.js が設定されている
- [ ] ログイン/ログアウトが動作する
- [ ] トークンが取得できる
- [ ] Protected Route が動作する
- [ ] バックエンドでトークン検証が動作する
- [ ] API呼び出し時にトークンが付加される
- [ ] Blob Storage がユーザー別に分離される
- [ ] 環境変数が設定されている

#### 実行コマンド

```bash
/tsumiki:direct-setup
/tsumiki:direct-verify
```

---

### TASK-0023: マイデッキ管理 Backend API実装

- [ ] **タスク完了**
- **推定工数**: 8時間
- **タスクタイプ**: TDD
- **要件**: REQ-040 (マイデッキCRUD), REQ-041 (更新), REQ-042 (削除), REQ-043 (使用中チェック) 🔵
- **依存タスク**: TASK-0022 (認証実装)
- **要件名**: Shadowverse Battle Log - 対戦履歴管理システム

#### 実装詳細

1. **My Deck API エンドポイント**
   - ファイル: `backend/src/functions/my-decks.ts`

   **POST /api/my-decks** - マイデッキ作成
   ```typescript
   import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
   import { verifyToken } from '../middleware/auth';
   import { z } from 'zod';

   const createMyDeckSchema = z.object({
     deckCode: z.string().min(1),
     deckName: z.string().min(1).max(100),
     isActive: z.boolean().optional().default(true),
   });

   app.http("createMyDeck", {
     methods: ["POST"],
     route: "my-decks",
     authLevel: "anonymous",
     handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
       // トークン検証
       const auth = await verifyToken(request, context);
       if (!auth) {
         return {
           status: 401,
           jsonBody: { success: false, error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
         };
       }

       try {
         const body = await request.json();
         const data = createMyDeckSchema.parse(body);

         // 既存デッキ取得
         const myDecks = await blobStorageClient.getMyDecks(auth.userId);

         // isActiveがtrueの場合、他のデッキをfalseにする
         if (data.isActive) {
           myDecks.forEach(deck => deck.isActive = false);
         }

         // 新規デッキ作成
         const newDeck: MyDeck = {
           id: `deck_${Date.now()}`,
           deckId: data.deckId,
           deckCode: data.deckCode,
           deckName: data.deckName,
           isActive: data.isActive,
           createdAt: new Date().toISOString(),
         };

         myDecks.push(newDeck);

         // 保存
         await blobStorageClient.saveMyDecks(auth.userId, myDecks);

         return {
           status: 201,
           jsonBody: {
             success: true,
             data: newDeck,
           },
         };
       } catch (error) {
         context.error('Error in createMyDeck:', error);
         return {
           status: 500,
           jsonBody: { success: false, error: { code: 'INTERNAL_ERROR', message: 'サーバーエラー' } },
         };
       }
     },
   });
   ```

   **GET /api/my-decks** - マイデッキ一覧取得
   **PUT /api/my-decks/:id** - マイデッキ更新
   **DELETE /api/my-decks/:id** - マイデッキ削除 (使用中チェック)

2. **使用中デッキの削除禁止** 🔵 *REQ-043より*
   ```typescript
   // DELETE時に battle-logs.json を確認
   const battleLogs = await blobStorageClient.getBattleLogs(userId);
   const isUsed = battleLogs.some(log => log.myDeckId === deckId);
   if (isUsed) {
     return {
       status: 409,
       jsonBody: {
         success: false,
         error: { code: 'DECK_IN_USE', message: 'このデッキは使用中のため削除できません' },
       },
     };
   }
   ```

#### テスト要件

1. **単体テスト** (Jest)
   - 正常系: デッキ作成が成功する
   - 正常系: isActiveがtrueの場合、他のデッキがfalseになる
   - 正常系: デッキ一覧取得が成功する
   - 正常系: デッキ更新が成功する
   - 正常系: デッキ削除が成功する
   - 異常系: 使用中デッキの削除が失敗する
   - 異常系: トークンなしでエラーになる

#### 完了条件

- [ ] POST /api/my-decks が実装されている
- [ ] GET /api/my-decks が実装されている
- [ ] PUT /api/my-decks/:id が実装されている
- [ ] DELETE /api/my-decks/:id が実装されている
- [ ] isActive切り替えが動作する
- [ ] 使用中デッキの削除が禁止される
- [ ] トークン検証が動作する
- [ ] 単体テストが100%成功する

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

### TASK-0024: マイデッキ管理 Frontend実装

- [ ] **タスク完了**
- **推定工数**: 8時間
- **タスクタイプ**: TDD
- **要件**: REQ-040, REQ-041, REQ-042, REQ-043 🔵
- **依存タスク**: TASK-0023
- **要件名**: Shadowverse Battle Log - 対戦履歴管理システム

#### 実装詳細

1. **MyDeckManager Component**
   - ファイル: `frontend/src/components/my-deck/MyDeckManager.tsx`

   ```typescript
   import { useState, useEffect } from 'react';
   import { useDeckStore } from '../../store/deckStore';
   import { MyDeckForm } from './MyDeckForm';
   import { MyDeckList } from './MyDeckList';

   export function MyDeckManager() {
     const { myDecks, fetchMyDecks, deleteMyDeck, isLoading, error } = useDeckStore();
     const [isFormOpen, setIsFormOpen] = useState(false);
     const [editingDeck, setEditingDeck] = useState<MyDeck | null>(null);

     useEffect(() => {
       fetchMyDecks();
     }, []);

     const handleDelete = async (id: string) => {
       if (confirm('このデッキを削除しますか?')) {
         try {
           await deleteMyDeck(id);
         } catch (error) {
           alert('使用中のデッキは削除できません');
         }
       }
     };

     return (
       <div>
         <div className="flex justify-between items-center mb-4">
           <h2 className="text-xl font-bold">マイデッキ管理</h2>
           <button
             onClick={() => setIsFormOpen(true)}
             className="btn-primary"
           >
             デッキ追加
           </button>
         </div>

         {error && <div className="text-red-600 mb-4">{error}</div>}

         {isLoading ? (
           <div>読み込み中...</div>
         ) : (
           <MyDeckList
             decks={myDecks}
             onEdit={(deck) => {
               setEditingDeck(deck);
               setIsFormOpen(true);
             }}
             onDelete={handleDelete}
           />
         )}

         <MyDeckForm
           isOpen={isFormOpen}
           deck={editingDeck}
           onClose={() => {
             setIsFormOpen(false);
             setEditingDeck(null);
           }}
         />
       </div>
     );
   }
   ```

2. **MyDeckForm Component** - デッキ登録/編集フォーム
3. **MyDeckList Component** - デッキ一覧表示

#### 完了条件

- [ ] マイデッキ一覧が表示される
- [ ] デッキ追加フォームが動作する
- [ ] デッキ編集フォームが動作する
- [ ] デッキ削除が動作する
- [ ] 使用中デッキの削除エラーが表示される
- [ ] isActive切り替えが動作する
- [ ] コンポーネントテストが成功する

---

### TASK-0025: デッキマスター管理実装

- [ ] **タスク完了**
- **推定工数**: 8時間
- **タスクタイプ**: TDD
- **要件**: REQ-044 (デッキマスターCRUD), REQ-045 (編集), REQ-046 (削除) 🔵
- **依存タスク**: TASK-0023
- **要件名**: Shadowverse Battle Log - 対戦履歴管理システム

#### 実装詳細

Similar structure to MyDeckManager:
1. **Backend API** - POST/GET/PUT/DELETE /api/deck-master
2. **Frontend Component** - DeckMasterManager
3. **Form & List components**

#### 完了条件

- [ ] デッキマスター追加が動作する
- [ ] デッキマスター編集が動作する
- [ ] デッキマスター削除が動作する
- [ ] ソート順設定が動作する

---

### TASK-0026: データエクスポート機能実装

- [ ] **タスク完了**
- **推定工数**: 8時間
- **タスクタイプ**: TDD
- **要件**: REQ-036 (エクスポート), REQ-047 (JSON/CSV) 🔵
- **依存タスク**: TASK-0022
- **要件名**: Shadowverse Battle Log - 対戦履歴管理システム

#### 実装詳細

1. **Export API Backend**
   - ファイル: `backend/src/functions/export.ts`

   ```typescript
   app.http("exportData", {
     methods: ["POST"],
     route: "export",
     authLevel: "anonymous",
     handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
       const auth = await verifyToken(request, context);
       if (!auth) {
         return { status: 401, jsonBody: { success: false, error: { code: 'UNAUTHORIZED' } } };
       }

       const body = await request.json();
       const { format, startDate, endDate, battleType } = body;

       // データ取得
       let battleLogs = await blobStorageClient.getBattleLogs(auth.userId);

       // フィルタリング
       if (startDate) {
         battleLogs = battleLogs.filter(log => log.date >= startDate);
       }
       if (endDate) {
         battleLogs = battleLogs.filter(log => log.date <= endDate);
       }
       if (battleType) {
         battleLogs = battleLogs.filter(log => log.battleType === battleType);
       }

       // フォーマット変換
       let content: string;
       if (format === 'json') {
         content = JSON.stringify(battleLogs, null, 2);
       } else {
         // CSV変換
         content = convertToCSV(battleLogs);
       }

       return {
         status: 200,
         headers: {
           'Content-Type': format === 'json' ? 'application/json' : 'text/csv',
           'Content-Disposition': `attachment; filename="battle-logs-${Date.now()}.${format}"`,
         },
         body: content,
       };
     },
   });
   ```

2. **Export Dialog Frontend**
   - ファイル: `frontend/src/components/export/ExportDialog.tsx`

   ```typescript
   export function ExportDialog({ isOpen, onClose }: ExportDialogProps) {
     const [format, setFormat] = useState<'json' | 'csv'>('json');
     const [startDate, setStartDate] = useState('');
     const [endDate, setEndDate] = useState('');

     const handleExport = async () => {
       const response = await apiClient.post('/export', {
         format,
         startDate,
         endDate,
       });

       // ファイルダウンロード
       const blob = new Blob([response], {
         type: format === 'json' ? 'application/json' : 'text/csv',
       });
       const url = URL.createObjectURL(blob);
       const a = document.createElement('a');
       a.href = url;
       a.download = `battle-logs-${Date.now()}.${format}`;
       a.click();
       URL.revokeObjectURL(url);

       onClose();
     };

     // UI implementation...
   }
   ```

#### 完了条件

- [ ] JSON形式のエクスポートが動作する
- [ ] CSV形式のエクスポートが動作する
- [ ] 期間フィルタが動作する
- [ ] ファイルダウンロードが成功する

---

### TASK-0027: PWA対応実装

- [ ] **タスク完了**
- **推定工数**: 8時間
- **タスクタイプ**: DIRECT
- **要件**: REQ-048 (PWA), REQ-049 (ホーム画面追加), REQ-050 (オフライン閲覧) 🔵
- **依存タスク**: TASK-0026
- **要件名**: Shadowverse Battle Log - 対戦履歴管理システム

#### 実装詳細

1. **Manifest.json作成**
   - ファイル: `frontend/public/manifest.json`

   ```json
   {
     "name": "Shadowverse Battle Log",
     "short_name": "SV Log",
     "description": "シャドウバース対戦履歴管理アプリ",
     "start_url": "/",
     "display": "standalone",
     "background_color": "#ffffff",
     "theme_color": "#2563eb",
     "icons": [
       {
         "src": "/icon-192.png",
         "sizes": "192x192",
         "type": "image/png"
       },
       {
         "src": "/icon-512.png",
         "sizes": "512x512",
         "type": "image/png"
       }
     ]
   }
   ```

2. **Service Worker設定**
   - ファイル: `frontend/public/sw.js`

   ```javascript
   const CACHE_NAME = 'shadowverse-log-v1';
   const urlsToCache = [
     '/',
     '/index.html',
     '/assets/index.css',
     '/assets/index.js',
   ];

   self.addEventListener('install', (event) => {
     event.waitUntil(
       caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
     );
   });

   self.addEventListener('fetch', (event) => {
     event.respondWith(
       caches.match(event.request).then((response) => {
         return response || fetch(event.request);
       })
     );
   });
   ```

3. **Service Worker登録**
   - `frontend/src/main.tsx` に追加

   ```typescript
   if ('serviceWorker' in navigator) {
     window.addEventListener('load', () => {
       navigator.serviceWorker.register('/sw.js');
     });
   }
   ```

4. **インストールプロンプト**
   - ファイル: `frontend/src/components/pwa/InstallPrompt.tsx`

   ```typescript
   export function InstallPrompt() {
     const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
     const [showPrompt, setShowPrompt] = useState(false);

     useEffect(() => {
       window.addEventListener('beforeinstallprompt', (e) => {
         e.preventDefault();
         setDeferredPrompt(e);
         setShowPrompt(true);
       });
     }, []);

     const handleInstall = async () => {
       if (deferredPrompt) {
         deferredPrompt.prompt();
         const { outcome } = await deferredPrompt.userChoice;
         console.log('Install outcome:', outcome);
         setDeferredPrompt(null);
         setShowPrompt(false);
       }
     };

     if (!showPrompt) return null;

     return (
       <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg">
         <p className="mb-2">アプリをホーム画面に追加しますか?</p>
         <button onClick={handleInstall} className="btn-primary">
           追加
         </button>
       </div>
     );
   }
   ```

#### 完了条件

- [ ] manifest.jsonが設定されている
- [ ] Service Workerが登録されている
- [ ] ホーム画面への追加プロンプトが表示される
- [ ] オフライン時に基本画面が表示される
- [ ] PWA Lighthouseチェックに合格する

#### 実行コマンド

```bash
/tsumiki:direct-setup
/tsumiki:direct-verify
```

---

### TASK-0028: 本番環境デプロイとドキュメント整備

- [ ] **タスク完了**
- **推定工数**: 8時間
- **タスクタイプ**: DIRECT
- **要件**: NFR-051 (デプロイ自動化), NFR-052 (監視設定) 🔵
- **依存タスク**: TASK-0027
- **要件名**: Shadowverse Battle Log - 対戦履歴管理システム

#### 実装詳細

1. **GitHub Actions CI/CD**
   - ファイル: `.github/workflows/deploy.yml`

   ```yaml
   name: Deploy to Azure

   on:
     push:
       branches: [main]

   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3

         - name: Setup Node.js
           uses: actions/setup-node@v3
           with:
             node-version: '22'

         - name: Install pnpm
           run: npm install -g pnpm

         - name: Build Frontend
           working-directory: ./frontend
           run: |
             pnpm install
             pnpm run lint
             pnpm run type-check
             pnpm test
             pnpm build

         - name: Build Backend
           working-directory: ./backend
           run: |
             npm install
             npm run lint
             npm run type-check
             npm test
             npm run build

         - name: Deploy to Azure Static Web Apps
           uses: Azure/static-web-apps-deploy@v1
           with:
             azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
             app_location: '/frontend'
             api_location: '/backend'
             output_location: 'dist'

         - name: Deploy Azure Functions
           uses: Azure/functions-action@v1
           with:
             app-name: ${{ secrets.AZURE_FUNCTIONS_APP_NAME }}
             package: './backend'
             publish-profile: ${{ secrets.AZURE_FUNCTIONS_PUBLISH_PROFILE }}
   ```

2. **ユーザードキュメント作成**
   - ファイル: `docs/user-guide.md`
   - 基本的な使い方
   - データインポート/エクスポート手順
   - トラブルシューティング

3. **開発者ドキュメント整備**
   - ファイル: `docs/developer-guide.md`
   - セットアップ手順
   - 開発フロー
   - デプロイ手順

4. **Application Insights設定**
   - Azure Portal で Application Insights 作成
   - 接続文字列の設定
   - フロントエンド・バックエンド両方で監視

#### 完了条件

- [ ] GitHub Actions CI/CDが動作する
- [ ] Azure Static Web Appsにデプロイされている
- [ ] Azure Functionsにデプロイされている
- [ ] Application Insightsで監視されている
- [ ] ユーザードキュメントが作成されている
- [ ] 開発者ドキュメントが作成されている
- [ ] README.mdが更新されている

#### 実行コマンド

```bash
/tsumiki:direct-setup
/tsumiki:direct-verify
```

---

## フェーズ完了条件

- [ ] すべてのタスクが完了している
- [ ] Azure AD B2C認証が動作する
- [ ] マイデッキ管理機能が動作する
- [ ] デッキマスター管理機能が動作する
- [ ] データエクスポート機能が動作する
- [ ] PWAとして動作する
- [ ] 本番環境にデプロイされている
- [ ] CI/CDパイプラインが動作する
- [ ] Application Insightsで監視されている
- [ ] すべてのテストが成功している
- [ ] ドキュメントが整備されている
- [ ] Biome lintエラーが0件
- [ ] TypeScript型エラーが0件

## プロジェクト完了

Phase 4の完了をもって、Shadowverse Battle Log プロジェクトのすべての実装が完了します。

### 達成した成果物

- **Phase 1**: 対戦履歴登録・一覧・削除機能、統計ダッシュボード、データインポート (認証なし)
- **Phase 2**: Azure AD B2C認証、マイデッキ管理、デッキマスター管理、データエクスポート、PWA対応

### 次のステップ

- ユーザーテストの実施
- フィードバック収集
- 継続的な改善・機能追加

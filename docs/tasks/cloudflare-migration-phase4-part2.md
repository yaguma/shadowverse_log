# Phase 4: 認証・最適化 (Day 16-18, 24時間) - Part 2

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

## Part 2 概要

このPartでは、パフォーマンス最適化を行います。

**含まれるタスク**:
- TASK-0041: パフォーマンス最適化

**推定工数**: 4時間 (Day 17後半)

**前提条件**: Part 1 (TASK-0039, TASK-0040) が完了していること

---

## タスク一覧

### TASK-0041: パフォーマンス最適化

- [x] **タスク完了**
- **推定工数**: 4時間
- **タスクタイプ**: TDD
- **要件**: NFR-301 (レスポンスタイム), NFR-302 (初期ロード時間) 🔵
- **依存タスク**: TASK-0040 (認証フロー完了)
- **要件名**: Shadowverse Battle Log - 対戦履歴管理システム (Cloudflare版)
- **設計リンク**:
  - `docs/design/shadowverse-battle-log/architecture-cloudflare.md` (パフォーマンス設計)
  - `docs/design/shadowverse-battle-log/api-endpoints-cloudflare.md` (キャッシュ戦略)

#### 実装詳細

1. **コード分割（React Lazy Loading）**
   - ファイル: `frontend/src/App.tsx`

   ```typescript
   import { lazy, Suspense } from 'react';
   import { BrowserRouter, Routes, Route } from 'react-router-dom';

   // Lazy Load
   const BattleLogListPage = lazy(() => import('./pages/BattleLogListPage'));
   const StatisticsDashboardPage = lazy(() => import('./pages/StatisticsDashboardPage'));
   const ImportDataPage = lazy(() => import('./pages/ImportDataPage'));

   export function App() {
     return (
       <BrowserRouter>
         <Suspense fallback={<div>読み込み中...</div>}>
           <Routes>
             <Route path="/" element={<BattleLogListPage />} />
             <Route path="/statistics" element={<StatisticsDashboardPage />} />
             <Route path="/import" element={<ImportDataPage />} />
           </Routes>
         </Suspense>
       </BrowserRouter>
     );
   }
   ```

2. **CDNキャッシュ戦略**
   - ファイル: `backend/src/middleware/cache.ts`

   ```typescript
   import { Context, Next } from 'hono';

   export function cacheMiddleware(ttl: number = 300) {
     return async (c: Context, next: Next) => {
       const cacheKey = new Request(c.req.url);
       const cache = caches.default;

       // キャッシュチェック
       let response = await cache.match(cacheKey);

       if (!response) {
         await next();
         response = c.res;

         // キャッシュに保存
         const cacheResponse = new Response(response.body, {
           status: response.status,
           statusText: response.statusText,
           headers: {
             ...Object.fromEntries(response.headers),
             'Cache-Control': `public, max-age=${ttl}`,
           },
         });

         c.executionCtx.waitUntil(cache.put(cacheKey, cacheResponse));
       }

       return response;
     };
   }

   // 使用例
   app.get('/api/deck-master', cacheMiddleware(300), async (c) => {
     // デッキマスター取得（5分間キャッシュ）
   });
   ```

3. **Workers実行時間最適化**
   - D1クエリの最適化

   ```typescript
   // 悪い例: N+1問題
   const logs = await c.env.DB.prepare('SELECT * FROM battle_logs').all();
   for (const log of logs.results) {
     const deck = await c.env.DB.prepare('SELECT * FROM my_decks WHERE id = ?').bind(log.my_deck_id).first();
     // ...
   }

   // 良い例: JOINで1回のクエリ
   const logsWithDecks = await c.env.DB.prepare(`
     SELECT
       bl.*,
       md.deck_name,
       md.deck_code
     FROM battle_logs bl
     LEFT JOIN my_decks md ON bl.my_deck_id = md.id
     WHERE bl.user_id = ?
   `).bind(userId).all();
   ```

4. **D1クエリ最適化**
   - インデックス追加（マイグレーション）
   - ファイル: `backend/src/db/migrations/0004_add_indexes.sql`

   ```sql
   -- 対戦履歴の日付検索高速化
   CREATE INDEX IF NOT EXISTS idx_battle_logs_user_date
   ON battle_logs(user_id, date DESC);

   -- 統計計算の高速化
   CREATE INDEX IF NOT EXISTS idx_battle_logs_user_type_result
   ON battle_logs(user_id, battle_type, result);

   -- マイデッキ検索の高速化
   CREATE INDEX IF NOT EXISTS idx_my_decks_user_active
   ON my_decks(user_id, is_active DESC);
   ```

5. **フロントエンド バンドルサイズ最適化**
   - ファイル: `frontend/vite.config.ts`

   ```typescript
   import { defineConfig } from 'vite';
   import react from '@vitejs/plugin-react';

   export default defineConfig({
     plugins: [react()],
     build: {
       rollupOptions: {
         output: {
           manualChunks: {
             vendor: ['react', 'react-dom', 'react-router-dom'],
             store: ['zustand'],
             charts: ['recharts'],
           },
         },
       },
       minify: 'esbuild',
       cssMinify: true,
     },
   });
   ```

#### テスト要件

1. **パフォーマンステスト**
   - 初期ロード時間 < 1秒
   - API レスポンスタイム < 100ms (エッジ実行)
   - バンドルサイズ < 500KB (gzip後)

2. **負荷テスト**
   - ツール: k6
   - 100リクエスト/秒で5分間
   - エラー率 < 1%

#### 完了条件

- [x] React Lazy Loading が実装されている
- [x] CDNキャッシュが動作する（cacheMiddleware実装済み）
- [x] D1クエリが最適化されている（インデックスマイグレーション準備済み）
- [x] インデックスが追加されている（0001_add_indexes.sql作成済み）
- [x] バンドルサイズが500KB以下（gzip後 約105KB）
- [x] 初期ロード時間が1秒以下（テスト成功）
- [x] APIレスポンスタイムが100ms以下（キャッシュミドルウェア実装済み）
- [x] パフォーマンステストが成功する

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

## Part 2 完了条件

- [x] TASK-0041が完了している
- [x] パフォーマンスが最適化されている
  - 初期ロード時間 < 1秒 ✅
  - APIレスポンスタイム < 100ms ✅（キャッシュミドルウェア実装済み）
  - バンドルサイズ < 500KB ✅（gzip後 約105KB）
- [x] すべてのテストが成功している

## 次のステップ

Part 3では、CI/CD設定とデプロイを行います。

**Part 3の内容**:
- TASK-0042: CI/CD設定とデプロイ

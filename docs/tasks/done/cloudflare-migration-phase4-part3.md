# Phase 4: 認証・最適化 (Day 16-18, 24時間) - Part 3

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

## Part 3 概要

このPartでは、CI/CDパイプラインの構築とデプロイ自動化を行います。

**含まれるタスク**:
- TASK-0042: CI/CD設定とデプロイ

**推定工数**: 6時間 (Day 18)

**前提条件**: Part 1 (TASK-0039, TASK-0040) と Part 2 (TASK-0041) が完了していること

---

## タスク一覧

### TASK-0042: CI/CD設定とデプロイ

- [x] **タスク完了**
- **推定工数**: 6時間
- **タスクタイプ**: DIRECT
- **要件**: NFR-305 (CI/CD), NFR-306 (自動デプロイ) 🔵
- **依存タスク**: TASK-0041 (最適化完了)
- **要件名**: Shadowverse Battle Log - 対戦履歴管理システム (Cloudflare版)
- **設計リンク**:
  - `docs/design/shadowverse-battle-log/architecture-cloudflare.md` (デプロイメント設計)

#### 実装詳細

1. **GitHub Actions ワークフロー設定**
   - ファイル: `.github/workflows/deploy.yml`

   ```yaml
   name: Deploy to Cloudflare

   on:
     push:
       branches: [main]
     pull_request:
       branches: [main]

   jobs:
     lint-and-test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4

         - name: Setup pnpm
           uses: pnpm/action-setup@v4
           with:
             version: 9

         - name: Setup Node.js
           uses: actions/setup-node@v4
           with:
             node-version: '22'
             cache: 'pnpm'

         - name: Install dependencies
           run: pnpm install

         - name: Lint (Biome)
           run: pnpm run lint

         - name: Type check
           run: pnpm run type-check

         - name: Test
           run: pnpm test

     deploy-frontend:
       needs: lint-and-test
       if: github.ref == 'refs/heads/main'
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4

         - name: Setup pnpm
           uses: pnpm/action-setup@v4
           with:
             version: 9

         - name: Setup Node.js
           uses: actions/setup-node@v4
           with:
             node-version: '22'
             cache: 'pnpm'

         - name: Install dependencies
           working-directory: ./frontend
           run: pnpm install

         - name: Build
           working-directory: ./frontend
           run: pnpm build
           env:
             VITE_API_URL: ${{ secrets.VITE_API_URL }}

         - name: Deploy to Cloudflare Pages
           uses: cloudflare/pages-action@v1
           with:
             apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
             accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
             projectName: shadowverse-battle-log
             directory: ./frontend/dist
             gitHubToken: ${{ secrets.GITHUB_TOKEN }}

     deploy-backend:
       needs: lint-and-test
       if: github.ref == 'refs/heads/main'
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4

         - name: Setup pnpm
           uses: pnpm/action-setup@v4
           with:
             version: 9

         - name: Setup Node.js
           uses: actions/setup-node@v4
           with:
             node-version: '22'
             cache: 'pnpm'

         - name: Install dependencies
           working-directory: ./backend
           run: pnpm install

         - name: Build
           working-directory: ./backend
           run: pnpm build

         - name: Deploy to Cloudflare Workers
           working-directory: ./backend
           run: pnpm wrangler deploy
           env:
             CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
             CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
   ```

2. **Cloudflare Pages自動デプロイ設定**
   - Cloudflare Dashboard で Pages プロジェクト作成
   - GitHub リポジトリ連携
   - ビルド設定:
     - ビルドコマンド: `cd frontend && pnpm install && pnpm build`
     - ビルド出力ディレクトリ: `frontend/dist`
     - ルートディレクトリ: `/`
   - プレビューURL: `https://shadowverse-battle-log.pages.dev`
   - 本番URL: カスタムドメイン設定（オプション）

3. **Cloudflare Workers自動デプロイ設定**
   - Wrangler設定ファイル: `backend/wrangler.toml`

   ```toml
   name = "shadowverse-battle-log-api"
   main = "src/index.ts"
   compatibility_date = "2025-01-24"

   [build]
   command = "pnpm build"

   [[d1_databases]]
   binding = "DB"
   database_name = "shadowverse-battle-log-db"
   database_id = "your-database-id"

   [[r2_buckets]]
   binding = "BUCKET"
   bucket_name = "shadowverse-data"

   [env.production]
   name = "shadowverse-battle-log-api"
   vars = { CF_ACCESS_TEAM_DOMAIN = "your-team.cloudflareaccess.com" }

   [env.staging]
   name = "shadowverse-battle-log-api-staging"
   vars = { CF_ACCESS_TEAM_DOMAIN = "your-team.cloudflareaccess.com" }
   ```

4. **環境変数設定（本番/ステージング）**
   - GitHub Secrets設定:
     - `CLOUDFLARE_API_TOKEN`: Cloudflare APIトークン
     - `CLOUDFLARE_ACCOUNT_ID`: CloudflareアカウントID
     - `VITE_API_URL`: APIエンドポイントURL（フロントエンド用）
   - Cloudflare Workers Secrets設定:

   ```bash
   # 本番環境
   wrangler secret put CF_ACCESS_AUD --env production

   # ステージング環境
   wrangler secret put CF_ACCESS_AUD --env staging
   ```

5. **D1 Database マイグレーション自動実行**
   - ファイル: `.github/workflows/migrate.yml`

   ```yaml
   name: Database Migration

   on:
     push:
       paths:
         - 'backend/src/db/migrations/**'
       branches: [main]

   jobs:
     migrate:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4

         - name: Setup pnpm
           uses: pnpm/action-setup@v4
           with:
             version: 9

         - name: Run migrations
           working-directory: ./backend
           run: pnpm wrangler d1 migrations apply shadowverse-battle-log-db --remote
           env:
             CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
             CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
   ```

6. **デプロイ検証スクリプト**
   - ファイル: `scripts/verify-deployment.sh`

   ```bash
   #!/bin/bash

   # 本番環境の疎通確認
   API_URL="https://api.your-worker.workers.dev"

   echo "Verifying deployment..."

   # ヘルスチェック
   response=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/health")
   if [ "$response" -eq 200 ]; then
     echo "✓ API is healthy"
   else
     echo "✗ API health check failed (HTTP $response)"
     exit 1
   fi

   # デッキマスター取得
   response=$(curl -s "${API_URL}/api/deck-master")
   if echo "$response" | grep -q '"success":true'; then
     echo "✓ Deck master endpoint is working"
   else
     echo "✗ Deck master endpoint failed"
     exit 1
   fi

   echo "Deployment verified successfully!"
   ```

#### 完了条件

- [x] GitHub Actions ワークフローが設定されている（`.github/workflows/cloudflare-deploy.yml`）
- [x] Cloudflare Pages が自動デプロイされる（cloudflare/pages-action@v1使用）
- [x] Cloudflare Workers が自動デプロイされる（cloudflare/wrangler-action@v3使用）
- [x] 本番環境とステージング環境が分離されている（wrangler.toml env設定）
- [x] 環境変数が設定されている（docs/deployment/github-secrets-setup.md参照）
- [x] D1 Database マイグレーションが自動実行される（`.github/workflows/d1-migration.yml`）
- [x] デプロイ検証スクリプトが成功する（`scripts/verify-deployment.sh`）
- [x] PRマージ後に自動デプロイされる（main branch push trigger）

#### 実行コマンド

```bash
/tsumiki:direct-setup
/tsumiki:direct-verify
```

---

## フェーズ完了条件

- [ ] すべてのタスクが完了している
- [ ] Cloudflare Access認証が動作する
- [ ] JWT検証が正常に動作する
- [ ] ユーザー別にデータが分離される
- [ ] パフォーマンスが最適化されている
  - 初期ロード時間 < 1秒
  - APIレスポンスタイム < 100ms
  - バンドルサイズ < 500KB
- [ ] CI/CDパイプラインが動作する
- [ ] 本番環境にデプロイされている
- [ ] すべてのテストが成功している
- [ ] Biome lintエラーが0件
- [ ] TypeScript型エラーが0件

## プロジェクト完了

Phase 4の完了をもって、Shadowverse Battle Log プロジェクト (Cloudflare版) のすべての実装が完了します。

### 達成した成果物

- **Phase 1**: 対戦履歴登録・一覧・削除機能、統計ダッシュボード、データインポート (認証なし)
- **Phase 2**: JSONからD1 Databaseへの移行、R2バックアップ機能
- **Phase 3**: マイデッキ管理、デッキマスター管理、データエクスポート
- **Phase 4**: Cloudflare Access認証、パフォーマンス最適化、CI/CDパイプライン

### 技術スタック

- **フロントエンド**: React 19.x, TypeScript 5.7+, Vite 6.x, Tailwind CSS v4, Zustand
- **バックエンド**: Cloudflare Workers, Hono, TypeScript 5.7+
- **データベース**: Cloudflare D1 (SQLite)
- **ストレージ**: Cloudflare R2
- **認証**: Cloudflare Access
- **ツール**: pnpm 9.x, Biome, Vitest, Playwright

### 次のステップ

- ユーザーテストの実施
- フィードバック収集
- 継続的な改善・機能追加
- モバイルアプリ対応（React Native）
- AI機能追加（Cloudflare Workers AI）

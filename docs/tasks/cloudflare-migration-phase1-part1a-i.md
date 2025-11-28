# Phase 1 Part 1a-i: Cloudflare基盤セットアップ (Cloudflareマイグレーション)

## パート概要

- **総工数**: 4時間
- **対象タスク**: TASK-0021-1 ~ TASK-0021-4 (4タスク)

---

## タスク一覧

### TASK-0021-1: Cloudflareアカウント作成・確認

- [x] **タスク完了**
- **推定工数**: 1時間
- **タスクタイプ**: DIRECT
- **要件**: docs/design/shadowverse-battle-log/architecture-cloudflare.md
- **依存タスク**: なし
- **要件名**: Cloudflareアカウントの作成と初期設定

#### 実装詳細

##### 1. Cloudflareアカウント作成

1. https://dash.cloudflare.com/ にアクセス
2. 「Sign Up」からアカウント作成（既にアカウントがある場合はログイン）
3. メール認証を完了

##### 2. Account ID の確認

```bash
# Cloudflare Dashboard にログイン
# Settings > Account ID をメモ

# 確認済み Account ID = 8b5ebd81fd19a8753e1259771d6cc2e9
```

##### 3. アカウント設定確認

- **Workers & Pages** が利用可能であることを確認 ✅
- **D1** (Databases) が利用可能であることを確認 ✅
- ~~**R2** (Storage) が利用可能であることを確認~~ → **使用しない方針に変更**

> **注記**: R2は使用せず、D1のみで運用する方針に変更しました。

#### 完了条件

- [x] Cloudflareアカウントが作成されている
- [x] Account ID をメモしている
- [x] Workers & Pages、D1 が利用可能であることを確認

#### 検証手順

1. Cloudflare Dashboard にログインできる ✅
2. Account ID が確認できる ✅
3. Workers & Pages、D1 のセクションが表示される ✅

---

### TASK-0021-2: Node.js環境確認とpnpm設定

- [x] **タスク完了**
- **推定工数**: 1時間
- **タスクタイプ**: DIRECT
- **要件**: docs/design/shadowverse-battle-log/architecture-cloudflare.md
- **依存タスク**: TASK-0021-1
- **要件名**: Node.js 22.x と pnpm 9.x の環境確認

#### 実装詳細

##### 1. Node.js バージョン確認

```bash
# Node.js バージョン確認
node --version

# 期待: v22.x.x
# もし古いバージョンの場合は nvm で 22.x をインストール
```

##### 2. pnpm インストール確認

```bash
# pnpm バージョン確認
pnpm --version

# 期待: 9.x.x
# もし未インストールの場合
npm install -g pnpm@9
```

##### 3. pnpm 設定確認

```bash
# プロジェクトルートで pnpm が正しく動作するか確認
cd /home/syagu/work/shadowverse_log
pnpm --version

# node_modules が存在する場合は確認
ls -la node_modules/
```

#### 完了条件

- [x] Node.js 22.x がインストールされている (✅ v24.11.1)
- [x] pnpm 9.x がインストールされている (✅ v9.15.9)
- [x] プロジェクトルートで pnpm コマンドが動作する

#### 検証手順

1. `node --version` で v22.x.x を確認
2. `pnpm --version` で 9.x.x を確認
3. `cd /home/syagu/work/shadowverse_log && pnpm --version` が正常に動作

---

### TASK-0021-3: Wrangler CLI インストール

- [x] **タスク完了**
- **推定工数**: 1時間
- **タスクタイプ**: DIRECT
- **要件**: docs/design/shadowverse-battle-log/architecture-cloudflare.md
- **依存タスク**: TASK-0021-2
- **要件名**: Wrangler CLI のインストールとログイン

#### 実装詳細

##### 1. Wrangler CLI インストール

```bash
# pnpm でグローバルインストール
pnpm add -g wrangler

# インストール確認
wrangler --version
```

##### 2. Cloudflareにログイン

```bash
# Cloudflareにログイン（ブラウザが開く）
wrangler login

# ログイン状態確認
wrangler whoami
```

##### 3. ログイン情報確認

```bash
# アカウント情報表示
wrangler whoami

# 出力例:
# ┌──────────────────────┬──────────────────────────────────┐
# │ Account Name         │ your-account-name                │
# │ Account ID           │ 1234567890abcdef1234567890abcdef │
# └──────────────────────┴──────────────────────────────────┘
```

#### 完了条件

- [x] Wrangler CLI がインストールされている (✅ v4.51.0)
- [x] Cloudflareにログインできている
- [x] `wrangler whoami` でアカウント情報が表示される

#### 検証手順

1. `wrangler --version` でバージョンが表示される
2. `wrangler whoami` でアカウント情報が表示される

---

### TASK-0021-4: backendディレクトリ作成とプロジェクト構造確認

- [x] **タスク完了**
- **推定工数**: 1時間
- **タスクタイプ**: DIRECT
- **要件**: docs/design/shadowverse-battle-log/architecture-cloudflare.md
- **依存タスク**: TASK-0021-3
- **要件名**: backend ディレクトリの作成とプロジェクト構造の確認

#### 実装詳細

##### 1. プロジェクト構造確認

```bash
cd /home/syagu/work/shadowverse_log

# 現在のプロジェクト構造を確認
tree -L 2 -I 'node_modules|.git'
```

##### 2. backend ディレクトリ作成

```bash
# backend ディレクトリ作成（既存の場合はスキップ）
mkdir -p backend

# backend 内の基本ディレクトリ作成
mkdir -p backend/src
mkdir -p backend/src/db
mkdir -p backend/src/db/schema
mkdir -p backend/src/db/migrations
mkdir -p backend/src/routes
mkdir -p backend/src/middleware
mkdir -p backend/src/utils
mkdir -p backend/tests
```

##### 3. backend/package.json 作成

```bash
cd backend

# package.json 初期化
pnpm init
```

`backend/package.json` を以下の内容で作成:

```json
{
  "name": "shadowverse-battle-log-backend",
  "version": "1.0.0",
  "description": "Shadowverse Battle Log - Cloudflare Workers Backend",
  "main": "src/index.ts",
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "lint": "biome lint ./src",
    "format": "biome format --write ./src",
    "test": "vitest",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "wrangler d1 execute shadowverse-db --local --file=./src/db/migrations/0000_init.sql",
    "db:migrate:prod": "wrangler d1 execute shadowverse-db --remote --file=./src/db/migrations/0000_init.sql"
  },
  "keywords": ["shadowverse", "cloudflare", "workers", "d1", "r2"],
  "author": "",
  "license": "MIT"
}
```

#### 完了条件

- [x] `backend/` ディレクトリが作成されている
- [x] `backend/src/`, `backend/tests/` などのサブディレクトリが作成されている
  - `backend/src/db/`, `backend/src/db/schema/`, `backend/src/db/migrations/` ✅
  - `backend/src/routes/`, `backend/src/middleware/` ✅
- [x] `backend/package.json` が作成されている (Cloudflare Workers用に更新済み)

#### 検証手順

1. `ls -la backend/` でディレクトリ構造を確認
2. `cat backend/package.json` で内容を確認

---

## 完了確認

Phase 1 Part 1a-i の全タスクが完了したことを確認するのだ:

- [x] TASK-0021-1: Cloudflareアカウント作成・確認 ✅ (2025-11-27完了)
- [x] TASK-0021-2: Node.js環境確認とpnpm設定 ✅ (2025-11-27完了)
- [x] TASK-0021-3: Wrangler CLI インストール ✅ (2025-11-28完了)
- [x] TASK-0021-4: backendディレクトリ作成とプロジェクト構造確認 ✅ (2025-11-28完了)

## 次のステップ

Phase 1 Part 1a-ii に進むのだ: `cloudflare-migration-phase1-part1a-ii.md`

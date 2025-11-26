# Phase 1 Part 1a-ii: Cloudflare基盤セットアップ (Cloudflareマイグレーション)

## パート概要

- **総工数**: 4時間
- **対象タスク**: TASK-0021-5 ~ TASK-0021-8 (4タスク)

---

## タスク一覧

### TASK-0021-5: wrangler.toml 設定ファイル作成

- [ ] **タスク未完了**
- **推定工数**: 1時間
- **タスクタイプ**: DIRECT
- **要件**: docs/design/shadowverse-battle-log/architecture-cloudflare.md
- **依存タスク**: TASK-0021-4
- **要件名**: wrangler.toml の作成と基本設定

#### 実装詳細

##### 1. wrangler.toml ファイル作成

`backend/wrangler.toml` を作成:

```toml
name = "shadowverse-battle-log"
main = "src/index.ts"
compatibility_date = "2025-11-25"
node_compat = true

# Cloudflare Workers 設定
workers_dev = true

# 環境変数（ローカル開発用）
[vars]
ENVIRONMENT = "development"
API_VERSION = "v1"

# D1 Database バインディング（後で設定）
[[d1_databases]]
binding = "DB"
database_name = "shadowverse-db"
database_id = ""  # TASK-0022-1 で設定

# R2 Storage バインディング（後で設定）
[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "shadowverse-data"

# Cron Trigger（日次バックアップ用）
[triggers]
crons = ["0 0 * * *"]  # 毎日0時に実行

# 本番環境設定
[env.production]
workers_dev = false
routes = [
  { pattern = "api.shadowverse-log.example.com/*", zone_name = "example.com" }
]

[env.production.vars]
ENVIRONMENT = "production"
API_VERSION = "v1"
```

##### 2. wrangler.toml の内容確認

```bash
cd backend
cat wrangler.toml
```

#### 完了条件

- [ ] `backend/wrangler.toml` が作成されている
- [ ] D1 と R2 のバインディング設定が記載されている
- [ ] 本番環境設定が含まれている

#### 検証手順

1. `cat backend/wrangler.toml` で内容を確認
2. `name`, `main`, `compatibility_date` が正しく設定されている

---

### TASK-0021-6: .dev.vars ファイル作成（ローカル開発用環境変数）

- [ ] **タスク未完了**
- **推定工数**: 1時間
- **タスクタイプ**: DIRECT
- **要件**: docs/design/shadowverse-battle-log/architecture-cloudflare.md
- **依存タスク**: TASK-0021-5
- **要件名**: .dev.vars ファイルの作成とシークレット管理

#### 実装詳細

##### 1. .dev.vars ファイル作成

`backend/.dev.vars` を作成（Gitにはコミットしない）:

```bash
cd backend

# .dev.vars ファイル作成
cat > .dev.vars <<'EOF'
# Cloudflare Account 情報
CLOUDFLARE_ACCOUNT_ID=<YOUR_ACCOUNT_ID>
CLOUDFLARE_DATABASE_ID=<YOUR_DATABASE_ID>
CLOUDFLARE_D1_TOKEN=<YOUR_D1_TOKEN>

# API設定
API_VERSION=v1
ENVIRONMENT=development

# デバッグ設定
DEBUG=true
LOG_LEVEL=debug
EOF
```

##### 2. プレースホルダーを実際の値に置き換え

- `<YOUR_ACCOUNT_ID>`: TASK-0021-1 で取得した Account ID
- `<YOUR_DATABASE_ID>`: TASK-0022-1 で取得する Database ID（一旦空欄）
- `<YOUR_D1_TOKEN>`: 必要に応じて API Token を生成

##### 3. .dev.vars のパーミッション設定

```bash
# .dev.vars を読み取り専用に設定（セキュリティ対策）
chmod 600 .dev.vars
```

#### 完了条件

- [ ] `backend/.dev.vars` が作成されている
- [ ] Account ID が設定されている
- [ ] パーミッションが 600 に設定されている

#### 検証手順

1. `ls -la backend/.dev.vars` でファイルが存在し、パーミッションが 600 であることを確認
2. `cat backend/.dev.vars` で内容を確認（Account ID が設定されているか）

---

### TASK-0021-7: .gitignore 更新とGit確認

- [ ] **タスク未完了**
- **推定工数**: 1時間
- **タスクタイプ**: DIRECT
- **要件**: docs/design/shadowverse-battle-log/architecture-cloudflare.md
- **依存タスク**: TASK-0021-6
- **要件名**: .gitignore の更新とシークレットファイルの除外

#### 実装詳細

##### 1. .gitignore 更新

`/home/syagu/work/shadowverse_log/.gitignore` に以下を追加:

```gitignore
# Cloudflare
.dev.vars
.wrangler/
wrangler.toml.backup
dist/

# Drizzle ORM
.drizzle/
drizzle/

# Environment variables
*.env
*.env.local
*.env.development
*.env.production

# Build outputs
backend/dist/
backend/.wrangler/
```

##### 2. Git status 確認

```bash
cd /home/syagu/work/shadowverse_log

# .dev.vars がトラッキングされていないことを確認
git status

# .dev.vars が Untracked files に表示されないことを確認
```

##### 3. .gitignore のコミット

```bash
git add .gitignore
git commit -m "chore: Update .gitignore for Cloudflare secrets"
```

#### 完了条件

- [ ] `.gitignore` が更新されている
- [ ] `.dev.vars` が Git で無視されている
- [ ] `.gitignore` の変更がコミットされている

#### 検証手順

1. `git status` で `.dev.vars` が表示されない
2. `cat .gitignore | grep ".dev.vars"` で `.dev.vars` が含まれている

---

### TASK-0021-8: backend依存関係のインストール

- [ ] **タスク未完了**
- **推定工数**: 1時間
- **タスクタイプ**: DIRECT
- **要件**: docs/design/shadowverse-battle-log/architecture-cloudflare.md
- **依存タスク**: TASK-0021-7
- **要件名**: backend プロジェクトの依存関係インストール

#### 実装詳細

##### 1. backend 依存関係のインストール

```bash
cd backend

# Cloudflare Workers 関連
pnpm add -D wrangler
pnpm add @cloudflare/workers-types

# Hono フレームワーク
pnpm add hono

# Drizzle ORM
pnpm add drizzle-orm
pnpm add -D drizzle-kit

# Zod バリデーション
pnpm add zod

# 日付処理
pnpm add date-fns

# 開発ツール
pnpm add -D @biomejs/biome
pnpm add -D typescript
pnpm add -D vitest
pnpm add -D @types/node
```

##### 2. TypeScript 設定ファイル作成

`backend/tsconfig.json` を作成:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "checkJs": false,
    "jsx": "react",
    "jsxImportSource": "hono/jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "types": ["@cloudflare/workers-types", "@types/node"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "tests/**/*.ts"],
  "exclude": ["node_modules", "dist", ".wrangler"]
}
```

##### 3. Biome 設定ファイル作成

`backend/biome.json` を作成:

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  }
}
```

#### 完了条件

- [ ] `backend/node_modules/` が作成されている
- [ ] `backend/pnpm-lock.yaml` が作成されている
- [ ] `backend/tsconfig.json` が作成されている
- [ ] `backend/biome.json` が作成されている

#### 検証手順

1. `ls -la backend/node_modules/` でパッケージがインストールされている
2. `pnpm list` で依存関係を確認
3. `pnpm run lint` でBiomeが動作することを確認

---

## 完了確認

Phase 1 Part 1a-ii の全タスクが完了したことを確認するのだ:

- [ ] TASK-0021-5: wrangler.toml 設定ファイル作成
- [ ] TASK-0021-6: .dev.vars ファイル作成（ローカル開発用環境変数）
- [ ] TASK-0021-7: .gitignore 更新とGit確認
- [ ] TASK-0021-8: backend依存関係のインストール

## 次のステップ

Phase 1 Part 1b に進むのだ: `cloudflare-migration-phase1-part1b.md`

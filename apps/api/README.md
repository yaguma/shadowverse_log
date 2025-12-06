# Shadowverse Battle Log - Backend (Cloudflare Workers)

## 技術スタック

- **Cloudflare Workers**: サーバーレス実行環境
- **Cloudflare D1**: SQLiteデータベース（エッジ対応）
- **Hono**: 軽量Webフレームワーク
- **Drizzle ORM**: TypeScript-first ORM
- **Zod**: バリデーションライブラリ
- **Biome**: Linter/Formatter
- **Vitest**: テストフレームワーク

## セットアップ

### 前提条件

- Node.js 22.x
- pnpm 9.x
- Cloudflare Account
- Wrangler CLI

### 環境構築

```bash
# 依存関係インストール
pnpm install

# Cloudflareにログイン
wrangler login

# .dev.vars ファイル作成（テンプレートをコピー）
cp .dev.vars.example .dev.vars
# .dev.vars にAccount ID等を設定

# D1データベース作成（初回のみ）
wrangler d1 create shadowverse-db

# マイグレーション実行
pnpm run db:migrate
```

## 開発

### ローカル開発サーバー起動

```bash
pnpm run dev
```

### Drizzle Studio 起動

```bash
# ローカルD1データベースを確認
pnpm run db:studio:local
```

### テスト実行

```bash
# 全テスト実行
pnpm test

# カバレッジ付きテスト
pnpm test:coverage

# Watchモードでテスト
pnpm test:watch
```

### Lint/Format

```bash
# Lint実行
pnpm run lint

# Format実行
pnpm run format
```

## デプロイ

```bash
# 本番環境にデプロイ
pnpm run deploy

# 本番D1マイグレーション
pnpm run db:migrate:prod
```

## マイグレーション

### 既存JSONデータのマイグレーション

```bash
# 1. ローカル開発サーバーを起動
pnpm run dev

# 2. ドライラン実行（データを確認）
curl -X POST http://localhost:8787/api/migration/dry-run \
  -H "Content-Type: application/json" \
  -d '{"userId": "default-user"}'

# 3. 本番マイグレーション実行
curl -X POST http://localhost:8787/api/migration/execute \
  -H "Content-Type: application/json" \
  -d '{"userId": "default-user", "confirm": true}'
```

### ロールバック

```bash
curl -X POST http://localhost:8787/api/migration/rollback
```

## プロジェクト構造

```
backend/
├── src/
│   ├── db/
│   │   ├── schema/          # Drizzle ORMスキーマ
│   │   │   ├── battle-logs.ts
│   │   │   ├── deck-master.ts
│   │   │   └── my-decks.ts
│   │   ├── repositories/    # リポジトリパターン実装
│   │   │   ├── base-repository.ts
│   │   │   ├── battle-logs-repository.ts
│   │   │   ├── deck-master-repository.ts
│   │   │   └── my-decks-repository.ts
│   │   ├── migrations/      # SQLマイグレーション
│   │   └── index.ts
│   ├── migration/           # データマイグレーション
│   │   ├── migrate-json-to-d1.ts
│   │   ├── rollback.ts
│   │   └── schema-mapping.ts
│   ├── routes/              # APIルート
│   │   └── migration.ts
│   └── index.ts             # エントリーポイント
├── tests/                   # テストコード
│   ├── db/                  # DBテスト
│   ├── migration/           # マイグレーションテスト
│   └── routes/              # ルートテスト
├── wrangler.toml            # Wrangler設定
├── drizzle.config.ts        # Drizzle設定
├── drizzle.config.local.ts  # Drizzle Studio ローカル設定
├── vitest.config.ts         # Vitest設定
├── tsconfig.json            # TypeScript設定
├── biome.json               # Biome設定
└── package.json
```

## API エンドポイント

### ルートエンドポイント

```
GET /
```

APIの基本情報を返す。

### ヘルスチェック

```
GET /health
```

サーバーの稼働状態を返す。

### マイグレーションAPI

```
POST /api/migration/dry-run    # ドライラン実行
POST /api/migration/execute    # 本番マイグレーション
POST /api/migration/rollback   # ロールバック
GET  /api/migration/status     # マイグレーション状態確認
```

## 環境変数

`.dev.vars` に以下を設定:

```
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_DATABASE_ID=your-database-id
API_VERSION=v1
ENVIRONMENT=development
```

## Phase 1 完了ステータス

- [x] Cloudflare Workers + D1 環境構築
- [x] Drizzle ORM セットアップ
- [x] 既存JSONデータのD1マイグレーション
- [x] リポジトリパターン実装
- [x] ローカル開発環境動作確認
- [x] テスト実装（カバレッジ: 主要部分90%以上）

## 次のステップ (Phase 2)

- 対戦履歴CRUD API実装
- 統計情報API実装
- Hono + Workers セットアップ完成

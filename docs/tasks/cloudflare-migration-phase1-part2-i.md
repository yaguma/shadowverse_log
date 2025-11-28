# Phase 1 Part 2-i: D1データベーススキーマとマイグレーション (Cloudflareマイグレーション)

## パート概要

- **期間**: Day 2 (1営業日)
- **総工数**: 5時間
- **目標**: D1データベーススキーマの完成とマイグレーションスクリプトの作成
- **対象タスク**: TASK-0022-5 ~ TASK-0022-8 (4タスク) + TASK-0023-1 (1タスク)

---

## タスク一覧

### TASK-0022-5: Drizzle ORM スキーマ統合とエクスポート

- [x] **タスク完了**
- **推定工数**: 1時間
- **タスクタイプ**: TDD
- **要件**: docs/design/shadowverse-battle-log/storage-design-cloudflare.md
- **依存タスク**: TASK-0022-4
- **要件名**: 全スキーマの統合とエクスポート設定

#### 実装詳細

##### 1. index.ts でスキーマをエクスポート

`backend/src/db/schema/index.ts` を作成:

```typescript
export * from './battles';
export * from './decks_master';
export * from './statistics';
export * from './battles.validation';
export * from './decks_master.validation';
export * from './statistics.validation';
```

##### 2. drizzle.config.ts 作成

`backend/drizzle.config.ts` を作成:

```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema/*.ts',
  out: './src/db/migrations',
  dialect: 'sqlite',
  driver: 'd1-http',
} satisfies Config;
```

##### 3. db/index.ts でデータベース接続を設定

`backend/src/db/index.ts` を作成:

```typescript
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export const createDb = (d1Database: D1Database) => {
  return drizzle(d1Database, { schema });
};

export type Database = ReturnType<typeof createDb>;
```

#### 完了条件

- [ ] `backend/src/db/schema/index.ts` が作成されている
- [ ] `backend/drizzle.config.ts` が作成されている
- [ ] `backend/src/db/index.ts` が作成されている
- [ ] TypeScriptコンパイルエラーがない

#### 検証手順

1. `pnpm run lint` でエラーがない
2. `tsc --noEmit` でTypeScriptコンパイルが成功する

---

### TASK-0022-6: SQLマイグレーションファイル生成

- [x] **タスク完了**
- **推定工数**: 1時間
- **タスクタイプ**: DIRECT
- **要件**: docs/design/shadowverse-battle-log/storage-design-cloudflare.md
- **依存タスク**: TASK-0022-5
- **要件名**: Drizzle Kit でマイグレーションファイルを生成

#### 実装詳細

##### 1. Drizzle Kit でマイグレーション生成

```bash
cd backend

# スキーマからマイグレーションファイルを生成
pnpm run db:generate

# 出力例:
# Generating migration...
# Migration generated at src/db/migrations/0000_init.sql
```

##### 2. 生成されたマイグレーションファイル確認

`backend/src/db/migrations/0000_init.sql` の内容を確認:

```sql
CREATE TABLE IF NOT EXISTS "battles" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "user_id" TEXT NOT NULL,
  "battle_date" TEXT NOT NULL,
  "my_class" TEXT NOT NULL,
  "my_deck" TEXT NOT NULL,
  "opponent_class" TEXT NOT NULL,
  "opponent_deck" TEXT,
  "result" TEXT NOT NULL,
  "turn" INTEGER,
  "format" TEXT NOT NULL,
  "notes" TEXT,
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "decks_master" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "class_name" TEXT NOT NULL,
  "deck_name" TEXT NOT NULL,
  "archetype" TEXT,
  "format" TEXT NOT NULL,
  "season" TEXT,
  "description" TEXT,
  "is_active" INTEGER DEFAULT 1 NOT NULL,
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "statistics" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "user_id" TEXT NOT NULL,
  "my_class" TEXT NOT NULL,
  "my_deck" TEXT NOT NULL,
  "opponent_class" TEXT,
  "period" TEXT NOT NULL,
  "period_start" TEXT NOT NULL,
  "period_end" TEXT NOT NULL,
  "total_games" INTEGER DEFAULT 0 NOT NULL,
  "wins" INTEGER DEFAULT 0 NOT NULL,
  "losses" INTEGER DEFAULT 0 NOT NULL,
  "draws" INTEGER DEFAULT 0 NOT NULL,
  "win_rate" REAL DEFAULT 0 NOT NULL,
  "avg_turn" REAL,
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS "battles_user_id_idx" ON "battles" ("user_id");
CREATE INDEX IF NOT EXISTS "battles_battle_date_idx" ON "battles" ("battle_date");
CREATE INDEX IF NOT EXISTS "battles_my_class_idx" ON "battles" ("my_class");
CREATE INDEX IF NOT EXISTS "statistics_user_id_idx" ON "statistics" ("user_id");
CREATE INDEX IF NOT EXISTS "statistics_period_idx" ON "statistics" ("period");
```

#### 完了条件

- [ ] `backend/src/db/migrations/0000_init.sql` が生成されている
- [ ] SQLファイルにテーブル定義が含まれている
- [ ] インデックスが正しく定義されている

#### 検証手順

1. `ls -la backend/src/db/migrations/` でファイルが存在する
2. `cat backend/src/db/migrations/0000_init.sql` で内容を確認

---

### TASK-0022-7: ローカルD1データベースへのマイグレーション実行

- [x] **タスク完了**
- **推定工数**: 1時間
- **タスクタイプ**: DIRECT
- **要件**: docs/design/shadowverse-battle-log/storage-design-cloudflare.md
- **依存タスク**: TASK-0022-6
- **要件名**: ローカル環境でD1マイグレーションを実行

#### 実装詳細

##### 1. ローカルD1データベースへのマイグレーション

```bash
cd backend

# ローカル環境でマイグレーション実行
pnpm run db:migrate

# または
wrangler d1 execute shadowverse-db --local --file=./src/db/migrations/0000_init.sql

# 出力例:
# 🌀 Executing on local database shadowverse-db...
# 🚣 Executed 3 statements in 0.123ms
# ┌─────────────────────┐
# │ changes             │
# ├─────────────────────┤
# │ 3                   │
# └─────────────────────┘
```

##### 2. ローカルデータベーステーブル確認

```bash
# テーブル一覧を確認
wrangler d1 execute shadowverse-db --local --command="SELECT name FROM sqlite_master WHERE type='table';"

# battles テーブルのスキーマ確認
wrangler d1 execute shadowverse-db --local --command="PRAGMA table_info(battles);"
```

#### 完了条件

- [ ] ローカルD1データベースにマイグレーションが実行されている
- [ ] battles, decks_master, statistics テーブルが作成されている
- [ ] インデックスが作成されている

#### 検証手順

1. `wrangler d1 execute shadowverse-db --local --command="SELECT name FROM sqlite_master WHERE type='table';"` でテーブルが表示される

---

### TASK-0022-8: リモートD1データベースへのマイグレーション実行

- [x] **タスク完了**
- **推定工数**: 1時間
- **タスクタイプ**: DIRECT
- **要件**: docs/design/shadowverse-battle-log/storage-design-cloudflare.md
- **依存タスク**: TASK-0022-7
- **要件名**: リモート(本番)環境でD1マイグレーションを実行

#### 実装詳細

##### 1. リモートD1データベースへのマイグレーション

```bash
cd backend

# リモート環境でマイグレーション実行
pnpm run db:migrate:prod

# または
wrangler d1 execute shadowverse-db --remote --file=./src/db/migrations/0000_init.sql

# 出力例:
# 🌀 Executing on remote database shadowverse-db (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)...
# 🚣 Executed 3 statements in 0.456ms
# ┌─────────────────────┐
# │ changes             │
# ├─────────────────────┤
# │ 3                   │
# └─────────────────────┘
```

##### 2. リモートデータベーステーブル確認

```bash
# テーブル一覧を確認
wrangler d1 execute shadowverse-db --remote --command="SELECT name FROM sqlite_master WHERE type='table';"

# battles テーブルのスキーマ確認
wrangler d1 execute shadowverse-db --remote --command="PRAGMA table_info(battles);"
```

#### 完了条件

- [ ] リモートD1データベースにマイグレーションが実行されている
- [ ] battles, decks_master, statistics テーブルが作成されている
- [ ] インデックスが作成されている

#### 検証手順

1. `wrangler d1 execute shadowverse-db --remote --command="SELECT name FROM sqlite_master WHERE type='table';"` でテーブルが表示される

---

### TASK-0023-1: R2バケット作成

- [x] **タスクスキップ** (R2は使用しない方針のため)
- **推定工数**: 1時間
- **タスクタイプ**: DIRECT
- **要件**: docs/design/shadowverse-battle-log/storage-design-cloudflare.md
- **依存タスク**: TASK-0022-8
- **要件名**: Cloudflare R2 バケットの作成

#### 実装詳細

##### 1. R2バケット作成

```bash
cd backend

# R2バケット作成
wrangler r2 bucket create shadowverse-data

# 出力例:
# ✅ Successfully created bucket 'shadowverse-data'
```

##### 2. R2バケット一覧確認

```bash
# R2バケット一覧を確認
wrangler r2 bucket list

# 出力例:
# ┌──────────────────────┐
# │ name                 │
# ├──────────────────────┤
# │ shadowverse-data     │
# └──────────────────────┘
```

##### 3. wrangler.toml の R2 バインディング確認

`backend/wrangler.toml` の R2 バインディングが正しいことを確認:

```toml
[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "shadowverse-data"
```

#### 完了条件

- [ ] R2バケット `shadowverse-data` が作成されている
- [ ] `wrangler r2 bucket list` でバケットが表示される
- [ ] `wrangler.toml` の R2 バインディングが正しい

#### 検証手順

1. `wrangler r2 bucket list` でバケットが表示される

---

## 完了確認

Phase 1 Part 2-i の全タスクが完了したことを確認するのだ:

- [x] TASK-0022-5: Drizzle ORM スキーマ統合とエクスポート
- [x] TASK-0022-6: SQLマイグレーションファイル生成
- [x] TASK-0022-7: ローカルD1データベースへのマイグレーション実行
- [x] TASK-0022-8: リモートD1データベースへのマイグレーション実行
- [x] TASK-0023-1: R2バケット作成 (スキップ - R2は使用しない方針)

## 次のステップ

Phase 1 Part 2-ii に進むのだ: `cloudflare-migration-phase1-part2-ii.md`

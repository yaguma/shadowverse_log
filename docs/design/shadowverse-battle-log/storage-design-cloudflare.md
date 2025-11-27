# Cloudflare D1 ストレージ設計

このドキュメントでは、シャドウバース対戦履歴管理アプリケーションにおけるCloudflare D1 (SQLiteデータベース) のデータ構造、アクセスパターン、運用方針を定義します。

> **注記**: 当初はCloudflare R2 (オブジェクトストレージ) も使用予定でしたが、D1のみでの運用に変更しました。バックアップはD1の自動バックアップ機能（30日間保持）を利用します。

**【信頼性レベル凡例】**:
- 🔵 **青信号**: EARS要件定義書・設計文書を参考にしてほぼ推測していない場合
- 🟡 **黄信号**: EARS要件定義書・設計文書から妥当な推測の場合
- 🔴 **赤信号**: EARS要件定義書・設計文書にない推測の場合

---

## 概要

**データストレージ**: Cloudflare D1 (SQLite) 🟡 *Cloudflare推奨より*
**データ形式**: SQLite (D1) 🟡 *スケーラビリティ要件から妥当な推測*
**バックアップ**: D1自動バックアップ機能（30日間保持） 🔵 *Cloudflare D1標準機能*
**互換性**: 既存データ (battle-logs.json, deck-master.json, my-decks.json) からの移行パス完備 🔵 *REQ-601より*

---

## Cloudflare D1 (SQLite Database)

### 概要

**プラットフォーム**: Cloudflare D1 (エッジで実行されるSQLite)
**料金**: 無料枠: 5GBストレージ、毎日100,000 read、50,000 write
**レイテンシー**: エッジロケーションでの実行により10-50ms
**特徴**:
- SQLiteベースで標準的なSQL構文をサポート
- Cloudflare Workersと統合
- 自動レプリケーション
- トランザクション対応

---

### データベーススキーマ

#### Phase 1 スキーマ

```sql
-- 対戦履歴テーブル
CREATE TABLE battle_logs (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    battle_type TEXT NOT NULL,
    rank TEXT NOT NULL,
    group_name TEXT NOT NULL,
    my_deck_id TEXT NOT NULL,
    turn TEXT NOT NULL,
    result TEXT NOT NULL,
    opponent_deck_id TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),

    -- Phase 1では未使用、Phase 2で利用
    user_id TEXT DEFAULT NULL,

    CHECK (battle_type IN ('ランクマッチ', '対戦台', 'ロビー大会')),
    CHECK (rank IN ('サファイア', 'ダイアモンド', 'ルビー', 'トパーズ', '-')),
    CHECK (turn IN ('先攻', '後攻')),
    CHECK (result IN ('勝ち', '負け'))
);

-- デッキマスターテーブル
CREATE TABLE deck_master (
    id TEXT PRIMARY KEY,
    class_name TEXT NOT NULL,
    deck_name TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- マイデッキテーブル (Phase 1では簡易版)
CREATE TABLE my_decks (
    id TEXT PRIMARY KEY,
    deck_code TEXT NOT NULL,
    deck_name TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),

    -- Phase 1では未使用、Phase 2で利用
    user_id TEXT DEFAULT NULL,

    CHECK (is_active IN (0, 1))
);

-- インデックス (Phase 1)
CREATE INDEX idx_battle_logs_date ON battle_logs(date DESC);
CREATE INDEX idx_battle_logs_my_deck_id ON battle_logs(my_deck_id);
CREATE INDEX idx_battle_logs_opponent_deck_id ON battle_logs(opponent_deck_id);
CREATE INDEX idx_deck_master_sort_order ON deck_master(sort_order ASC);
```

#### Phase 2 スキーマ追加

```sql
-- ユーザーテーブル
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    last_login_at TEXT DEFAULT (datetime('now'))
);

-- Phase 2用インデックス追加
CREATE INDEX idx_battle_logs_user_id ON battle_logs(user_id);
CREATE INDEX idx_battle_logs_user_date ON battle_logs(user_id, date DESC);
CREATE INDEX idx_my_decks_user_id ON my_decks(user_id);
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- Phase 2: user_idをNOT NULLに変更
-- ALTER TABLE battle_logs ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE my_decks ALTER COLUMN user_id SET NOT NULL;
```

---

### Drizzle ORM スキーマ定義

```typescript
import { sqliteTable, text, integer, index, check } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// 対戦履歴テーブル
export const battleLogs = sqliteTable('battle_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id'),  // Phase 2で必須化
  date: text('date').notNull(),
  battleType: text('battle_type').notNull(),
  rank: text('rank').notNull(),
  groupName: text('group_name').notNull(),
  myDeckId: text('my_deck_id').notNull(),
  turn: text('turn').notNull(),
  result: text('result').notNull(),
  opponentDeckId: text('opponent_deck_id').notNull(),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
}, (table) => ({
  dateIdx: index('idx_battle_logs_date').on(table.date),
  userIdIdx: index('idx_battle_logs_user_id').on(table.userId),  // Phase 2
}))

// デッキマスターテーブル
export const deckMaster = sqliteTable('deck_master', {
  id: text('id').primaryKey(),
  className: text('class_name').notNull(),
  deckName: text('deck_name').notNull(),
  sortOrder: integer('sort_order').notNull(),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
}, (table) => ({
  sortOrderIdx: index('idx_deck_master_sort_order').on(table.sortOrder),
}))

// マイデッキテーブル
export const myDecks = sqliteTable('my_decks', {
  id: text('id').primaryKey(),
  userId: text('user_id'),  // Phase 2で必須化
  deckCode: text('deck_code').notNull(),
  deckName: text('deck_name').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
}, (table) => ({
  userIdIdx: index('idx_my_decks_user_id').on(table.userId),  // Phase 2
}))

// ユーザーテーブル (Phase 2)
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  displayName: text('display_name'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  lastLoginAt: text('last_login_at').default(sql`(datetime('now'))`),
}, (table) => ({
  emailIdx: index('idx_users_email').on(table.email),
}))
```

---

### Drizzle ORM CRUD 操作例

#### 対戦履歴の取得

```typescript
import { drizzle } from 'drizzle-orm/d1'
import { battleLogs } from './schema'
import { desc, eq, and, between } from 'drizzle-orm'

const db = drizzle(c.env.DB)

// 一覧取得
const logs = await db.select()
  .from(battleLogs)
  .orderBy(desc(battleLogs.date))
  .limit(100)

// 期間指定取得
const filteredLogs = await db.select()
  .from(battleLogs)
  .where(
    and(
      between(battleLogs.date, startDate, endDate),
      eq(battleLogs.userId, userId)  // Phase 2
    )
  )
  .orderBy(desc(battleLogs.date))
```

#### 対戦履歴の登録

```typescript
await db.insert(battleLogs).values({
  id: crypto.randomUUID(),
  date: '2025-01-24',
  battleType: 'ランクマッチ',
  rank: 'ダイアモンド',
  groupName: 'AAA',
  myDeckId: 'deck_001',
  turn: '先攻',
  result: '勝ち',
  opponentDeckId: 'deck_master_002',
  userId: userId  // Phase 2
})
```

#### 対戦履歴の削除

```typescript
await db.delete(battleLogs)
  .where(eq(battleLogs.id, logId))
```

#### 統計データの集計

```typescript
// D1の生SQLで複雑な集計を効率的に実行
const stats = await c.env.DB.prepare(`
  SELECT
    COUNT(*) as totalGames,
    SUM(CASE WHEN result = '勝ち' THEN 1 ELSE 0 END) as wins,
    SUM(CASE WHEN result = '負け' THEN 1 ELSE 0 END) as losses,
    ROUND(SUM(CASE WHEN result = '勝ち' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as winRate
  FROM battle_logs
  WHERE date BETWEEN ? AND ?
  ${userId ? 'AND user_id = ?' : ''}
`).bind(startDate, endDate, ...(userId ? [userId] : [])).first()
```

---

### 既存JSONデータの移行

#### 移行スクリプト (Cloudflare Workers)

```typescript
// JSONからD1へのマイグレーションWorker
// 既存のJSONファイルはAPIリクエスト経由でインポート
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const db = drizzle(env.DB)

    // リクエストボディからJSONデータを取得
    const battleLogsData = await request.json() as any[]

    // D1へ一括INSERT (バッチ処理)
    const batchSize = 100
    for (let i = 0; i < battleLogsData.length; i += batchSize) {
      const batch = battleLogsData.slice(i, i + batchSize)

      const statements = batch.map(log =>
        env.DB.prepare(`
          INSERT OR IGNORE INTO battle_logs
          (id, date, battle_type, rank, group_name, my_deck_id, turn, result, opponent_deck_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          log.id,
          log.date,
          log.battleType,
          log.rank,
          log.group,
          log.myDeckId,
          log.turn,
          log.result,
          log.opponentDeckId
        )
      )

      await env.DB.batch(statements)
    }

    return new Response('Migration completed', { status: 200 })
  }
}
```

---

## エクスポート/インポート処理

> **注記**: R2は使用せず、D1から直接レスポンスを返す方式で実装します。

### エクスポートの作成

```typescript
app.get('/api/export', async (c) => {
  const { format, startDate, endDate } = c.req.query()

  const db = drizzle(c.env.DB)

  // D1からデータ取得
  const logs = await db.select()
    .from(battleLogs)
    .where(
      between(battleLogs.date, startDate, endDate)
    )

  if (format === 'json') {
    return c.json({
      success: true,
      data: logs
    })
  } else if (format === 'csv') {
    const csv = convertToCSV(logs)
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="export-${new Date().toISOString()}.csv"`
      }
    })
  }
})
```

### インポートの処理

```typescript
app.post('/api/import', async (c) => {
  const { format, data } = await c.req.json()

  // データをパース
  let logs: BattleLog[]
  if (format === 'json') {
    logs = JSON.parse(data)
  } else if (format === 'csv') {
    logs = parseCSV(data)
  }

  // D1に一括INSERT
  const db = drizzle(c.env.DB)
  const statements = logs.map(log =>
    c.env.DB.prepare(`
      INSERT OR IGNORE INTO battle_logs
      (id, date, battle_type, rank, group_name, my_deck_id, turn, result, opponent_deck_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      log.id || crypto.randomUUID(),
      log.date,
      log.battleType,
      log.rank,
      log.group,
      log.myDeckId,
      log.turn,
      log.result,
      log.opponentDeckId
    )
  )

  const results = await c.env.DB.batch(statements)

  return c.json({
    success: true,
    data: {
      imported: results.filter(r => r.meta.changes > 0).length,
      skipped: results.filter(r => r.meta.changes === 0).length
    }
  })
})
```

---

## バックアップ戦略

> **注記**: Cloudflare D1には自動バックアップ機能（30日間保持）があるため、R2への手動バックアップは不要です。
> 必要に応じてD1のPoint-in-Time Recovery (PITR) 機能を利用できます。

---

## 同時実行制御

### D1 トランザクション

```typescript
// Drizzle ORM トランザクション
await db.transaction(async (tx) => {
  // 複数の操作をアトミックに実行
  await tx.insert(battleLogs).values({ /* ... */ })
  await tx.update(myDecks).set({ isActive: false }).where(eq(myDecks.id, deckId))
})
```

### 楽観的ロック (Phase 2以降)

```typescript
// updated_atを使用した楽観的ロック
const log = await db.select()
  .from(battleLogs)
  .where(eq(battleLogs.id, logId))
  .get()

const result = await db.update(battleLogs)
  .set({ result: '勝ち', updatedAt: sql`datetime('now')` })
  .where(
    and(
      eq(battleLogs.id, logId),
      eq(battleLogs.updatedAt, log.updatedAt)  // 楽観的ロック
    )
  )

if (result.changes === 0) {
  throw new Error('Conflict: データが他のユーザーによって更新されました')
}
```

---

## パフォーマンス最適化

### クエリ最適化

```typescript
// 1. インデックスを活用したクエリ
const logs = await db.select()
  .from(battleLogs)
  .where(eq(battleLogs.userId, userId))  // idx_battle_logs_user_id を使用
  .orderBy(desc(battleLogs.date))        // idx_battle_logs_date を使用
  .limit(100)

// 2. JOIN の最小化（必要な場合のみ）
const logsWithDeckNames = await db.select({
  log: battleLogs,
  myDeckName: myDecks.deckName,
  opponentDeckName: deckMaster.deckName,
})
  .from(battleLogs)
  .leftJoin(myDecks, eq(battleLogs.myDeckId, myDecks.id))
  .leftJoin(deckMaster, eq(battleLogs.opponentDeckId, deckMaster.id))
  .where(eq(battleLogs.userId, userId))
  .limit(100)
```

### キャッシュ戦略

```typescript
// デッキマスターは更新頻度が低いため、Cloudflare Cache APIでキャッシュ
app.get('/api/deck-master', async (c) => {
  const cacheKey = 'deck-master-v1'
  const cached = await c.env.KV_CACHE.get(cacheKey, 'json')

  if (cached) {
    return c.json({
      success: true,
      data: { deckMaster: cached }
    })
  }

  const db = drizzle(c.env.DB)
  const decks = await db.select()
    .from(deckMaster)
    .orderBy(deckMaster.sortOrder)

  // KVに5分間キャッシュ
  await c.env.KV_CACHE.put(cacheKey, JSON.stringify(decks), { expirationTtl: 300 })

  return c.json({
    success: true,
    data: { deckMaster: decks }
  })
})
```

---

## セキュリティ

### D1アクセス制御

```typescript
// Phase 2: ユーザーIDによる行レベルセキュリティ
app.use('/api/*', async (c, next) => {
  const userId = c.get('userId')  // Cloudflare Accessから取得

  // すべてのクエリでuser_idフィルタを強制
  c.set('userId', userId)

  await next()
})

// すべてのクエリでuser_idをフィルタ
const logs = await db.select()
  .from(battleLogs)
  .where(eq(battleLogs.userId, c.get('userId')))
```

---

## 運用監視

### ログ記録

```typescript
// Cloudflare Workers Analytics
app.use('*', async (c, next) => {
  const start = Date.now()

  try {
    await next()
  } catch (error) {
    console.error('Error:', error)
    throw error
  } finally {
    const duration = Date.now() - start
    console.log(`${c.req.method} ${c.req.path} - ${duration}ms`)

    // カスタムメトリクス
    c.executionCtx.waitUntil(
      c.env.ANALYTICS.writeDataPoint({
        blobs: [c.req.path],
        doubles: [duration],
        indexes: [c.req.method]
      })
    )
  }
})
```

### アラート設定

- D1クエリエラー率が10%を超える
- データベースサイズが4GBを超える（無料枠の80%）

---

## 開発ツール

### Drizzle ORM設定

**Drizzle設定** (`drizzle.config.ts`):

```typescript
import type { Config } from 'drizzle-kit'

export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
    token: process.env.CLOUDFLARE_D1_TOKEN!,
  },
} satisfies Config
```

### pnpmコマンド

```bash
# データベース開発
cd backend
pnpm install

# Drizzle ORM コマンド
pnpm drizzle-kit generate    # マイグレーションファイル生成
pnpm drizzle-kit migrate     # マイグレーション実行
pnpm drizzle-kit push        # スキーマを直接D1にプッシュ
pnpm drizzle-kit studio      # Drizzle Studio (GUI) 起動

# Biome
pnpm lint                    # Biome lint
pnpm format                  # Biome format

# テスト
pnpm test                    # Unit テスト
pnpm test:watch              # Watch モード
```

### Biome設定

**プロジェクト共通** (`biome.json`):

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "files": {
    "include": ["src/**/*.ts", "src/**/*.tsx"]
  },
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": {
        "noExplicitAny": "error"
      },
      "complexity": {
        "noForEach": "off"
      }
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

---

## 更新履歴

- **2025-11-27**: R2削除、D1のみの運用に変更
  - R2 (Object Storage) の使用を廃止
  - バックアップはD1の自動バックアップ機能（30日間保持）を利用
  - エクスポート/インポートはD1から直接レスポンスを返す方式に変更
- **2025-11-25**: 初版作成（Cloudflare D1版）
  - Azure Blob StorageからCloudflare D1への移行設計
  - JSONからSQLiteへのデータモデル変更
  - Drizzle ORMによる型安全なデータアクセス
  - pnpm 9.x、Biome使用を明記

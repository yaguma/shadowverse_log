# Cloudflare D1 + R2 ストレージ設計

このドキュメントでは、シャドウバース対戦履歴管理アプリケーションにおけるCloudflare D1 (SQLiteデータベース) とCloudflare R2 (オブジェクトストレージ) のデータ構造、アクセスパターン、運用方針を定義します。

**【信頼性レベル凡例】**:
- 🔵 **青信号**: EARS要件定義書・設計文書を参考にしてほぼ推測していない場合
- 🟡 **黄信号**: EARS要件定義書・設計文書から妥当な推測の場合
- 🔴 **赤信号**: EARS要件定義書・設計文書にない推測の場合

---

## 概要

**データストレージ**: Cloudflare D1 (SQLite) + Cloudflare R2 (Object Storage) 🟡 *Cloudflare推奨より*
**データ形式**: SQLite (D1) + JSON (R2バックアップ) 🟡 *スケーラビリティ要件から妥当な推測*
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
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const db = drizzle(env.DB)

    // R2から既存のJSONファイルを取得
    const battleLogsJson = await env.R2_BUCKET.get('legacy/battle-logs.json')
    const battleLogsData = await battleLogsJson?.json() as any[]

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

## Cloudflare R2 (Object Storage)

### 概要

**プラットフォーム**: Cloudflare R2 (S3互換オブジェクトストレージ)
**料金**: 無料枠: 10GB/月、1000万リクエスト/月、Egress無料
**特徴**:
- S3互換API
- Egress料金なし（大きなコスト削減）
- Cloudflare Workersと統合
- 自動バックアップ

---

### バケット構成

```
shadowverse-data/  (Bucket)
├── backups/
│   ├── daily/
│   │   ├── 2025-11-25/
│   │   │   ├── battle-logs.json       # D1のバックアップ
│   │   │   ├── deck-master.json
│   │   │   └── my-decks.json
│   │   └── ...
│   └── weekly/
│       └── 2025-W47/
│           └── full-backup.json        # 週次フルバックアップ
├── exports/
│   ├── {userId}/
│   │   ├── export-2025-11-25.json     # ユーザーエクスポート
│   │   └── export-2025-11-25.csv
│   └── ...
├── imports/
│   └── temp/
│       └── import-{requestId}.json     # 一時インポートファイル
└── legacy/
    ├── battle-logs.json                # 既存データ（移行元）
    ├── deck-master.json
    └── my-decks.json
```

---

### R2 アクセスパターン

#### バックアップの作成

```typescript
import { drizzle } from 'drizzle-orm/d1'
import { battleLogs } from './schema'

// 日次バックアップ (Cron Trigger)
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const db = drizzle(env.DB)

    // D1からすべてのデータを取得
    const logs = await db.select().from(battleLogs)

    // JSON形式に変換
    const json = JSON.stringify(logs, null, 2)

    // R2に保存
    const today = new Date().toISOString().split('T')[0]
    await env.R2_BUCKET.put(
      `backups/daily/${today}/battle-logs.json`,
      json,
      {
        httpMetadata: {
          contentType: 'application/json',
        },
      }
    )

    console.log(`Backup completed: ${today}`)
  }
}
```

#### エクスポートの作成

```typescript
app.post('/api/export', async (c) => {
  const userId = c.get('userId')
  const { format, startDate, endDate } = await c.req.json()

  const db = drizzle(c.env.DB)

  // D1からデータ取得
  const logs = await db.select()
    .from(battleLogs)
    .where(
      and(
        eq(battleLogs.userId, userId),
        between(battleLogs.date, startDate, endDate)
      )
    )

  let content: string
  let contentType: string

  if (format === 'json') {
    content = JSON.stringify(logs, null, 2)
    contentType = 'application/json'
  } else if (format === 'csv') {
    content = convertToCSV(logs)
    contentType = 'text/csv'
  }

  // R2に一時保存（24時間後に自動削除）
  const filename = `export-${new Date().toISOString()}.${format}`
  await c.env.R2_BUCKET.put(
    `exports/${userId}/${filename}`,
    content,
    {
      httpMetadata: { contentType },
      customMetadata: {
        expiresAt: (Date.now() + 24 * 60 * 60 * 1000).toString()  // 24時間後
      }
    }
  )

  // 署名付きURLを生成（1時間有効）
  const signedUrl = await generateSignedUrl(c.env.R2_BUCKET, `exports/${userId}/${filename}`, 3600)

  return c.json({
    success: true,
    data: {
      downloadUrl: signedUrl,
      filename,
      expiresIn: 3600
    }
  })
})
```

#### インポートの処理

```typescript
app.post('/api/import', async (c) => {
  const { format, data } = await c.req.json()

  // R2に一時保存
  const requestId = crypto.randomUUID()
  await c.env.R2_BUCKET.put(
    `imports/temp/import-${requestId}.${format}`,
    data,
    {
      customMetadata: {
        expiresAt: (Date.now() + 60 * 60 * 1000).toString()  // 1時間後に削除
      }
    }
  )

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
      (id, date, battle_type, rank, group_name, my_deck_id, turn, result, opponent_deck_id, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      log.id || crypto.randomUUID(),
      log.date,
      log.battleType,
      log.rank,
      log.group,
      log.myDeckId,
      log.turn,
      log.result,
      log.opponentDeckId,
      c.get('userId')
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

### R2 署名付きURL生成

```typescript
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

async function generateSignedUrl(
  bucket: R2Bucket,
  key: string,
  expiresIn: number
): Promise<string> {
  // Cloudflare R2はS3互換API
  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  })

  const command = new GetObjectCommand({
    Bucket: 'shadowverse-data',
    Key: key,
  })

  return await getSignedUrl(s3, command, { expiresIn })
}
```

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

## バックアップ戦略

### Cron Triggerによる自動バックアップ

```typescript
// wrangler.toml
// [triggers]
// crons = ["0 0 * * *"]  // 毎日0時に実行

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const db = drizzle(env.DB)

    // すべてのテーブルをバックアップ
    const [logs, decks, myDecks] = await Promise.all([
      db.select().from(battleLogs),
      db.select().from(deckMaster),
      db.select().from(myDecks),
    ])

    const today = new Date().toISOString().split('T')[0]

    // R2に並列保存
    await Promise.all([
      env.R2_BUCKET.put(
        `backups/daily/${today}/battle-logs.json`,
        JSON.stringify(logs, null, 2)
      ),
      env.R2_BUCKET.put(
        `backups/daily/${today}/deck-master.json`,
        JSON.stringify(decks, null, 2)
      ),
      env.R2_BUCKET.put(
        `backups/daily/${today}/my-decks.json`,
        JSON.stringify(myDecks, null, 2)
      ),
    ])

    console.log(`Daily backup completed: ${today}`)
  }
}
```

### 古いバックアップの自動削除

```typescript
// 30日より古いバックアップを削除
export async function cleanupOldBackups(env: Env): Promise<void> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  const { objects } = await env.R2_BUCKET.list({ prefix: 'backups/daily/' })

  for (const object of objects) {
    const dateMatch = object.key.match(/backups\/daily\/(\d{4}-\d{2}-\d{2})/)
    if (dateMatch && dateMatch[1] < thirtyDaysAgo) {
      await env.R2_BUCKET.delete(object.key)
      console.log(`Deleted old backup: ${object.key}`)
    }
  }
}
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

### R2アクセス制御

```typescript
// R2バケットはプライベートに設定
// Cloudflare Workers経由でのみアクセス可能

// エクスポートファイルは署名付きURLで一時的にアクセス許可
const signedUrl = await generateSignedUrl(
  c.env.R2_BUCKET,
  `exports/${userId}/${filename}`,
  3600  // 1時間有効
)
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
- R2バックアップが24時間以上失敗
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

- **2025-11-25**: 初版作成（Cloudflare D1 + R2版）
  - Azure Blob StorageからCloudflare D1 + R2への移行設計
  - JSONからSQLiteへのデータモデル変更
  - Drizzle ORMによる型安全なデータアクセス
  - R2を使用した自動バックアップ戦略
  - pnpm 9.x、Biome使用を明記

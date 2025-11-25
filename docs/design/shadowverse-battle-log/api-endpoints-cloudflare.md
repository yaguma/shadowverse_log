# API Endpoints Design (Cloudflare版)

**プロジェクト**: Shadowverse Battle Log
**作成日**: 2025-11-25
**バージョン**: 2.0.0 (Cloudflare版)
**対応要件**: REQ-001 ~ REQ-054

---

## 概要

本ドキュメントでは、Cloudflare Workers上で動作するShadowverse Battle LogアプリケーションのRESTful APIエンドポイント仕様を定義します。

### API設計原則

- **RESTful設計**: リソース指向のURL構造
- **HTTPメソッド**: GET/POST/PUT/DELETE の適切な使用
- **ステートレス**: 各リクエストは独立して処理可能
- **一貫性のあるレスポンス形式**: 成功/エラーで統一されたフォーマット
- **バージョニング**: 将来の拡張性を考慮（現在はv1）
- **エッジコンピューティング**: Cloudflare Workersでの高速実行

### 信頼性レベル凡例

- 🔵 **高**: 既存データ構造・ユーザヒアリングより確定
- 🟡 **中**: 推測または一般的なベストプラクティスより
- 🔴 **低**: 要確認・仮定

---

## ベースURL

### Phase 1（単一ユーザー）

```
https://api.your-worker-name.workers.dev
```

または Cloudflare Pages Functions を使用:

```
https://your-app.pages.dev/api
```

### Phase 2（マルチユーザー）

```
https://api.your-worker-name.workers.dev
```

**認証**: Cloudflare Access JWT Token

---

## 共通レスポンス形式

### 成功レスポンス 🟡 *一般的なRESTful APIのベストプラクティスより*

```typescript
{
  "success": true,
  "data": T,
  "meta": {
    "timestamp": "2025-11-25T12:34:56.789Z",
    "requestId": "uuid-v4",
    "executionTime": "45ms"  // Cloudflare Workers実行時間
  }
}
```

### エラーレスポンス 🟡 *一般的なRESTful APIのベストプラクティスより*

```typescript
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "ユーザーフレンドリーなエラーメッセージ",
    "details": {} // オプション: 詳細情報
  },
  "meta": {
    "timestamp": "2025-11-25T12:34:56.789Z",
    "requestId": "uuid-v4"
  }
}
```

### HTTPステータスコード 🟡 *RESTful標準より*

| ステータスコード | 用途 |
|---|---|
| 200 OK | 成功（GET, PUT, DELETE） |
| 201 Created | リソース作成成功（POST） |
| 400 Bad Request | リクエストパラメータ不正 |
| 401 Unauthorized | 認証失敗（Phase 2） |
| 403 Forbidden | 権限不足（Phase 2） |
| 404 Not Found | リソースが存在しない |
| 409 Conflict | リソース競合（Phase 2） |
| 429 Too Many Requests | レート制限超過 |
| 500 Internal Server Error | サーバーエラー |
| 503 Service Unavailable | サービス一時停止 |

---

## Phase 1 エンドポイント

### 1. 対戦履歴管理

#### 1.1 対戦履歴一覧取得

**エンドポイント**: `GET /api/battle-logs`

**説明**: 対戦履歴の一覧を取得 🔵 *REQ-009より*

**クエリパラメータ**:

| パラメータ | 型 | 必須 | デフォルト | 説明 | 信頼性 |
|---|---|---|---|---|---|
| `limit` | number | No | 100 | 取得件数（最大1000） | 🔵 *REQ-009より* |
| `offset` | number | No | 0 | スキップ件数 | 🟡 *ページネーション標準より* |
| `sortBy` | string | No | "date" | ソートキー | 🔵 *ユーザヒアリングより* |
| `sortOrder` | "asc" \| "desc" | No | "desc" | ソート順 | 🔵 *ユーザヒアリングより* |

**リクエスト例**:

```http
GET /api/battle-logs?limit=50&sortBy=date&sortOrder=desc
```

**レスポンス例**:

```json
{
  "success": true,
  "data": {
    "battleLogs": [
      {
        "id": "log_20250124_001",
        "date": "2025-01-24",
        "battleType": "ランクマッチ",
        "rank": "ダイアモンド",
        "group": "AAA",
        "myDeckId": "deck_001",
        "turn": "先攻",
        "result": "勝ち",
        "opponentDeckId": "deck_master_002"
      }
    ],
    "total": 84,
    "limit": 50,
    "offset": 0
  },
  "meta": {
    "timestamp": "2025-11-25T12:34:56.789Z",
    "requestId": "req_abc123",
    "executionTime": "23ms"
  }
}
```

**Cloudflare Workers実装例**:

```typescript
import { Hono } from 'hono'
import { D1Database } from '@cloudflare/workers-types'

const app = new Hono<{ Bindings: { DB: D1Database } }>()

app.get('/api/battle-logs', async (c) => {
  const { limit = 100, offset = 0, sortBy = 'date', sortOrder = 'desc' } = c.req.query()

  const { results } = await c.env.DB.prepare(
    `SELECT * FROM battle_logs ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`
  ).bind(limit, offset).all()

  const { total } = await c.env.DB.prepare('SELECT COUNT(*) as total FROM battle_logs').first()

  return c.json({
    success: true,
    data: {
      battleLogs: results,
      total: total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
      executionTime: `${Date.now() - c.req.start}ms`
    }
  })
})
```

---

#### 1.2 対戦履歴登録

**エンドポイント**: `POST /api/battle-logs`

**説明**: 新しい対戦履歴を登録 🔵 *REQ-001, REQ-002より*

**リクエストボディ**:

| パラメータ | 型 | 必須 | デフォルト値 | 説明 | 信頼性 |
|---|---|---|---|---|---|
| `date` | string | No | 今日 | 対戦日（YYYY-MM-DD形式） | 🔵 *REQ-002より* |
| `battleType` | BattleType | Yes | - | 対戦タイプ | 🔵 *REQ-002より* |
| `rank` | Rank | Yes | - | ランク | 🔵 *REQ-002より* |
| `group` | Group | Yes | - | グループ | 🔵 *REQ-002より* |
| `myDeckId` | string | Yes | - | 使用デッキID | 🔵 *REQ-002より* |
| `turn` | Turn | Yes | - | 先攻後攻 | 🔵 *REQ-002より* |
| `result` | BattleResult | Yes | - | 対戦結果 | 🔵 *REQ-002より* |
| `opponentDeckId` | string | Yes | - | 相手デッキID | 🔵 *REQ-002より* |

**リクエスト例**:

```http
POST /api/battle-logs
Content-Type: application/json

{
  "date": "2025-01-24",
  "battleType": "ランクマッチ",
  "rank": "ダイアモンド",
  "group": "AAA",
  "myDeckId": "deck_001",
  "turn": "先攻",
  "result": "勝ち",
  "opponentDeckId": "deck_master_002"
}
```

**Cloudflare Workers実装例**:

```typescript
app.post('/api/battle-logs', async (c) => {
  const body = await c.req.json()

  // Zodバリデーション
  const validated = battleLogSchema.parse(body)

  const id = crypto.randomUUID()

  await c.env.DB.prepare(`
    INSERT INTO battle_logs
    (id, date, battle_type, rank, group_name, my_deck_id, turn, result, opponent_deck_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).bind(
    id,
    validated.date,
    validated.battleType,
    validated.rank,
    validated.group,
    validated.myDeckId,
    validated.turn,
    validated.result,
    validated.opponentDeckId
  ).run()

  return c.json({
    success: true,
    data: { battleLog: { id, ...validated } },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    }
  }, 201)
})
```

---

#### 1.3 対戦履歴削除

**エンドポイント**: `DELETE /api/battle-logs/:id`

**説明**: 指定した対戦履歴を削除 🔵 *REQ-010より*

**パスパラメータ**:

| パラメータ | 型 | 説明 |
|---|---|---|
| `id` | string | 削除対象の対戦履歴ID |

**リクエスト例**:

```http
DELETE /api/battle-logs/log_20250124_001
```

**Cloudflare Workers実装例**:

```typescript
app.delete('/api/battle-logs/:id', async (c) => {
  const id = c.req.param('id')

  const result = await c.env.DB.prepare('DELETE FROM battle_logs WHERE id = ?').bind(id).run()

  if (result.meta.changes === 0) {
    return c.json({
      success: false,
      error: {
        code: 'BATTLE_LOG_NOT_FOUND',
        message: '指定された対戦履歴が見つかりません'
      }
    }, 404)
  }

  return c.json({
    success: true,
    data: { deletedId: id }
  })
})
```

---

### 2. 統計・分析

#### 2.1 統計データ取得

**エンドポイント**: `GET /api/statistics`

**説明**: 対戦履歴の統計データを取得 🔵 *REQ-014, REQ-015, REQ-016, REQ-017より*

**クエリパラメータ**:

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|---|---|---|---|---|
| `startDate` | string | No | 7日前 | 集計開始日（YYYY-MM-DD） |
| `endDate` | string | No | 今日 | 集計終了日（YYYY-MM-DD） |
| `battleType` | string | No | 全て | 対戦タイプ絞り込み |

**Cloudflare Workers実装例**:

```typescript
app.get('/api/statistics', async (c) => {
  const { startDate, endDate, battleType } = c.req.query()

  // D1でSQLクエリを使用して効率的に統計を計算
  const overallStats = await c.env.DB.prepare(`
    SELECT
      COUNT(*) as totalGames,
      SUM(CASE WHEN result = '勝ち' THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN result = '負け' THEN 1 ELSE 0 END) as losses,
      ROUND(SUM(CASE WHEN result = '勝ち' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as winRate
    FROM battle_logs
    WHERE date BETWEEN ? AND ?
    ${battleType ? 'AND battle_type = ?' : ''}
  `).bind(startDate, endDate, ...(battleType ? [battleType] : [])).first()

  // デッキ別統計
  const byMyDeck = await c.env.DB.prepare(`
    SELECT
      my_deck_id as deckId,
      COUNT(*) as totalGames,
      SUM(CASE WHEN result = '勝ち' THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN result = '負け' THEN 1 ELSE 0 END) as losses,
      ROUND(SUM(CASE WHEN result = '勝ち' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as winRate
    FROM battle_logs
    WHERE date BETWEEN ? AND ?
    GROUP BY my_deck_id
  `).bind(startDate, endDate).all()

  return c.json({
    success: true,
    data: {
      overall: overallStats,
      byMyDeck: byMyDeck.results,
      // ... その他の統計
    }
  })
})
```

---

### 3. マスターデータ

#### 3.1 デッキマスター一覧取得

**エンドポイント**: `GET /api/deck-master`

**説明**: デッキマスター（相手デッキ選択肢）の一覧を取得 🔵 *REQ-002より*

**Cloudflare Workers実装例**:

```typescript
app.get('/api/deck-master', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM deck_master ORDER BY sort_order ASC'
  ).all()

  return c.json({
    success: true,
    data: { deckMaster: results }
  })
})
```

---

### 4. データインポート

#### 4.1 データインポート

**エンドポイント**: `POST /api/import`

**説明**: JSON/CSV形式のデータをインポート 🔵 *REQ-035より*

**リクエストボディ**:

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| `format` | string | Yes | "json" \| "csv" |
| `data` | string | Yes | インポートデータ |

**Cloudflare Workers実装例**:

```typescript
app.post('/api/import', async (c) => {
  const { format, data } = await c.req.json()

  let battleLogs: BattleLog[]

  if (format === 'json') {
    battleLogs = JSON.parse(data)
  } else if (format === 'csv') {
    // CSV パース処理
    battleLogs = parseCSV(data)
  }

  // D1トランザクションで一括INSERT
  const batch = battleLogs.map(log =>
    c.env.DB.prepare(`
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

  const results = await c.env.DB.batch(batch)

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

## Phase 2 エンドポイント

### 認証ヘッダー 🔵 *REQ-022より*

Phase 2の全エンドポイントは以下のヘッダーが必須:

```http
CF-Access-JWT-Assertion: <Cloudflare Access Token>
```

### Cloudflare Access認証検証

```typescript
import { verify } from '@tsndr/cloudflare-worker-jwt'

app.use('/api/*', async (c, next) => {
  const token = c.req.header('CF-Access-JWT-Assertion')

  if (!token) {
    return c.json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '認証トークンが必要です'
      }
    }, 401)
  }

  try {
    const isValid = await verify(token, c.env.CF_ACCESS_PUBLIC_KEY)

    if (!isValid) {
      return c.json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: '認証トークンが無効です'
        }
      }, 401)
    }

    // ユーザー情報をコンテキストに保存
    c.set('userId', decoded.sub)

    await next()
  } catch (error) {
    return c.json({
      success: false,
      error: {
        code: 'TOKEN_VALIDATION_ERROR',
        message: 'トークン検証エラー'
      }
    }, 401)
  }
})
```

---

### 5. マイデッキ管理

#### 5.1 マイデッキ一覧取得

**エンドポイント**: `GET /api/my-decks`

**説明**: ログインユーザーのマイデッキ一覧を取得 🔵 *REQ-040より*

```typescript
app.get('/api/my-decks', async (c) => {
  const userId = c.get('userId')

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM my_decks WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(userId).all()

  return c.json({
    success: true,
    data: { myDecks: results }
  })
})
```

---

## Cloudflare Workers特有の機能

### レート制限

```typescript
import { RateLimiter } from '@cloudflare/workers-rate-limiter'

const limiter = new RateLimiter({
  limit: 100,  // 100リクエスト/分
  window: 60   // 60秒
})

app.use('/api/*', async (c, next) => {
  const ip = c.req.header('CF-Connecting-IP')

  const { success } = await limiter.limit({ key: ip })

  if (!success) {
    return c.json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'リクエスト制限を超過しました'
      }
    }, 429)
  }

  await next()
})
```

---

### キャッシュ戦略

```typescript
app.get('/api/deck-master', async (c) => {
  const cacheKey = new Request('https://api.example.com/deck-master', c.req)
  const cache = caches.default

  // キャッシュチェック
  let response = await cache.match(cacheKey)

  if (!response) {
    // D1から取得
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM deck_master ORDER BY sort_order ASC'
    ).all()

    response = new Response(JSON.stringify({
      success: true,
      data: { deckMaster: results }
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300'  // 5分間キャッシュ
      }
    })

    // キャッシュに保存
    c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()))
  }

  return response
})
```

---

## パフォーマンス要件 🔵 *REQ-038より*

| エンドポイント | 目標レスポンスタイム | Cloudflare Workers目標 |
|---|---|---|
| `GET /api/battle-logs` | < 500ms | < 100ms（エッジ実行） |
| `POST /api/battle-logs` | < 300ms | < 50ms |
| `DELETE /api/battle-logs/:id` | < 300ms | < 50ms |
| `GET /api/statistics` | < 1000ms | < 200ms（D1クエリ最適化） |
| `POST /api/import` | < 2000ms | < 500ms（バッチ処理） |
| `POST /api/export` | < 2000ms | < 500ms |

**Cloudflare Workersの利点**:
- エッジロケーションでの実行により、Azure Functionsよりも2-5倍高速
- コールドスタートがほぼゼロ（V8 Isolates）
- グローバルに分散されたエッジネットワーク

---

## モニタリング 🟡 *Cloudflare Workers Analytics標準より*

Cloudflare Workers Analyticsで以下のメトリクスを記録:

- **リクエスト数**
- **レスポンスタイム** (P50, P95, P99)
- **エラー率**
- **HTTPステータスコード分布**
- **エッジロケーション別レスポンス**
- **CPU時間**
- **Durable Objects使用量** (Phase 2以降)

```typescript
// カスタムメトリクス
app.use('*', async (c, next) => {
  const start = Date.now()
  await next()
  const duration = Date.now() - start

  // Cloudflare Analyticsに記録
  c.executionCtx.waitUntil(
    c.env.ANALYTICS.writeDataPoint({
      blobs: [c.req.path],
      doubles: [duration],
      indexes: [c.req.method]
    })
  )
})
```

---

## 更新履歴

| バージョン | 日付 | 変更内容 |
|---|---|---|
| 2.0.0 | 2025-11-25 | Cloudflare版作成 (Workers, D1対応) |
| 1.0.0 | 2025-10-24 | Azure版初版作成 |

---

## 開発ツール

### Biome設定

**プロジェクト共通** (`biome.json`):

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": {
        "noExplicitAny": "error"
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

### pnpmコマンド

```bash
# バックエンド開発
cd backend
pnpm install
pnpm dev          # Wranglerローカル開発
pnpm build        # TypeScriptビルド
pnpm lint         # Biome lint
pnpm format       # Biome format
pnpm test         # Unit テスト
pnpm deploy       # Cloudflare Workers デプロイ

# Biome個別実行
pnpm biome check .           # Lint + Format チェック
pnpm biome check --write .   # Lint + Format 自動修正
pnpm biome format --write .  # Format のみ自動修正
```

---

## 参考資料

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Hono Framework](https://hono.dev/)
- [Drizzle ORM for D1](https://orm.drizzle.team/docs/get-started-sqlite#cloudflare-d1)
- [Biome Documentation](https://biomejs.dev/)
- [pnpm Documentation](https://pnpm.io/)

---

**ドキュメント終了**

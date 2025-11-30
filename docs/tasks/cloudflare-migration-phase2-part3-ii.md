# Phase 2 Part 3-ii: APIテスト・最適化

## フェーズ概要

- **期間**: Day 6-10 (5営業日)
- **総工数**: 40時間
- **目標**: Cloudflare Workers上でのバックエンドAPI実装完了
- **成果物**:
  - Hono + Workers セットアップ
  - Battle Log CRUD API (D1データベース)
  - Deck Master API
  - Statistics API (統計計算)
  - Import API
  - 単体テスト・統合テスト完備

## 週次計画

### Week 2 (Day 6-10)

- **目標**: すべてのバックエンドAPIの実装とテスト完了
- **成果物**: Cloudflare Workers APIが完成し、テスト済み

---

## タスク一覧

### TASK-0032: APIテスト・最適化

- [x] **タスク完了**
- **推定工数**: 2時間
- **タスクタイプ**: TDD
- **要件**: NFR-101 (レスポンスタイム), NFR-201 (エラーハンドリング) 🔵
- **依存タスク**:
  - TASK-0028 (対戦履歴CRUD API) ✅
  - TASK-0029 (デッキマスターAPI) ✅
  - TASK-0030 (統計計算API) ✅
  - TASK-0031 (インポートAPI) ✅
- **要件リンク**: [docs/design/shadowverse-battle-log/api-endpoints-cloudflare.md](/home/syagu/work/shadowverse_log/docs/design/shadowverse-battle-log/api-endpoints-cloudflare.md)

#### 実装詳細

##### 1. 統合テスト実装

`tests/integration/api.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

describe('API Integration Tests', () => {
  const baseUrl = 'http://localhost:8787'

  describe('Battle Logs API', () => {
    it('対戦履歴を登録できる', async () => {
      const response = await fetch(`${baseUrl}/api/battle-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: '2025-01-24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_002',
        }),
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.battleLog.id).toBeDefined()
    })

    it('対戦履歴一覧を取得できる', async () => {
      const response = await fetch(`${baseUrl}/api/battle-logs`)

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.battleLogs).toBeInstanceOf(Array)
    })
  })

  describe('Statistics API', () => {
    it('統計データを取得できる', async () => {
      const response = await fetch(`${baseUrl}/api/statistics`)

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.overall).toBeDefined()
    })
  })
})
```

##### 2. パフォーマンステスト

`tests/performance/load.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'

describe('Performance Tests', () => {
  const baseUrl = 'http://localhost:8787'

  it('GET /api/battle-logs が100ms以内に応答する', async () => {
    const start = Date.now()
    const response = await fetch(`${baseUrl}/api/battle-logs`)
    const duration = Date.now() - start

    expect(response.status).toBe(200)
    expect(duration).toBeLessThan(100)
  })

  it('GET /api/statistics が200ms以内に応答する', async () => {
    const start = Date.now()
    const response = await fetch(`${baseUrl}/api/statistics`)
    const duration = Date.now() - start

    expect(response.status).toBe(200)
    expect(duration).toBeLessThan(200)
  })
})
```

##### 3. レート制限実装

`src/middleware/rateLimit.ts`:

```typescript
import type { Context, Next } from 'hono'

const requestCounts = new Map<string, { count: number; resetAt: number }>()

export const rateLimit = (limit = 100, window = 60000) => {
  return async (c: Context, next: Next) => {
    const ip = c.req.header('CF-Connecting-IP') || 'unknown'
    const now = Date.now()

    let record = requestCounts.get(ip)

    if (!record || now > record.resetAt) {
      record = { count: 0, resetAt: now + window }
      requestCounts.set(ip, record)
    }

    record.count++

    if (record.count > limit) {
      return c.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'リクエスト制限を超過しました',
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          },
        },
        429
      )
    }

    await next()
  }
}
```

`src/index.ts` に適用:

```typescript
import { rateLimit } from './middleware/rateLimit'

app.use('/api/*', rateLimit(100, 60000)) // 100リクエスト/分
```

#### 完了条件

- [x] すべての統合テストがパス
- [x] パフォーマンステストがパス
- [x] レート制限が正常動作
- [x] エラーハンドリングが正常動作
- [x] すべてのエンドポイントが目標レスポンスタイムを達成

#### テスト要件

##### 1. テスト実行

```bash
pnpm test                    # すべてのテスト実行
pnpm test:unit              # 単体テストのみ
pnpm test:integration       # 統合テストのみ
pnpm test:performance       # パフォーマンステストのみ
```

##### 2. カバレッジ確認

```bash
pnpm test:coverage
```

- カバレッジ目標: 80%以上

---

## Phase 2 完了チェックリスト

### セットアップ

- [ ] Honoフレームワークがセットアップ済み
- [ ] Workersプロジェクトが初期化済み
- [ ] ルーティングが設定済み
- [ ] ミドルウェアが設定済み（CORS, エラーハンドリング）

### API実装

- [ ] GET /api/battle-logs が実装済み
- [ ] POST /api/battle-logs が実装済み
- [ ] DELETE /api/battle-logs/:id が実装済み
- [ ] GET /api/deck-master が実装済み
- [ ] GET /api/statistics が実装済み
- [ ] POST /api/import が実装済み

### バリデーション

- [ ] Zodバリデーションが実装済み
- [ ] 未来日付チェックが動作
- [ ] 必須項目チェックが動作
- [ ] Enum値チェックが動作

### データベース

- [ ] D1クエリが正常実行
- [ ] バッチINSERT処理が動作
- [ ] インデックスが適切に設定
- [ ] トランザクション処理が動作

### キャッシュ

- [ ] デッキマスターのキャッシュが動作（5分間）
- [ ] Cache API が正常動作

### エラーハンドリング

- [ ] バリデーションエラーが適切に返却
- [ ] 404エラーが適切に返却
- [ ] 500エラーが適切に返却
- [ ] レート制限エラーが適切に返却

### テスト

- [ ] すべての単体テストがパス
- [ ] すべての統合テストがパス
- [ ] パフォーマンステストがパス
- [ ] カバレッジが80%以上

### パフォーマンス

- [ ] GET /api/battle-logs が100ms以内
- [ ] POST /api/battle-logs が50ms以内
- [ ] GET /api/statistics が200ms以内
- [ ] POST /api/import が500ms以内

### セキュリティ

- [ ] CORS設定が動作
- [ ] 入力バリデーションが動作
- [ ] レート制限が動作
- [ ] エラーメッセージが適切

### デプロイ

- [ ] `pnpm build` が成功
- [ ] `pnpm deploy` が成功
- [ ] 本番環境で正常動作

---

## 更新履歴

| バージョン | 日付 | 変更内容 |
|---|---|---|
| 1.0.0 | 2025-11-26 | Cloudflare版Phase 2 Part 3-ii作成 |

---

**ドキュメント終了**

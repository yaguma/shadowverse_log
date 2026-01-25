# Phase 2 Part 2-i: デッキマスターAPI実装

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

### TASK-0029: デッキマスターAPI実装

- **推定工数**: 6時間
- **タスクタイプ**: TDD
- **要件**: REQ-002 (相手デッキ選択肢) 🔵
- **依存タスク**: TASK-0027 (Hono + Workers セットアップ) ✅
- **要件リンク**: [docs/design/shadowverse-battle-log/api-endpoints-cloudflare.md](/home/syagu/work/shadowverse_log/docs/design/shadowverse-battle-log/api-endpoints-cloudflare.md)

#### 実装詳細

##### 1. 型定義

`src/types/deckMaster.ts`:

```typescript
export interface DeckMaster {
  id: string
  className: string
  deckName: string
  sortOrder: number
  createdAt?: string
}
```

##### 2. サービス実装

`src/services/deckMasterService.ts`:

```typescript
import type { D1Database } from '@cloudflare/workers-types'
import type { DeckMaster } from '../types/deckMaster'

export class DeckMasterService {
  constructor(private db: D1Database) {}

  /**
   * デッキマスター一覧取得
   */
  async getDeckMasters(): Promise<DeckMaster[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM deck_master ORDER BY sort_order ASC')
      .all<DeckMaster>()

    return results || []
  }
}
```

##### 3. キャッシュ戦略実装

`src/routes/deck-master.ts`:

```typescript
import { Hono } from 'hono'
import type { D1Database } from '@cloudflare/workers-types'
import { DeckMasterService } from '../services/deckMasterService'

type Bindings = {
  DB: D1Database
}

const deckMaster = new Hono<{ Bindings: Bindings }>()

// GET /api/deck-master
deckMaster.get('/', async (c) => {
  const cacheKey = new Request('https://api.example.com/deck-master', c.req.raw)
  const cache = caches.default

  // キャッシュチェック
  let response = await cache.match(cacheKey)

  if (!response) {
    // D1から取得
    const service = new DeckMasterService(c.env.DB)
    const deckMasters = await service.getDeckMasters()

    response = new Response(
      JSON.stringify({
        success: true,
        data: { deckMasters },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300', // 5分間キャッシュ
        },
      }
    )

    // キャッシュに保存
    c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()))
  }

  return response
})

export default deckMaster
```

#### 完了条件

- [x] GET /api/deck-master が正常動作
- [x] Drizzle ORM連携が正常動作
- [x] キャッシュ戦略が動作（5分間）
- [x] すべての単体テストがパス

#### テスト要件

##### 1. 単体テスト

`src/services/deckMasterService.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DeckMasterService } from './deckMasterService'
import type { D1Database } from '@cloudflare/workers-types'

describe('DeckMasterService', () => {
  let mockDB: D1Database
  let service: DeckMasterService

  beforeEach(() => {
    mockDB = {
      prepare: vi.fn().mockReturnValue({
        all: vi.fn().mockResolvedValue({
          results: [
            {
              id: 'deck_master_001',
              className: 'エルフ',
              deckName: 'アグロエルフ',
              sortOrder: 1,
            },
          ],
        }),
      }),
    } as unknown as D1Database

    service = new DeckMasterService(mockDB)
  })

  describe('getDeckMasters', () => {
    it('デッキマスター一覧を取得できる', async () => {
      const result = await service.getDeckMasters()

      expect(result).toBeInstanceOf(Array)
      expect(result[0].id).toBe('deck_master_001')
      expect(result[0].className).toBe('エルフ')
    })
  })
})
```

---

## 更新履歴

| バージョン | 日付 | 変更内容 |
|---|---|---|
| 1.0.0 | 2025-11-26 | Cloudflare版Phase 2 Part 2-i作成 |

---

**ドキュメント終了**

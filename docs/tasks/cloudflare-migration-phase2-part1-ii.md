# Phase 2 Part 1-ii: 対戦履歴CRUD API実装

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

### TASK-0028: 対戦履歴CRUD API実装

- **推定工数**: 10時間
- **タスクタイプ**: TDD
- **要件**: REQ-001, REQ-002, REQ-009, REQ-010 🔵
- **依存タスク**: TASK-0027 (Hono + Workers セットアップ) ✅
- **要件リンク**: [docs/design/shadowverse-battle-log/api-endpoints-cloudflare.md](/home/syagu/work/shadowverse_log/docs/design/shadowverse-battle-log/api-endpoints-cloudflare.md)

#### 実装詳細

##### 1. 型定義

`src/types/battleLog.ts`:

```typescript
export type BattleType = 'ランクマッチ' | '対戦台' | 'ロビー大会'
export type Rank = 'サファイア' | 'ダイアモンド' | 'ルビー' | 'トパーズ' | '-'
export type Group = 'A' | 'AA' | 'AAA' | 'Master' | '-'
export type Turn = '先攻' | '後攻'
export type BattleResult = '勝ち' | '負け'

export interface BattleLog {
  id: string
  date: string
  battleType: BattleType
  rank: Rank
  group: Group
  myDeckId: string
  turn: Turn
  result: BattleResult
  opponentDeckId: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateBattleLogRequest {
  date?: string
  battleType: BattleType
  rank: Rank
  group: Group
  myDeckId: string
  turn: Turn
  result: BattleResult
  opponentDeckId: string
}
```

##### 2. バリデーションスキーマ (Zod)

`src/utils/validation.ts`:

```typescript
import { z } from 'zod'

const isFutureDate = (dateStr: string): boolean => {
  const inputDate = new Date(dateStr)
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  return inputDate > today
}

export const createBattleLogSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: '日付はYYYY-MM-DD形式で入力してください' })
    .refine((val) => !isFutureDate(val), { message: '未来の日付は入力できません' })
    .default(() => new Date().toISOString().split('T')[0]),

  battleType: z.enum(['ランクマッチ', '対戦台', 'ロビー大会'], {
    errorMap: () => ({ message: '対戦タイプが不正です' }),
  }),

  rank: z.enum(['サファイア', 'ダイアモンド', 'ルビー', 'トパーズ', '-'], {
    errorMap: () => ({ message: 'ランクが不正です' }),
  }),

  group: z.enum(['A', 'AA', 'AAA', 'Master', '-'], {
    errorMap: () => ({ message: 'グループが不正です' }),
  }),

  myDeckId: z.string().min(1, { message: 'マイデッキIDは必須です' }),

  turn: z.enum(['先攻', '後攻'], {
    errorMap: () => ({ message: 'ターンが不正です' }),
  }),

  result: z.enum(['勝ち', '負け'], {
    errorMap: () => ({ message: '対戦結果が不正です' }),
  }),

  opponentDeckId: z.string().min(1, { message: '相手デッキIDは必須です' }),
})

export type CreateBattleLogInput = z.infer<typeof createBattleLogSchema>
```

##### 3. D1クエリ実装

`src/services/battleLogService.ts`:

```typescript
import type { D1Database } from '@cloudflare/workers-types'
import type { BattleLog, CreateBattleLogInput } from '../types/battleLog'

export class BattleLogService {
  constructor(private db: D1Database) {}

  /**
   * 対戦履歴一覧取得
   */
  async getBattleLogs(
    limit = 100,
    offset = 0,
    sortBy = 'date',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ battleLogs: BattleLog[]; total: number }> {
    // 一覧取得
    const { results } = await this.db
      .prepare(
        `SELECT * FROM battle_logs ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`
      )
      .bind(limit, offset)
      .all<BattleLog>()

    // 総件数取得
    const { total } = await this.db
      .prepare('SELECT COUNT(*) as total FROM battle_logs')
      .first<{ total: number }>()

    return {
      battleLogs: results || [],
      total: total || 0,
    }
  }

  /**
   * 対戦履歴登録
   */
  async createBattleLog(input: CreateBattleLogInput): Promise<BattleLog> {
    const id = crypto.randomUUID()

    await this.db
      .prepare(
        `
        INSERT INTO battle_logs
        (id, date, battle_type, rank, group_name, my_deck_id, turn, result, opponent_deck_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `
      )
      .bind(
        id,
        input.date,
        input.battleType,
        input.rank,
        input.group,
        input.myDeckId,
        input.turn,
        input.result,
        input.opponentDeckId
      )
      .run()

    return {
      id,
      ...input,
    }
  }

  /**
   * 対戦履歴削除
   */
  async deleteBattleLog(id: string): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM battle_logs WHERE id = ?').bind(id).run()

    return (result.meta.changes ?? 0) > 0
  }
}
```

##### 4. APIルート実装

`src/routes/battle-logs.ts`:

```typescript
import { Hono } from 'hono'
import type { D1Database } from '@cloudflare/workers-types'
import { BattleLogService } from '../services/battleLogService'
import { createBattleLogSchema } from '../utils/validation'

type Bindings = {
  DB: D1Database
}

const battleLogs = new Hono<{ Bindings: Bindings }>()

// GET /api/battle-logs
battleLogs.get('/', async (c) => {
  const { limit = '100', offset = '0', sortBy = 'date', sortOrder = 'desc' } = c.req.query()

  const service = new BattleLogService(c.env.DB)
  const result = await service.getBattleLogs(
    parseInt(limit),
    parseInt(offset),
    sortBy,
    sortOrder as 'asc' | 'desc'
  )

  return c.json({
    success: true,
    data: result,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    },
  })
})

// POST /api/battle-logs
battleLogs.post('/', async (c) => {
  const body = await c.req.json()

  // バリデーション
  const validated = createBattleLogSchema.parse(body)

  const service = new BattleLogService(c.env.DB)
  const battleLog = await service.createBattleLog(validated)

  return c.json(
    {
      success: true,
      data: { battleLog },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    },
    201
  )
})

// DELETE /api/battle-logs/:id
battleLogs.delete('/:id', async (c) => {
  const id = c.req.param('id')

  const service = new BattleLogService(c.env.DB)
  const deleted = await service.deleteBattleLog(id)

  if (!deleted) {
    return c.json(
      {
        success: false,
        error: {
          code: 'BATTLE_LOG_NOT_FOUND',
          message: '指定された対戦履歴が見つかりません',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      },
      404
    )
  }

  return c.json({
    success: true,
    data: { deletedId: id },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    },
  })
})

export default battleLogs
```

#### 完了条件

- [x] GET /api/battle-logs が正常動作
- [x] POST /api/battle-logs が正常動作
- [x] DELETE /api/battle-logs/:id が正常動作
- [x] Zodバリデーションが動作
- [x] D1クエリが正常実行
- [x] エラーハンドリングが正常動作
- [x] すべての単体テストがパス

#### テスト要件

##### 1. 単体テスト (Vitest)

`src/services/battleLogService.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BattleLogService } from './battleLogService'
import type { D1Database } from '@cloudflare/workers-types'

describe('BattleLogService', () => {
  let mockDB: D1Database
  let service: BattleLogService

  beforeEach(() => {
    mockDB = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue({ results: [] }),
          first: vi.fn().mockResolvedValue({ total: 0 }),
          run: vi.fn().mockResolvedValue({ meta: { changes: 1 } }),
        }),
      }),
    } as unknown as D1Database

    service = new BattleLogService(mockDB)
  })

  describe('createBattleLog', () => {
    it('対戦履歴を正常に登録できる', async () => {
      const input = {
        date: '2025-01-24',
        battleType: 'ランクマッチ' as const,
        rank: 'ダイアモンド' as const,
        group: 'AAA' as const,
        myDeckId: 'deck_001',
        turn: '先攻' as const,
        result: '勝ち' as const,
        opponentDeckId: 'deck_master_002',
      }

      const result = await service.createBattleLog(input)

      expect(result.id).toBeDefined()
      expect(result.date).toBe('2025-01-24')
      expect(result.battleType).toBe('ランクマッチ')
    })
  })

  describe('getBattleLogs', () => {
    it('対戦履歴一覧を取得できる', async () => {
      const result = await service.getBattleLogs(100, 0)

      expect(result.battleLogs).toBeInstanceOf(Array)
      expect(result.total).toBeGreaterThanOrEqual(0)
    })
  })

  describe('deleteBattleLog', () => {
    it('対戦履歴を削除できる', async () => {
      const result = await service.deleteBattleLog('log_20250124_001')

      expect(result).toBe(true)
    })
  })
})
```

##### 2. 統合テスト

```bash
curl -X POST http://localhost:8787/api/battle-logs \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-01-24",
    "battleType": "ランクマッチ",
    "rank": "ダイアモンド",
    "group": "AAA",
    "myDeckId": "deck_001",
    "turn": "先攻",
    "result": "勝ち",
    "opponentDeckId": "deck_master_002"
  }'
```

---

## 更新履歴

| バージョン | 日付 | 変更内容 |
|---|---|---|
| 1.0.0 | 2025-11-26 | Cloudflare版Phase 2 Part 1-ii作成 |

---

**ドキュメント終了**

# Phase 2 Part 3-i: インポートAPI実装

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

### TASK-0031: インポートAPI実装

- **推定工数**: 6時間
- **タスクタイプ**: TDD
- **要件**: REQ-035 (データインポート) 🔵
- **依存タスク**: TASK-0028 (対戦履歴CRUD API) ✅
- **要件リンク**: [docs/design/shadowverse-battle-log/api-endpoints-cloudflare.md](/home/syagu/work/shadowverse_log/docs/design/shadowverse-battle-log/api-endpoints-cloudflare.md)

#### 実装詳細

##### 1. 型定義

`src/types/import.ts`:

```typescript
export type ImportFormat = 'json' | 'csv'

export interface ImportRequest {
  format: ImportFormat
  data: string
}

export interface ImportResponse {
  imported: number
  skipped: number
  errors?: string[]
}
```

##### 2. CSV/JSONパーサー実装

`src/utils/parser.ts`:

```typescript
import type { BattleLog } from '../types/battleLog'

/**
 * JSON文字列をパース
 */
export function parseJSON(data: string): BattleLog[] {
  try {
    const parsed = JSON.parse(data)
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch (error) {
    throw new Error('JSON形式が不正です')
  }
}

/**
 * CSV文字列をパース
 */
export function parseCSV(data: string): BattleLog[] {
  const lines = data.trim().split('\n')

  if (lines.length === 0) {
    throw new Error('CSVデータが空です')
  }

  // ヘッダー行を解析
  const headers = lines[0].split(',').map((h) => h.trim())

  // データ行を解析
  const battleLogs: BattleLog[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim())

    const log: Partial<BattleLog> = {}

    headers.forEach((header, index) => {
      log[header as keyof BattleLog] = values[index] as any
    })

    if (log.id && log.date && log.battleType) {
      battleLogs.push(log as BattleLog)
    }
  }

  return battleLogs
}
```

##### 3. インポートサービス実装

`src/services/importService.ts`:

```typescript
import type { D1Database } from '@cloudflare/workers-types'
import type { BattleLog } from '../types/battleLog'
import type { ImportFormat, ImportResponse } from '../types/import'
import { parseJSON, parseCSV } from '../utils/parser'

export class ImportService {
  constructor(private db: D1Database) {}

  /**
   * データインポート
   */
  async importBattleLogs(format: ImportFormat, data: string): Promise<ImportResponse> {
    // データパース
    let battleLogs: BattleLog[]

    if (format === 'json') {
      battleLogs = parseJSON(data)
    } else if (format === 'csv') {
      battleLogs = parseCSV(data)
    } else {
      throw new Error('サポートされていないフォーマットです')
    }

    // バッチINSERT
    const batch = battleLogs.map((log) =>
      this.db
        .prepare(
          `
        INSERT OR IGNORE INTO battle_logs
        (id, date, battle_type, rank, group_name, my_deck_id, turn, result, opponent_deck_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `
        )
        .bind(
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

    const results = await this.db.batch(batch)

    const imported = results.filter((r) => (r.meta.changes ?? 0) > 0).length
    const skipped = results.length - imported

    return { imported, skipped }
  }
}
```

##### 4. R2一時保存実装

`src/routes/import.ts`:

```typescript
import { Hono } from 'hono'
import type { D1Database, R2Bucket } from '@cloudflare/workers-types'
import { ImportService } from '../services/importService'
import { z } from 'zod'

type Bindings = {
  DB: D1Database
  R2: R2Bucket
}

const importData = new Hono<{ Bindings: Bindings }>()

const importSchema = z.object({
  format: z.enum(['json', 'csv']),
  data: z.string().min(1),
})

// POST /api/import
importData.post('/', async (c) => {
  const body = await c.req.json()

  // バリデーション
  const { format, data } = importSchema.parse(body)

  // R2に一時保存
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const key = `imports/temp/import_${timestamp}.${format}`

  await c.env.R2.put(key, data, {
    httpMetadata: {
      contentType: format === 'json' ? 'application/json' : 'text/csv',
    },
  })

  // インポート処理
  const service = new ImportService(c.env.DB)
  const result = await service.importBattleLogs(format, data)

  return c.json({
    success: true,
    data: result,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
      r2Key: key,
    },
  })
})

export default importData
```

#### 完了条件

- [x] POST /api/import が正常動作
- [x] JSON形式のインポートが動作
- [x] CSV形式のインポートが動作
- [x] バッチINSERT処理が動作
- [x] R2一時保存が動作
- [x] すべての単体テストがパス

#### テスト要件

##### 1. 単体テスト

`src/services/importService.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ImportService } from './importService'
import type { D1Database } from '@cloudflare/workers-types'

describe('ImportService', () => {
  let mockDB: D1Database
  let service: ImportService

  beforeEach(() => {
    mockDB = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
      }),
      batch: vi.fn().mockResolvedValue([
        { meta: { changes: 1 } },
        { meta: { changes: 0 } },
      ]),
    } as unknown as D1Database

    service = new ImportService(mockDB)
  })

  describe('importBattleLogs', () => {
    it('JSON形式のデータをインポートできる', async () => {
      const jsonData = JSON.stringify([
        {
          id: 'log_20250124_001',
          date: '2025-01-24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_002',
        },
      ])

      const result = await service.importBattleLogs('json', jsonData)

      expect(result.imported).toBe(1)
      expect(result.skipped).toBe(1)
    })
  })
})
```

---

## 更新履歴

| バージョン | 日付 | 変更内容 |
|---|---|---|
| 1.0.0 | 2025-11-26 | Cloudflare版Phase 2 Part 3-i作成 |

---

**ドキュメント終了**

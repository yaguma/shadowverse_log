# Phase 2 Part 2-ii: 統計計算API実装

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

### TASK-0030: 統計計算API実装

- **推定工数**: 10時間
- **タスクタイプ**: TDD
- **要件**: REQ-014, REQ-015, REQ-016, REQ-017 (統計機能) 🔵
- **依存タスク**: TASK-0028 (対戦履歴CRUD API) ✅
- **要件リンク**: [docs/design/shadowverse-battle-log/api-endpoints-cloudflare.md](/home/syagu/work/shadowverse_log/docs/design/shadowverse-battle-log/api-endpoints-cloudflare.md)

#### 実装詳細

##### 1. 型定義

`src/types/statistics.ts`:

```typescript
export interface OverallStatistics {
  totalGames: number
  wins: number
  losses: number
  winRate: number
}

export interface DeckStatistics {
  deckId: string
  totalGames: number
  wins: number
  losses: number
  winRate: number
}

export interface RankStatistics {
  rank: string
  totalGames: number
  wins: number
  losses: number
  winRate: number
}

export interface StatisticsResponse {
  overall: OverallStatistics
  byMyDeck: DeckStatistics[]
  byOpponentDeck: DeckStatistics[]
  byRank: RankStatistics[]
  byTurn: {
    first: OverallStatistics
    second: OverallStatistics
  }
}
```

##### 2. 統計計算サービス

`src/services/statisticsService.ts`:

```typescript
import type { D1Database } from '@cloudflare/workers-types'
import type {
  StatisticsResponse,
  OverallStatistics,
  DeckStatistics,
  RankStatistics,
} from '../types/statistics'

export class StatisticsService {
  constructor(private db: D1Database) {}

  /**
   * 統計データ取得
   */
  async getStatistics(
    startDate?: string,
    endDate?: string,
    battleType?: string
  ): Promise<StatisticsResponse> {
    // デフォルト値設定
    const end = endDate || new Date().toISOString().split('T')[0]
    const start =
      startDate ||
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // 全体統計
    const overall = await this.getOverallStatistics(start, end, battleType)

    // デッキ別統計
    const byMyDeck = await this.getByMyDeckStatistics(start, end, battleType)
    const byOpponentDeck = await this.getByOpponentDeckStatistics(start, end, battleType)

    // ランク別統計
    const byRank = await this.getByRankStatistics(start, end, battleType)

    // ターン別統計
    const byTurn = await this.getByTurnStatistics(start, end, battleType)

    return {
      overall,
      byMyDeck,
      byOpponentDeck,
      byRank,
      byTurn,
    }
  }

  /**
   * 全体統計計算
   */
  private async getOverallStatistics(
    startDate: string,
    endDate: string,
    battleType?: string
  ): Promise<OverallStatistics> {
    let query = `
      SELECT
        COUNT(*) as totalGames,
        SUM(CASE WHEN result = '勝ち' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN result = '負け' THEN 1 ELSE 0 END) as losses,
        ROUND(SUM(CASE WHEN result = '勝ち' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as winRate
      FROM battle_logs
      WHERE date BETWEEN ? AND ?
    `

    const bindings: (string | number)[] = [startDate, endDate]

    if (battleType) {
      query += ' AND battle_type = ?'
      bindings.push(battleType)
    }

    const result = await this.db.prepare(query).bind(...bindings).first<OverallStatistics>()

    return result || { totalGames: 0, wins: 0, losses: 0, winRate: 0 }
  }

  /**
   * マイデッキ別統計
   */
  private async getByMyDeckStatistics(
    startDate: string,
    endDate: string,
    battleType?: string
  ): Promise<DeckStatistics[]> {
    let query = `
      SELECT
        my_deck_id as deckId,
        COUNT(*) as totalGames,
        SUM(CASE WHEN result = '勝ち' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN result = '負け' THEN 1 ELSE 0 END) as losses,
        ROUND(SUM(CASE WHEN result = '勝ち' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as winRate
      FROM battle_logs
      WHERE date BETWEEN ? AND ?
    `

    const bindings: (string | number)[] = [startDate, endDate]

    if (battleType) {
      query += ' AND battle_type = ?'
      bindings.push(battleType)
    }

    query += ' GROUP BY my_deck_id'

    const { results } = await this.db.prepare(query).bind(...bindings).all<DeckStatistics>()

    return results || []
  }

  /**
   * 相手デッキ別統計
   */
  private async getByOpponentDeckStatistics(
    startDate: string,
    endDate: string,
    battleType?: string
  ): Promise<DeckStatistics[]> {
    let query = `
      SELECT
        opponent_deck_id as deckId,
        COUNT(*) as totalGames,
        SUM(CASE WHEN result = '勝ち' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN result = '負け' THEN 1 ELSE 0 END) as losses,
        ROUND(SUM(CASE WHEN result = '勝ち' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as winRate
      FROM battle_logs
      WHERE date BETWEEN ? AND ?
    `

    const bindings: (string | number)[] = [startDate, endDate]

    if (battleType) {
      query += ' AND battle_type = ?'
      bindings.push(battleType)
    }

    query += ' GROUP BY opponent_deck_id'

    const { results } = await this.db.prepare(query).bind(...bindings).all<DeckStatistics>()

    return results || []
  }

  /**
   * ランク別統計
   */
  private async getByRankStatistics(
    startDate: string,
    endDate: string,
    battleType?: string
  ): Promise<RankStatistics[]> {
    let query = `
      SELECT
        rank,
        COUNT(*) as totalGames,
        SUM(CASE WHEN result = '勝ち' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN result = '負け' THEN 1 ELSE 0 END) as losses,
        ROUND(SUM(CASE WHEN result = '勝ち' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as winRate
      FROM battle_logs
      WHERE date BETWEEN ? AND ?
    `

    const bindings: (string | number)[] = [startDate, endDate]

    if (battleType) {
      query += ' AND battle_type = ?'
      bindings.push(battleType)
    }

    query += ' GROUP BY rank'

    const { results } = await this.db.prepare(query).bind(...bindings).all<RankStatistics>()

    return results || []
  }

  /**
   * ターン別統計
   */
  private async getByTurnStatistics(
    startDate: string,
    endDate: string,
    battleType?: string
  ): Promise<{ first: OverallStatistics; second: OverallStatistics }> {
    let query = `
      SELECT
        turn,
        COUNT(*) as totalGames,
        SUM(CASE WHEN result = '勝ち' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN result = '負け' THEN 1 ELSE 0 END) as losses,
        ROUND(SUM(CASE WHEN result = '勝ち' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as winRate
      FROM battle_logs
      WHERE date BETWEEN ? AND ?
    `

    const bindings: (string | number)[] = [startDate, endDate]

    if (battleType) {
      query += ' AND battle_type = ?'
      bindings.push(battleType)
    }

    query += ' GROUP BY turn'

    const { results } = await this.db
      .prepare(query)
      .bind(...bindings)
      .all<OverallStatistics & { turn: string }>()

    const first =
      results?.find((r) => r.turn === '先攻') || { totalGames: 0, wins: 0, losses: 0, winRate: 0 }
    const second =
      results?.find((r) => r.turn === '後攻') || { totalGames: 0, wins: 0, losses: 0, winRate: 0 }

    return { first, second }
  }
}
```

##### 3. APIルート実装

`src/routes/statistics.ts`:

```typescript
import { Hono } from 'hono'
import type { D1Database } from '@cloudflare/workers-types'
import { StatisticsService } from '../services/statisticsService'

type Bindings = {
  DB: D1Database
}

const statistics = new Hono<{ Bindings: Bindings }>()

// GET /api/statistics
statistics.get('/', async (c) => {
  const { startDate, endDate, battleType } = c.req.query()

  const service = new StatisticsService(c.env.DB)
  const stats = await service.getStatistics(startDate, endDate, battleType)

  return c.json({
    success: true,
    data: stats,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    },
  })
})

export default statistics
```

#### 完了条件

- [x] GET /api/statistics が正常動作
- [x] 全体統計計算が正常動作
- [x] デッキ別統計計算が正常動作
- [x] ランク別統計計算が正常動作
- [x] ターン別統計計算が正常動作
- [x] 期間フィルタリングが正常動作
- [x] すべての単体テストがパス

#### テスト要件

##### 1. 単体テスト

`src/services/statisticsService.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { StatisticsService } from './statisticsService'
import type { D1Database } from '@cloudflare/workers-types'

describe('StatisticsService', () => {
  let mockDB: D1Database
  let service: StatisticsService

  beforeEach(() => {
    mockDB = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({
            totalGames: 10,
            wins: 6,
            losses: 4,
            winRate: 60.0,
          }),
          all: vi.fn().mockResolvedValue({ results: [] }),
        }),
      }),
    } as unknown as D1Database

    service = new StatisticsService(mockDB)
  })

  describe('getStatistics', () => {
    it('統計データを取得できる', async () => {
      const result = await service.getStatistics('2025-01-01', '2025-01-31')

      expect(result.overall.totalGames).toBe(10)
      expect(result.overall.wins).toBe(6)
      expect(result.overall.winRate).toBe(60.0)
    })
  })
})
```

---

## 更新履歴

| バージョン | 日付 | 変更内容 |
|---|---|---|
| 1.0.0 | 2025-11-26 | Cloudflare版Phase 2 Part 2-ii作成 |

---

**ドキュメント終了**

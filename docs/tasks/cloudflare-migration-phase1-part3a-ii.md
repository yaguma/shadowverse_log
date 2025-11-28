# Phase 1 Part 3a-ii: リポジトリ統合と最終検証 (Cloudflareマイグレーション)

## パート概要
- **期間**: Day 3 (1営業日)
- **総工数**: 3時間
- **目標**: 全リポジトリの統合と最終検証
- **対象タスク**: TASK-0024-4 ~ TASK-0024-6 (3タスク)

---

## タスク一覧

### TASK-0024-4: DecksMaster と Statistics リポジトリ実装

- [x] **タスク完了**
- **実装備考**: 実際のスキーマ（`deckMaster`, `myDecks`）に合わせて `DeckMasterRepository` と `MyDecksRepository` を実装
- **推定工数**: 1時間
- **タスクタイプ**: TDD
- **要件**: docs/design/shadowverse-battle-log/storage-design-cloudflare.md
- **依存タスク**: TASK-0024-3
- **要件名**: decks_master と statistics テーブル用リポジトリ実装

#### 実装詳細

##### 1. DecksMaster リポジトリ実装

`backend/src/db/repositories/decks-master-repository.ts` を作成:

```typescript
import { eq, and } from 'drizzle-orm';
import type { Database } from '../index';
import { decksMaster, type DeckMaster, type NewDeckMaster } from '../schema/decks_master';
import type { BaseRepository } from './base-repository';

export class DecksMasterRepository implements BaseRepository<DeckMaster, NewDeckMaster> {
  constructor(private db: Database) {}

  async findById(id: string): Promise<DeckMaster | null> {
    const result = await this.db.select().from(decksMaster).where(eq(decksMaster.id, id)).limit(1);
    return result[0] || null;
  }

  async findAll(limit = 100, offset = 0): Promise<DeckMaster[]> {
    return await this.db.select().from(decksMaster).limit(limit).offset(offset);
  }

  async create(data: NewDeckMaster): Promise<DeckMaster> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    const newDeck: DeckMaster = {
      id,
      ...data,
      isActive: data.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.insert(decksMaster).values(newDeck);
    return newDeck;
  }

  async update(id: string, data: Partial<NewDeckMaster>): Promise<DeckMaster | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: DeckMaster = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await this.db.update(decksMaster).set(updated).where(eq(decksMaster.id, id));
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(decksMaster).where(eq(decksMaster.id, id));
    return result.changes > 0;
  }

  async findByClassName(className: string): Promise<DeckMaster[]> {
    return await this.db
      .select()
      .from(decksMaster)
      .where(eq(decksMaster.className, className));
  }

  async findActiveDecks(): Promise<DeckMaster[]> {
    return await this.db
      .select()
      .from(decksMaster)
      .where(eq(decksMaster.isActive, true));
  }
}
```

##### 2. Statistics リポジトリ実装

`backend/src/db/repositories/statistics-repository.ts` を作成:

```typescript
import { eq, and } from 'drizzle-orm';
import type { Database } from '../index';
import { statistics, type Statistic, type NewStatistic } from '../schema/statistics';
import type { BaseRepository } from './base-repository';

export class StatisticsRepository implements BaseRepository<Statistic, NewStatistic> {
  constructor(private db: Database) {}

  async findById(id: string): Promise<Statistic | null> {
    const result = await this.db.select().from(statistics).where(eq(statistics.id, id)).limit(1);
    return result[0] || null;
  }

  async findAll(limit = 50, offset = 0): Promise<Statistic[]> {
    return await this.db.select().from(statistics).limit(limit).offset(offset);
  }

  async create(data: NewStatistic): Promise<Statistic> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    const newStat: Statistic = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.insert(statistics).values(newStat);
    return newStat;
  }

  async update(id: string, data: Partial<NewStatistic>): Promise<Statistic | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: Statistic = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await this.db.update(statistics).set(updated).where(eq(statistics.id, id));
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(statistics).where(eq(statistics.id, id));
    return result.changes > 0;
  }

  async findByUserAndPeriod(
    userId: string,
    period: string,
    periodStart: string
  ): Promise<Statistic | null> {
    const result = await this.db
      .select()
      .from(statistics)
      .where(
        and(
          eq(statistics.userId, userId),
          eq(statistics.period, period),
          eq(statistics.periodStart, periodStart)
        )
      )
      .limit(1);
    return result[0] || null;
  }
}
```

#### 完了条件

- [ ] `backend/src/db/repositories/decks-master-repository.ts` が作成されている
- [ ] `backend/src/db/repositories/statistics-repository.ts` が作成されている
- [ ] TypeScriptコンパイルエラーがない

#### 検証手順

1. TypeScriptコンパイルが成功する

---

### TASK-0024-5: リポジトリ統合とエクスポート

- [x] **タスク完了**
- **推定工数**: 1時間
- **タスクタイプ**: TDD
- **要件**: docs/design/shadowverse-battle-log/storage-design-cloudflare.md
- **依存タスク**: TASK-0024-4
- **要件名**: 全リポジトリの統合とエクスポート設定

#### 実装詳細

##### 1. リポジトリインデックス作成

`backend/src/db/repositories/index.ts` を作成:

```typescript
export * from './base-repository';
export * from './battles-repository';
export * from './decks-master-repository';
export * from './statistics-repository';

import type { Database } from '../index';
import { BattlesRepository } from './battles-repository';
import { DecksMasterRepository } from './decks-master-repository';
import { StatisticsRepository } from './statistics-repository';

export interface Repositories {
  battles: BattlesRepository;
  decksMaster: DecksMasterRepository;
  statistics: StatisticsRepository;
}

export function createRepositories(db: Database): Repositories {
  return {
    battles: new BattlesRepository(db),
    decksMaster: new DecksMasterRepository(db),
    statistics: new StatisticsRepository(db),
  };
}
```

##### 2. データベースコンテキスト更新

`backend/src/db/index.ts` を更新:

```typescript
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';
import { createRepositories, type Repositories } from './repositories';

export const createDb = (d1Database: D1Database) => {
  return drizzle(d1Database, { schema });
};

export type Database = ReturnType<typeof createDb>;

export interface DatabaseContext {
  db: Database;
  repositories: Repositories;
}

export function createDatabaseContext(d1Database: D1Database): DatabaseContext {
  const db = createDb(d1Database);
  const repositories = createRepositories(db);

  return { db, repositories };
}
```

#### 完了条件

- [ ] `backend/src/db/repositories/index.ts` が作成されている
- [ ] `backend/src/db/index.ts` が更新されている
- [ ] TypeScriptコンパイルエラーがない

#### 検証手順

1. `pnpm run lint` でエラーがない
2. TypeScriptの型推論が正しく動作する

---

### TASK-0024-6: リポジトリ統合テストとDrizzle Studio確認

- [x] **タスク完了**
- **実装備考**: db:studio スクリプト追加完了。リポジトリ関連テスト（25テスト）は全て成功。旧Azure関連のテストはマイグレーション対象外
- **推定工数**: 1時間
- **タスクタイプ**: DIRECT
- **要件**: docs/design/shadowverse-battle-log/storage-design-cloudflare.md
- **依存タスク**: TASK-0024-5
- **要件名**: リポジトリの統合テストとDrizzle Studioでの動作確認

#### 実装詳細

##### 1. package.json に Drizzle Studio スクリプト追加

`backend/package.json` に以下を追加:

```json
{
  "scripts": {
    "db:studio": "drizzle-kit studio",
    "db:studio:prod": "drizzle-kit studio --config=drizzle.config.ts"
  }
}
```

##### 2. Drizzle Studio 起動確認

```bash
cd backend

# Drizzle Studio 起動
pnpm run db:studio

# ブラウザで https://local.drizzle.studio/ にアクセス
# D1データベースのテーブルとデータが表示されることを確認
```

##### 3. 統合テスト実行

```bash
# 全テスト実行
pnpm test

# カバレッジレポート生成
pnpm test --coverage
```

#### 完了条件

- [ ] Drizzle Studio が起動する
- [ ] テーブル構造が正しく表示される
- [ ] 全テストが成功する

#### 検証手順

1. `pnpm run db:studio` で Drizzle Studio が起動する
2. `pnpm test` で全テストが成功する

---

## 完了確認

Phase 1 Part 3a-ii の全タスクが完了したことを確認するのだ:

- [x] TASK-0024-4: DecksMaster と Statistics リポジトリ実装 (実際は DeckMaster + MyDecks を実装)
- [x] TASK-0024-5: リポジトリ統合とエクスポート
- [x] TASK-0024-6: リポジトリ統合テストとDrizzle Studio確認

## 次のステップ

Phase 1 Part 3b に進むのだ: `cloudflare-migration-phase1-part3b.md`

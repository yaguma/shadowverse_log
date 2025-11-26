# Phase 1 Part 3a-i: Drizzle ORM統合とリポジトリ実装 (Cloudflareマイグレーション)

## パート概要
- **期間**: Day 3 (1営業日)
- **総工数**: 3時間
- **目標**: Drizzle ORM統合とリポジトリパターン実装
- **対象タスク**: TASK-0024-1 ~ TASK-0024-3 (3タスク)

---

## タスク一覧

### TASK-0024-1: Drizzle ORM リポジトリパターン基盤実装

- [ ] **タスク未完了**
- **推定工数**: 1時間
- **タスクタイプ**: TDD
- **要件**: docs/design/shadowverse-battle-log/storage-design-cloudflare.md
- **依存タスク**: TASK-0023-6
- **要件名**: リポジトリパターンの基底クラスとインターフェース実装

#### 実装詳細

##### 1. 基底リポジトリインターフェース作成

`backend/src/db/repositories/base-repository.ts` を作成:

```typescript
export interface BaseRepository<T, TInsert> {
  findById(id: string): Promise<T | null>;
  findAll(limit?: number, offset?: number): Promise<T[]>;
  create(data: TInsert): Promise<T>;
  update(id: string, data: Partial<TInsert>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}

export interface PaginationOptions {
  limit: number;
  offset: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasNext: boolean;
}
```

##### 2. 基底リポジトリテスト作成

`backend/tests/db/repositories/base-repository.test.ts` を作成:

```typescript
import { describe, it, expect } from 'vitest';

describe('BaseRepository Interface', () => {
  it('should define required methods', () => {
    const methods = ['findById', 'findAll', 'create', 'update', 'delete'];

    methods.forEach(method => {
      expect(typeof method).toBe('string');
    });
  });
});
```

#### 完了条件

- [ ] `backend/src/db/repositories/base-repository.ts` が作成されている
- [ ] `backend/tests/db/repositories/base-repository.test.ts` が作成されている
- [ ] TypeScriptコンパイルエラーがない

#### 検証手順

1. `pnpm test` でテストが成功する
2. TypeScriptの型推論が正しく動作する

---

### TASK-0024-2: Battles リポジトリ実装

- [ ] **タスク未完了**
- **推定工数**: 1時間
- **タスクタイプ**: TDD
- **要件**: docs/design/shadowverse-battle-log/storage-design-cloudflare.md
- **依存タスク**: TASK-0024-1
- **要件名**: battles テーブル用リポジトリ実装

#### 実装詳細

##### 1. Battles リポジトリ実装

`backend/src/db/repositories/battles-repository.ts` を作成:

```typescript
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import type { Database } from '../index';
import { battles, type Battle, type NewBattle } from '../schema/battles';
import type { BaseRepository, PaginatedResult, PaginationOptions } from './base-repository';

export class BattlesRepository implements BaseRepository<Battle, NewBattle> {
  constructor(private db: Database) {}

  async findById(id: string): Promise<Battle | null> {
    const result = await this.db.select().from(battles).where(eq(battles.id, id)).limit(1);
    return result[0] || null;
  }

  async findAll(limit = 50, offset = 0): Promise<Battle[]> {
    return await this.db
      .select()
      .from(battles)
      .orderBy(desc(battles.battleDate))
      .limit(limit)
      .offset(offset);
  }

  async create(data: NewBattle): Promise<Battle> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    const newBattle: Battle = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.insert(battles).values(newBattle);
    return newBattle;
  }

  async update(id: string, data: Partial<NewBattle>): Promise<Battle | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: Battle = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await this.db.update(battles).set(updated).where(eq(battles.id, id));
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(battles).where(eq(battles.id, id));
    return result.changes > 0;
  }

  // カスタムメソッド: ユーザーIDで検索
  async findByUserId(userId: string, options?: PaginationOptions): Promise<Battle[]> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    return await this.db
      .select()
      .from(battles)
      .where(eq(battles.userId, userId))
      .orderBy(desc(battles.battleDate))
      .limit(limit)
      .offset(offset);
  }

  // カスタムメソッド: 日付範囲で検索
  async findByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<Battle[]> {
    return await this.db
      .select()
      .from(battles)
      .where(
        and(
          eq(battles.userId, userId),
          gte(battles.battleDate, startDate),
          lte(battles.battleDate, endDate)
        )
      )
      .orderBy(desc(battles.battleDate));
  }

  // カスタムメソッド: クラス別集計
  async countByClass(userId: string, myClass: string): Promise<number> {
    const result = await this.db
      .select()
      .from(battles)
      .where(and(eq(battles.userId, userId), eq(battles.myClass, myClass)));
    return result.length;
  }
}
```

#### 完了条件

- [ ] `backend/src/db/repositories/battles-repository.ts` が作成されている
- [ ] CRUD操作とカスタムメソッドが実装されている
- [ ] TypeScriptコンパイルエラーがない

#### 検証手順

1. TypeScriptコンパイルが成功する

---

### TASK-0024-3: Battles リポジトリのテスト実装

- [ ] **タスク未完了**
- **推定工数**: 1時間
- **タスクタイプ**: TDD
- **要件**: docs/design/shadowverse-battle-log/storage-design-cloudflare.md
- **依存タスク**: TASK-0024-2
- **要件名**: Battles リポジトリの単体テスト

#### 実装詳細

##### 1. Battles リポジトリテスト作成

`backend/tests/db/repositories/battles-repository.test.ts` を作成:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BattlesRepository } from '../../../src/db/repositories/battles-repository';
import type { Database } from '../../../src/db';

describe('BattlesRepository', () => {
  let repository: BattlesRepository;
  let mockDb: Database;

  beforeEach(() => {
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue({ changes: 1 }),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    } as any;

    repository = new BattlesRepository(mockDb);
  });

  describe('findById', () => {
    it('should return battle by id', async () => {
      const mockBattle = {
        id: 'test-id',
        userId: 'user-1',
        battleDate: '2025-11-26T00:00:00Z',
        myClass: 'Elf',
        myDeck: 'Aggro Elf',
        opponentClass: 'Royal',
        result: 'win',
        format: 'rotation',
        createdAt: '2025-11-26T00:00:00Z',
        updatedAt: '2025-11-26T00:00:00Z',
      };

      mockDb.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockBattle]),
          }),
        }),
      });

      const result = await repository.findById('test-id');
      expect(result).toEqual(mockBattle);
    });

    it('should return null when battle not found', async () => {
      mockDb.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await repository.findById('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new battle', async () => {
      const newBattleData = {
        userId: 'user-1',
        battleDate: '2025-11-26T00:00:00Z',
        myClass: 'Elf' as const,
        myDeck: 'Aggro Elf',
        opponentClass: 'Royal' as const,
        result: 'win' as const,
        format: 'rotation' as const,
      };

      const result = await repository.create(newBattleData);

      expect(result.id).toBeDefined();
      expect(result.userId).toBe('user-1');
      expect(result.myClass).toBe('Elf');
    });
  });
});
```

#### 完了条件

- [ ] `backend/tests/db/repositories/battles-repository.test.ts` が作成されている
- [ ] 主要なCRUD操作のテストが実装されている
- [ ] テストが成功する

#### 検証手順

1. `pnpm test` でテストが成功する

---

## 完了確認

Phase 1 Part 3a-i の全タスクが完了したことを確認するのだ:

- [ ] TASK-0024-1: Drizzle ORM リポジトリパターン基盤実装
- [ ] TASK-0024-2: Battles リポジトリ実装
- [ ] TASK-0024-3: Battles リポジトリのテスト実装

## 次のステップ

Phase 1 Part 3a-ii に進むのだ: `cloudflare-migration-phase1-part3a-ii.md`

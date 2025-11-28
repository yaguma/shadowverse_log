# Phase 1 Part 1b: D1データベーススキーマ定義 (Cloudflareマイグレーション)

## パート概要

- **期間**: Day 1-2 (2営業日)
- **総工数**: 4時間
- **目標**: D1データベース作成とDrizzle ORMスキーマ定義
- **対象タスク**: TASK-0022-1 ~ TASK-0022-4 (4タスク)

---

## タスク一覧

### TASK-0022-1: D1データベース作成

- [x] **タスク完了** ✅ (2025-11-28完了)
- **推定工数**: 1時間
- **タスクタイプ**: DIRECT
- **要件**: docs/design/shadowverse-battle-log/storage-design-cloudflare.md
- **依存タスク**: TASK-0021-8
- **要件名**: Cloudflare D1 データベースの作成と初期化

#### 実装詳細

##### 1. D1データベース作成

```bash
cd backend

# D1データベース作成
wrangler d1 create shadowverse-db

# 出力例:
# ✅ Successfully created DB 'shadowverse-db'
#
# [[d1_databases]]
# binding = "DB"
# database_name = "shadowverse-db"
# database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
#
# 出力された database_id をメモする
```

##### 2. database_id を wrangler.toml に設定

`backend/wrangler.toml` の `database_id` を更新:

```toml
[[d1_databases]]
binding = "DB"
database_name = "shadowverse-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # 作成時に取得したID
```

##### 3. database_id を .dev.vars に設定

`backend/.dev.vars` の `CLOUDFLARE_DATABASE_ID` を更新:

```
CLOUDFLARE_DATABASE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

#### 完了条件

- [x] D1データベース `shadowverse-db` が作成されている
- [x] `wrangler.toml` の `database_id` が設定されている
- [x] `.dev.vars` の `CLOUDFLARE_DATABASE_ID` が設定されている

#### 検証手順

1. `wrangler d1 list` でデータベースが表示される
2. `cat backend/wrangler.toml | grep database_id` で ID が設定されている

---

### TASK-0022-2: Drizzle ORM スキーマ定義 (battle_logs テーブル)

- [x] **タスク完了** ✅ (2025-11-28完了)
- **推定工数**: 1時間
- **タスクタイプ**: TDD
- **要件**: docs/design/shadowverse-battle-log/storage-design-cloudflare.md
- **依存タスク**: TASK-0022-1
- **要件名**: battles テーブルのスキーマ定義

#### 実装詳細

##### 1. battles テーブルスキーマ作成

`backend/src/db/schema/battles.ts` を作成:

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const battles = sqliteTable('battles', {
  id: text('id').primaryKey(), // UUID v4
  userId: text('user_id').notNull(),
  battleDate: text('battle_date').notNull(), // ISO 8601 format
  myClass: text('my_class').notNull(),
  myDeck: text('my_deck').notNull(),
  opponentClass: text('opponent_class').notNull(),
  opponentDeck: text('opponent_deck'),
  result: text('result').notNull(), // 'win' | 'lose' | 'draw'
  turn: integer('turn'),
  format: text('format').notNull(), // 'rotation' | 'unlimited'
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export type Battle = typeof battles.$inferSelect;
export type NewBattle = typeof battles.$inferInsert;
```

##### 2. battles テーブルのバリデーションスキーマ

`backend/src/db/schema/battles.validation.ts` を作成:

```typescript
import { z } from 'zod';

export const BattleResultSchema = z.enum(['win', 'lose', 'draw']);
export const BattleFormatSchema = z.enum(['rotation', 'unlimited']);
export const ClassNameSchema = z.enum([
  'Elf',
  'Royal',
  'Witch',
  'Dragon',
  'Necromancer',
  'Vampire',
  'Bishop',
  'Nemesis',
]);

export const NewBattleSchema = z.object({
  userId: z.string().min(1),
  battleDate: z.string().datetime(),
  myClass: ClassNameSchema,
  myDeck: z.string().min(1),
  opponentClass: ClassNameSchema,
  opponentDeck: z.string().optional(),
  result: BattleResultSchema,
  turn: z.number().int().positive().optional(),
  format: BattleFormatSchema,
  notes: z.string().optional(),
});

export type NewBattleInput = z.infer<typeof NewBattleSchema>;
```

#### 完了条件

- [x] `backend/src/db/schema/battle-logs.ts` が作成されている（設計文書に従いbattlesからbattle_logsに変更）
- [x] `backend/src/db/schema/battle-logs.validation.ts` が作成されている
- [x] TypeScriptコンパイルエラーがない
- [x] Biome Lintエラーがない

#### 検証手順

1. `pnpm run lint` でエラーがない
2. TypeScriptの型推論が正しく動作する

---

### TASK-0022-3: Drizzle ORM スキーマ定義 (deck_master テーブル)

- [x] **タスク完了** ✅ (2025-11-28完了)
- **推定工数**: 1時間
- **タスクタイプ**: TDD
- **要件**: docs/design/shadowverse-battle-log/storage-design-cloudflare.md
- **依存タスク**: TASK-0022-2
- **要件名**: decks_master テーブルのスキーマ定義

#### 実装詳細

##### 1. decks_master テーブルスキーマ作成

`backend/src/db/schema/decks_master.ts` を作成:

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const decksMaster = sqliteTable('decks_master', {
  id: text('id').primaryKey(), // UUID v4
  className: text('class_name').notNull(),
  deckName: text('deck_name').notNull(),
  archetype: text('archetype'),
  format: text('format').notNull(), // 'rotation' | 'unlimited'
  season: text('season'),
  description: text('description'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export type DeckMaster = typeof decksMaster.$inferSelect;
export type NewDeckMaster = typeof decksMaster.$inferInsert;
```

##### 2. decks_master テーブルのバリデーションスキーマ

`backend/src/db/schema/decks_master.validation.ts` を作成:

```typescript
import { z } from 'zod';
import { ClassNameSchema, BattleFormatSchema } from './battles.validation';

export const NewDeckMasterSchema = z.object({
  className: ClassNameSchema,
  deckName: z.string().min(1).max(100),
  archetype: z.string().optional(),
  format: BattleFormatSchema,
  season: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type NewDeckMasterInput = z.infer<typeof NewDeckMasterSchema>;
```

#### 完了条件

- [x] `backend/src/db/schema/deck-master.ts` が作成されている（設計文書に従いファイル名変更）
- [x] `backend/src/db/schema/deck-master.validation.ts` が作成されている
- [x] TypeScriptコンパイルエラーがない
- [x] Biome Lintエラーがない

#### 検証手順

1. `pnpm run lint` でエラーがない
2. TypeScriptの型推論が正しく動作する

---

### TASK-0022-4: Drizzle ORM スキーマ定義 (my_decks テーブル)

- [x] **タスク完了** ✅ (2025-11-28完了)
- **推定工数**: 1時間
- **タスクタイプ**: TDD
- **要件**: docs/design/shadowverse-battle-log/storage-design-cloudflare.md
- **依存タスク**: TASK-0022-3
- **要件名**: statistics テーブルのスキーマ定義

#### 実装詳細

##### 1. statistics テーブルスキーマ作成

`backend/src/db/schema/statistics.ts` を作成:

```typescript
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const statistics = sqliteTable('statistics', {
  id: text('id').primaryKey(), // UUID v4
  userId: text('user_id').notNull(),
  myClass: text('my_class').notNull(),
  myDeck: text('my_deck').notNull(),
  opponentClass: text('opponent_class'),
  period: text('period').notNull(), // 'daily' | 'weekly' | 'monthly' | 'season'
  periodStart: text('period_start').notNull(), // ISO 8601 format
  periodEnd: text('period_end').notNull(), // ISO 8601 format
  totalGames: integer('total_games').notNull().default(0),
  wins: integer('wins').notNull().default(0),
  losses: integer('losses').notNull().default(0),
  draws: integer('draws').notNull().default(0),
  winRate: real('win_rate').notNull().default(0),
  avgTurn: real('avg_turn'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export type Statistic = typeof statistics.$inferSelect;
export type NewStatistic = typeof statistics.$inferInsert;
```

##### 2. statistics テーブルのバリデーションスキーマ

`backend/src/db/schema/statistics.validation.ts` を作成:

```typescript
import { z } from 'zod';
import { ClassNameSchema } from './battles.validation';

export const PeriodSchema = z.enum(['daily', 'weekly', 'monthly', 'season']);

export const NewStatisticSchema = z.object({
  userId: z.string().min(1),
  myClass: ClassNameSchema,
  myDeck: z.string().min(1),
  opponentClass: ClassNameSchema.optional(),
  period: PeriodSchema,
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  totalGames: z.number().int().nonnegative().default(0),
  wins: z.number().int().nonnegative().default(0),
  losses: z.number().int().nonnegative().default(0),
  draws: z.number().int().nonnegative().default(0),
  winRate: z.number().nonnegative().max(1).default(0),
  avgTurn: z.number().positive().optional(),
});

export type NewStatisticInput = z.infer<typeof NewStatisticSchema>;
```

#### 完了条件

- [x] `backend/src/db/schema/my-decks.ts` が作成されている（設計文書に従いstatisticsからmy_decksに変更）
- [x] `backend/src/db/schema/my-decks.validation.ts` が作成されている
- [x] `backend/src/db/schema/index.ts` が作成されている（全スキーマのエクスポート）
- [x] TypeScriptコンパイルエラーがない
- [x] Biome Lintエラーがない

#### 検証手順

1. `pnpm run lint` でエラーがない
2. TypeScriptの型推論が正しく動作する

---

## 完了確認

Phase 1 Part 1b の全タスクが完了したことを確認するのだ:

- [x] TASK-0022-1: D1データベース作成 ✅ (2025-11-28完了)
- [x] TASK-0022-2: Drizzle ORM スキーマ定義 (battle_logs テーブル) ✅ (2025-11-28完了)
- [x] TASK-0022-3: Drizzle ORM スキーマ定義 (deck_master テーブル) ✅ (2025-11-28完了)
- [x] TASK-0022-4: Drizzle ORM スキーマ定義 (my_decks テーブル) ✅ (2025-11-28完了)

## 次のステップ

Phase 1 Part 2 に進むのだ: `cloudflare-migration-phase1-part2.md`

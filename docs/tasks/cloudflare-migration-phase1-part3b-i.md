# Phase 1 Part 3b-i: データマイグレーション準備 (Cloudflareマイグレーション)

## パート概要

- **期間**: Day 4 (1営業日)
- **総工数**: 3時間
- **目標**: 既存JSONデータのD1マイグレーション準備
- **対象タスク**: TASK-0025-1 ~ TASK-0025-3 (3タスク)

---

## タスク一覧

### TASK-0025-1: 既存JSONデータの分析とスキーママッピング

- [ ] **タスク未完了**
- **推定工数**: 1時間
- **タスクタイプ**: DIRECT
- **要件**: docs/design/shadowverse-battle-log/storage-design-cloudflare.md
- **依存タスク**: TASK-0024-6
- **要件名**: 既存JSONデータ構造の分析とD1スキーマへのマッピング定義

#### 実装詳細

##### 1. 既存JSONデータ構造の確認

```bash
cd /home/syagu/work/shadowverse_log

# 既存のJSONデータを確認
ls -la data/

# JSONファイルの構造を確認
cat data/battle-logs.json | head -n 50
cat data/deck-master.json | head -n 50
```

##### 2. マッピング定義ファイル作成

`backend/src/migration/schema-mapping.ts` を作成:

```typescript
// 既存JSONスキーマ定義
export interface LegacyBattleLog {
  id: string;
  date: string; // "YYYY-MM-DD" 形式
  battleType: string;
  rank?: string;
  group?: string;
  myDeckId: string;
  turn?: number;
  result: 'win' | 'lose' | 'draw';
  opponentDeckId: string;
}

export interface LegacyDeckMaster {
  id: string;
  className: string;
  deckName: string;
  sortOrder: number;
}

// スキーママッピング関数
export function mapLegacyBattleToNew(legacy: LegacyBattleLog, userId: string): NewBattle {
  return {
    userId,
    battleDate: `${legacy.date}T00:00:00Z`, // ISO 8601形式に変換
    myClass: extractClassFromDeckId(legacy.myDeckId),
    myDeck: legacy.myDeckId,
    opponentClass: extractClassFromDeckId(legacy.opponentDeckId),
    opponentDeck: legacy.opponentDeckId,
    result: legacy.result,
    turn: legacy.turn,
    format: legacy.battleType === 'rotation' ? 'rotation' : 'unlimited',
    notes: legacy.rank ? `Rank: ${legacy.rank}, Group: ${legacy.group}` : undefined,
  };
}

export function mapLegacyDeckMasterToNew(legacy: LegacyDeckMaster): NewDeckMaster {
  return {
    className: legacy.className,
    deckName: legacy.deckName,
    format: 'rotation', // デフォルトはrotation
    isActive: true,
  };
}

function extractClassFromDeckId(deckId: string): string {
  // deckId から className を抽出（例: "elf-aggro-1" → "Elf"）
  const classMap: Record<string, string> = {
    elf: 'Elf',
    royal: 'Royal',
    witch: 'Witch',
    dragon: 'Dragon',
    necromancer: 'Necromancer',
    vampire: 'Vampire',
    bishop: 'Bishop',
    nemesis: 'Nemesis',
  };

  const classKey = deckId.split('-')[0].toLowerCase();
  return classMap[classKey] || 'Unknown';
}
```

#### 完了条件

- [ ] 既存JSONデータの構造が分析されている
- [ ] `backend/src/migration/schema-mapping.ts` が作成されている
- [ ] マッピング関数が実装されている

#### 検証手順

1. `cat backend/src/migration/schema-mapping.ts` で内容を確認
2. TypeScriptコンパイルエラーがない

---

### TASK-0025-2: マイグレーションスクリプトの基本実装

- [ ] **タスク未完了**
- **推定工数**: 1時間
- **タスクタイプ**: TDD
- **要件**: docs/design/shadowverse-battle-log/storage-design-cloudflare.md
- **依存タスク**: TASK-0025-1
- **要件名**: JSONからD1へのマイグレーションスクリプト基本実装

#### 実装詳細

##### 1. マイグレーションスクリプト実装

`backend/src/migration/migrate-json-to-d1.ts` を作成:

```typescript
import type { D1Database, R2Bucket } from '@cloudflare/workers-types';
import { createDatabaseContext } from '../db';
import {
  type LegacyBattleLog,
  type LegacyDeckMaster,
  mapLegacyBattleToNew,
  mapLegacyDeckMasterToNew,
} from './schema-mapping';

export interface MigrationEnv {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
}

export interface MigrationResult {
  decksMaster: { imported: number; skipped: number; errors: string[] };
  battles: { imported: number; skipped: number; errors: string[] };
  totalTime: number;
}

export async function migrateJsonToD1(
  env: MigrationEnv,
  userId: string = 'default-user',
  dryRun: boolean = false
): Promise<MigrationResult> {
  const startTime = Date.now();
  const ctx = createDatabaseContext(env.DB);

  const result: MigrationResult = {
    decksMaster: { imported: 0, skipped: 0, errors: [] },
    battles: { imported: 0, skipped: 0, errors: [] },
    totalTime: 0,
  };

  try {
    // 1. デッキマスターのマイグレーション
    console.log('Migrating deck_master...');
    const deckMasterData = await loadLegacyDeckMaster(env.R2_BUCKET);

    for (const legacyDeck of deckMasterData) {
      try {
        const newDeck = mapLegacyDeckMasterToNew(legacyDeck);

        if (!dryRun) {
          await ctx.repositories.decksMaster.create(newDeck);
        }

        result.decksMaster.imported++;
        console.log(`Imported deck_master: ${legacyDeck.id}`);
      } catch (error) {
        result.decksMaster.skipped++;
        result.decksMaster.errors.push(`${legacyDeck.id}: ${String(error)}`);
        console.error(`Failed to import deck_master ${legacyDeck.id}:`, error);
      }
    }

    // 2. 対戦履歴のマイグレーション
    console.log('Migrating battles...');
    const battlesData = await loadLegacyBattles(env.R2_BUCKET);

    for (const legacyBattle of battlesData) {
      try {
        const newBattle = mapLegacyBattleToNew(legacyBattle, userId);

        if (!dryRun) {
          await ctx.repositories.battles.create(newBattle);
        }

        result.battles.imported++;
        console.log(`Imported battle: ${legacyBattle.id}`);
      } catch (error) {
        result.battles.skipped++;
        result.battles.errors.push(`${legacyBattle.id}: ${String(error)}`);
        console.error(`Failed to import battle ${legacyBattle.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }

  result.totalTime = Date.now() - startTime;
  return result;
}

async function loadLegacyDeckMaster(bucket: R2Bucket): Promise<LegacyDeckMaster[]> {
  const object = await bucket.get('legacy/deck-master.json');
  if (!object) throw new Error('deck-master.json not found in R2');

  const text = await object.text();
  return JSON.parse(text);
}

async function loadLegacyBattles(bucket: R2Bucket): Promise<LegacyBattleLog[]> {
  const object = await bucket.get('legacy/battle-logs.json');
  if (!object) throw new Error('battle-logs.json not found in R2');

  const text = await object.text();
  return JSON.parse(text);
}
```

#### 完了条件

- [ ] `backend/src/migration/migrate-json-to-d1.ts` が作成されている
- [ ] マイグレーション基本ロジックが実装されている
- [ ] エラーハンドリングが実装されている

#### 検証手順

1. TypeScriptコンパイルエラーがない

---

### TASK-0025-3: マイグレーションスクリプトのテスト実装

- [ ] **タスク未完了**
- **推定工数**: 1時間
- **タスクタイプ**: TDD
- **要件**: docs/design/shadowverse-battle-log/storage-design-cloudflare.md
- **依存タスク**: TASK-0025-2
- **要件名**: マイグレーションスクリプトの単体テスト

#### 実装詳細

##### 1. マイグレーションテスト作成

`backend/tests/migration/migrate-json-to-d1.test.ts` を作成:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { migrateJsonToD1 } from '../../src/migration/migrate-json-to-d1';
import type { MigrationEnv } from '../../src/migration/migrate-json-to-d1';

describe('migrateJsonToD1', () => {
  it('should migrate deck_master data', async () => {
    const mockEnv: MigrationEnv = {
      DB: {} as any,
      R2_BUCKET: {
        get: vi.fn().mockImplementation((key: string) => {
          if (key === 'legacy/deck-master.json') {
            return Promise.resolve({
              text: () =>
                Promise.resolve(
                  JSON.stringify([
                    {
                      id: 'deck-1',
                      className: 'Elf',
                      deckName: 'Aggro Elf',
                      sortOrder: 1,
                    },
                  ])
                ),
            });
          }
          if (key === 'legacy/battle-logs.json') {
            return Promise.resolve({
              text: () => Promise.resolve(JSON.stringify([])),
            });
          }
          return null;
        }),
      } as any,
    };

    const result = await migrateJsonToD1(mockEnv, 'test-user', true);

    expect(result.decksMaster.imported).toBe(1);
    expect(result.decksMaster.errors).toHaveLength(0);
  });

  it('should handle migration errors gracefully', async () => {
    const mockEnv: MigrationEnv = {
      DB: {} as any,
      R2_BUCKET: {
        get: vi.fn().mockRejectedValue(new Error('R2 access failed')),
      } as any,
    };

    await expect(migrateJsonToD1(mockEnv, 'test-user', true)).rejects.toThrow('R2 access failed');
  });
});
```

#### 完了条件

- [ ] `backend/tests/migration/migrate-json-to-d1.test.ts` が作成されている
- [ ] 正常系・異常系のテストが実装されている
- [ ] テストが成功する

#### 検証手順

1. `pnpm test` でテストが成功する

---

## 完了確認

Phase 1 Part 3b-i の全タスクが完了したことを確認するのだ:

- [ ] TASK-0025-1: 既存JSONデータの分析とスキーママッピング
- [ ] TASK-0025-2: マイグレーションスクリプトの基本実装
- [ ] TASK-0025-3: マイグレーションスクリプトのテスト実装

## 次のステップ

Phase 1 Part 3b-ii に進むのだ: `cloudflare-migration-phase1-part3b-ii.md`

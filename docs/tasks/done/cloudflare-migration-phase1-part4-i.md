# Phase 1 Part 4-i: データマイグレーション完了 (Cloudflareマイグレーション)

## パート概要

- **期間**: Day 4 (1営業日)
- **総工数**: 3時間
- **目標**: データマイグレーション本番実行とロールバック機能
- **対象タスク**: TASK-0025-7 ~ TASK-0026-1 (3タスク)

---

## タスク一覧

### TASK-0025-7: マイグレーション本番実行

- [x] **タスク完了**
- **推定工数**: 1時間
- **タスクタイプ**: DIRECT
- **要件**: docs/design/shadowverse-battle-log/storage-design-cloudflare.md
- **依存タスク**: TASK-0025-6
- **要件名**: 既存JSONデータのD1への本番マイグレーション実行

#### 実装詳細

##### 1. マイグレーション本番実行

```bash
cd backend

# 本番マイグレーション実行（dryRun: false）
curl -X POST http://localhost:8787/api/migration/migrate \
  -H "Content-Type: application/json" \
  -d '{"userId": "default-user", "dryRun": false}'

# レスポンス確認
# {
#   "success": true,
#   "data": {
#     "decksMaster": { "imported": 50, "skipped": 0, "errors": [] },
#     "battles": { "imported": 1000, "skipped": 0, "errors": [] },
#     "totalTime": 2345
#   },
#   "message": "Migration completed"
# }
```

##### 2. マイグレーション結果確認

```bash
# D1データベースのレコード数確認
wrangler d1 execute shadowverse-db --local --command="SELECT COUNT(*) FROM battles;"
wrangler d1 execute shadowverse-db --local --command="SELECT COUNT(*) FROM decks_master;"

# サンプルデータ確認
wrangler d1 execute shadowverse-db --local --command="SELECT * FROM battles LIMIT 5;"
```

##### 3. マイグレーションログ保存

```bash
# マイグレーション結果をログファイルに保存
echo "$(curl -X POST http://localhost:8787/api/migration/migrate \
  -H 'Content-Type: application/json' \
  -d '{\"userId\": \"default-user\", \"dryRun\": false}')" > migration-result.json

cat migration-result.json
```

#### 完了条件

- [x] マイグレーションが成功している
- [x] D1にデータが正しくインポートされている
- [x] マイグレーションログが保存されている

#### 検証手順

1. `wrangler d1 execute shadowverse-db --local --command="SELECT COUNT(*) FROM battles;"` でレコード数が表示される
2. エラーが0件または許容範囲内

---

### TASK-0025-8: マイグレーションのロールバック機能実装

- [x] **タスク完了**
- **推定工数**: 1時間
- **タスクタイプ**: TDD
- **要件**: docs/design/shadowverse-battle-log/storage-design-cloudflare.md
- **依存タスク**: TASK-0025-7
- **要件名**: マイグレーション失敗時のロールバック機能

#### 実装詳細

##### 1. ロールバック関数実装

`backend/src/migration/rollback.ts` を作成:

```typescript
import type { D1Database } from '@cloudflare/workers-types';
import { createDatabaseContext } from '../db';

export interface RollbackResult {
  deletedBattles: number;
  deletedDecksMaster: number;
  success: boolean;
  error?: string;
}

export async function rollbackMigration(db: D1Database): Promise<RollbackResult> {
  const ctx = createDatabaseContext(db);

  try {
    // トランザクション的に全データを削除
    // 注意: D1はトランザクションをサポートしていないため、順番に削除

    // 1. battles テーブルをクリア
    const battlesResult = await db.prepare('DELETE FROM battles').run();
    const deletedBattles = battlesResult.meta.changes;

    // 2. decks_master テーブルをクリア
    const decksMasterResult = await db.prepare('DELETE FROM decks_master').run();
    const deletedDecksMaster = decksMasterResult.meta.changes;

    // 3. statistics テーブルもクリア
    await db.prepare('DELETE FROM statistics').run();

    console.log(`Rollback completed: ${deletedBattles} battles, ${deletedDecksMaster} decks deleted`);

    return {
      deletedBattles,
      deletedDecksMaster,
      success: true,
    };
  } catch (error) {
    console.error('Rollback failed:', error);
    return {
      deletedBattles: 0,
      deletedDecksMaster: 0,
      success: false,
      error: String(error),
    };
  }
}
```

##### 2. ロールバックAPIエンドポイント追加

`backend/src/routes/migration.ts` を更新:

```typescript
import { Hono } from 'hono';
import type { MigrationEnv } from '../migration/migrate-json-to-d1';
import { migrateJsonToD1 } from '../migration/migrate-json-to-d1';
import { rollbackMigration } from '../migration/rollback';

const migration = new Hono<{ Bindings: MigrationEnv }>();

migration.post('/migrate', async (c) => {
  // ... 既存のコード
});

migration.post('/rollback', async (c) => {
  try {
    const result = await rollbackMigration(c.env.DB);

    if (!result.success) {
      return c.json(
        {
          success: false,
          error: result.error,
        },
        500
      );
    }

    return c.json({
      success: true,
      data: result,
      message: 'Rollback completed',
    });
  } catch (error) {
    console.error('Rollback API error:', error);
    return c.json(
      {
        success: false,
        error: String(error),
      },
      500
    );
  }
});

migration.get('/status', async (c) => {
  // ... 既存のコード
});

export default migration;
```

#### 完了条件

- [x] `backend/src/migration/rollback.ts` が作成されている
- [x] ロールバックAPIエンドポイントが実装されている
- [x] TypeScriptコンパイルエラーがない

#### 検証手順

1. `curl -X POST http://localhost:8787/api/migration/rollback` でロールバックが実行できる
2. D1のデータが削除されている

---

### TASK-0026-1: ローカル開発環境の動作確認

- [x] **タスク完了**
- **推定工数**: 1時間
- **タスクタイプ**: DIRECT
- **要件**: docs/design/shadowverse-battle-log/architecture-cloudflare.md
- **依存タスク**: TASK-0025-8
- **要件名**: ローカル開発環境での全機能動作確認

#### 実装詳細

##### 1. Wrangler Dev サーバー起動確認

```bash
cd backend

# Wrangler Dev サーバー起動
pnpm run dev

# 出力例:
# ⎔ Starting local server...
# [wrangler:inf] Ready on http://localhost:8787
# ╭──────────────────────────────────────────────────────────╮
# │ [b] open a browser, [d] open Devtools, [l] turn off local mode, [c] clear console, [x] to exit │
# ╰──────────────────────────────────────────────────────────╯
```

##### 2. ヘルスチェック確認

```bash
# ルートエンドポイント確認
curl http://localhost:8787/

# 期待レスポンス: "Shadowverse Battle Log API - Cloudflare Workers"
```

##### 3. D1接続確認

```bash
# D1データベースに接続できるか確認
wrangler d1 execute shadowverse-db --local --command="SELECT 1;"

# 出力例:
# 🌀 Executing on local database shadowverse-db...
# ┌─────┐
# │ 1   │
# ├─────┤
# │ 1   │
# └─────┘
```

##### 4. R2接続確認

```bash
# R2バケットに接続できるか確認
wrangler r2 bucket list

# 出力例:
# ┌──────────────────────┐
# │ name                 │
# ├──────────────────────┤
# │ shadowverse-data     │
# └──────────────────────┘
```

#### 完了条件

- [x] Wrangler Dev サーバーが起動する
- [x] ヘルスチェックが成功する（APIが正常に応答）
- [x] D1接続が確認できる
- [x] R2接続確認（※R2は使用しない方針に変更済み - wrangler.toml参照）

#### 検証手順

1. `pnpm run dev` でサーバーが起動する
2. `curl http://localhost:8787/` でレスポンスが返る
3. `wrangler d1 execute` でD1に接続できる
4. `wrangler r2 bucket list` でR2バケットが表示される

---

## 完了確認

Phase 1 Part 4-i の全タスクが完了したことを確認するのだ:

- [ ] TASK-0025-7: マイグレーション本番実行
- [ ] TASK-0025-8: マイグレーションのロールバック機能実装
- [ ] TASK-0026-1: ローカル開発環境の動作確認

## 次のステップ

Phase 1 Part 4-ii に進むのだ: `cloudflare-migration-phase1-part4-ii.md`

# Phase 1 Part 3b-ii: データマイグレーション実行 (Cloudflareマイグレーション)

## パート概要

- **期間**: Day 4 (1営業日)
- **総工数**: 3時間
- **目標**: 既存JSONデータのD1マイグレーション実行
- **対象タスク**: TASK-0025-4 ~ TASK-0025-6 (3タスク)

---

## タスク一覧

### TASK-0025-4: 既存JSONデータのR2アップロード

- [ ] **タスク未完了**
- **推定工数**: 1時間
- **タスクタイプ**: DIRECT
- **要件**: docs/design/shadowverse-battle-log/storage-design-cloudflare.md
- **依存タスク**: TASK-0025-3
- **要件名**: 既存JSONデータをR2にアップロード

#### 実装詳細

##### 1. 既存JSONデータの確認

```bash
cd /home/syagu/work/shadowverse_log

# 既存のJSONファイルを確認
ls -la data/

# ファイルサイズ確認
du -sh data/*.json
```

##### 2. R2へのアップロードスクリプト作成

`backend/scripts/upload-legacy-data.sh` を作成:

```bash
#!/bin/bash

# 既存JSONデータをR2にアップロード

cd /home/syagu/work/shadowverse_log

# R2バケットにlegacyディレクトリを作成してアップロード
wrangler r2 object put shadowverse-data/legacy/deck-master.json --file=data/deck-master.json
wrangler r2 object put shadowverse-data/legacy/battle-logs.json --file=data/battle-logs.json

echo "Legacy data uploaded to R2"
```

##### 3. アップロード実行

```bash
cd backend

# スクリプトに実行権限付与
chmod +x scripts/upload-legacy-data.sh

# アップロード実行
./scripts/upload-legacy-data.sh
```

##### 4. アップロード確認

```bash
# R2にファイルがアップロードされているか確認
wrangler r2 object list shadowverse-data --prefix="legacy/"
```

#### 完了条件

- [ ] `backend/scripts/upload-legacy-data.sh` が作成されている
- [ ] 既存JSONデータがR2にアップロードされている
- [ ] アップロードされたファイルが確認できる

#### 検証手順

1. `wrangler r2 object list shadowverse-data --prefix="legacy/"` でファイルが表示される

---

### TASK-0025-5: マイグレーションAPIエンドポイント実装

- [ ] **タスク未完了**
- **推定工数**: 1時間
- **タスクタイプ**: TDD
- **要件**: docs/design/shadowverse-battle-log/storage-design-cloudflare.md
- **依存タスク**: TASK-0025-4
- **要件名**: マイグレーション実行用APIエンドポイント

#### 実装詳細

##### 1. マイグレーションAPIエンドポイント実装

`backend/src/routes/migration.ts` を作成:

```typescript
import { Hono } from 'hono';
import type { MigrationEnv } from '../migration/migrate-json-to-d1';
import { migrateJsonToD1 } from '../migration/migrate-json-to-d1';

const migration = new Hono<{ Bindings: MigrationEnv }>();

migration.post('/migrate', async (c) => {
  try {
    const { userId, dryRun } = await c.req.json();

    const result = await migrateJsonToD1(c.env, userId || 'default-user', dryRun || false);

    return c.json({
      success: true,
      data: result,
      message: dryRun ? 'Dry run completed' : 'Migration completed',
    });
  } catch (error) {
    console.error('Migration API error:', error);
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
  // マイグレーション状態確認（簡易実装）
  return c.json({
    success: true,
    data: {
      status: 'ready',
      message: 'Migration endpoint is ready',
    },
  });
});

export default migration;
```

##### 2. メインアプリにマイグレーションルートを追加

`backend/src/index.ts` を更新:

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import migrationRoutes from './routes/migration';
import { handleBackup } from './workers/backup';

export interface Env {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());
app.use('*', logger());

app.get('/', (c) => c.text('Shadowverse Battle Log API - Cloudflare Workers'));

// マイグレーションルート
app.route('/api/migration', migrationRoutes);

export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    console.log('Running scheduled backup...');
    await handleBackup(env);
  },
};
```

#### 完了条件

- [ ] `backend/src/routes/migration.ts` が作成されている
- [ ] `backend/src/index.ts` にルートが追加されている
- [ ] TypeScriptコンパイルエラーがない

#### 検証手順

1. TypeScriptコンパイルが成功する

---

### TASK-0025-6: マイグレーションのドライラン実行と検証

- [ ] **タスク未完了**
- **推定工数**: 1時間
- **タスクタイプ**: DIRECT
- **要件**: docs/design/shadowverse-battle-log/storage-design-cloudflare.md
- **依存タスク**: TASK-0025-5
- **要件名**: マイグレーションのドライラン実行とデータ検証

#### 実装詳細

##### 1. ローカル開発サーバー起動

```bash
cd backend

# Wrangler Dev サーバー起動
pnpm run dev

# ローカルで http://localhost:8787 にアクセス可能
```

##### 2. マイグレーションドライラン実行

```bash
# ドライラン実行（データは実際に書き込まれない）
curl -X POST http://localhost:8787/api/migration/migrate \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user", "dryRun": true}'

# レスポンス例:
# {
#   "success": true,
#   "data": {
#     "decksMaster": { "imported": 50, "skipped": 0, "errors": [] },
#     "battles": { "imported": 1000, "skipped": 5, "errors": ["..."] },
#     "totalTime": 1234
#   },
#   "message": "Dry run completed"
# }
```

##### 3. エラー確認と修正

```bash
# エラーがある場合はログを確認
tail -f .wrangler/state/v3/d1/miniflare-D1DatabaseObject/xxxxxxxx.sqlite

# エラー内容に応じてマッピング関数を修正
```

#### 完了条件

- [ ] ローカル開発サーバーが起動する
- [ ] マイグレーションドライランが成功する
- [ ] エラーが0件またはハンドリング可能なレベル

#### 検証手順

1. `pnpm run dev` でサーバーが起動する
2. `curl` でマイグレーションAPIが実行できる
3. レスポンスにエラーが少ない（または0件）

---

## 完了確認

Phase 1 Part 3b-ii の全タスクが完了したことを確認するのだ:

- [ ] TASK-0025-4: 既存JSONデータのR2アップロード
- [ ] TASK-0025-5: マイグレーションAPIエンドポイント実装
- [ ] TASK-0025-6: マイグレーションのドライラン実行と検証

## 次のステップ

Phase 1 Part 4 に進むのだ: `cloudflare-migration-phase1-part4.md`

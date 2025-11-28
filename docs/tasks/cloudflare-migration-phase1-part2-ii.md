# Phase 1 Part 2-ii: R2ストレージとバックアップ実装 (Cloudflareマイグレーション)

## パート概要

- **期間**: Day 3 (1営業日)
- **総工数**: 5時間
- **目標**: R2ストレージとバックアップ機能の実装
- **対象タスク**: TASK-0023-2 ~ TASK-0023-6 (5タスク)

---

## タスク一覧

### TASK-0023-2: R2ディレクトリ構造設計

- [x] **タスクスキップ** (R2は使用しない方針のため)
- **推定工数**: 1時間
- **タスクタイプ**: DIRECT
- **要件**: docs/design/shadowverse-battle-log/storage-design-cloudflare.md
- **依存タスク**: TASK-0023-1
- **要件名**: R2ストレージのディレクトリ構造設計

#### 実装詳細

##### 1. R2ディレクトリ構造定義

R2バケット内のディレクトリ構造を以下のように定義:

```
shadowverse-data/
├── backups/                      # データベースバックアップ
│   ├── daily/                    # 日次バックアップ
│   │   └── shadowverse-db-2025-11-26.db
│   ├── weekly/                   # 週次バックアップ
│   └── monthly/                  # 月次バックアップ
├── exports/                      # エクスポートデータ
│   ├── csv/                      # CSV形式
│   │   └── battles-2025-11-26.csv
│   └── json/                     # JSON形式
│       └── battles-2025-11-26.json
└── imports/                      # インポート用一時ファイル
    └── upload-{timestamp}.json
```

##### 2. ディレクトリ構造定義ファイル作成

`backend/src/utils/r2-structure.ts` を作成:

```typescript
export const R2_STRUCTURE = {
  backups: {
    daily: 'backups/daily',
    weekly: 'backups/weekly',
    monthly: 'backups/monthly',
  },
  exports: {
    csv: 'exports/csv',
    json: 'exports/json',
  },
  imports: 'imports',
} as const;

export const getBackupPath = (type: 'daily' | 'weekly' | 'monthly', date: Date): string => {
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  return `${R2_STRUCTURE.backups[type]}/shadowverse-db-${dateStr}.db`;
};

export const getExportPath = (format: 'csv' | 'json', date: Date): string => {
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  return `${R2_STRUCTURE.exports[format]}/battles-${dateStr}.${format}`;
};

export const getImportPath = (timestamp: number): string => {
  return `${R2_STRUCTURE.imports}/upload-${timestamp}.json`;
};
```

#### 完了条件

- [ ] R2ディレクトリ構造が定義されている
- [ ] `backend/src/utils/r2-structure.ts` が作成されている
- [ ] パスヘルパー関数が実装されている

#### 検証手順

1. `cat backend/src/utils/r2-structure.ts` で内容を確認
2. TypeScriptコンパイルエラーがない

---

### TASK-0023-3: R2アクセス用ヘルパー関数実装

- [x] **タスクスキップ** (R2は使用しない方針のため)
- **推定工数**: 1時間
- **タスクタイプ**: TDD
- **要件**: docs/design/shadowverse-battle-log/storage-design-cloudflare.md
- **依存タスク**: TASK-0023-2
- **要件名**: R2へのファイルアップロード・ダウンロードヘルパー関数

#### 実装詳細

##### 1. R2ヘルパー関数実装

`backend/src/utils/r2-helpers.ts` を作成:

```typescript
import type { R2Bucket } from '@cloudflare/workers-types';

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface DownloadResult {
  body: ReadableStream | null;
  contentType: string | null;
  size: number;
}

export class R2Helper {
  constructor(private bucket: R2Bucket) {}

  async upload(key: string, data: string | ArrayBuffer, options?: UploadOptions): Promise<void> {
    await this.bucket.put(key, data, {
      httpMetadata: options?.contentType ? { contentType: options.contentType } : undefined,
      customMetadata: options?.metadata,
    });
  }

  async download(key: string): Promise<DownloadResult | null> {
    const object = await this.bucket.get(key);
    if (!object) return null;

    return {
      body: object.body,
      contentType: object.httpMetadata?.contentType || null,
      size: object.size,
    };
  }

  async delete(key: string): Promise<void> {
    await this.bucket.delete(key);
  }

  async list(prefix: string): Promise<string[]> {
    const list = await this.bucket.list({ prefix });
    return list.objects.map((obj) => obj.key);
  }

  async exists(key: string): Promise<boolean> {
    const object = await this.bucket.head(key);
    return object !== null;
  }
}
```

##### 2. R2ヘルパーのテスト作成

`backend/tests/utils/r2-helpers.test.ts` を作成:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { R2Helper } from '../../src/utils/r2-helpers';

describe('R2Helper', () => {
  it('should upload file to R2', async () => {
    const mockBucket = {
      put: vi.fn(),
    };

    const helper = new R2Helper(mockBucket as any);
    await helper.upload('test.txt', 'Hello World', { contentType: 'text/plain' });

    expect(mockBucket.put).toHaveBeenCalledWith('test.txt', 'Hello World', {
      httpMetadata: { contentType: 'text/plain' },
      customMetadata: undefined,
    });
  });

  it('should download file from R2', async () => {
    const mockBucket = {
      get: vi.fn().mockResolvedValue({
        body: new ReadableStream(),
        httpMetadata: { contentType: 'text/plain' },
        size: 11,
      }),
    };

    const helper = new R2Helper(mockBucket as any);
    const result = await helper.download('test.txt');

    expect(result).not.toBeNull();
    expect(result?.contentType).toBe('text/plain');
    expect(result?.size).toBe(11);
  });
});
```

#### 完了条件

- [ ] `backend/src/utils/r2-helpers.ts` が作成されている
- [ ] `backend/tests/utils/r2-helpers.test.ts` が作成されている
- [ ] テストが成功する

#### 検証手順

1. `pnpm test` でテストが成功する

---

### TASK-0023-4: R2バックアップ用Workers実装

- [x] **タスクスキップ** (R2は使用しない方針のため)
- **推定工数**: 1時間
- **タスクタイプ**: TDD
- **要件**: docs/design/shadowverse-battle-log/storage-design-cloudflare.md
- **依存タスク**: TASK-0023-3
- **要件名**: 日次バックアップ用Cloudflare Workers実装

#### 実装詳細

##### 1. バックアップWorker実装

`backend/src/workers/backup.ts` を作成:

```typescript
import type { D1Database, R2Bucket } from '@cloudflare/workers-types';
import { R2Helper } from '../utils/r2-helpers';
import { getBackupPath } from '../utils/r2-structure';

export interface BackupEnv {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
}

export async function handleBackup(env: BackupEnv): Promise<Response> {
  try {
    const now = new Date();
    const r2Helper = new R2Helper(env.R2_BUCKET);

    // D1データベースのバックアップ（SQLiteダンプ）
    const backupData = await createDatabaseBackup(env.DB);

    // R2にアップロード
    const backupKey = getBackupPath('daily', now);
    await r2Helper.upload(backupKey, backupData, {
      contentType: 'application/octet-stream',
      metadata: {
        timestamp: now.toISOString(),
        type: 'daily',
      },
    });

    return new Response(JSON.stringify({ success: true, backupKey }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Backup failed:', error);
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function createDatabaseBackup(db: D1Database): Promise<ArrayBuffer> {
  // D1のバックアップ機能を使用（簡易実装）
  const tables = ['battles', 'decks_master', 'statistics'];
  const dumps: string[] = [];

  for (const table of tables) {
    const result = await db.prepare(`SELECT * FROM ${table}`).all();
    dumps.push(JSON.stringify({ table, data: result.results }));
  }

  return new TextEncoder().encode(dumps.join('\n')).buffer;
}
```

#### 完了条件

- [ ] `backend/src/workers/backup.ts` が作成されている
- [ ] バックアップ機能が実装されている

#### 検証手順

1. TypeScriptコンパイルエラーがない

---

### TASK-0023-5: Cron Trigger設定でバックアップ自動化

- [x] **タスクスキップ** (R2は使用しない方針のため)
- **推定工数**: 1時間
- **タスクタイプ**: DIRECT
- **要件**: docs/design/shadowverse-battle-log/storage-design-cloudflare.md
- **依存タスク**: TASK-0023-4
- **要件名**: Cloudflare Cron Triggerで日次バックアップを自動実行

#### 実装詳細

##### 1. Cron Trigger Handler 実装

`backend/src/index.ts` に Cron Handler を追加:

```typescript
import { handleBackup } from './workers/backup';

export interface Env {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // API ハンドラー（後で実装）
    return new Response('Hello from Cloudflare Workers!');
  },

  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    // Cron Triggerで実行される処理
    console.log('Running scheduled backup...');
    await handleBackup(env);
  },
};
```

##### 2. wrangler.toml の Cron Trigger 確認

`backend/wrangler.toml` の Cron Trigger 設定を確認:

```toml
[triggers]
crons = ["0 0 * * *"]  # 毎日0時に実行
```

##### 3. Cron Trigger テスト（ローカル）

```bash
cd backend

# Cron Triggerをローカルでテスト
wrangler dev --test-scheduled
```

#### 完了条件

- [ ] `backend/src/index.ts` に Cron Handler が実装されている
- [ ] `wrangler.toml` に Cron Trigger が設定されている
- [ ] ローカルでテストできる

#### 検証手順

1. `wrangler dev --test-scheduled` でCronが実行される

---

### TASK-0023-6: R2バックアップの動作確認

- [x] **タスクスキップ** (R2は使用しない方針のため)
- **推定工数**: 1時間
- **タスクタイプ**: DIRECT
- **要件**: docs/design/shadowverse-battle-log/storage-design-cloudflare.md
- **依存タスク**: TASK-0023-5
- **要件名**: R2バックアップ機能の動作確認

#### 実装詳細

##### 1. バックアップ手動実行

```bash
cd backend

# バックアップを手動実行（テスト用エンドポイントを作成）
curl http://localhost:8787/api/backup -X POST
```

##### 2. R2にバックアップファイルが保存されているか確認

```bash
# R2バケットのファイル一覧を確認
wrangler r2 object list shadowverse-data --prefix="backups/daily/"

# 出力例:
# ┌──────────────────────────────────────────┬──────┬──────────────────────┐
# │ key                                       │ size │ uploaded             │
# ├──────────────────────────────────────────┼──────┼──────────────────────┤
# │ backups/daily/shadowverse-db-2025-11-26.db│ 1024 │ 2025-11-26T00:00:00Z │
# └──────────────────────────────────────────┴──────┴──────────────────────┘
```

##### 3. バックアップファイルのダウンロードと確認

```bash
# バックアップファイルをダウンロード
wrangler r2 object get shadowverse-data backups/daily/shadowverse-db-2025-11-26.db --file=backup-test.db

# ファイルサイズ確認
ls -lh backup-test.db
```

#### 完了条件

- [ ] バックアップが手動実行できる
- [ ] R2にバックアップファイルが保存されている
- [ ] バックアップファイルがダウンロードできる

#### 検証手順

1. `wrangler r2 object list shadowverse-data --prefix="backups/daily/"` でファイルが表示される
2. ダウンロードしたファイルのサイズが0より大きい

---

## 完了確認

Phase 1 Part 2-ii の全タスクが完了したことを確認するのだ:

- [x] TASK-0023-2: R2ディレクトリ構造設計 (スキップ - R2は使用しない方針)
- [x] TASK-0023-3: R2アクセス用ヘルパー関数実装 (スキップ - R2は使用しない方針)
- [x] TASK-0023-4: R2バックアップ用Workers実装 (スキップ - R2は使用しない方針)
- [x] TASK-0023-5: Cron Trigger設定でバックアップ自動化 (スキップ - R2は使用しない方針)
- [x] TASK-0023-6: R2バックアップの動作確認 (スキップ - R2は使用しない方針)

## 次のステップ

Phase 1 Part 3a に進むのだ: `cloudflare-migration-phase1-part3a.md`

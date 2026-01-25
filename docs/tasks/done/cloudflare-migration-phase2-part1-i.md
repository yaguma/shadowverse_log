# Phase 2 Part 1-i: Hono + Workers セットアップ

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

### TASK-0027: Hono + Workers セットアップ

- **推定工数**: 6時間
- **タスクタイプ**: DIRECT
- **要件**: architecture-cloudflare.md (バックエンド構成) 🔵
- **依存タスク**:
  - TASK-0021 (D1データベース構築) ✅
  - TASK-0022 (Drizzle ORM セットアップ) ✅
  - TASK-0023 (R2バケット作成) ✅
- **要件リンク**: [docs/design/shadowverse-battle-log/architecture-cloudflare.md](/home/syagu/work/shadowverse_log/docs/design/shadowverse-battle-log/architecture-cloudflare.md)
- **関連API**: [docs/design/shadowverse-battle-log/api-endpoints-cloudflare.md](/home/syagu/work/shadowverse_log/docs/design/shadowverse-battle-log/api-endpoints-cloudflare.md)

#### 実装詳細

##### 1. プロジェクトセットアップ

**ディレクトリ構成**:

```
backend/
├── src/
│   ├── index.ts              # エントリーポイント
│   ├── routes/               # API ルート定義
│   ├── services/             # ビジネスロジック
│   ├── db/                   # データベース
│   │   ├── schema.ts         # Drizzle スキーマ定義
│   │   └── migrations/       # マイグレーションファイル
│   ├── types/                # TypeScript型定義
│   ├── middleware/           # ミドルウェア
│   └── utils/                # ユーティリティ
├── wrangler.toml             # Cloudflare Workers設定
├── package.json
├── pnpm-lock.yaml
├── biome.json
└── tsconfig.json
```

##### 2. 依存関係インストール

`package.json`:

```json
{
  "name": "shadowverse-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "build": "tsc",
    "lint": "biome check .",
    "format": "biome check --write .",
    "test": "vitest"
  },
  "dependencies": {
    "hono": "^4.0.0",
    "zod": "^3.22.0",
    "drizzle-orm": "^0.36.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20240000.0",
    "@biomejs/biome": "^1.9.4",
    "wrangler": "^3.0.0",
    "typescript": "^5.7.0",
    "vitest": "^2.0.0"
  }
}
```

インストールコマンド:

```bash
cd backend
pnpm install
```

##### 3. Honoフレームワーク導入

`src/index.ts`:

```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import type { D1Database } from '@cloudflare/workers-types'

type Bindings = {
  DB: D1Database
  R2: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>()

// ミドルウェア設定
app.use('*', logger())
app.use(
  '/api/*',
  cors({
    origin: ['http://localhost:5173', 'https://your-app.pages.dev'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
)

// ヘルスチェック
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

export default app
```

##### 4. ルーティング設定

`src/routes/index.ts`:

```typescript
import { Hono } from 'hono'
import battleLogs from './battle-logs'
import deckMaster from './deck-master'
import statistics from './statistics'
import importData from './import'

const routes = new Hono()

routes.route('/battle-logs', battleLogs)
routes.route('/deck-master', deckMaster)
routes.route('/statistics', statistics)
routes.route('/import', importData)

export default routes
```

`src/index.ts` に統合:

```typescript
import routes from './routes'

app.route('/api', routes)
```

##### 5. エラーハンドリングミドルウェア

`src/middleware/errorHandler.ts`:

```typescript
import type { Context, Next } from 'hono'
import { ZodError } from 'zod'

export const errorHandler = async (c: Context, next: Next) => {
  try {
    await next()
  } catch (error) {
    console.error('Error:', error)

    if (error instanceof ZodError) {
      return c.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '入力値が不正です',
            details: error.errors.reduce((acc, err) => {
              acc[err.path.join('.')] = err.message
              return acc
            }, {} as Record<string, string>),
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          },
        },
        400
      )
    }

    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'サーバーエラーが発生しました',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      },
      500
    )
  }
}
```

`src/index.ts` に適用:

```typescript
import { errorHandler } from './middleware/errorHandler'

app.use('*', errorHandler)
```

##### 6. wrangler.toml 設定

```toml
name = "shadowverse-backend"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[env.production]
vars = { ENVIRONMENT = "production" }

[[d1_databases]]
binding = "DB"
database_name = "shadowverse-db"
database_id = "your-database-id"

[[r2_buckets]]
binding = "R2"
bucket_name = "shadowverse-data"
```

##### 7. TypeScript設定

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "types": ["@cloudflare/workers-types"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

##### 8. Biome設定

`biome.json`:

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": {
        "noExplicitAny": "error"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  }
}
```

#### 完了条件

- [x] Honoフレームワークが正常に動作
- [x] CORSミドルウェアが設定済み
- [x] エラーハンドリングミドルウェアが動作
- [x] `/health` エンドポイントが正常動作
- [x] D1, R2バインディングが正常動作
- [x] `pnpm dev` でローカル開発サーバー起動
- [x] Biome lint/format が正常動作

#### テスト要件

##### 1. ローカル開発サーバー起動確認

```bash
pnpm dev
```

- Wrangler開発サーバーが起動すること
- `http://localhost:8787/health` でヘルスチェックが応答すること

##### 2. CORS動作確認

```bash
curl -X OPTIONS http://localhost:8787/api/battle-logs \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST"
```

- CORS ヘッダーが返却されること

##### 3. エラーハンドリング動作確認

```bash
curl -X POST http://localhost:8787/api/battle-logs \
  -H "Content-Type: application/json" \
  -d '{}'
```

- バリデーションエラーが返却されること

---

## 更新履歴

| バージョン | 日付 | 変更内容 |
|---|---|---|
| 1.0.0 | 2025-11-26 | Cloudflare版Phase 2 Part 1-i作成 |

---

**ドキュメント終了**

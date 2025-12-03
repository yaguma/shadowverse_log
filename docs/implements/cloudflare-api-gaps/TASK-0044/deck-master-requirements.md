# TASK-0044: deck-master ルート実装 - 要件定義書

## 概要

デッキマスターAPIエンドポイントを `/backend/src/routes/deck-master.ts` に実装する。

## 信頼性レベル

🔵 **青信号**: `/workers/src/routes/deck-master.ts` の仕様に基づく実装

## 機能要件

### FR-0044-01: デッキマスター一覧取得

| 項目 | 内容 |
|------|------|
| **メソッド** | GET |
| **エンドポイント** | `/api/deck-master` |
| **認証** | 不要（skipPathsに含まれる） |

#### リクエスト

- パラメータなし

#### レスポンス

**成功時 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "deckMasters": [
      {
        "id": "uuid",
        "className": "エルフ",
        "deckName": "妖精エルフ",
        "sortOrder": 1
      }
    ]
  },
  "meta": {
    "timestamp": "2025-12-03T00:00:00.000Z",
    "requestId": "uuid"
  }
}
```

**エラー時 (500 Internal Server Error)**:
```json
{
  "success": false,
  "error": {
    "code": "DATABASE_ERROR",
    "message": "デッキマスターの取得中にエラーが発生しました。"
  },
  "meta": {
    "timestamp": "2025-12-03T00:00:00.000Z",
    "requestId": "uuid"
  }
}
```

## 非機能要件

### NFR-0044-01: キャッシュヘッダー

- `Cache-Control: public, max-age=300` を設定（5分間キャッシュ）
- CDNおよびブラウザキャッシュで有効

### NFR-0044-02: ソート順序

- `sortOrder` 昇順でソートされた結果を返す

### NFR-0044-03: 型安全性

- TypeScript型エラーなし
- Biome lint通過

## 技術仕様

### 使用するリポジトリ

- `DeckMasterRepository.findAll()` メソッドを使用
- `createDb()` 関数でデータベース接続を作成

### 実装パターン

```typescript
import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';
import { createDb } from '../db';
import { DeckMasterRepository } from '../db/repositories/deck-master-repository';

type Bindings = {
  DB: D1Database;
};

const deckMaster = new Hono<{ Bindings: Bindings }>();

deckMaster.get('/', async (c) => {
  const db = createDb(c.env.DB);
  const repository = new DeckMasterRepository(db);
  const deckMasters = await repository.findAll();

  c.header('Cache-Control', 'public, max-age=300');

  return c.json({
    success: true,
    data: { deckMasters },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    },
  });
});

export default deckMaster;
```

## 受け入れ基準

- [ ] GET /api/deck-master が正常動作
- [ ] Cache-Controlヘッダーが設定される
- [ ] sortOrder昇順でソートされる
- [ ] TypeScript型エラーなし
- [ ] Biome lint通過

## 依存関係

### 既存リソース（使用可能）

| リソース | ファイル |
|----------|----------|
| DeckMasterRepository | `backend/src/db/repositories/deck-master-repository.ts` |
| deck_masterスキーマ | `backend/src/db/schema/deck-master.ts` |
| createDb関数 | `backend/src/db/index.ts` |

### 作成するリソース

| リソース | ファイル |
|----------|----------|
| deck-masterルート | `backend/src/routes/deck-master.ts` |

## 参考資料

- `/workers/src/routes/deck-master.ts` - 参考実装
- `/backend/src/routes/statistics.ts` - 既存ルートの実装パターン

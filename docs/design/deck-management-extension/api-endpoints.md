# デッキ管理機能拡張 APIエンドポイント設計

**作成日**: 2025-01-26
**関連要件定義**: [requirements.md](../../spec/deck-management-extension/requirements.md)
**ベースAPI設計**: [shadowverse-battle-log/api-endpoints-cloudflare.md](../shadowverse-battle-log/api-endpoints-cloudflare.md)

**【信頼性レベル凡例】**:
- 🔵 **青信号**: ユーザヒアリング・設計文書を参考にした確実な設計
- 🟡 **黄信号**: ユーザヒアリング・設計文書から妥当な推測による設計
- 🔴 **赤信号**: ユーザヒアリング・設計文書にない推測による設計

---

## 1. API概要

### 1.1 ベースURL 🔵

```
https://{worker-name}.{account}.workers.dev/api
```

### 1.2 共通レスポンス形式 🔵

```typescript
// 成功時
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-01-26T10:00:00.000Z"
  }
}

// エラー時
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": { ... }
  }
}
```

---

## 2. デッキ種別（DeckMaster）API 🔵

### 2.1 デッキ種別一覧取得 🔵

**既存エンドポイント拡張**

```
GET /api/deck-master
```

#### クエリパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| includeUsage | boolean | No | 使用履歴情報を含める（REQ-EXT-302対応） |

#### レスポンス（includeUsage=false または省略時）

```json
{
  "success": true,
  "data": [
    {
      "id": "dm-001",
      "className": "エルフ",
      "deckName": "アグロエルフ",
      "sortOrder": 1,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": null
    },
    {
      "id": "dm-002",
      "className": "ロイヤル",
      "deckName": "連携ロイヤル",
      "sortOrder": 2,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": null
    }
  ],
  "meta": {
    "timestamp": "2025-01-26T10:00:00.000Z"
  }
}
```

#### レスポンス（includeUsage=true）

```json
{
  "success": true,
  "data": [
    {
      "id": "dm-002",
      "className": "ロイヤル",
      "deckName": "連携ロイヤル",
      "sortOrder": 2,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": null,
      "lastUsedDate": "2025-01-25",
      "usageCount": 15
    },
    {
      "id": "dm-001",
      "className": "エルフ",
      "deckName": "アグロエルフ",
      "sortOrder": 1,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": null,
      "lastUsedDate": "2025-01-20",
      "usageCount": 8
    },
    {
      "id": "dm-003",
      "className": "ウィッチ",
      "deckName": "スペルウィッチ",
      "sortOrder": 3,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": null,
      "lastUsedDate": null,
      "usageCount": 0
    }
  ],
  "meta": {
    "timestamp": "2025-01-26T10:00:00.000Z"
  }
}
```

**ソート順（includeUsage=true時）**:
1. lastUsedDateがnullのものは末尾
2. lastUsedDateの降順（新しいものが先）
3. sortOrderの昇順

---

### 2.2 デッキ種別追加 🔵

**新規エンドポイント（REQ-EXT-001 ~ REQ-EXT-005対応）**

```
POST /api/deck-master
```

#### リクエストボディ

```json
{
  "className": "ウィッチ",
  "deckName": "スペルウィッチ"
}
```

| フィールド | 型 | 必須 | バリデーション |
|-----------|-----|------|---------------|
| className | string | Yes | CLASS_NAMES一覧に含まれること |
| deckName | string | Yes | 1文字以上100文字以下 |

#### 成功レスポンス

```json
{
  "success": true,
  "data": {
    "id": "dm-new-uuid",
    "className": "ウィッチ",
    "deckName": "スペルウィッチ",
    "sortOrder": 10,
    "createdAt": "2025-01-26T10:00:00.000Z",
    "updatedAt": null
  },
  "meta": {
    "timestamp": "2025-01-26T10:00:00.000Z"
  }
}
```

**ステータスコード**: 201 Created

#### エラーレスポンス（バリデーションエラー）

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力値が不正です",
    "details": [
      {
        "field": "deckName",
        "constraint": "required",
        "value": ""
      }
    ]
  }
}
```

**ステータスコード**: 400 Bad Request

---

### 2.3 デッキ種別更新 🔵

**新規エンドポイント（REQ-EXT-006 ~ REQ-EXT-007対応）**

```
PUT /api/deck-master/:id
```

#### パスパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| id | string | Yes | デッキ種別ID |

#### リクエストボディ

```json
{
  "deckName": "秘術ウィッチ"
}
```

| フィールド | 型 | 必須 | バリデーション |
|-----------|-----|------|---------------|
| deckName | string | Yes | 1文字以上100文字以下 |

**注意**: classNameは変更不可のためリクエストに含めない

#### 成功レスポンス

```json
{
  "success": true,
  "data": {
    "id": "dm-001",
    "className": "ウィッチ",
    "deckName": "秘術ウィッチ",
    "sortOrder": 3,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-26T10:00:00.000Z"
  },
  "meta": {
    "timestamp": "2025-01-26T10:00:00.000Z"
  }
}
```

**ステータスコード**: 200 OK

#### エラーレスポンス（Not Found）

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "指定されたデッキ種別が見つかりません",
    "details": {
      "id": "dm-not-exist"
    }
  }
}
```

**ステータスコード**: 404 Not Found

---

### 2.4 デッキ種別削除 🔵

**新規エンドポイント（REQ-EXT-008, REQ-EXT-401対応）**

```
DELETE /api/deck-master/:id
```

#### パスパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| id | string | Yes | デッキ種別ID |

#### 成功レスポンス

**ステータスコード**: 204 No Content（ボディなし）

#### エラーレスポンス（削除制約エラー）

```json
{
  "success": false,
  "error": {
    "code": "DELETE_CONSTRAINT_ERROR",
    "message": "このデッキ種別は対戦履歴で使用されているため削除できません",
    "details": {
      "entityType": "deckMaster",
      "entityId": "dm-001",
      "referencedBy": "battleLogs",
      "referenceCount": 15
    }
  }
}
```

**ステータスコード**: 409 Conflict

---

## 3. 使用デッキ（MyDeck）API 🔵

### 3.1 使用デッキ一覧取得 🔵

**既存エンドポイント（変更なし）**

```
GET /api/my-decks
```

#### レスポンス

```json
{
  "success": true,
  "data": [
    {
      "id": "md-001",
      "deckId": "dm-001",
      "deckCode": "abc123",
      "deckName": "マイアグロエルフ",
      "isActive": true,
      "userId": null,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": null
    }
  ],
  "meta": {
    "timestamp": "2025-01-26T10:00:00.000Z"
  }
}
```

---

### 3.2 使用デッキ追加 🔵

**新規エンドポイント（REQ-EXT-101 ~ REQ-EXT-107対応）**

```
POST /api/my-decks
```

#### リクエストボディ

```json
{
  "deckId": "dm-001",
  "deckName": "マイアグロエルフ",
  "deckCode": "abc123"
}
```

| フィールド | 型 | 必須 | バリデーション |
|-----------|-----|------|---------------|
| deckId | string | Yes | DeckMasterに存在するid |
| deckName | string | Yes | 1文字以上100文字以下 |
| deckCode | string | No | バリデーションなし（空白可） |

#### 成功レスポンス

```json
{
  "success": true,
  "data": {
    "id": "md-new-uuid",
    "deckId": "dm-001",
    "deckCode": "abc123",
    "deckName": "マイアグロエルフ",
    "isActive": true,
    "userId": null,
    "createdAt": "2025-01-26T10:00:00.000Z",
    "updatedAt": null
  },
  "meta": {
    "timestamp": "2025-01-26T10:00:00.000Z"
  }
}
```

**ステータスコード**: 201 Created

---

### 3.3 使用デッキ削除 🔵

**新規エンドポイント（REQ-EXT-108, REQ-EXT-402対応）**

```
DELETE /api/my-decks/:id
```

#### パスパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| id | string | Yes | 使用デッキID |

#### 成功レスポンス

**ステータスコード**: 204 No Content（ボディなし）

#### エラーレスポンス（削除制約エラー）

```json
{
  "success": false,
  "error": {
    "code": "DELETE_CONSTRAINT_ERROR",
    "message": "この使用デッキは対戦履歴で使用されているため削除できません",
    "details": {
      "entityType": "myDeck",
      "entityId": "md-001",
      "referencedBy": "battleLogs",
      "referenceCount": 10
    }
  }
}
```

**ステータスコード**: 409 Conflict

---

## 4. 統計（Statistics）API 🔵

### 4.1 シーズン一覧取得 🔵

**新規エンドポイント（REQ-EXT-203 ~ REQ-EXT-205対応）**

```
GET /api/statistics/seasons
```

#### レスポンス

```json
{
  "success": true,
  "data": [27, 26, 25, 24, 23],
  "meta": {
    "timestamp": "2025-01-26T10:00:00.000Z"
  }
}
```

**注意**: 降順でソート（最新シーズンが先頭）

---

### 4.2 統計取得 🔵

**既存エンドポイント拡張（REQ-EXT-203 ~ REQ-EXT-205対応）**

```
GET /api/statistics
```

#### クエリパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| season | number | No | シーズン番号（省略時は最新シーズン） |

#### レスポンス

```json
{
  "success": true,
  "data": {
    "season": 27,
    "totalMatches": 100,
    "wins": 55,
    "losses": 45,
    "winRate": 55.0,
    "firstWinRate": 60.0,
    "secondWinRate": 50.0
  },
  "meta": {
    "timestamp": "2025-01-26T10:00:00.000Z"
  }
}
```

---

## 5. 対戦履歴（BattleLog）API 🔵

### 5.1 対戦履歴登録 🔵

**既存エンドポイント（変更なし）**

統計画面からの登録も同じエンドポイントを使用（REQ-EXT-201, REQ-EXT-202対応）

```
POST /api/battle-logs
```

#### リクエストボディ

```json
{
  "season": 27,
  "battleDate": "2025-01-26",
  "myDeckId": "md-001",
  "opponentDeckId": "dm-002",
  "isFirst": true,
  "result": "win",
  "memo": "良い試合だった"
}
```

---

## 6. Hono実装サンプル 🟡

### 6.1 deckMasterRoutes.ts

```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const app = new Hono<{ Bindings: Bindings }>();

// バリデーションスキーマ
const createSchema = z.object({
  className: z.string().min(1),
  deckName: z.string().min(1).max(100),
});

const updateSchema = z.object({
  deckName: z.string().min(1).max(100),
});

// GET /api/deck-master
app.get('/', async (c) => {
  const includeUsage = c.req.query('includeUsage') === 'true';
  const db = c.env.DB;

  if (includeUsage) {
    const results = await db.prepare(`
      SELECT
        dm.*,
        MAX(bl.battle_date) as last_used_date,
        COUNT(bl.id) as usage_count
      FROM deck_master dm
      LEFT JOIN battle_logs bl ON dm.id = bl.opponent_deck_id
      GROUP BY dm.id
      ORDER BY
        CASE WHEN MAX(bl.battle_date) IS NULL THEN 1 ELSE 0 END,
        MAX(bl.battle_date) DESC,
        dm.sort_order ASC
    `).all();
    return c.json({ success: true, data: results.results });
  }

  const results = await db.prepare(
    'SELECT * FROM deck_master ORDER BY sort_order ASC'
  ).all();
  return c.json({ success: true, data: results.results });
});

// POST /api/deck-master
app.post('/', zValidator('json', createSchema), async (c) => {
  const data = c.req.valid('json');
  const db = c.env.DB;

  // 最大sortOrder取得
  const maxResult = await db.prepare(
    'SELECT MAX(sort_order) as max_order FROM deck_master'
  ).first();
  const newSortOrder = (maxResult?.max_order ?? 0) + 1;

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.prepare(`
    INSERT INTO deck_master (id, class_name, deck_name, sort_order, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).bind(id, data.className, data.deckName, newSortOrder, now).run();

  const created = await db.prepare(
    'SELECT * FROM deck_master WHERE id = ?'
  ).bind(id).first();

  return c.json({ success: true, data: created }, 201);
});

// PUT /api/deck-master/:id
app.put('/:id', zValidator('json', updateSchema), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');
  const db = c.env.DB;

  const existing = await db.prepare(
    'SELECT * FROM deck_master WHERE id = ?'
  ).bind(id).first();

  if (!existing) {
    return c.json({
      success: false,
      error: { code: 'NOT_FOUND', message: '指定されたデッキ種別が見つかりません' }
    }, 404);
  }

  const now = new Date().toISOString();
  await db.prepare(`
    UPDATE deck_master SET deck_name = ?, updated_at = ? WHERE id = ?
  `).bind(data.deckName, now, id).run();

  const updated = await db.prepare(
    'SELECT * FROM deck_master WHERE id = ?'
  ).bind(id).first();

  return c.json({ success: true, data: updated });
});

// DELETE /api/deck-master/:id
app.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const db = c.env.DB;

  // 参照チェック
  const refCount = await db.prepare(`
    SELECT COUNT(*) as count FROM battle_logs WHERE opponent_deck_id = ?
  `).bind(id).first();

  if (refCount && refCount.count > 0) {
    return c.json({
      success: false,
      error: {
        code: 'DELETE_CONSTRAINT_ERROR',
        message: 'このデッキ種別は対戦履歴で使用されているため削除できません',
        details: {
          entityType: 'deckMaster',
          entityId: id,
          referencedBy: 'battleLogs',
          referenceCount: refCount.count
        }
      }
    }, 409);
  }

  await db.prepare('DELETE FROM deck_master WHERE id = ?').bind(id).run();
  return c.body(null, 204);
});

export default app;
```

---

## 7. エラーコード一覧 🔵

| コード | HTTPステータス | 説明 |
|--------|---------------|------|
| VALIDATION_ERROR | 400 | 入力バリデーションエラー |
| NOT_FOUND | 404 | リソースが見つからない |
| DELETE_CONSTRAINT_ERROR | 409 | 削除制約エラー（参照あり） |
| INTERNAL_ERROR | 500 | 内部エラー |

---

## 8. 信頼性レベルサマリー

- 🔵 青信号: 16件 (94%)
- 🟡 黄信号: 1件 (6%)
- 🔴 赤信号: 0件 (0%)

**品質評価**: 高品質（ほぼすべてのAPI設計がユーザヒアリングと既存設計に基づく）

---

## 更新履歴

- **2025-01-26**: 初版作成（tsumiki:kairo-design により生成）

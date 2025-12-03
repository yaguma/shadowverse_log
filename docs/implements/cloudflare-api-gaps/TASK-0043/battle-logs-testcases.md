# TASK-0043: battle-logs ルート実装 - テストケース定義

## 概要

### テスト対象
- **ファイル**: `backend/src/routes/battle-logs.ts`
- **テストファイル**: `backend/tests/routes/battle-logs.test.ts`

### テスト方針
- バリデーション機能をメインにテスト
- 既存の `statistics.test.ts` のパターンに従う
- モックを使用してDBアクセスを回避

## テストケース一覧

### TC-001: GET /api/battle-logs - 一覧取得（正常系）🔵

**目的**: 対戦履歴一覧の正常取得を確認

| # | 入力 | 期待結果 |
|---|------|----------|
| 1-1 | パラメータなし | 200 OK, デフォルト値（limit=100, offset=0） |
| 1-2 | `?limit=10` | 200 OK, limit=10 |
| 1-3 | `?limit=10&offset=5` | 200 OK, limit=10, offset=5 |
| 1-4 | `?sortOrder=asc` | 200 OK, 昇順ソート |
| 1-5 | `?sortOrder=desc` | 200 OK, 降順ソート |

**レスポンス検証項目**:
- `success` が `true`
- `data.battleLogs` が配列
- `data.total` が数値
- `data.limit` が指定値
- `data.offset` が指定値
- `meta.timestamp` が存在
- `meta.requestId` が存在

### TC-002: GET /api/battle-logs - パラメータバリデーション 🔵

**目的**: 不正なパラメータの処理を確認

| # | 入力 | 期待結果 |
|---|------|----------|
| 2-1 | `?limit=0` | limit=1に補正（最小値） |
| 2-2 | `?limit=2000` | limit=1000に補正（最大値） |
| 2-3 | `?limit=-1` | limit=100に補正（デフォルト） |
| 2-4 | `?limit=abc` | limit=100に補正（デフォルト） |
| 2-5 | `?offset=-1` | offset=0に補正 |
| 2-6 | `?sortOrder=invalid` | sortOrder=descに補正 |

### TC-003: POST /api/battle-logs - 新規作成（正常系）🔵

**目的**: 対戦履歴の新規作成を確認

| # | 入力 | 期待結果 |
|---|------|----------|
| 3-1 | 全必須フィールド | 201 Created |
| 3-2 | 全フィールド（オプション含む） | 201 Created |

**正常リクエストボディ例**:
```json
{
  "date": "2025-12-03",
  "battleType": "ランクマッチ",
  "myDeckId": "deck-123",
  "turn": "先攻",
  "result": "勝ち"
}
```

**レスポンス検証項目**:
- `success` が `true`
- `data.battleLog` が作成されたデータ
- ステータスコードが201

### TC-004: POST /api/battle-logs - バリデーションエラー 🔵

**目的**: 不正な入力のバリデーションを確認

| # | 入力 | 期待結果 |
|---|------|----------|
| 4-1 | 空のボディ | 400, VALIDATION_ERROR |
| 4-2 | date なし | 400, VALIDATION_ERROR |
| 4-3 | battleType なし | 400, VALIDATION_ERROR |
| 4-4 | myDeckId なし | 400, VALIDATION_ERROR |
| 4-5 | turn なし | 400, VALIDATION_ERROR |
| 4-6 | result なし | 400, VALIDATION_ERROR |
| 4-7 | 不正な日付形式 | 400, VALIDATION_ERROR |

**エラーレスポンス検証項目**:
- `success` が `false`
- `error.code` が `VALIDATION_ERROR`
- `error.message` が存在
- `error.details` にフィールド別エラー

### TC-005: DELETE /api/battle-logs/:id - 削除（正常系）🔵

**目的**: 対戦履歴の削除を確認

| # | 入力 | 期待結果 |
|---|------|----------|
| 5-1 | 存在するID | 200 OK, deletedId |

**レスポンス検証項目**:
- `success` が `true`
- `data.deletedId` が削除されたID

### TC-006: DELETE /api/battle-logs/:id - 削除（異常系）🔵

**目的**: 存在しないIDの削除を確認

| # | 入力 | 期待結果 |
|---|------|----------|
| 6-1 | 存在しないID | 404, BATTLE_LOG_NOT_FOUND |

**エラーレスポンス検証項目**:
- `success` が `false`
- `error.code` が `BATTLE_LOG_NOT_FOUND`
- `error.message` が存在

### TC-007: レスポンス形式の検証 🔵

**目的**: APIレスポンスが標準形式に準拠していることを確認

| # | エンドポイント | 検証項目 |
|---|---------------|----------|
| 7-1 | GET /api/battle-logs | meta.timestamp, meta.requestId |
| 7-2 | POST /api/battle-logs | meta.timestamp, meta.requestId |
| 7-3 | DELETE /api/battle-logs/:id | meta.timestamp, meta.requestId |
| 7-4 | エラーレスポンス | meta.timestamp, meta.requestId |

### TC-008: Content-Type検証 🔵

**目的**: レスポンスのContent-Typeが正しいことを確認

| # | エンドポイント | 期待値 |
|---|---------------|--------|
| 8-1 | GET /api/battle-logs | application/json |
| 8-2 | POST /api/battle-logs | application/json |
| 8-3 | DELETE /api/battle-logs/:id | application/json |

## テスト実装コード骨格

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';

interface Env {
  DB: unknown;
}

// モックヘルパー
function createMeta() {
  return {
    timestamp: new Date().toISOString(),
    requestId: crypto.randomUUID(),
  };
}

describe('GET /api/battle-logs', () => {
  describe('TC-001: 一覧取得（正常系）', () => {
    it('パラメータなしで200 OKを返す', async () => {
      // ...
    });
    it('limit パラメータが正しく適用される', async () => {
      // ...
    });
  });

  describe('TC-002: パラメータバリデーション', () => {
    it('limitが範囲外の場合、補正される', async () => {
      // ...
    });
  });
});

describe('POST /api/battle-logs', () => {
  describe('TC-003: 新規作成（正常系）', () => {
    it('正しいデータで201 Createdを返す', async () => {
      // ...
    });
  });

  describe('TC-004: バリデーションエラー', () => {
    it('必須フィールドがない場合400を返す', async () => {
      // ...
    });
  });
});

describe('DELETE /api/battle-logs/:id', () => {
  describe('TC-005: 削除（正常系）', () => {
    it('存在するIDで200 OKを返す', async () => {
      // ...
    });
  });

  describe('TC-006: 削除（異常系）', () => {
    it('存在しないIDで404を返す', async () => {
      // ...
    });
  });
});

describe('レスポンス形式', () => {
  describe('TC-007: meta情報', () => {
    it('全レスポンスにtimestampとrequestIdが含まれる', async () => {
      // ...
    });
  });

  describe('TC-008: Content-Type', () => {
    it('application/jsonを返す', async () => {
      // ...
    });
  });
});
```

## カバレッジ目標

- 行カバレッジ: 80%以上
- 分岐カバレッジ: 80%以上
- 関数カバレッジ: 100%

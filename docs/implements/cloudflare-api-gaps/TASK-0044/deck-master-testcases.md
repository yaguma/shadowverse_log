# TASK-0044: deck-master ルート実装 - テストケース

## 概要

デッキマスターAPIエンドポイントのテストケース定義。

## テストファイル

`backend/tests/routes/deck-master.test.ts`

## テストケース一覧

### TC-0044-001: 一覧取得（正常系）

| 項目 | 内容 |
|------|------|
| **テストID** | TC-0044-001 |
| **テスト名** | 一覧取得（正常系） |
| **前提条件** | データベースにデッキマスターデータが存在 |
| **入力** | GET /api/deck-master |
| **期待結果** | 200 OK、deckMasters配列を含むレスポンス |

**検証項目**:
- [ ] HTTPステータスコード 200
- [ ] success: true
- [ ] data.deckMasters が配列
- [ ] meta.timestamp が存在
- [ ] meta.requestId が存在

### TC-0044-002: キャッシュヘッダー

| 項目 | 内容 |
|------|------|
| **テストID** | TC-0044-002 |
| **テスト名** | キャッシュヘッダー設定 |
| **前提条件** | なし |
| **入力** | GET /api/deck-master |
| **期待結果** | Cache-Control: public, max-age=300 |

**検証項目**:
- [ ] Cache-Controlヘッダーが存在
- [ ] 値が "public, max-age=300"

### TC-0044-003: 空データ時のレスポンス

| 項目 | 内容 |
|------|------|
| **テストID** | TC-0044-003 |
| **テスト名** | 空データ時のレスポンス |
| **前提条件** | データベースにデッキマスターデータがない |
| **入力** | GET /api/deck-master |
| **期待結果** | 200 OK、空の配列を返す |

**検証項目**:
- [ ] HTTPステータスコード 200
- [ ] success: true
- [ ] data.deckMasters が空配列 []

### TC-0044-004: ソート順序

| 項目 | 内容 |
|------|------|
| **テストID** | TC-0044-004 |
| **テスト名** | sortOrder昇順ソート |
| **前提条件** | 複数のデッキマスターデータが存在 |
| **入力** | GET /api/deck-master |
| **期待結果** | sortOrderの昇順でソートされた結果 |

**検証項目**:
- [ ] data.deckMasters[0].sortOrder < data.deckMasters[1].sortOrder

### TC-0044-005: レスポンス形式

| 項目 | 内容 |
|------|------|
| **テストID** | TC-0044-005 |
| **テスト名** | レスポンス形式 |
| **前提条件** | なし |
| **入力** | GET /api/deck-master |
| **期待結果** | 正しいJSON形式 |

**検証項目**:
- [ ] Content-Type: application/json
- [ ] 各deckMasterにid, className, deckName, sortOrderが含まれる

### TC-0044-006: データベースエラー時

| 項目 | 内容 |
|------|------|
| **テストID** | TC-0044-006 |
| **テスト名** | データベースエラー時 |
| **前提条件** | データベース接続エラーが発生 |
| **入力** | GET /api/deck-master |
| **期待結果** | 500 Internal Server Error |

**検証項目**:
- [ ] HTTPステータスコード 500
- [ ] success: false
- [ ] error.code: "DATABASE_ERROR"

## テスト実装例

```typescript
import { beforeEach, describe, expect, it } from 'vitest';
import { Hono } from 'hono';

interface Env {
  DB: unknown;
}

function createMeta() {
  return {
    timestamp: new Date().toISOString(),
    requestId: crypto.randomUUID(),
  };
}

function createTestApp() {
  const app = new Hono<{ Bindings: Env }>();

  app.get('/api/deck-master', async (c) => {
    // Mock data
    const deckMasters = [
      { id: '1', className: 'エルフ', deckName: '妖精エルフ', sortOrder: 1 },
      { id: '2', className: 'ロイヤル', deckName: '連携ロイヤル', sortOrder: 2 },
    ];

    c.header('Cache-Control', 'public, max-age=300');

    return c.json({
      success: true,
      data: { deckMasters },
      meta: createMeta(),
    });
  });

  return app;
}

describe('GET /api/deck-master', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('TC-0044-001: 一覧取得（正常系）', () => {
    it('200 OKを返す', async () => {
      const res = await app.request('/api/deck-master');
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.deckMasters).toBeInstanceOf(Array);
    });

    it('meta情報が含まれる', async () => {
      const res = await app.request('/api/deck-master');
      const json = await res.json();

      expect(json.meta.timestamp).toBeDefined();
      expect(json.meta.requestId).toBeDefined();
    });
  });

  describe('TC-0044-002: キャッシュヘッダー', () => {
    it('Cache-Controlヘッダーが設定される', async () => {
      const res = await app.request('/api/deck-master');

      expect(res.headers.get('Cache-Control')).toBe('public, max-age=300');
    });
  });

  describe('TC-0044-005: レスポンス形式', () => {
    it('application/jsonを返す', async () => {
      const res = await app.request('/api/deck-master');

      expect(res.headers.get('Content-Type')).toContain('application/json');
    });

    it('deckMasterに必要なフィールドが含まれる', async () => {
      const res = await app.request('/api/deck-master');
      const json = await res.json();

      const deckMaster = json.data.deckMasters[0];
      expect(deckMaster.id).toBeDefined();
      expect(deckMaster.className).toBeDefined();
      expect(deckMaster.deckName).toBeDefined();
      expect(deckMaster.sortOrder).toBeDefined();
    });
  });
});
```

## 優先度

| 優先度 | テストケース |
|--------|------------|
| High | TC-0044-001, TC-0044-002 |
| Medium | TC-0044-003, TC-0044-004, TC-0044-005 |
| Low | TC-0044-006 |

/**
 * my-decks API POST エンドポイント テスト
 * TASK-0015: MyDeck API - POST 実装
 *
 * @description POST /api/my-decks エンドポイントのテスト
 * 青信号 信頼性レベル: 青信号（api-endpoints.md 3.2より、REQ-EXT-101〜107）
 */

import { Hono } from 'hono';
import { describe, expect, it, beforeEach } from 'vitest';

// 環境バインディング型
interface Env {
  DB: unknown;
}

// DeckMaster型
interface DeckMaster {
  id: string;
  className: string;
  deckName: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string | null;
}

// MyDeck型
interface MyDeck {
  id: string;
  deckId: string;
  deckCode: string;
  deckName: string;
  className: string;
  isActive: boolean;
  userId: string | null;
  createdAt: string;
  updatedAt: string | null;
}

// 成功レスポンス型
interface MyDeckSuccessResponse {
  success: true;
  data: MyDeck;
  meta: {
    timestamp: string;
  };
}

// エラーレスポンス型
interface MyDeckErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      constraint: string;
      value: unknown;
    }>;
  };
  meta: {
    timestamp: string;
  };
}

type MyDeckResponse = MyDeckSuccessResponse | MyDeckErrorResponse;

// ===========================================
// POST /api/my-decks テスト
// ===========================================
describe('POST /api/my-decks', () => {
  // モックデータストア
  let mockMyDecksStore: MyDeck[];
  let mockDeckMasterStore: DeckMaster[];

  beforeEach(() => {
    mockMyDecksStore = [];
    // DeckMasterのモックデータ
    mockDeckMasterStore = [
      {
        id: 'dm-001',
        className: 'エルフ',
        deckName: 'アグロエルフ',
        sortOrder: 1,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: null,
      },
      {
        id: 'dm-002',
        className: 'ロイヤル',
        deckName: '連携ロイヤル',
        sortOrder: 2,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: null,
      },
    ];
  });

  /**
   * テスト用のモックアプリを作成
   * POST /api/my-decks のロジックをテスト
   */
  function createTestApp() {
    const app = new Hono<{ Bindings: Env }>();

    app.post('/api/my-decks', async (c) => {
      try {
        const body = await c.req.json();

        // バリデーション: リクエストボディの存在チェック
        if (!body || typeof body !== 'object') {
          return c.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: '入力値が不正です',
                details: [{ field: 'body', constraint: 'required', value: body }],
              },
              meta: { timestamp: new Date().toISOString() },
            },
            400
          );
        }

        const { deckId, deckName, deckCode } = body;

        // バリデーション: deckId必須チェック
        if (!deckId || deckId === '') {
          return c.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: '入力値が不正です',
                details: [{ field: 'deckId', constraint: 'required', value: deckId }],
              },
              meta: { timestamp: new Date().toISOString() },
            },
            400
          );
        }

        // バリデーション: deckName必須チェック
        if (!deckName || deckName === '') {
          return c.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: '入力値が不正です',
                details: [{ field: 'deckName', constraint: 'required', value: deckName }],
              },
              meta: { timestamp: new Date().toISOString() },
            },
            400
          );
        }

        // DeckMaster存在確認
        const deckMaster = mockDeckMasterStore.find((dm) => dm.id === deckId);
        if (!deckMaster) {
          return c.json(
            {
              success: false,
              error: {
                code: 'DECK_MASTER_NOT_FOUND',
                message: `deckId: ${deckId} が見つかりません`,
              },
              meta: { timestamp: new Date().toISOString() },
            },
            404
          );
        }

        // UUIDの自動生成
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        const newMyDeck: MyDeck = {
          id,
          deckId,
          deckCode: deckCode || '',
          deckName,
          className: deckMaster.className,
          isActive: true, // 固定
          userId: null,
          createdAt: now,
          updatedAt: null,
        };

        mockMyDecksStore.push(newMyDeck);

        return c.json(
          {
            success: true,
            data: newMyDeck,
            meta: {
              timestamp: now,
            },
          },
          201
        );
      } catch {
        // JSONパースエラー等
        return c.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: '入力値が不正です',
              details: [{ field: 'body', constraint: 'required', value: null }],
            },
            meta: { timestamp: new Date().toISOString() },
          },
          400
        );
      }
    });

    return app;
  }

  // TC-0015-001: 正常な入力で201 Created
  describe('TC-0015-001: 正常な入力で201 Created', () => {
    it('有効なリクエストで201 Createdを返す', async () => {
      const app = createTestApp();
      const requestBody = {
        deckId: 'dm-001',
        deckName: 'マイアグロエルフ',
        deckCode: 'ABC123',
      };

      const res = await app.request('/api/my-decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      expect(res.status).toBe(201);
    });

    it('UUIDが自動生成される', async () => {
      const app = createTestApp();
      const requestBody = {
        deckId: 'dm-001',
        deckName: 'マイアグロエルフ',
        deckCode: 'ABC123',
      };

      const res = await app.request('/api/my-decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const json = (await res.json()) as MyDeckSuccessResponse;

      expect(json.success).toBe(true);
      expect(json.data.id).toBeDefined();
      // UUID形式の検証
      expect(json.data.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('deckId, deckName, deckCodeがレスポンスに含まれる', async () => {
      const app = createTestApp();
      const requestBody = {
        deckId: 'dm-001',
        deckName: 'マイアグロエルフ',
        deckCode: 'ABC123',
      };

      const res = await app.request('/api/my-decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const json = (await res.json()) as MyDeckSuccessResponse;

      expect(json.data.deckId).toBe('dm-001');
      expect(json.data.deckName).toBe('マイアグロエルフ');
      expect(json.data.deckCode).toBe('ABC123');
    });

    it('classNameがDeckMasterから取得される', async () => {
      const app = createTestApp();
      const requestBody = {
        deckId: 'dm-001',
        deckName: 'マイアグロエルフ',
        deckCode: 'ABC123',
      };

      const res = await app.request('/api/my-decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const json = (await res.json()) as MyDeckSuccessResponse;

      expect(json.data.className).toBe('エルフ');
    });

    it('isActiveがtrueで設定される', async () => {
      const app = createTestApp();
      const requestBody = {
        deckId: 'dm-001',
        deckName: 'マイアグロエルフ',
        deckCode: 'ABC123',
      };

      const res = await app.request('/api/my-decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const json = (await res.json()) as MyDeckSuccessResponse;

      expect(json.data.isActive).toBe(true);
    });

    it('createdAtが設定される', async () => {
      const app = createTestApp();
      const requestBody = {
        deckId: 'dm-001',
        deckName: 'マイアグロエルフ',
        deckCode: 'ABC123',
      };

      const res = await app.request('/api/my-decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const json = (await res.json()) as MyDeckSuccessResponse;

      expect(json.data.createdAt).toBeDefined();
      // ISO 8601形式の検証
      expect(json.data.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('meta.timestampが含まれる', async () => {
      const app = createTestApp();
      const requestBody = {
        deckId: 'dm-001',
        deckName: 'マイアグロエルフ',
        deckCode: 'ABC123',
      };

      const res = await app.request('/api/my-decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const json = (await res.json()) as MyDeckSuccessResponse;

      expect(json.meta.timestamp).toBeDefined();
    });
  });

  // TC-0015-002: deckName空でValidationError
  describe('TC-0015-002: deckName空でValidationError', () => {
    it('deckNameが空の場合、400 Bad Requestを返す', async () => {
      const app = createTestApp();
      const requestBody = {
        deckId: 'dm-001',
        deckName: '',
      };

      const res = await app.request('/api/my-decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      expect(res.status).toBe(400);
    });

    it('deckNameが空の場合、error.codeがVALIDATION_ERRORを返す', async () => {
      const app = createTestApp();
      const requestBody = {
        deckId: 'dm-001',
        deckName: '',
      };

      const res = await app.request('/api/my-decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const json = (await res.json()) as MyDeckErrorResponse;

      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // TC-0015-003: deckId空でValidationError
  describe('TC-0015-003: deckId空でValidationError', () => {
    it('deckIdが空の場合、400 Bad Requestを返す', async () => {
      const app = createTestApp();
      const requestBody = {
        deckId: '',
        deckName: 'テストデッキ',
      };

      const res = await app.request('/api/my-decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      expect(res.status).toBe(400);
    });

    it('deckIdが空の場合、error.codeがVALIDATION_ERRORを返す', async () => {
      const app = createTestApp();
      const requestBody = {
        deckId: '',
        deckName: 'テストデッキ',
      };

      const res = await app.request('/api/my-decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const json = (await res.json()) as MyDeckErrorResponse;

      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // TC-0015-004: deckCode空で登録成功
  describe('TC-0015-004: deckCode空で登録成功', () => {
    it('deckCodeが空でも201 Createdを返す', async () => {
      const app = createTestApp();
      const requestBody = {
        deckId: 'dm-001',
        deckName: 'マイアグロエルフ',
        // deckCodeを省略
      };

      const res = await app.request('/api/my-decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      expect(res.status).toBe(201);
    });

    it('deckCodeが空の場合、deckCodeは空文字列になる', async () => {
      const app = createTestApp();
      const requestBody = {
        deckId: 'dm-001',
        deckName: 'マイアグロエルフ',
        // deckCodeを省略
      };

      const res = await app.request('/api/my-decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const json = (await res.json()) as MyDeckSuccessResponse;

      expect(json.data.deckCode).toBe('');
    });
  });

  // TC-0015-005: 存在しないdeckIdでエラー
  describe('TC-0015-005: 存在しないdeckIdでエラー', () => {
    it('存在しないdeckIdの場合、404 Not Foundを返す', async () => {
      const app = createTestApp();
      const requestBody = {
        deckId: 'non-existent-id',
        deckName: 'テストデッキ',
      };

      const res = await app.request('/api/my-decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      expect(res.status).toBe(404);
    });

    it('存在しないdeckIdの場合、error.codeがDECK_MASTER_NOT_FOUNDを返す', async () => {
      const app = createTestApp();
      const requestBody = {
        deckId: 'non-existent-id',
        deckName: 'テストデッキ',
      };

      const res = await app.request('/api/my-decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const json = (await res.json()) as MyDeckErrorResponse;

      expect(json.success).toBe(false);
      expect(json.error.code).toBe('DECK_MASTER_NOT_FOUND');
    });
  });

  // TC-0015-006: リクエストボディなしでValidationError
  describe('TC-0015-006: リクエストボディなしでValidationError', () => {
    it('リクエストボディなしで400 Bad Requestを返す', async () => {
      const app = createTestApp();

      const res = await app.request('/api/my-decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(res.status).toBe(400);
    });

    it('リクエストボディなしでerror.codeがVALIDATION_ERRORを返す', async () => {
      const app = createTestApp();

      const res = await app.request('/api/my-decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = (await res.json()) as MyDeckErrorResponse;

      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // TC-0015-007: 異なるDeckMasterからclassNameを取得
  describe('TC-0015-007: 異なるDeckMasterからclassNameを取得', () => {
    it('dm-002のclassNameがロイヤルであることを確認', async () => {
      const app = createTestApp();
      const requestBody = {
        deckId: 'dm-002',
        deckName: 'マイ連携ロイヤル',
        deckCode: 'XYZ789',
      };

      const res = await app.request('/api/my-decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const json = (await res.json()) as MyDeckSuccessResponse;

      expect(json.data.className).toBe('ロイヤル');
    });
  });
});

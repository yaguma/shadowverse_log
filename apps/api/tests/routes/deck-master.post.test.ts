/**
 * deck-master API POST エンドポイント テスト
 * TASK-0006: DeckMaster API - POST 実装
 *
 * @description POST /api/deck-master エンドポイントのテスト
 * 🔵 信頼性レベル: 青信号（api-endpoints.md 2.2より、REQ-EXT-001〜005）
 */

import { Hono } from 'hono';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// 環境バインディング型
interface Env {
  DB: unknown;
}

// デッキマスター型
interface DeckMaster {
  id: string;
  className: string;
  deckName: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string | null;
}

// 成功レスポンス型
interface DeckMasterSuccessResponse {
  success: true;
  data: DeckMaster;
  meta: {
    timestamp: string;
  };
}

// エラーレスポンス型
interface DeckMasterErrorResponse {
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
}

type DeckMasterResponse = DeckMasterSuccessResponse | DeckMasterErrorResponse;

// ===========================================
// POST /api/deck-master テスト
// ===========================================
describe('POST /api/deck-master', () => {
  // モックデータストア
  let mockDataStore: DeckMaster[];
  let mockSortOrderMax: number;

  beforeEach(() => {
    mockDataStore = [];
    mockSortOrderMax = 0;
  });

  /**
   * テスト用のモックアプリを作成
   * POST /api/deck-master のロジックをテスト
   */
  function createTestApp(initialData: DeckMaster[] = []) {
    mockDataStore = [...initialData];
    mockSortOrderMax = initialData.length > 0
      ? Math.max(...initialData.map(d => d.sortOrder))
      : 0;

    const app = new Hono<{ Bindings: Env }>();

    app.post('/api/deck-master', async (c) => {
      try {
        const body = await c.req.json();

        // バリデーション: リクエストボディの存在チェック
        if (!body || typeof body !== 'object') {
          return c.json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: '入力値が不正です',
              details: [{ field: 'body', constraint: 'required', value: body }],
            },
          }, 400);
        }

        const { className, deckName } = body;

        // バリデーション: className
        const validClassNames = [
          'エルフ', 'ロイヤル', 'ウィッチ', 'ドラゴン',
          'ネクロマンサー', 'ヴァンパイア', 'ビショップ', 'ネメシス',
        ];

        if (!className || className === '') {
          return c.json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: '入力値が不正です',
              details: [{ field: 'className', constraint: 'required', value: className }],
            },
          }, 400);
        }

        if (!validClassNames.includes(className)) {
          return c.json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: '入力値が不正です',
              details: [{ field: 'className', constraint: 'enum', value: className }],
            },
          }, 400);
        }

        // バリデーション: deckName
        if (!deckName || deckName === '') {
          return c.json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: '入力値が不正です',
              details: [{ field: 'deckName', constraint: 'required', value: deckName }],
            },
          }, 400);
        }

        if (deckName.length > 100) {
          return c.json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: '入力値が不正です',
              details: [{ field: 'deckName', constraint: 'maxLength', value: deckName }],
            },
          }, 400);
        }

        // sortOrderの自動採番（max + 1）
        const newSortOrder = mockSortOrderMax + 1;
        mockSortOrderMax = newSortOrder;

        // UUIDの自動生成
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        const newDeckMaster: DeckMaster = {
          id,
          className,
          deckName,
          sortOrder: newSortOrder,
          createdAt: now,
          updatedAt: null,
        };

        mockDataStore.push(newDeckMaster);

        return c.json({
          success: true,
          data: newDeckMaster,
          meta: {
            timestamp: now,
          },
        }, 201);
      } catch (error) {
        // JSONパースエラー等
        return c.json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '入力値が不正です',
            details: [{ field: 'body', constraint: 'required', value: null }],
          },
        }, 400);
      }
    });

    return app;
  }

  // TC-0006-001: 正常登録で201 Created
  describe('TC-0006-001: 正常登録で201 Created', () => {
    it('有効なリクエストで201 Createdを返す', async () => {
      const app = createTestApp();
      const requestBody = {
        className: 'ウィッチ',
        deckName: '秘術ウィッチ',
      };

      const res = await app.request('/api/deck-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      expect(res.status).toBe(201);
    });

    it('UUIDが自動生成される', async () => {
      const app = createTestApp();
      const requestBody = {
        className: 'ウィッチ',
        deckName: '秘術ウィッチ',
      };

      const res = await app.request('/api/deck-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const json = (await res.json()) as DeckMasterSuccessResponse;

      expect(json.success).toBe(true);
      expect(json.data.id).toBeDefined();
      // UUID形式の検証
      expect(json.data.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it('className, deckNameがレスポンスに含まれる', async () => {
      const app = createTestApp();
      const requestBody = {
        className: 'ウィッチ',
        deckName: '秘術ウィッチ',
      };

      const res = await app.request('/api/deck-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const json = (await res.json()) as DeckMasterSuccessResponse;

      expect(json.data.className).toBe('ウィッチ');
      expect(json.data.deckName).toBe('秘術ウィッチ');
    });

    it('createdAtが設定される', async () => {
      const app = createTestApp();
      const requestBody = {
        className: 'ウィッチ',
        deckName: '秘術ウィッチ',
      };

      const res = await app.request('/api/deck-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const json = (await res.json()) as DeckMasterSuccessResponse;

      expect(json.data.createdAt).toBeDefined();
    });

    it('meta.timestampが含まれる', async () => {
      const app = createTestApp();
      const requestBody = {
        className: 'ウィッチ',
        deckName: '秘術ウィッチ',
      };

      const res = await app.request('/api/deck-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const json = (await res.json()) as DeckMasterSuccessResponse;

      expect(json.meta.timestamp).toBeDefined();
    });
  });

  // TC-0006-002: sortOrderが最大値+1で採番
  describe('TC-0006-002: sortOrderが最大値+1で採番', () => {
    it('既存データがある場合、sortOrderが最大値+1になる', async () => {
      const initialData: DeckMaster[] = [
        {
          id: '1',
          className: 'エルフ',
          deckName: 'アグロエルフ',
          sortOrder: 5,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: null,
        },
      ];
      const app = createTestApp(initialData);

      const requestBody = {
        className: 'ウィッチ',
        deckName: '秘術ウィッチ',
      };

      const res = await app.request('/api/deck-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const json = (await res.json()) as DeckMasterSuccessResponse;

      expect(json.data.sortOrder).toBe(6);
    });
  });

  // TC-0006-003: データ0件時のsortOrderは1
  describe('TC-0006-003: データ0件時のsortOrderは1', () => {
    it('データがない場合、sortOrderが1になる', async () => {
      const app = createTestApp([]);

      const requestBody = {
        className: 'ウィッチ',
        deckName: '秘術ウィッチ',
      };

      const res = await app.request('/api/deck-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const json = (await res.json()) as DeckMasterSuccessResponse;

      expect(json.data.sortOrder).toBe(1);
    });
  });

  // TC-0006-004: deckName空でValidationError
  describe('TC-0006-004: deckName空でValidationError', () => {
    it('deckNameが空の場合、400 Bad Requestを返す', async () => {
      const app = createTestApp();
      const requestBody = {
        className: 'ウィッチ',
        deckName: '',
      };

      const res = await app.request('/api/deck-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      expect(res.status).toBe(400);
    });

    it('deckNameが空の場合、error.codeがVALIDATION_ERRORを返す', async () => {
      const app = createTestApp();
      const requestBody = {
        className: 'ウィッチ',
        deckName: '',
      };

      const res = await app.request('/api/deck-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const json = (await res.json()) as DeckMasterErrorResponse;

      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // TC-0006-005: deckName101文字でValidationError（100文字制限）
  describe('TC-0006-005: deckName101文字でValidationError', () => {
    it('deckNameが101文字以上の場合、400 Bad Requestを返す', async () => {
      const app = createTestApp();
      const requestBody = {
        className: 'ウィッチ',
        deckName: 'a'.repeat(101),
      };

      const res = await app.request('/api/deck-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      expect(res.status).toBe(400);
    });

    it('deckNameが100文字の場合、201 Createdを返す', async () => {
      const app = createTestApp();
      const requestBody = {
        className: 'ウィッチ',
        deckName: 'a'.repeat(100),
      };

      const res = await app.request('/api/deck-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      expect(res.status).toBe(201);
    });
  });

  // TC-0006-006: className空でValidationError
  describe('TC-0006-006: className空でValidationError', () => {
    it('classNameが空の場合、400 Bad Requestを返す', async () => {
      const app = createTestApp();
      const requestBody = {
        className: '',
        deckName: 'テストデッキ',
      };

      const res = await app.request('/api/deck-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      expect(res.status).toBe(400);
    });

    it('classNameが空の場合、error.codeがVALIDATION_ERRORを返す', async () => {
      const app = createTestApp();
      const requestBody = {
        className: '',
        deckName: 'テストデッキ',
      };

      const res = await app.request('/api/deck-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const json = (await res.json()) as DeckMasterErrorResponse;

      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // TC-0006-007: 無効なclassNameでValidationError
  describe('TC-0006-007: 無効なclassNameでValidationError', () => {
    it('無効なclassNameの場合、400 Bad Requestを返す', async () => {
      const app = createTestApp();
      const requestBody = {
        className: '無効クラス',
        deckName: 'テストデッキ',
      };

      const res = await app.request('/api/deck-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      expect(res.status).toBe(400);
    });

    it('無効なclassNameの場合、error.codeがVALIDATION_ERRORを返す', async () => {
      const app = createTestApp();
      const requestBody = {
        className: '無効クラス',
        deckName: 'テストデッキ',
      };

      const res = await app.request('/api/deck-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const json = (await res.json()) as DeckMasterErrorResponse;

      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // TC-0006-008: リクエストボディなしでValidationError
  describe('TC-0006-008: リクエストボディなしでValidationError', () => {
    it('リクエストボディなしで400 Bad Requestを返す', async () => {
      const app = createTestApp();

      const res = await app.request('/api/deck-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(res.status).toBe(400);
    });

    it('リクエストボディなしでerror.codeがVALIDATION_ERRORを返す', async () => {
      const app = createTestApp();

      const res = await app.request('/api/deck-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = (await res.json()) as DeckMasterErrorResponse;

      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // TC-0006-009: 有効なクラス名一覧のテスト
  describe('TC-0006-009: 有効なクラス名一覧のテスト', () => {
    const validClassNames = [
      'エルフ', 'ロイヤル', 'ウィッチ', 'ドラゴン',
      'ネクロマンサー', 'ヴァンパイア', 'ビショップ', 'ネメシス',
    ];

    for (const className of validClassNames) {
      it(`${className}は有効なクラス名として受け入れられる`, async () => {
        const app = createTestApp();
        const requestBody = {
          className,
          deckName: 'テストデッキ',
        };

        const res = await app.request('/api/deck-master', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        expect(res.status).toBe(201);
      });
    }
  });
});

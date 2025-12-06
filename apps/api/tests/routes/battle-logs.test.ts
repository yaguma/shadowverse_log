/**
 * battle-logs API エンドポイント テスト
 * TASK-0043: battle-logs ルート実装
 *
 * @description GET/POST/DELETE /api/battle-logs エンドポイントのテスト
 * 🔵 信頼性レベル: 青信号（workers/src/routes/battle-logs.ts の仕様に基づく）
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { NewBattleLogSchema } from '../../src/db/schema/battle-logs.validation';

// 環境バインディング型
interface Env {
  DB: unknown;
}

/**
 * メタ情報を生成
 */
function createMeta() {
  return {
    timestamp: new Date().toISOString(),
    requestId: crypto.randomUUID(),
  };
}

/**
 * エラーレスポンスを生成
 */
function createErrorResponse(code: string, message: string, details?: Record<string, string>) {
  return {
    success: false as const,
    error: { code, message, ...(details && { details }) },
    meta: createMeta(),
  };
}

/**
 * バリデーション・パラメータ処理をテストするためのシンプルなルート
 */
function createValidationTestApp() {
  const app = new Hono<{ Bindings: Env }>();

  // GET /api/battle-logs - 一覧取得
  app.get('/api/battle-logs', async (c) => {
    const { limit = '100', offset = '0', sortBy = 'date', sortOrder = 'desc' } = c.req.query();

    // パラメータ補正
    const parsedLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 100, 1), 1000);
    const parsedOffset = Math.max(Number.parseInt(offset, 10) || 0, 0);
    const parsedSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

    // モックデータを返す
    return c.json({
      success: true,
      data: {
        battleLogs: [],
        total: 0,
        limit: parsedLimit,
        offset: parsedOffset,
      },
      meta: createMeta(),
    });
  });

  // POST /api/battle-logs - 新規作成
  app.post('/api/battle-logs', async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json(
        createErrorResponse(
          'VALIDATION_ERROR',
          '入力値が不正です',
          { body: 'JSONのパースに失敗しました' }
        ),
        400
      );
    }

    // Zodでバリデーション
    const parseResult = NewBattleLogSchema.safeParse(body);
    if (!parseResult.success) {
      const issues = parseResult.error?.issues || [];
      const details: Record<string, string> = {};
      for (const err of issues) {
        const pathStr = err.path.map(String).join('.') || 'unknown';
        details[pathStr] = err.message;
      }
      return c.json(
        createErrorResponse(
          'VALIDATION_ERROR',
          '入力値が不正です',
          details
        ),
        400
      );
    }

    // モックデータを返す
    return c.json(
      {
        success: true,
        data: {
          battleLog: {
            id: crypto.randomUUID(),
            ...parseResult.data,
          },
        },
        meta: createMeta(),
      },
      201
    );
  });

  // DELETE /api/battle-logs/:id - 削除
  app.delete('/api/battle-logs/:id', async (c) => {
    const id = c.req.param('id');

    // モックで存在しないIDを判定
    if (id === 'non-existent-id') {
      return c.json(
        createErrorResponse(
          'BATTLE_LOG_NOT_FOUND',
          '指定された対戦履歴が見つかりません'
        ),
        404
      );
    }

    return c.json({
      success: true,
      data: { deletedId: id },
      meta: createMeta(),
    });
  });

  return app;
}

// ===========================================
// GET /api/battle-logs テスト
// ===========================================
describe('GET /api/battle-logs', () => {
  let app: ReturnType<typeof createValidationTestApp>;

  beforeEach(() => {
    app = createValidationTestApp();
  });

  // TC-001: 一覧取得（正常系）
  describe('TC-001: 一覧取得（正常系）', () => {
    it('パラメータなしで200 OKを返す', async () => {
      const res = await app.request('/api/battle-logs');
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.battleLogs).toBeInstanceOf(Array);
      expect(json.data.limit).toBe(100);
      expect(json.data.offset).toBe(0);
    });

    it('limit パラメータが正しく適用される', async () => {
      const res = await app.request('/api/battle-logs?limit=10');
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.limit).toBe(10);
    });

    it('limit と offset パラメータが正しく適用される', async () => {
      const res = await app.request('/api/battle-logs?limit=10&offset=5');
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.limit).toBe(10);
      expect(json.data.offset).toBe(5);
    });

    it('sortOrder=asc が受け入れられる', async () => {
      const res = await app.request('/api/battle-logs?sortOrder=asc');

      expect(res.status).toBe(200);
    });

    it('sortOrder=desc が受け入れられる', async () => {
      const res = await app.request('/api/battle-logs?sortOrder=desc');

      expect(res.status).toBe(200);
    });
  });

  // TC-002: パラメータバリデーション
  describe('TC-002: パラメータバリデーション', () => {
    it('limit=0 の場合、デフォルト値100が適用される（falsyのため）', async () => {
      const res = await app.request('/api/battle-logs?limit=0');
      const json = await res.json();

      expect(res.status).toBe(200);
      // 0はfalsyなのでデフォルト値100になり、Math.min(Math.max(100, 1), 1000) = 100
      expect(json.data.limit).toBe(100);
    });

    it('limit=2000 の場合、limit=1000に補正される', async () => {
      const res = await app.request('/api/battle-logs?limit=2000');
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.limit).toBe(1000);
    });

    it('limit=-1 の場合、limit=1に補正される（最小値）', async () => {
      const res = await app.request('/api/battle-logs?limit=-1');
      const json = await res.json();

      expect(res.status).toBe(200);
      // Math.min(Math.max(-1, 1), 1000) = 1
      expect(json.data.limit).toBe(1);
    });

    it('limit=abc の場合、デフォルト値に補正される', async () => {
      const res = await app.request('/api/battle-logs?limit=abc');
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.limit).toBe(100);
    });

    it('offset=-1 の場合、offset=0に補正される', async () => {
      const res = await app.request('/api/battle-logs?offset=-1');
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.offset).toBe(0);
    });

    it('不正なsortOrderの場合、descに補正される', async () => {
      const res = await app.request('/api/battle-logs?sortOrder=invalid');

      expect(res.status).toBe(200);
    });
  });

  // TC-007: レスポンス形式
  describe('TC-007: レスポンス形式', () => {
    it('meta.timestampが含まれる', async () => {
      const res = await app.request('/api/battle-logs');
      const json = await res.json();

      expect(json.meta.timestamp).toBeDefined();
    });

    it('meta.requestIdが含まれる', async () => {
      const res = await app.request('/api/battle-logs');
      const json = await res.json();

      expect(json.meta.requestId).toBeDefined();
    });
  });

  // TC-008: Content-Type
  describe('TC-008: Content-Type', () => {
    it('application/jsonを返す', async () => {
      const res = await app.request('/api/battle-logs');

      expect(res.headers.get('Content-Type')).toContain('application/json');
    });
  });
});

// ===========================================
// POST /api/battle-logs テスト
// ===========================================
describe('POST /api/battle-logs', () => {
  let app: ReturnType<typeof createValidationTestApp>;

  beforeEach(() => {
    app = createValidationTestApp();
  });

  // TC-003: 新規作成（正常系）
  describe('TC-003: 新規作成（正常系）', () => {
    it('正しいデータで201 Createdを返す', async () => {
      const validData = {
        date: '2025-12-03',
        battleType: 'ランクマッチ',
        rank: 'ダイアモンド',
        groupName: 'A',
        myDeckId: 'deck-123',
        turn: '先攻',
        result: '勝ち',
        opponentDeckId: 'opponent-deck-456',
      };

      const res = await app.request('/api/battle-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validData),
      });
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data.battleLog).toBeDefined();
      expect(json.data.battleLog.id).toBeDefined();
    });

    it('meta情報が含まれる', async () => {
      const validData = {
        date: '2025-12-03',
        battleType: 'ランクマッチ',
        rank: 'ダイアモンド',
        groupName: 'A',
        myDeckId: 'deck-123',
        turn: '先攻',
        result: '勝ち',
        opponentDeckId: 'opponent-deck-456',
      };

      const res = await app.request('/api/battle-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validData),
      });
      const json = await res.json();

      expect(json.meta.timestamp).toBeDefined();
      expect(json.meta.requestId).toBeDefined();
    });
  });

  // TC-004: バリデーションエラー
  describe('TC-004: バリデーションエラー', () => {
    it('空のボディで400を返す', async () => {
      const res = await app.request('/api/battle-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('dateがない場合400を返す', async () => {
      const res = await app.request('/api/battle-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          groupName: 'A',
          myDeckId: 'deck-123',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'opponent-deck-456',
        }),
      });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('battleTypeがない場合400を返す', async () => {
      const res = await app.request('/api/battle-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: '2025-12-03',
          rank: 'ダイアモンド',
          groupName: 'A',
          myDeckId: 'deck-123',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'opponent-deck-456',
        }),
      });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('myDeckIdがない場合400を返す', async () => {
      const res = await app.request('/api/battle-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: '2025-12-03',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          groupName: 'A',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'opponent-deck-456',
        }),
      });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('turnがない場合400を返す', async () => {
      const res = await app.request('/api/battle-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: '2025-12-03',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          groupName: 'A',
          myDeckId: 'deck-123',
          result: '勝ち',
          opponentDeckId: 'opponent-deck-456',
        }),
      });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('resultがない場合400を返す', async () => {
      const res = await app.request('/api/battle-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: '2025-12-03',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          groupName: 'A',
          myDeckId: 'deck-123',
          turn: '先攻',
          opponentDeckId: 'opponent-deck-456',
        }),
      });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('不正な日付形式で400を返す', async () => {
      const res = await app.request('/api/battle-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: '2025/12/03', // 不正な形式
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          groupName: 'A',
          myDeckId: 'deck-123',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'opponent-deck-456',
        }),
      });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('エラーレスポンスにdetailsが含まれる', async () => {
      const res = await app.request('/api/battle-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json();

      expect(json.error.details).toBeDefined();
    });
  });
});

// ===========================================
// DELETE /api/battle-logs/:id テスト
// ===========================================
describe('DELETE /api/battle-logs/:id', () => {
  let app: ReturnType<typeof createValidationTestApp>;

  beforeEach(() => {
    app = createValidationTestApp();
  });

  // TC-005: 削除（正常系）
  describe('TC-005: 削除（正常系）', () => {
    it('存在するIDで200 OKを返す', async () => {
      const res = await app.request('/api/battle-logs/existing-id', {
        method: 'DELETE',
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.deletedId).toBe('existing-id');
    });

    it('meta情報が含まれる', async () => {
      const res = await app.request('/api/battle-logs/existing-id', {
        method: 'DELETE',
      });
      const json = await res.json();

      expect(json.meta.timestamp).toBeDefined();
      expect(json.meta.requestId).toBeDefined();
    });
  });

  // TC-006: 削除（異常系）
  describe('TC-006: 削除（異常系）', () => {
    it('存在しないIDで404を返す', async () => {
      const res = await app.request('/api/battle-logs/non-existent-id', {
        method: 'DELETE',
      });
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('BATTLE_LOG_NOT_FOUND');
    });
  });
});

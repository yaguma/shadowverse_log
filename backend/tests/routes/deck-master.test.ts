/**
 * deck-master API エンドポイント テスト
 * TASK-0044: deck-master ルート実装
 *
 * @description GET /api/deck-master エンドポイントのテスト
 * 🔵 信頼性レベル: 青信号（workers/src/routes/deck-master.ts の仕様に基づく）
 */

import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

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
}

// レスポンス型
interface DeckMasterResponse {
  success: boolean;
  data: {
    deckMasters: DeckMaster[];
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
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
 * テスト用のモックアプリを作成
 * デッキマスター一覧取得のロジックをテスト
 */
function createTestApp(
  mockData: Array<{ id: string; className: string; deckName: string; sortOrder: number }> = []
) {
  const app = new Hono<{ Bindings: Env }>();

  app.get('/api/deck-master', async (c) => {
    // モックデータをsortOrder昇順でソート
    const deckMasters = [...mockData].sort((a, b) => a.sortOrder - b.sortOrder);

    // Cache-Controlヘッダーを設定（5分間キャッシュ）
    c.header('Cache-Control', 'public, max-age=300');

    return c.json({
      success: true,
      data: { deckMasters },
      meta: createMeta(),
    });
  });

  return app;
}

// ===========================================
// GET /api/deck-master テスト
// ===========================================
describe('GET /api/deck-master', () => {
  // TC-0044-001: 一覧取得（正常系）
  describe('TC-0044-001: 一覧取得（正常系）', () => {
    it('200 OKを返す', async () => {
      const mockData = [
        { id: '1', className: 'エルフ', deckName: '妖精エルフ', sortOrder: 1 },
        { id: '2', className: 'ロイヤル', deckName: '連携ロイヤル', sortOrder: 2 },
      ];
      const app = createTestApp(mockData);

      const res = await app.request('/api/deck-master');
      const json = (await res.json()) as DeckMasterResponse;

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.deckMasters).toBeInstanceOf(Array);
    });

    it('deckMasters配列を含むレスポンスを返す', async () => {
      const mockData = [{ id: '1', className: 'エルフ', deckName: '妖精エルフ', sortOrder: 1 }];
      const app = createTestApp(mockData);

      const res = await app.request('/api/deck-master');
      const json = (await res.json()) as DeckMasterResponse;

      expect(json.data.deckMasters.length).toBe(1);
      expect(json.data.deckMasters[0].className).toBe('エルフ');
    });

    it('meta.timestampが含まれる', async () => {
      const app = createTestApp();

      const res = await app.request('/api/deck-master');
      const json = (await res.json()) as DeckMasterResponse;

      expect(json.meta.timestamp).toBeDefined();
    });

    it('meta.requestIdが含まれる', async () => {
      const app = createTestApp();

      const res = await app.request('/api/deck-master');
      const json = (await res.json()) as DeckMasterResponse;

      expect(json.meta.requestId).toBeDefined();
    });
  });

  // TC-0044-002: キャッシュヘッダー
  describe('TC-0044-002: キャッシュヘッダー', () => {
    it('Cache-Controlヘッダーが設定される', async () => {
      const app = createTestApp();

      const res = await app.request('/api/deck-master');

      expect(res.headers.get('Cache-Control')).toBe('public, max-age=300');
    });
  });

  // TC-0044-003: 空データ時のレスポンス
  describe('TC-0044-003: 空データ時のレスポンス', () => {
    it('データがない場合でも200 OKを返す', async () => {
      const app = createTestApp([]);

      const res = await app.request('/api/deck-master');
      const json = (await res.json()) as DeckMasterResponse;

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
    });

    it('空の配列を返す', async () => {
      const app = createTestApp([]);

      const res = await app.request('/api/deck-master');
      const json = (await res.json()) as DeckMasterResponse;

      expect(json.data.deckMasters).toEqual([]);
    });
  });

  // TC-0044-004: ソート順序
  describe('TC-0044-004: ソート順序', () => {
    it('sortOrder昇順でソートされる', async () => {
      const mockData = [
        { id: '2', className: 'ロイヤル', deckName: '連携ロイヤル', sortOrder: 20 },
        { id: '1', className: 'エルフ', deckName: '妖精エルフ', sortOrder: 10 },
        { id: '3', className: 'ウィッチ', deckName: 'スペルウィッチ', sortOrder: 15 },
      ];
      const app = createTestApp(mockData);

      const res = await app.request('/api/deck-master');
      const json = (await res.json()) as DeckMasterResponse;

      expect(json.data.deckMasters[0].sortOrder).toBe(10);
      expect(json.data.deckMasters[1].sortOrder).toBe(15);
      expect(json.data.deckMasters[2].sortOrder).toBe(20);
    });
  });

  // TC-0044-005: レスポンス形式
  describe('TC-0044-005: レスポンス形式', () => {
    it('application/jsonを返す', async () => {
      const app = createTestApp();

      const res = await app.request('/api/deck-master');

      expect(res.headers.get('Content-Type')).toContain('application/json');
    });

    it('deckMasterに必要なフィールドが含まれる', async () => {
      const mockData = [{ id: '1', className: 'エルフ', deckName: '妖精エルフ', sortOrder: 1 }];
      const app = createTestApp(mockData);

      const res = await app.request('/api/deck-master');
      const json = (await res.json()) as DeckMasterResponse;

      const deckMasterItem = json.data.deckMasters[0];
      expect(deckMasterItem.id).toBeDefined();
      expect(deckMasterItem.className).toBeDefined();
      expect(deckMasterItem.deckName).toBeDefined();
      expect(deckMasterItem.sortOrder).toBeDefined();
    });
  });
});

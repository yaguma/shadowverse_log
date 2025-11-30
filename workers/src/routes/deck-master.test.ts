import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { errorHandler } from "../middleware/errorHandler";
import type { Bindings, Variables } from "../types";
import type { DeckMaster } from "../types/deckMaster";
import deckMaster from "./deck-master";

/**
 * Deck Master API Routesの統合テスト
 * 🔵 青信号: タスクファイル (cloudflare-migration-phase2-part2-i.md) の仕様に基づく
 */

// APIレスポンス型定義
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta: {
    timestamp: string;
    requestId: string;
  };
}

interface DeckMastersData {
  deckMasters: DeckMaster[];
}

// D1Databaseのモック作成関数
const createMockDB = (
  overrides: {
    results?: unknown[];
  } = {},
) => {
  const { results = [] } = overrides;

  return {
    prepare: vi.fn().mockReturnValue({
      all: vi.fn().mockResolvedValue({ results }),
    }),
  } as unknown as D1Database;
};

const createMockR2 = () => {
  return {} as unknown as R2Bucket;
};

// エラーハンドラー付きのテストアプリを作成
const createTestApp = () => {
  const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();
  app.use("*", errorHandler);
  app.route("/api/deck-master", deckMaster);
  return app;
};

describe("Deck Master API Routes", () => {
  let app: Hono<{ Bindings: Bindings; Variables: Variables }>;
  let mockDB: D1Database;
  let mockR2: R2Bucket;

  beforeEach(() => {
    mockDB = createMockDB();
    mockR2 = createMockR2();
    app = createTestApp();
    vi.clearAllMocks();
  });

  describe("GET /api/deck-master", () => {
    it("デッキマスター一覧が取得できる", async () => {
      const mockResults = [
        {
          id: "deck_master_001",
          class_name: "エルフ",
          deck_name: "アグロエルフ",
          sort_order: 1,
          created_at: "2025-01-24T12:00:00Z",
          updated_at: "2025-01-24T12:00:00Z",
        },
        {
          id: "deck_master_002",
          class_name: "ロイヤル",
          deck_name: "ミッドレンジロイヤル",
          sort_order: 2,
          created_at: "2025-01-24T12:00:00Z",
          updated_at: "2025-01-24T12:00:00Z",
        },
      ];
      mockDB = createMockDB({ results: mockResults });
      app = createTestApp();

      const req = new Request("http://localhost/api/deck-master");
      const res = await app.fetch(req, { DB: mockDB, R2: mockR2 });
      const json = (await res.json()) as ApiSuccessResponse<DeckMastersData>;

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.deckMasters).toBeInstanceOf(Array);
      expect(json.data.deckMasters).toHaveLength(2);
      expect(json.data.deckMasters[0].id).toBe("deck_master_001");
      expect(json.data.deckMasters[0].className).toBe("エルフ");
      expect(json.data.deckMasters[0].deckName).toBe("アグロエルフ");
      expect(json.meta.timestamp).toBeDefined();
      expect(json.meta.requestId).toBeDefined();
    });

    it("デッキマスターが0件の場合に空配列が返る", async () => {
      mockDB = createMockDB({ results: [] });
      app = createTestApp();

      const req = new Request("http://localhost/api/deck-master");
      const res = await app.fetch(req, { DB: mockDB, R2: mockR2 });
      const json = (await res.json()) as ApiSuccessResponse<DeckMastersData>;

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.deckMasters).toEqual([]);
    });

    it("Cache-Controlヘッダーが設定されている（5分間キャッシュ）", async () => {
      mockDB = createMockDB({ results: [] });
      app = createTestApp();

      const req = new Request("http://localhost/api/deck-master");
      const res = await app.fetch(req, { DB: mockDB, R2: mockR2 });

      expect(res.headers.get("Cache-Control")).toBe("public, max-age=300");
    });

    it("D1データベースからデータを取得する", async () => {
      const mockResults = [
        {
          id: "deck_001",
          class_name: "ネクロマンサー",
          deck_name: "アグロネクロ",
          sort_order: 1,
          created_at: "2025-01-24T12:00:00Z",
          updated_at: "2025-01-24T12:00:00Z",
        },
      ];
      mockDB = createMockDB({ results: mockResults });
      app = createTestApp();

      const req = new Request("http://localhost/api/deck-master");
      await app.fetch(req, { DB: mockDB, R2: mockR2 });

      // D1からデータを取得していることを確認
      expect(mockDB.prepare).toHaveBeenCalled();
    });

    it("レスポンスにtimestampとrequestIdが含まれる", async () => {
      mockDB = createMockDB({ results: [] });
      app = createTestApp();

      const req = new Request("http://localhost/api/deck-master");
      const res = await app.fetch(req, { DB: mockDB, R2: mockR2 });
      const json = (await res.json()) as ApiSuccessResponse<DeckMastersData>;

      expect(json.meta.timestamp).toBeDefined();
      expect(json.meta.requestId).toBeDefined();
      // UUIDフォーマットをチェック
      expect(json.meta.requestId).toMatch(/^[a-f0-9-]{36}$/);
    });
  });
});

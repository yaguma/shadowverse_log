import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { errorHandler } from "../middleware/errorHandler";
import type { Bindings, Variables } from "../types";
import type { BattleLog } from "../types/battleLog";
import battleLogs from "./battle-logs";

// APIレスポンス型定義
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta: {
    timestamp: string;
    requestId: string;
  };
}

interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

interface BattleLogsListData {
  battleLogs: BattleLog[];
  total: number;
  limit: number;
  offset: number;
}

interface BattleLogData {
  battleLog: BattleLog;
}

interface DeletedData {
  deletedId: string;
}

// D1Databaseのモック作成関数
// D1では prepare().bind().all() と prepare().first() の両方を使う
const createMockDB = (
  overrides: {
    results?: unknown[];
    total?: number;
    changes?: number;
  } = {},
) => {
  const { results = [], total = 0, changes = 1 } = overrides;

  // 各prepareの呼び出しに対応するモック
  const bindMock = vi.fn().mockReturnValue({
    all: vi.fn().mockResolvedValue({ results }),
    run: vi.fn().mockResolvedValue({ meta: { changes } }),
  });

  // prepareに対して bind() と first() の両方を持たせる
  return {
    prepare: vi.fn().mockReturnValue({
      bind: bindMock,
      first: vi.fn().mockResolvedValue({ total }),
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
  app.route("/api/battle-logs", battleLogs);
  return app;
};

describe("Battle Logs API Routes", () => {
  let app: Hono<{ Bindings: Bindings; Variables: Variables }>;
  let mockDB: D1Database;
  let mockR2: R2Bucket;

  beforeEach(() => {
    mockDB = createMockDB();
    mockR2 = createMockR2();
    app = createTestApp();
    vi.clearAllMocks();
  });

  describe("GET /api/battle-logs", () => {
    // TC-003: 対戦履歴一覧取得（デフォルトパラメータ）
    it("TC-003: デフォルトパラメータで対戦履歴一覧が取得できる", async () => {
      const mockResults = [
        {
          id: "log_001",
          date: "2025-01-24",
          battle_type: "ランクマッチ",
          rank: "ダイアモンド",
          group_name: "AAA",
          my_deck_id: "deck_001",
          turn: "先攻",
          result: "勝ち",
          opponent_deck_id: "deck_master_002",
        },
      ];
      mockDB = createMockDB({ results: mockResults, total: 84 });
      app = createTestApp();

      const req = new Request("http://localhost/api/battle-logs");
      const res = await app.fetch(req, { DB: mockDB, R2: mockR2 });
      const json = (await res.json()) as ApiResponse<BattleLogsListData>;

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      if (json.success) {
        expect(json.data.battleLogs).toBeInstanceOf(Array);
        expect(json.data.total).toBe(84);
        expect(json.data.limit).toBe(100);
        expect(json.data.offset).toBe(0);
      }
      expect(json.meta.timestamp).toBeDefined();
      expect(json.meta.requestId).toBeDefined();
    });

    // TC-004: 対戦履歴一覧取得（ページネーション）
    it("TC-004: ページネーションパラメータで対戦履歴一覧が取得できる", async () => {
      mockDB = createMockDB({ results: [], total: 100 });
      app = createTestApp();

      const req = new Request("http://localhost/api/battle-logs?limit=10&offset=20");
      const res = await app.fetch(req, { DB: mockDB, R2: mockR2 });
      const json = (await res.json()) as ApiResponse<BattleLogsListData>;

      expect(res.status).toBe(200);
      if (json.success) {
        expect(json.data.limit).toBe(10);
        expect(json.data.offset).toBe(20);
      }
    });

    // TC-204: データ0件時の一覧取得
    it("TC-204: 対戦履歴が0件の場合に空配列が返る", async () => {
      mockDB = createMockDB({ results: [], total: 0 });
      app = createTestApp();

      const req = new Request("http://localhost/api/battle-logs");
      const res = await app.fetch(req, { DB: mockDB, R2: mockR2 });
      const json = (await res.json()) as ApiResponse<BattleLogsListData>;

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      if (json.success) {
        expect(json.data.battleLogs).toEqual([]);
        expect(json.data.total).toBe(0);
      }
    });
  });

  describe("POST /api/battle-logs", () => {
    // TC-001: 対戦履歴の正常登録（全項目指定）
    it("TC-001: 必須項目をすべて指定した対戦履歴が正しく作成される", async () => {
      const input = {
        date: "2025-01-24",
        battleType: "ランクマッチ",
        rank: "ダイアモンド",
        group: "AAA",
        myDeckId: "deck_001",
        turn: "先攻",
        result: "勝ち",
        opponentDeckId: "deck_master_002",
      };

      const req = new Request("http://localhost/api/battle-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const res = await app.fetch(req, { DB: mockDB, R2: mockR2 });
      const json = (await res.json()) as ApiResponse<BattleLogData>;

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      if (json.success) {
        expect(json.data.battleLog).toBeDefined();
        expect(json.data.battleLog.id).toBeDefined();
        expect(json.data.battleLog.date).toBe("2025-01-24");
      }
      expect(json.meta.timestamp).toBeDefined();
      expect(json.meta.requestId).toBeDefined();
    });

    // TC-101: 未来日付の登録エラー
    it("TC-101: 未来の日付を指定した場合に400エラーが返る", async () => {
      const input = {
        date: "2099-12-31",
        battleType: "ランクマッチ",
        rank: "ダイアモンド",
        group: "AAA",
        myDeckId: "deck_001",
        turn: "先攻",
        result: "勝ち",
        opponentDeckId: "deck_master_002",
      };

      const req = new Request("http://localhost/api/battle-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const res = await app.fetch(req, { DB: mockDB, R2: mockR2 });
      const json = (await res.json()) as ApiErrorResponse;

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    // TC-102: 不正な日付形式のエラー
    it("TC-102: 不正な日付形式の場合に400エラーが返る", async () => {
      const input = {
        date: "2025/01/24",
        battleType: "ランクマッチ",
        rank: "ダイアモンド",
        group: "AAA",
        myDeckId: "deck_001",
        turn: "先攻",
        result: "勝ち",
        opponentDeckId: "deck_master_002",
      };

      const req = new Request("http://localhost/api/battle-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const res = await app.fetch(req, { DB: mockDB, R2: mockR2 });
      const json = (await res.json()) as ApiErrorResponse;

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    // TC-103: 必須フィールド未入力エラー
    it("TC-103: battleTypeが未入力の場合に400エラーが返る", async () => {
      const input = {
        date: "2025-01-24",
        rank: "ダイアモンド",
        group: "AAA",
        myDeckId: "deck_001",
        turn: "先攻",
        result: "勝ち",
        opponentDeckId: "deck_master_002",
      };

      const req = new Request("http://localhost/api/battle-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const res = await app.fetch(req, { DB: mockDB, R2: mockR2 });
      const json = (await res.json()) as ApiErrorResponse;

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    // TC-104: 不正なEnum値エラー（battleType）
    it("TC-104: 不正なbattleType値の場合に400エラーが返る", async () => {
      const input = {
        date: "2025-01-24",
        battleType: "フリーマッチ",
        rank: "ダイアモンド",
        group: "AAA",
        myDeckId: "deck_001",
        turn: "先攻",
        result: "勝ち",
        opponentDeckId: "deck_master_002",
      };

      const req = new Request("http://localhost/api/battle-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const res = await app.fetch(req, { DB: mockDB, R2: mockR2 });
      const json = (await res.json()) as ApiErrorResponse;

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    // TC-109: 空のリクエストボディエラー
    it("TC-109: 空のリクエストボディで400エラーが返る", async () => {
      const req = new Request("http://localhost/api/battle-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const res = await app.fetch(req, { DB: mockDB, R2: mockR2 });
      const json = (await res.json()) as ApiErrorResponse;

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("DELETE /api/battle-logs/:id", () => {
    // TC-006: 対戦履歴の正常削除
    it("TC-006: 存在する対戦履歴が正しく削除できる", async () => {
      mockDB = createMockDB({ changes: 1 });
      app = createTestApp();

      const req = new Request("http://localhost/api/battle-logs/existing-uuid-123", {
        method: "DELETE",
      });
      const res = await app.fetch(req, { DB: mockDB, R2: mockR2 });
      const json = (await res.json()) as ApiResponse<DeletedData>;

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      if (json.success) {
        expect(json.data.deletedId).toBe("existing-uuid-123");
      }
      expect(json.meta.timestamp).toBeDefined();
      expect(json.meta.requestId).toBeDefined();
    });

    // TC-108: 存在しないIDの削除エラー
    it("TC-108: 存在しない対戦履歴IDを削除しようとした場合に404エラーが返る", async () => {
      mockDB = createMockDB({ changes: 0 });
      app = createTestApp();

      const req = new Request("http://localhost/api/battle-logs/non-existent-uuid", {
        method: "DELETE",
      });
      const res = await app.fetch(req, { DB: mockDB, R2: mockR2 });
      const json = (await res.json()) as ApiErrorResponse;

      expect(res.status).toBe(404);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("BATTLE_LOG_NOT_FOUND");
      expect(json.error.message).toContain("見つかりません");
    });
  });
});

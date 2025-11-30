import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeckMasterService } from "./deckMasterService";

/**
 * DeckMasterServiceの単体テスト
 * 🔵 青信号: タスクファイル (cloudflare-migration-phase2-part2-i.md) の仕様に基づく
 */

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

describe("DeckMasterService", () => {
  let mockDB: D1Database;
  let service: DeckMasterService;

  beforeEach(() => {
    mockDB = createMockDB();
    service = new DeckMasterService(mockDB);
    vi.clearAllMocks();
  });

  describe("getDeckMasters", () => {
    it("デッキマスター一覧を取得できる", async () => {
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
      service = new DeckMasterService(mockDB);

      const result = await service.getDeckMasters();

      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("deck_master_001");
      expect(result[0].className).toBe("エルフ");
      expect(result[0].deckName).toBe("アグロエルフ");
      expect(result[0].sortOrder).toBe(1);
      expect(result[1].id).toBe("deck_master_002");
      expect(result[1].className).toBe("ロイヤル");
    });

    it("sort_orderの昇順でソートされた結果を返す", async () => {
      const mockResults = [
        {
          id: "1",
          class_name: "エルフ",
          deck_name: "デッキA",
          sort_order: 1,
          created_at: "",
          updated_at: "",
        },
        {
          id: "2",
          class_name: "ロイヤル",
          deck_name: "デッキB",
          sort_order: 2,
          created_at: "",
          updated_at: "",
        },
        {
          id: "3",
          class_name: "ウィッチ",
          deck_name: "デッキC",
          sort_order: 3,
          created_at: "",
          updated_at: "",
        },
      ];

      mockDB = createMockDB({ results: mockResults });
      service = new DeckMasterService(mockDB);

      await service.getDeckMasters();

      // SQLクエリにORDER BY sort_order ASCが含まれていることを確認
      const prepareCall = vi.mocked(mockDB.prepare).mock.calls[0][0] as string;
      expect(prepareCall).toContain("ORDER BY");
      expect(prepareCall.toLowerCase()).toContain("sort_order");
      expect(prepareCall.toLowerCase()).toContain("asc");
    });

    it("データ0件時に空配列が返る", async () => {
      mockDB = createMockDB({ results: [] });
      service = new DeckMasterService(mockDB);

      const result = await service.getDeckMasters();

      expect(result).toEqual([]);
    });

    it("D1データベースからデータを取得する", async () => {
      mockDB = createMockDB({ results: [] });
      service = new DeckMasterService(mockDB);

      await service.getDeckMasters();

      expect(mockDB.prepare).toHaveBeenCalledWith(expect.stringContaining("SELECT"));
      expect(mockDB.prepare).toHaveBeenCalledWith(expect.stringContaining("deck_master"));
    });

    it("snake_caseのカラム名をcamelCaseに変換する", async () => {
      const mockResults = [
        {
          id: "deck_001",
          class_name: "ネクロマンサー",
          deck_name: "アグロネクロ",
          sort_order: 5,
          created_at: "2025-01-24T12:00:00Z",
          updated_at: "2025-01-25T12:00:00Z",
        },
      ];

      mockDB = createMockDB({ results: mockResults });
      service = new DeckMasterService(mockDB);

      const result = await service.getDeckMasters();

      // snake_caseではなくcamelCaseのプロパティを持つことを確認
      expect(result[0]).toHaveProperty("className");
      expect(result[0]).toHaveProperty("deckName");
      expect(result[0]).toHaveProperty("sortOrder");
      expect(result[0]).toHaveProperty("createdAt");
      expect(result[0]).toHaveProperty("updatedAt");

      // snake_caseのプロパティは存在しないことを確認
      expect(result[0]).not.toHaveProperty("class_name");
      expect(result[0]).not.toHaveProperty("deck_name");
      expect(result[0]).not.toHaveProperty("sort_order");
    });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CreateBattleLogInput } from "../utils/validation";
import { BattleLogService } from "./battleLogService";

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

describe("BattleLogService", () => {
  let mockDB: D1Database;
  let service: BattleLogService;

  beforeEach(() => {
    mockDB = createMockDB();
    service = new BattleLogService(mockDB);
    vi.clearAllMocks();
  });

  describe("createBattleLog", () => {
    // TC-001 に対応するサービステスト
    it("対戦履歴を正常に登録できる", async () => {
      const input: CreateBattleLogInput = {
        date: "2025-01-24",
        battleType: "ランクマッチ",
        rank: "ダイアモンド",
        group: "AAA",
        myDeckId: "deck_001",
        turn: "先攻",
        result: "勝ち",
        opponentDeckId: "deck_master_002",
      };

      const result = await service.createBattleLog(input);

      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^[a-f0-9-]{36}$/); // UUID形式
      expect(result.date).toBe("2025-01-24");
      expect(result.battleType).toBe("ランクマッチ");
      expect(result.rank).toBe("ダイアモンド");
      expect(result.group).toBe("AAA");
      expect(result.myDeckId).toBe("deck_001");
      expect(result.turn).toBe("先攻");
      expect(result.result).toBe("勝ち");
      expect(result.opponentDeckId).toBe("deck_master_002");

      // D1へのINSERTが実行されていることを確認
      expect(mockDB.prepare).toHaveBeenCalled();
    });

    it("D1への保存時にcreatedAtとupdatedAtが設定される", async () => {
      const input: CreateBattleLogInput = {
        date: "2025-01-24",
        battleType: "ランクマッチ",
        rank: "ダイアモンド",
        group: "AAA",
        myDeckId: "deck_001",
        turn: "先攻",
        result: "勝ち",
        opponentDeckId: "deck_master_002",
      };

      await service.createBattleLog(input);

      // INSERTクエリにdatetime('now')が含まれていることを確認
      const prepareCall = vi.mocked(mockDB.prepare).mock.calls[0][0] as string;
      expect(prepareCall).toContain("INSERT INTO battle_logs");
      expect(prepareCall).toContain("datetime('now')");
    });
  });

  describe("getBattleLogs", () => {
    // TC-003 に対応するサービステスト
    it("デフォルトパラメータで対戦履歴一覧を取得できる", async () => {
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
          created_at: "2025-01-24T12:00:00Z",
          updated_at: "2025-01-24T12:00:00Z",
        },
      ];

      mockDB = createMockDB({ results: mockResults, total: 84 });
      service = new BattleLogService(mockDB);

      const result = await service.getBattleLogs();

      expect(result.battleLogs).toBeInstanceOf(Array);
      expect(result.total).toBe(84);
      expect(mockDB.prepare).toHaveBeenCalled();
    });

    // TC-004 に対応するサービステスト
    it("ページネーションパラメータで対戦履歴一覧を取得できる", async () => {
      mockDB = createMockDB({ results: [], total: 100 });
      service = new BattleLogService(mockDB);

      const result = await service.getBattleLogs(10, 20);

      expect(result.battleLogs).toBeInstanceOf(Array);
      // prepareが呼ばれていることを確認
      expect(mockDB.prepare).toHaveBeenCalled();
    });

    // TC-005 に対応するサービステスト
    it("ソートパラメータで対戦履歴一覧の並び順が変わる", async () => {
      mockDB = createMockDB({ results: [], total: 0 });
      service = new BattleLogService(mockDB);

      await service.getBattleLogs(100, 0, "date", "asc");

      // prepareに渡されたクエリにORDER BY date ascが含まれていることを確認
      const prepareCall = vi.mocked(mockDB.prepare).mock.calls[0][0] as string;
      expect(prepareCall).toContain("ORDER BY");
      expect(prepareCall.toLowerCase()).toContain("asc");
    });

    // TC-204 に対応するサービステスト
    it("データ0件時に空配列とtotal:0が返る", async () => {
      mockDB = createMockDB({ results: [], total: 0 });
      service = new BattleLogService(mockDB);

      const result = await service.getBattleLogs();

      expect(result.battleLogs).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe("deleteBattleLog", () => {
    // TC-006 に対応するサービステスト
    it("存在する対戦履歴を削除できる", async () => {
      mockDB = createMockDB({ changes: 1 });
      service = new BattleLogService(mockDB);

      const result = await service.deleteBattleLog("existing-uuid-123");

      expect(result).toBe(true);
      expect(mockDB.prepare).toHaveBeenCalled();
      const prepareCall = vi.mocked(mockDB.prepare).mock.calls[0][0] as string;
      expect(prepareCall).toContain("DELETE FROM battle_logs");
    });

    // TC-108 に対応するサービステスト
    it("存在しない対戦履歴の削除はfalseを返す", async () => {
      mockDB = createMockDB({ changes: 0 });
      service = new BattleLogService(mockDB);

      const result = await service.deleteBattleLog("non-existent-uuid");

      expect(result).toBe(false);
    });
  });
});

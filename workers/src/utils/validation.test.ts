import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { createBattleLogSchema } from "./validation";

// 今日の日付を固定してテストの再現性を確保
const TODAY = "2025-11-30";
const FUTURE_DATE = "2099-12-31";

describe("createBattleLogSchema", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(`${TODAY}T12:00:00Z`));
  });

  describe("正常系テストケース", () => {
    // TC-001: 対戦履歴の正常登録（全項目指定）
    it("TC-001: 必須項目をすべて指定した対戦履歴が正しくバリデーションされる", () => {
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

      const result = createBattleLogSchema.parse(input);

      expect(result.date).toBe("2025-01-24");
      expect(result.battleType).toBe("ランクマッチ");
      expect(result.rank).toBe("ダイアモンド");
      expect(result.group).toBe("AAA");
      expect(result.myDeckId).toBe("deck_001");
      expect(result.turn).toBe("先攻");
      expect(result.result).toBe("勝ち");
      expect(result.opponentDeckId).toBe("deck_master_002");
    });

    // TC-002: 日付省略時に今日の日付が自動設定される
    it("TC-002: dateフィールド省略時に今日の日付が自動補完される", () => {
      const input = {
        battleType: "対戦台",
        rank: "ルビー",
        group: "A",
        myDeckId: "deck_002",
        turn: "後攻",
        result: "負け",
        opponentDeckId: "deck_master_005",
      };

      const result = createBattleLogSchema.parse(input);

      expect(result.date).toBe(TODAY);
    });

    // TC-206: 日付境界値（今日の日付）
    it("TC-206: 今日の日付で対戦履歴が正常にバリデーションされる", () => {
      const input = {
        date: TODAY,
        battleType: "ランクマッチ",
        rank: "ダイアモンド",
        group: "AAA",
        myDeckId: "deck_001",
        turn: "先攻",
        result: "勝ち",
        opponentDeckId: "deck_master_002",
      };

      const result = createBattleLogSchema.parse(input);

      expect(result.date).toBe(TODAY);
    });
  });

  describe("異常系テストケース", () => {
    // TC-101: 未来日付の登録エラー
    it("TC-101: 未来の日付を指定した場合にバリデーションエラーが返る", () => {
      const input = {
        date: FUTURE_DATE,
        battleType: "ランクマッチ",
        rank: "ダイアモンド",
        group: "AAA",
        myDeckId: "deck_001",
        turn: "先攻",
        result: "勝ち",
        opponentDeckId: "deck_master_002",
      };

      expect(() => createBattleLogSchema.parse(input)).toThrow(ZodError);

      try {
        createBattleLogSchema.parse(input);
      } catch (error) {
        if (error instanceof ZodError) {
          expect(error.errors[0].message).toContain("未来の日付");
        }
      }
    });

    // TC-102: 不正な日付形式のエラー
    it("TC-102: 不正な日付形式の場合にバリデーションエラーが返る", () => {
      const input = {
        date: "2025/01/24", // スラッシュ区切りは不正
        battleType: "ランクマッチ",
        rank: "ダイアモンド",
        group: "AAA",
        myDeckId: "deck_001",
        turn: "先攻",
        result: "勝ち",
        opponentDeckId: "deck_master_002",
      };

      expect(() => createBattleLogSchema.parse(input)).toThrow(ZodError);

      try {
        createBattleLogSchema.parse(input);
      } catch (error) {
        if (error instanceof ZodError) {
          expect(error.errors[0].message).toContain("YYYY-MM-DD");
        }
      }
    });

    // TC-103: 必須フィールド未入力エラー（battleType）
    it("TC-103: battleTypeが未入力の場合にバリデーションエラーが返る", () => {
      const input = {
        date: "2025-01-24",
        rank: "ダイアモンド",
        group: "AAA",
        myDeckId: "deck_001",
        turn: "先攻",
        result: "勝ち",
        opponentDeckId: "deck_master_002",
      };

      expect(() => createBattleLogSchema.parse(input)).toThrow(ZodError);
    });

    // TC-104: 不正なEnum値エラー（battleType）
    it("TC-104: 不正なbattleType値の場合にバリデーションエラーが返る", () => {
      const input = {
        date: "2025-01-24",
        battleType: "フリーマッチ", // 不正な値
        rank: "ダイアモンド",
        group: "AAA",
        myDeckId: "deck_001",
        turn: "先攻",
        result: "勝ち",
        opponentDeckId: "deck_master_002",
      };

      expect(() => createBattleLogSchema.parse(input)).toThrow(ZodError);

      try {
        createBattleLogSchema.parse(input);
      } catch (error) {
        if (error instanceof ZodError) {
          expect(error.errors[0].message).toContain("対戦タイプが不正");
        }
      }
    });

    // TC-105: 不正なEnum値エラー（rank）
    it("TC-105: 不正なrank値の場合にバリデーションエラーが返る", () => {
      const input = {
        date: "2025-01-24",
        battleType: "ランクマッチ",
        rank: "プラチナ", // 不正な値
        group: "AAA",
        myDeckId: "deck_001",
        turn: "先攻",
        result: "勝ち",
        opponentDeckId: "deck_master_002",
      };

      expect(() => createBattleLogSchema.parse(input)).toThrow(ZodError);

      try {
        createBattleLogSchema.parse(input);
      } catch (error) {
        if (error instanceof ZodError) {
          expect(error.errors[0].message).toContain("ランクが不正");
        }
      }
    });

    // TC-106: 不正なEnum値エラー（turn）
    it("TC-106: 不正なturn値の場合にバリデーションエラーが返る", () => {
      const input = {
        date: "2025-01-24",
        battleType: "ランクマッチ",
        rank: "ダイアモンド",
        group: "AAA",
        myDeckId: "deck_001",
        turn: "引き分け", // 不正な値
        result: "勝ち",
        opponentDeckId: "deck_master_002",
      };

      expect(() => createBattleLogSchema.parse(input)).toThrow(ZodError);

      try {
        createBattleLogSchema.parse(input);
      } catch (error) {
        if (error instanceof ZodError) {
          expect(error.errors[0].message).toContain("ターンが不正");
        }
      }
    });

    // TC-107: 不正なEnum値エラー（result）
    it("TC-107: 不正なresult値の場合にバリデーションエラーが返る", () => {
      const input = {
        date: "2025-01-24",
        battleType: "ランクマッチ",
        rank: "ダイアモンド",
        group: "AAA",
        myDeckId: "deck_001",
        turn: "先攻",
        result: "引き分け", // 不正な値
        opponentDeckId: "deck_master_002",
      };

      expect(() => createBattleLogSchema.parse(input)).toThrow(ZodError);

      try {
        createBattleLogSchema.parse(input);
      } catch (error) {
        if (error instanceof ZodError) {
          expect(error.errors[0].message).toContain("対戦結果が不正");
        }
      }
    });

    // TC-109: 空のリクエストボディエラー
    it("TC-109: 空のリクエストボディでバリデーションエラーが返る", () => {
      const input = {};

      expect(() => createBattleLogSchema.parse(input)).toThrow(ZodError);
    });

    // TC-205: 空文字のmyDeckIdエラー
    it("TC-205: myDeckIdが空文字の場合にバリデーションエラーが返る", () => {
      const input = {
        date: "2025-01-24",
        battleType: "ランクマッチ",
        rank: "ダイアモンド",
        group: "AAA",
        myDeckId: "", // 空文字
        turn: "先攻",
        result: "勝ち",
        opponentDeckId: "deck_master_002",
      };

      expect(() => createBattleLogSchema.parse(input)).toThrow(ZodError);

      try {
        createBattleLogSchema.parse(input);
      } catch (error) {
        if (error instanceof ZodError) {
          expect(error.errors[0].message).toContain("マイデッキID");
        }
      }
    });
  });
});

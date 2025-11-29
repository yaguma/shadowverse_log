import { z } from "zod";

/**
 * 未来日付かどうかを判定する
 */
const isFutureDate = (dateStr: string): boolean => {
  const inputDate = new Date(dateStr);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return inputDate > today;
};

/**
 * 今日の日付をYYYY-MM-DD形式で取得する
 */
const getTodayString = (): string => {
  return new Date().toISOString().split("T")[0];
};

/**
 * 対戦履歴作成用のZodスキーマ
 */
export const createBattleLogSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: "日付はYYYY-MM-DD形式で入力してください",
    })
    .refine((val) => !isFutureDate(val), {
      message: "未来の日付は入力できません",
    })
    .default(() => getTodayString()),

  battleType: z.enum(["ランクマッチ", "対戦台", "ロビー大会"], {
    errorMap: () => ({ message: "対戦タイプが不正です" }),
  }),

  rank: z.enum(["サファイア", "ダイアモンド", "ルビー", "トパーズ", "-"], {
    errorMap: () => ({ message: "ランクが不正です" }),
  }),

  group: z.enum(["A", "AA", "AAA", "Master", "-"], {
    errorMap: () => ({ message: "グループが不正です" }),
  }),

  myDeckId: z.string().min(1, { message: "マイデッキIDは必須です" }),

  turn: z.enum(["先攻", "後攻"], {
    errorMap: () => ({ message: "ターンが不正です" }),
  }),

  result: z.enum(["勝ち", "負け"], {
    errorMap: () => ({ message: "対戦結果が不正です" }),
  }),

  opponentDeckId: z.string().min(1, { message: "相手デッキIDは必須です" }),
});

export type CreateBattleLogInput = z.infer<typeof createBattleLogSchema>;

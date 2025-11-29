import { Hono } from "hono";
import { BattleLogService } from "../services/battleLogService";
import type { Bindings, Variables } from "../types";
import { createBattleLogSchema } from "../utils/validation";

const battleLogs = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * GET /api/battle-logs
 * 対戦履歴一覧を取得する
 */
battleLogs.get("/", async (c) => {
  const { limit = "100", offset = "0", sortBy = "date", sortOrder = "desc" } = c.req.query();

  const parsedLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 100, 1), 1000);
  const parsedOffset = Math.max(Number.parseInt(offset, 10) || 0, 0);
  const parsedSortOrder = sortOrder === "asc" ? "asc" : "desc";

  const service = new BattleLogService(c.env.DB);
  const result = await service.getBattleLogs(parsedLimit, parsedOffset, sortBy, parsedSortOrder);

  return c.json({
    success: true,
    data: {
      battleLogs: result.battleLogs,
      total: result.total,
      limit: parsedLimit,
      offset: parsedOffset,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    },
  });
});

/**
 * POST /api/battle-logs
 * 対戦履歴を新規登録する
 */
battleLogs.post("/", async (c) => {
  const body = await c.req.json();

  // Zodでバリデーション（safeParse使用でエラーを直接処理）
  const parseResult = createBattleLogSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "入力値が不正です",
          details: parseResult.error.errors.reduce(
            (acc, err) => {
              acc[err.path.join(".")] = err.message;
              return acc;
            },
            {} as Record<string, string>,
          ),
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      },
      400,
    );
  }

  const service = new BattleLogService(c.env.DB);
  const battleLog = await service.createBattleLog(parseResult.data);

  return c.json(
    {
      success: true,
      data: { battleLog },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    },
    201,
  );
});

/**
 * DELETE /api/battle-logs/:id
 * 対戦履歴を削除する
 */
battleLogs.delete("/:id", async (c) => {
  const id = c.req.param("id");

  const service = new BattleLogService(c.env.DB);
  const deleted = await service.deleteBattleLog(id);

  if (!deleted) {
    return c.json(
      {
        success: false,
        error: {
          code: "BATTLE_LOG_NOT_FOUND",
          message: "指定された対戦履歴が見つかりません",
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      },
      404,
    );
  }

  return c.json({
    success: true,
    data: { deletedId: id },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    },
  });
});

export default battleLogs;

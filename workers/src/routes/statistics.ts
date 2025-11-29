import { Hono } from "hono";
import type { Bindings, Variables } from "../types";

const statistics = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// TODO: TASK-0030で実装
statistics.get("/", async (c) => {
  return c.json({
    success: true,
    data: {
      overall: { totalGames: 0, wins: 0, losses: 0, winRate: 0 },
      byMyDeck: [],
      byOpponentDeck: [],
      byTurn: {
        first: { wins: 0, losses: 0, winRate: 0 },
        second: { wins: 0, losses: 0, winRate: 0 },
      },
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    },
  });
});

export default statistics;

import { Hono } from "hono";
import type { Bindings, Variables } from "../types";

const deckMaster = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// TODO: TASK-0029で実装
deckMaster.get("/", async (c) => {
  return c.json({
    success: true,
    data: { deckMaster: [] },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    },
  });
});

export default deckMaster;

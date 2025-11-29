import { Hono } from "hono";
import type { Bindings, Variables } from "../types";

const importData = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// TODO: TASK-0031で実装
importData.post("/", async (c) => {
  return c.json({
    success: true,
    data: { imported: 0, skipped: 0 },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    },
  });
});

export default importData;

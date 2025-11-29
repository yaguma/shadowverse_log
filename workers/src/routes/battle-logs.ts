import { Hono } from "hono";
import type { Bindings, Variables } from "../types";

const battleLogs = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// TODO: TASK-0028で実装
battleLogs.get("/", async (c) => {
  return c.json({
    success: true,
    data: { battleLogs: [], total: 0, limit: 100, offset: 0 },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    },
  });
});

battleLogs.post("/", async (c) => {
  return c.json(
    {
      success: true,
      data: { battleLog: null },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    },
    201,
  );
});

battleLogs.delete("/:id", async (c) => {
  const id = c.req.param("id");
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

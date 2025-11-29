import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { errorHandler } from "./middleware/errorHandler";
import routes from "./routes";
import type { Bindings, Variables } from "./types";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ミドルウェア設定
app.use("*", logger());
app.use("*", errorHandler);
app.use(
  "/api/*",
  cors({
    origin: ["http://localhost:5173", "https://shadowverse-log.pages.dev"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// ヘルスチェック
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// APIルート
app.route("/api", routes);

// 404ハンドラー
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "指定されたリソースが見つかりません",
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    },
    404,
  );
});

export default app;

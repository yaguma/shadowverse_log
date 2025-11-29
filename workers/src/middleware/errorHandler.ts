import type { Context, Next } from "hono";
import { ZodError } from "zod";

export const errorHandler = async (c: Context, next: Next) => {
  try {
    await next();
  } catch (error) {
    // ZodErrorの場合はバリデーションエラーとして処理
    if (error instanceof ZodError) {
      console.error("Validation Error:", JSON.stringify(error.errors));
      return c.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "入力値が不正です",
            details: error.errors.reduce(
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

    // その他のエラーはサーバーエラーとして処理
    console.error("Internal Error:", error instanceof Error ? error.message : String(error));
    return c.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "サーバーエラーが発生しました",
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      },
      500,
    );
  }
};

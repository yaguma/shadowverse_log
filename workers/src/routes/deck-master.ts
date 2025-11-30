import { Hono } from "hono";
import { DeckMasterService } from "../services/deckMasterService";
import type { Bindings, Variables } from "../types";

const deckMaster = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * GET /api/deck-master
 * デッキマスター一覧を取得する
 * 🔵 青信号: タスクファイル (cloudflare-migration-phase2-part2-i.md) の仕様に基づく
 *
 * キャッシュ戦略:
 * - Cache-Controlヘッダーを設定して5分間キャッシュ
 * - CloudflareのCDNキャッシュおよびブラウザキャッシュで有効
 * - デッキマスターデータは頻繁に変更されないため、キャッシュが有効
 */
deckMaster.get("/", async (c) => {
  // D1から取得
  const service = new DeckMasterService(c.env.DB);
  const deckMasters = await service.getDeckMasters();

  // Cache-Controlヘッダーを設定（5分間キャッシュ）
  c.header("Cache-Control", "public, max-age=300");

  return c.json({
    success: true,
    data: { deckMasters },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    },
  });
});

export default deckMaster;

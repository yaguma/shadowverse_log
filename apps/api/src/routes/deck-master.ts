/**
 * デッキマスターAPI ルート
 * TASK-0044: deck-master ルート実装
 * TASK-0005: DeckMaster API - GET（使用履歴付き）実装
 *
 * @description GET /api/deck-master エンドポイントの実装
 * 🔵 信頼性レベル: 青信号（api-endpoints.md 2.1より）
 */

import type { D1Database } from '@cloudflare/workers-types';
import { Hono } from 'hono';
import { createDb } from '../db';
import { DeckMasterRepository } from '../db/repositories/deck-master-repository';

/** 環境バインディング型 */
type Bindings = {
  DB: D1Database;
};

const deckMaster = new Hono<{ Bindings: Bindings }>();

/**
 * メタ情報を生成（countを含む）
 */
function createMeta(count?: number) {
  return {
    timestamp: new Date().toISOString(),
    requestId: crypto.randomUUID(),
    ...(count !== undefined && { count }),
  };
}

/**
 * エラーレスポンスを生成
 */
function createErrorResponse(code: string, message: string) {
  return {
    success: false as const,
    error: { code, message },
    meta: createMeta(),
  };
}

/**
 * GET /api/deck-master
 *
 * デッキマスター一覧を取得
 *
 * クエリパラメータ:
 * - includeUsage: boolean - 使用履歴情報を含める（REQ-EXT-302対応）
 *
 * キャッシュ戦略:
 * - Cache-Controlヘッダーを設定して5分間キャッシュ
 * - CloudflareのCDNキャッシュおよびブラウザキャッシュで有効
 * - デッキマスターデータは頻繁に変更されないため、キャッシュが有効
 *
 * ソート順（includeUsage=true時）:
 * 1. lastUsedDateがnullのものは末尾
 * 2. lastUsedDateの降順（新しいものが先）
 * 3. sortOrderの昇順
 */
deckMaster.get('/', async (c) => {
  try {
    // データベース接続とリポジトリ初期化
    const db = createDb(c.env.DB);
    const repository = new DeckMasterRepository(db);

    // クエリパラメータの取得
    const includeUsageParam = c.req.query('includeUsage');
    const includeUsage = includeUsageParam === 'true';

    // 使用履歴付きか通常取得かを判定
    const deckMasters = includeUsage
      ? await repository.findAllWithUsage()
      : await repository.findAll();

    // Cache-Controlヘッダーを設定（5分間キャッシュ）
    c.header('Cache-Control', 'public, max-age=300');

    return c.json({
      success: true,
      data: { deckMasters },
      meta: createMeta(deckMasters.length),
    });
  } catch (error) {
    console.error('Deck Master API error:', error);

    return c.json(
      createErrorResponse('DATABASE_ERROR', 'デッキマスターの取得中にエラーが発生しました。'),
      500
    );
  }
});

export default deckMaster;

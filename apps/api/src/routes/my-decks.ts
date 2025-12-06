/**
 * マイデッキAPI ルート
 *
 * @description GET /api/my-decks エンドポイントの実装
 * マイデッキ（自分のデッキ）一覧を取得するAPI
 */

import type { D1Database } from '@cloudflare/workers-types';
import { Hono } from 'hono';
import { createDb } from '../db';
import { MyDecksRepository } from '../db/repositories/my-decks-repository';

/** 環境バインディング型 */
type Bindings = {
  DB: D1Database;
};

const myDecksRoute = new Hono<{ Bindings: Bindings }>();

/**
 * メタ情報を生成
 */
function createMeta() {
  return {
    timestamp: new Date().toISOString(),
    requestId: crypto.randomUUID(),
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
 * GET /api/my-decks
 *
 * マイデッキ一覧を取得
 *
 * キャッシュ戦略:
 * - Cache-Controlヘッダーを設定して5分間キャッシュ
 * - CloudflareのCDNキャッシュおよびブラウザキャッシュで有効
 */
myDecksRoute.get('/', async (c) => {
  try {
    // データベース接続とリポジトリ初期化
    const db = createDb(c.env.DB);
    const repository = new MyDecksRepository(db);

    // アクティブなマイデッキを取得
    const decks = await repository.findActive();

    // Cache-Controlヘッダーを設定（5分間キャッシュ）
    c.header('Cache-Control', 'public, max-age=300');

    return c.json({
      success: true,
      data: { myDecks: decks },
      meta: createMeta(),
    });
  } catch (error) {
    console.error('My Decks API error:', error);

    return c.json(
      createErrorResponse('DATABASE_ERROR', 'マイデッキの取得中にエラーが発生しました。'),
      500
    );
  }
});

export default myDecksRoute;

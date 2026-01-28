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
function createErrorResponse(code: string, message: string, details?: unknown) {
  return {
    success: false as const,
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
    },
    meta: createMeta(),
  };
}

/**
 * UUIDの形式を検証
 */
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
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

/**
 * DELETE /api/my-decks/:id
 *
 * マイデッキを削除
 * TASK-0016: MyDeck API - DELETE 実装
 *
 * 削除前にbattle_logsでの参照チェックを行い、
 * 参照がある場合は409 Conflictを返す
 *
 * レスポンス:
 * - 204 No Content: 削除成功
 * - 400 Bad Request: 無効なID形式
 * - 404 Not Found: 指定されたIDが存在しない
 * - 409 Conflict: 対戦履歴で参照されている
 * - 500 Internal Server Error: データベースエラー
 */
myDecksRoute.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    // UUIDバリデーション
    if (!isValidUUID(id)) {
      return c.json(
        createErrorResponse('VALIDATION_ERROR', '無効なID形式です'),
        400
      );
    }

    // データベース接続とリポジトリ初期化
    const db = createDb(c.env.DB);
    const repository = new MyDecksRepository(db);

    // 存在確認
    const existing = await repository.findById(id);
    if (!existing) {
      return c.json(
        createErrorResponse('MY_DECK_NOT_FOUND', `MyDeck ID: ${id} が見つかりません`),
        404
      );
    }

    // 参照チェック
    const referenceCount = await repository.countReferences(id);
    if (referenceCount > 0) {
      return c.json(
        createErrorResponse(
          'DELETE_CONSTRAINT_ERROR',
          'このデッキは対戦履歴で使用されているため削除できません',
          {
            referencedBy: 'battle_logs',
            count: referenceCount,
          }
        ),
        409
      );
    }

    // 削除実行
    const deleted = await repository.delete(id);
    if (!deleted) {
      return c.json(
        createErrorResponse('DATABASE_ERROR', 'マイデッキの削除に失敗しました'),
        500
      );
    }

    // 204 No Content
    return c.body(null, 204);
  } catch (error) {
    console.error('My Decks DELETE API error:', error);

    return c.json(
      createErrorResponse('DATABASE_ERROR', 'マイデッキの削除中にエラーが発生しました'),
      500
    );
  }
});

export default myDecksRoute;

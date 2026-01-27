/**
 * デッキマスターAPI ルート
 * TASK-0044: deck-master ルート実装
 * TASK-0005: DeckMaster API - GET（使用履歴付き）実装
 * TASK-0008: DeckMaster API - DELETE 実装
 *
 * @description GET, DELETE /api/deck-master エンドポイントの実装
 * 🔵 信頼性レベル: 青信号（api-endpoints.md 2.1, 2.4より）
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
function createErrorResponse(code: string, message: string, details?: Record<string, unknown>) {
  return {
    success: false as const,
    error: {
      code,
      message,
      ...(details && { details }),
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

/**
 * DELETE /api/deck-master/:id
 *
 * デッキマスターを削除
 * TASK-0008: DeckMaster API - DELETE 実装
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
deckMaster.delete('/:id', async (c) => {
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
    const repository = new DeckMasterRepository(db);

    // 存在確認
    const existing = await repository.findById(id);
    if (!existing) {
      return c.json(
        createErrorResponse('NOT_FOUND', '指定されたデッキ種別が見つかりません'),
        404
      );
    }

    // 参照チェック
    const usageCount = await repository.countReferences(id);
    if (usageCount > 0) {
      return c.json(
        createErrorResponse(
          'DELETE_CONSTRAINT_ERROR',
          'このデッキ種別は対戦履歴で使用されているため削除できません',
          { usageCount }
        ),
        409
      );
    }

    // 削除実行
    const deleted = await repository.delete(id);
    if (!deleted) {
      return c.json(
        createErrorResponse('DATABASE_ERROR', 'デッキ種別の削除に失敗しました'),
        500
      );
    }

    // 204 No Content
    return c.body(null, 204);
  } catch (error) {
    console.error('Deck Master DELETE API error:', error);

    return c.json(
      createErrorResponse('DATABASE_ERROR', 'デッキ種別の削除中にエラーが発生しました'),
      500
    );
  }
});

export default deckMaster;

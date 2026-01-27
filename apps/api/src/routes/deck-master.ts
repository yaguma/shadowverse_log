/**
 * デッキマスターAPI ルート
 * TASK-0044: deck-master ルート実装
 * TASK-0007: PUT エンドポイント追加
 *
 * @description GET/PUT /api/deck-master エンドポイントの実装
 * 🔵 信頼性レベル: 青信号（workers/src/routes/deck-master.ts の仕様に基づく）
 */

import type { D1Database } from '@cloudflare/workers-types';
import { Hono } from 'hono';
import { createDb } from '../db';
import { DeckMasterRepository } from '../db/repositories/deck-master-repository';
import { DeckMasterIdSchema, PutDeckMasterSchema } from '../db/schema/deck-master.validation';

/** 環境バインディング型 */
type Bindings = {
  DB: D1Database;
};

const deckMaster = new Hono<{ Bindings: Bindings }>();

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
 * GET /api/deck-master
 *
 * デッキマスター一覧を取得
 *
 * キャッシュ戦略:
 * - Cache-Controlヘッダーを設定して5分間キャッシュ
 * - CloudflareのCDNキャッシュおよびブラウザキャッシュで有効
 * - デッキマスターデータは頻繁に変更されないため、キャッシュが有効
 */
deckMaster.get('/', async (c) => {
  try {
    // データベース接続とリポジトリ初期化
    const db = createDb(c.env.DB);
    const repository = new DeckMasterRepository(db);

    // sortOrder昇順で全件取得
    const deckMasters = await repository.findAll();

    // Cache-Controlヘッダーを設定（5分間キャッシュ）
    c.header('Cache-Control', 'public, max-age=300');

    return c.json({
      success: true,
      data: { deckMasters },
      meta: createMeta(),
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
 * PUT /api/deck-master/:id
 * TASK-0007: DeckMaster API - PUT 実装
 *
 * デッキマスターを更新
 *
 * - deckNameのみ更新可能
 * - classNameはリクエストに含まれていても無視（変更不可）
 * - updated_atは現在時刻で自動更新
 */
deckMaster.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    // IDのバリデーション
    const idValidation = DeckMasterIdSchema.safeParse(id);
    if (!idValidation.success) {
      return c.json(createErrorResponse('VALIDATION_ERROR', '無効なID形式です'), 400);
    }

    // リクエストボディの取得とバリデーション
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json(createErrorResponse('VALIDATION_ERROR', 'リクエストボディが必要です'), 400);
    }

    // deckNameのバリデーション
    const bodyValidation = PutDeckMasterSchema.safeParse(body);
    if (!bodyValidation.success) {
      const issues = bodyValidation.error.issues;
      const errorMessages = issues.map((issue) => issue.message).join(', ');
      return c.json(createErrorResponse('VALIDATION_ERROR', errorMessages), 400);
    }

    // データベース接続とリポジトリ初期化
    const db = createDb(c.env.DB);
    const repository = new DeckMasterRepository(db);

    // 既存レコードの存在確認
    const existing = await repository.findById(id);
    if (!existing) {
      return c.json(createErrorResponse('NOT_FOUND', '指定されたデッキ種別が見つかりません'), 404);
    }

    // deckNameのみ更新（classNameは無視）
    // updated_atはリポジトリで自動更新される
    const updated = await repository.update(id, {
      deckName: bodyValidation.data.deckName,
    });

    if (!updated) {
      return c.json(createErrorResponse('DATABASE_ERROR', '更新に失敗しました'), 500);
    }

    return c.json({
      success: true,
      data: updated,
      meta: createMeta(),
    });
  } catch (error) {
    console.error('Deck Master PUT API error:', error);

    return c.json(
      createErrorResponse('DATABASE_ERROR', 'デッキマスターの更新中にエラーが発生しました。'),
      500
    );
  }
});

export default deckMaster;

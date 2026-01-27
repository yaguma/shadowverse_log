/**
 * デッキマスターAPI ルート
 * TASK-0044: deck-master ルート実装
 * TASK-0005: DeckMaster API - GET（使用履歴付き）実装
 * TASK-0006: POST /api/deck-master 実装追加
 * TASK-0007: PUT エンドポイント追加
 * TASK-0008: DeckMaster API - DELETE 実装
 *
 * @description GET/POST/PUT/DELETE /api/deck-master エンドポイントの実装
 * 🔵 信頼性レベル: 青信号（api-endpoints.md 2.1, 2.2, 2.4より）
 */

import type { D1Database } from '@cloudflare/workers-types';
import { Hono } from 'hono';
import { CLASS_NAMES } from '@shadowverse-log/shared';
import { createDb } from '../db';
import { DeckMasterRepository } from '../db/repositories/deck-master-repository';
import { DeckMasterIdSchema, PutDeckMasterSchema } from '../db/schema/deck-master.validation';

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
 * POST /api/deck-master
 *
 * デッキマスターを新規登録
 * TASK-0006: DeckMaster API - POST 実装
 *
 * 🔵 信頼性レベル: 青信号（api-endpoints.md 2.2より、REQ-EXT-001〜005）
 *
 * リクエストボディ:
 * - className: クラス名（必須、有効なクラス名のみ）
 * - deckName: デッキ名（必須、1〜100文字）
 *
 * レスポンス:
 * - 201 Created: 正常登録
 * - 400 Bad Request: バリデーションエラー
 * - 500 Internal Server Error: データベースエラー
 */
deckMaster.post('/', async (c) => {
  try {
    // リクエストボディの取得
    let body: { className?: string; deckName?: string };
    try {
      body = await c.req.json();
    } catch {
      return c.json(
        createErrorResponse('VALIDATION_ERROR', '入力値が不正です', [
          { field: 'body', constraint: 'required', value: null },
        ]),
        400
      );
    }

    // バリデーション: リクエストボディの存在チェック
    if (!body || typeof body !== 'object') {
      return c.json(
        createErrorResponse('VALIDATION_ERROR', '入力値が不正です', [
          { field: 'body', constraint: 'required', value: body },
        ]),
        400
      );
    }

    const { className, deckName } = body;

    // バリデーション: className必須チェック
    if (!className || className === '') {
      return c.json(
        createErrorResponse('VALIDATION_ERROR', '入力値が不正です', [
          { field: 'className', constraint: 'required', value: className },
        ]),
        400
      );
    }

    // バリデーション: className有効値チェック（sharedパッケージのCLASS_NAMESを使用）
    if (!CLASS_NAMES.includes(className as (typeof CLASS_NAMES)[number])) {
      return c.json(
        createErrorResponse('VALIDATION_ERROR', '入力値が不正です', [
          { field: 'className', constraint: 'enum', value: className },
        ]),
        400
      );
    }

    // バリデーション: deckName必須チェック
    if (!deckName || deckName === '') {
      return c.json(
        createErrorResponse('VALIDATION_ERROR', '入力値が不正です', [
          { field: 'deckName', constraint: 'required', value: deckName },
        ]),
        400
      );
    }

    // バリデーション: deckName長さチェック（sharedパッケージのDeckNameSchemaと一貫して100文字）
    if (deckName.length > 100) {
      return c.json(
        createErrorResponse('VALIDATION_ERROR', '入力値が不正です', [
          { field: 'deckName', constraint: 'maxLength', value: deckName },
        ]),
        400
      );
    }

    // データベース接続とリポジトリ初期化
    const db = createDb(c.env.DB);
    const repository = new DeckMasterRepository(db);

    // sortOrderの自動採番（max + 1）
    const maxSortOrder = await repository.getMaxSortOrder();
    const newSortOrder = maxSortOrder + 1;

    // デッキマスター作成
    const newDeckMaster = await repository.create({
      className,
      deckName,
      sortOrder: newSortOrder,
    });

    return c.json(
      {
        success: true,
        data: newDeckMaster,
        meta: createMeta(),
      },
      201
    );
  } catch (error) {
    console.error('Deck Master POST API error:', error);

    return c.json(
      createErrorResponse('DATABASE_ERROR', 'デッキマスターの登録中にエラーが発生しました。'),
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

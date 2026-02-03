/**
 * マイデッキAPI ルート
 * TASK-0015: MyDeck API - POST 実装追加
 * TASK-0016: MyDeck API - DELETE 実装追加
 *
 * @description GET/POST/DELETE /api/my-decks エンドポイントの実装
 * マイデッキ（自分のデッキ）一覧を取得・作成・削除するAPI
 * 青信号 信頼性レベル: 青信号（api-endpoints.md 3.1, 3.2より、REQ-EXT-101〜107）
 */

import type { D1Database } from '@cloudflare/workers-types';
import { Hono } from 'hono';
import { createDb } from '../db';
import { MyDecksRepository } from '../db/repositories/my-decks-repository';
import { DeckMasterRepository } from '../db/repositories/deck-master-repository';
import { createMeta, createErrorResponse } from '../utils/response';
import { isValidUUID } from '../utils/validation';

/** 環境バインディング型 */
type Bindings = {
  DB: D1Database;
};

const myDecksRoute = new Hono<{ Bindings: Bindings }>();

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
 * POST /api/my-decks
 * TASK-0015: MyDeck API - POST 実装
 *
 * マイデッキを新規登録
 *
 * 青信号 信頼性レベル: 青信号（api-endpoints.md 3.2より、REQ-EXT-101〜107）
 *
 * リクエストボディ:
 * - deckId: DeckMasterのID（必須）
 * - deckName: デッキ名（必須）
 * - deckCode: デッキコード（任意、バリデーションなし）
 *
 * レスポンス:
 * - 201 Created: 正常登録
 * - 400 Bad Request: バリデーションエラー
 * - 404 Not Found: DeckMasterが見つからない
 * - 500 Internal Server Error: データベースエラー
 */
myDecksRoute.post('/', async (c) => {
  try {
    // リクエストボディの取得
    let body: { deckId?: string; deckName?: string; deckCode?: string };
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

    const { deckId, deckName, deckCode } = body;

    // バリデーション: deckId必須チェック（REQ-EXT-105）
    if (!deckId || deckId === '') {
      return c.json(
        createErrorResponse('VALIDATION_ERROR', '入力値が不正です', [
          { field: 'deckId', constraint: 'required', value: deckId },
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

    // データベース接続とリポジトリ初期化
    const db = createDb(c.env.DB);
    const myDecksRepository = new MyDecksRepository(db);
    const deckMasterRepository = new DeckMasterRepository(db);

    // DeckMaster存在確認（REQ-EXT-105）
    const deckMaster = await deckMasterRepository.findById(deckId);
    if (!deckMaster) {
      return c.json(
        createErrorResponse('DECK_MASTER_NOT_FOUND', `deckId: ${deckId} が見つかりません`),
        404
      );
    }

    // マイデッキ作成
    // - UUID自動生成（REQ-EXT-106）
    // - isActive = true 固定（REQ-EXT-102）
    // - classNameはDeckMasterから取得可能なため保存しない（正規化）
    // - createdAt自動設定（REQ-EXT-107）
    const newMyDeck = await myDecksRepository.create({
      deckId,
      deckName,
      deckCode: deckCode || '', // 任意、空文字許可（REQ-EXT-103）
      isActive: true,
    });

    return c.json(
      {
        success: true,
        data: newMyDeck,
        meta: createMeta(),
      },
      201
    );
  } catch (error) {
    console.error('My Decks POST API error:', error);

    return c.json(
      createErrorResponse('DATABASE_ERROR', 'マイデッキの登録中にエラーが発生しました。'),
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
      return c.json(createErrorResponse('VALIDATION_ERROR', '無効なID形式です'), 400);
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
      return c.json(createErrorResponse('DATABASE_ERROR', 'マイデッキの削除に失敗しました'), 500);
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

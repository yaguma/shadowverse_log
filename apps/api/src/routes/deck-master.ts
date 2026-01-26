/**
 * デッキマスターAPI ルート
 * TASK-0044: deck-master ルート実装
 * TASK-0006: POST /api/deck-master 実装追加
 *
 * @description GET/POST /api/deck-master エンドポイントの実装
 * 🔵 信頼性レベル: 青信号（workers/src/routes/deck-master.ts の仕様に基づく）
 * 🔵 信頼性レベル: 青信号（api-endpoints.md 2.2より、REQ-EXT-001〜005）
 */

import type { D1Database } from '@cloudflare/workers-types';
import { Hono } from 'hono';
import { createDb } from '../db';
import { DeckMasterRepository } from '../db/repositories/deck-master-repository';
// ClassNameSchema は VALID_CLASS_NAMES と重複するため、将来のリファクタリングで統合可能

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
function createErrorResponse(code: string, message: string, details?: unknown[]) {
  return {
    success: false as const,
    error: { code, message, ...(details ? { details } : {}) },
    meta: createMeta(),
  };
}

/**
 * 有効なクラス名一覧
 * TASK-0006: POST /api/deck-master 用
 */
const VALID_CLASS_NAMES = [
  'エルフ',
  'ロイヤル',
  'ウィッチ',
  'ドラゴン',
  'ネクロマンサー',
  'ヴァンパイア',
  'ビショップ',
  'ネメシス',
] as const;

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
 * POST /api/deck-master
 *
 * デッキマスターを新規登録
 * TASK-0006: DeckMaster API - POST 実装
 *
 * 🔵 信頼性レベル: 青信号（api-endpoints.md 2.2より、REQ-EXT-001〜005）
 *
 * リクエストボディ:
 * - className: クラス名（必須、有効なクラス名のみ）
 * - deckName: デッキ名（必須、1〜50文字）
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

    // バリデーション: className有効値チェック
    if (!VALID_CLASS_NAMES.includes(className as (typeof VALID_CLASS_NAMES)[number])) {
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

    // バリデーション: deckName長さチェック（タスク要件では1〜50文字）
    if (deckName.length > 50) {
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

export default deckMaster;

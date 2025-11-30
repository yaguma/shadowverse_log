/**
 * インポートAPI エンドポイント テスト
 * TASK-0031: インポートAPI実装
 *
 * @description POST /api/import エンドポイントのテスト
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';

// D1ImportServiceをモック
const mockImportFromJson = vi.fn().mockResolvedValue({
  imported: 3,
  skipped: 0,
  errors: 0,
  details: {},
});
const mockImportFromCsv = vi.fn().mockResolvedValue({
  imported: 3,
  skipped: 0,
  errors: 0,
  details: {},
});

vi.mock('../../src/services/d1-import-service', () => {
  return {
    D1ImportService: class {
      importFromJson = mockImportFromJson;
      importFromCsv = mockImportFromCsv;
    },
  };
});

// createDbをモック
vi.mock('../../src/db', () => ({
  createDb: vi.fn().mockReturnValue({}),
}));

import importRoutes from '../../src/routes/import';

// 環境バインディング型
interface Env {
  DB: D1Database;
}

describe('POST /api/import', () => {
  let app: Hono<{ Bindings: Env }>;
  let mockDB: D1Database;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDB = {} as unknown as D1Database;
    app = new Hono<{ Bindings: Env }>();
    app.route('/api/import', importRoutes);
  });

  // ===========================================
  // TC-025: 異常系: format未指定で400エラー
  // ===========================================
  describe('TC-025: 異常系: format未指定で400エラー', () => {
    it('format省略で400, INVALID_REQUESTを返す', async () => {
      const res = await app.request(
        '/api/import',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: '[]' }),
        },
        { DB: mockDB }
      );
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('INVALID_REQUEST');
    });
  });

  // ===========================================
  // TC-026: 異常系: data未指定で400エラー
  // ===========================================
  describe('TC-026: 異常系: data未指定で400エラー', () => {
    it('data省略で400, INVALID_REQUESTを返す', async () => {
      const res = await app.request(
        '/api/import',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ format: 'json' }),
        },
        { DB: mockDB }
      );
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('INVALID_REQUEST');
    });
  });

  // ===========================================
  // TC-027: 異常系: 不正なformat値で400エラー
  // ===========================================
  describe('TC-027: 異常系: 不正なformat値で400エラー', () => {
    it('format: "xml"で400, INVALID_FORMATを返す', async () => {
      const res = await app.request(
        '/api/import',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ format: 'xml', data: '<data></data>' }),
        },
        { DB: mockDB }
      );
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('INVALID_FORMAT');
    });
  });

  // ===========================================
  // TC-028: 正常系: format=jsonで成功
  // ===========================================
  describe('TC-028: 正常系: format=jsonで成功', () => {
    it('format: "json"と有効データで200, success: trueを返す', async () => {
      const res = await app.request(
        '/api/import',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            format: 'json',
            data: JSON.stringify([
              {
                date: '2025-01-24',
                battleType: 'ランクマッチ',
                rank: 'ダイアモンド',
                group: 'AAA',
                myDeckId: 'deck_001',
                turn: '先攻',
                result: '勝ち',
                opponentDeckId: 'deck_master_001',
              },
            ]),
          }),
        },
        { DB: mockDB }
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.imported).toBeDefined();
    });
  });

  // ===========================================
  // TC-029: 正常系: format=csvで成功
  // ===========================================
  describe('TC-029: 正常系: format=csvで成功', () => {
    it('format: "csv"と有効データで200, success: trueを返す', async () => {
      const csvData = `date,battleType,rank,group,myDeckId,turn,result,opponentDeckId
2025-01-24,ランクマッチ,ダイアモンド,AAA,deck_001,先攻,勝ち,deck_master_001`;

      const res = await app.request(
        '/api/import',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ format: 'csv', data: csvData }),
        },
        { DB: mockDB }
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.imported).toBeDefined();
    });
  });

  // ===========================================
  // TC-030: 正常系: 成功レスポンスに必要なフィールドが含まれる
  // ===========================================
  describe('TC-030: 正常系: 成功レスポンスに必要なフィールドが含まれる', () => {
    it('有効なリクエストでsuccess, data.imported, data.skipped, metaを返す', async () => {
      const res = await app.request(
        '/api/import',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ format: 'json', data: '[]' }),
        },
        { DB: mockDB }
      );
      const json = await res.json();

      expect(json.success).toBe(true);
      expect(json.data).toBeDefined();
      expect(json.data.imported).toBeDefined();
      expect(json.data.skipped).toBeDefined();
      expect(json.meta).toBeDefined();
    });
  });

  // ===========================================
  // TC-031: 異常系: エラーレスポンスに必要なフィールドが含まれる
  // ===========================================
  describe('TC-031: 異常系: エラーレスポンスに必要なフィールドが含まれる', () => {
    it('不正なリクエストでsuccess: false, error.code, error.message, metaを返す', async () => {
      const res = await app.request(
        '/api/import',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ format: 'invalid' }),
        },
        { DB: mockDB }
      );
      const json = await res.json();

      expect(json.success).toBe(false);
      expect(json.error).toBeDefined();
      expect(json.error.code).toBeDefined();
      expect(json.error.message).toBeDefined();
      expect(json.meta).toBeDefined();
    });
  });

  // ===========================================
  // TC-032: 正常系: metaにtimestampとrequestIdが含まれる
  // ===========================================
  describe('TC-032: 正常系: metaにtimestampとrequestIdが含まれる', () => {
    it('有効なリクエストでmeta.timestamp, meta.requestIdを返す', async () => {
      const res = await app.request(
        '/api/import',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ format: 'json', data: '[]' }),
        },
        { DB: mockDB }
      );
      const json = await res.json();

      expect(json.meta.timestamp).toBeDefined();
      expect(json.meta.requestId).toBeDefined();
    });
  });

  // ===========================================
  // TC-033: 異常系: JSON形式エラーで400エラー
  // ===========================================
  describe('TC-033: 異常系: JSON形式エラーで400エラー', () => {
    it('format: "json"と不正JSONで400, INVALID_FORMATを返す', async () => {
      // エラーを投げるようにモック変更
      mockImportFromJson.mockRejectedValueOnce(new Error('JSON形式が不正です'));

      const res = await app.request(
        '/api/import',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ format: 'json', data: '{invalid json}' }),
        },
        { DB: mockDB }
      );
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('INVALID_FORMAT');
    });
  });

  // ===========================================
  // TC-034: 異常系: CSVヘッダー不足で400エラー
  // ===========================================
  describe('TC-034: 異常系: CSVヘッダー不足で400エラー', () => {
    it('format: "csv"とヘッダー不足で400, INVALID_FORMATを返す', async () => {
      // エラーを投げるようにモック変更
      mockImportFromCsv.mockRejectedValueOnce(new Error('必須ヘッダーが不足しています'));

      const res = await app.request(
        '/api/import',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ format: 'csv', data: 'date,battleType,rank' }),
        },
        { DB: mockDB }
      );
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('INVALID_FORMAT');
    });
  });

  // ===========================================
  // TC-035: 異常系: D1エラーで500エラー
  // ===========================================
  describe('TC-035: 異常系: D1エラーで500エラー', () => {
    it('D1接続失敗で500, INTERNAL_ERRORを返す', async () => {
      // DBエラーを投げるようにモック変更
      mockImportFromJson.mockRejectedValueOnce(new Error('Database connection failed'));

      const res = await app.request(
        '/api/import',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ format: 'json', data: '[]' }),
        },
        { DB: mockDB }
      );
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('INTERNAL_ERROR');
    });
  });
});

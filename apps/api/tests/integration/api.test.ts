/**
 * API Integration Tests
 * TASK-0032: APIテスト・最適化
 *
 * @description 各APIエンドポイントの統合テスト
 * 🔵 信頼性レベル: 青信号（cloudflare-migration-phase2-part3-ii.md より）
 *
 * 注: DB依存のテストは各ルートテストファイルで実施済み。
 * ここではHTTPレベルの統合テストとエラーハンドリングを確認する。
 */
import { describe, it, expect } from 'vitest';
import app from '../../src/index';

/**
 * テスト用の最小モック環境
 * 注: 実際のDB操作は各ルートテストファイルで詳細にテスト済み
 */
function createMinimalMockEnv() {
  return {
    DB: {
      prepare: () => ({
        bind: () => ({
          all: async () => ({ results: [] }),
          first: async () => null,
          run: async () => ({ changes: 0 }),
        }),
        all: async () => ({ results: [] }),
        first: async () => null,
        run: async () => ({ changes: 0 }),
      }),
      batch: async () => [],
      exec: async () => {},
    },
    ENVIRONMENT: 'test',
    API_VERSION: '1.0.0-test',
    // CORS設定: テスト用オリジンを許可
    ALLOWED_ORIGINS: 'http://localhost:5173,http://example.com',
  };
}

describe('API Integration Tests', () => {
  describe('Root Endpoint', () => {
    it('GET / - ルートエンドポイントが正しく応答する', async () => {
      const env = createMinimalMockEnv();
      const request = new Request('http://localhost/');
      const response = await app.fetch(request, env);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Shadowverse Battle Log API');
      expect(data.data.version).toBe('1.0.0-test');
      expect(data.data.environment).toBe('test');
    });
  });

  describe('Health Check', () => {
    it('GET /health - ヘルスチェックが正しく応答する', async () => {
      const env = createMinimalMockEnv();
      const request = new Request('http://localhost/health');
      const response = await app.fetch(request, env);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('healthy');
      expect(data.data).toHaveProperty('timestamp');
      expect(data.data.version).toBe('1.0.0-test');
    });
  });

  describe('Statistics API - Validation', () => {
    it('GET /api/statistics?startDate=invalid - 不正な日付形式でエラーを返す', async () => {
      const env = createMinimalMockEnv();
      const request = new Request('http://localhost/api/statistics?startDate=invalid');
      const response = await app.fetch(request, env);

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_DATE_FORMAT');
      expect(data).toHaveProperty('meta');
      expect(data.meta).toHaveProperty('timestamp');
      expect(data.meta).toHaveProperty('requestId');
    });

    it('GET /api/statistics?endDate=not-a-date - endDateの不正な日付形式でエラーを返す', async () => {
      const env = createMinimalMockEnv();
      const request = new Request('http://localhost/api/statistics?endDate=not-a-date');
      const response = await app.fetch(request, env);

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_DATE_FORMAT');
    });

    it('GET /api/statistics?startDate=2025-12-31&endDate=2025-01-01 - 日付範囲エラーを返す', async () => {
      const env = createMinimalMockEnv();
      const request = new Request(
        'http://localhost/api/statistics?startDate=2025-12-31&endDate=2025-01-01'
      );
      const response = await app.fetch(request, env);

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_DATE_RANGE');
    });
  });

  describe('Import API - Validation', () => {
    it('POST /api/import - format未指定でエラーを返す', async () => {
      const env = createMinimalMockEnv();
      const request = new Request('http://localhost/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: '{}' }),
      });

      const response = await app.fetch(request, env);

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_REQUEST');
      expect(data.error.message).toContain('format');
    });

    it('POST /api/import - data未指定でエラーを返す', async () => {
      const env = createMinimalMockEnv();
      const request = new Request('http://localhost/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'json' }),
      });

      const response = await app.fetch(request, env);

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_REQUEST');
      expect(data.error.message).toContain('data');
    });

    it('POST /api/import - 不正なformat値でエラーを返す', async () => {
      const env = createMinimalMockEnv();
      const request = new Request('http://localhost/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'xml', data: '{}' }),
      });

      const response = await app.fetch(request, env);

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_FORMAT');
    });

    it('POST /api/import - 不正なJSONボディでエラーを返す', async () => {
      const env = createMinimalMockEnv();
      const request = new Request('http://localhost/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not valid json',
      });

      const response = await app.fetch(request, env);

      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('GET /unknown - 存在しないルートで404を返す', async () => {
      const env = createMinimalMockEnv();
      const request = new Request('http://localhost/unknown');
      const response = await app.fetch(request, env);

      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
      expect(data.error.message).toContain('GET');
      expect(data.error.message).toContain('/unknown');
    });

    it('POST /api/unknown - 存在しないAPIエンドポイントで404を返す', async () => {
      const env = createMinimalMockEnv();
      const request = new Request('http://localhost/api/unknown', {
        method: 'POST',
      });
      const response = await app.fetch(request, env);

      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
    });
  });

  describe('CORS Headers', () => {
    it('OPTIONSリクエストでCORSヘッダーが返される', async () => {
      const env = createMinimalMockEnv();
      const request = new Request('http://localhost/api/statistics', {
        method: 'OPTIONS',
        headers: { Origin: 'http://example.com' },
      });
      const response = await app.fetch(request, env);

      // CORSミドルウェアが適用されている
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeTruthy();
    });
  });

  describe('Response Format Consistency', () => {
    it('成功レスポンスの形式が一貫している', async () => {
      const env = createMinimalMockEnv();
      const request = new Request('http://localhost/');
      const response = await app.fetch(request, env);
      const data = await response.json();

      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
    });

    it('エラーレスポンスの形式が一貫している', async () => {
      const env = createMinimalMockEnv();
      const request = new Request('http://localhost/not-found');
      const response = await app.fetch(request, env);
      const data = await response.json();

      expect(data).toHaveProperty('success', false);
      expect(data).toHaveProperty('error');
      expect(data.error).toHaveProperty('code');
      expect(data.error).toHaveProperty('message');
    });
  });

  describe('Large Data Import - SQLite Placeholder Limit', () => {
    /**
     * SQLite SQLITE_MAX_VARIABLE_NUMBER制限テスト
     * D1/SQLiteではプレースホルダー数に制限があるため、
     * 大量データをバッチ処理で処理する必要がある
     *
     * 注: IDありのデータはDBのinArrayクエリが必要なため、
     * 完全なモックが必要。詳細なバッチ処理テストは
     * d1-import-service.test.ts で実施済み。
     */

    it('POST /api/import - IDなしの600件データでも正常に処理される', async () => {
      // IDなしの600件データ（バッチサイズ500を超える、ID自動生成のテスト）
      // IDがない場合はgetExistingIdsでDBクエリが発生しない
      const records = Array.from({ length: 600 }, () => ({
        date: '2025-01-24',
        battleType: 'ランクマッチ',
        rank: 'ダイアモンド',
        groupName: 'AAA',
        myDeckId: 'deck_001',
        turn: '先攻',
        result: '勝ち',
        opponentDeckId: 'deck_master_001',
      }));

      const env = createMinimalMockEnv();
      const request = new Request('http://localhost/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'json',
          data: JSON.stringify(records),
        }),
      });

      const response = await app.fetch(request, env);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.imported).toBe(600);
    });

    it('POST /api/import - IDなしの1000件超データでもタイムアウトしない', async () => {
      // IDなしの1100件のテストデータを生成（複数バッチに分割される）
      const records = Array.from({ length: 1100 }, (_, i) => ({
        date: '2025-01-24',
        battleType: 'ランクマッチ',
        rank: 'ダイアモンド',
        groupName: 'AAA',
        myDeckId: 'deck_001',
        turn: i % 2 === 0 ? '先攻' : '後攻',
        result: i % 3 === 0 ? '勝ち' : '負け',
        opponentDeckId: `deck_master_${i % 10}`,
      }));

      const env = createMinimalMockEnv();
      const request = new Request('http://localhost/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'json',
          data: JSON.stringify(records),
        }),
      });

      const startTime = Date.now();
      const response = await app.fetch(request, env);
      const elapsedTime = Date.now() - startTime;

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.imported).toBe(1100);

      // 処理時間が妥当な範囲内であることを確認（5秒以内）
      expect(elapsedTime).toBeLessThan(5000);
    });

    it('POST /api/import - CSV形式のIDなし大量データでも正常に処理される', async () => {
      // CSVヘッダー（IDなし）
      let csvData =
        'date,battleType,rank,groupName,myDeckId,turn,result,opponentDeckId\n';

      // 600行のCSVデータを生成（IDなし）
      for (let i = 0; i < 600; i++) {
        csvData += `2025-01-24,ランクマッチ,ダイアモンド,AAA,deck_001,先攻,勝ち,deck_master_001\n`;
      }

      const env = createMinimalMockEnv();
      const request = new Request('http://localhost/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'csv',
          data: csvData,
        }),
      });

      const response = await app.fetch(request, env);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.imported).toBe(600);
    });

    it('POST /api/import - 大量データでもレスポンス形式が正しい', async () => {
      // 500件のデータ
      const records = Array.from({ length: 500 }, () => ({
        date: '2025-01-24',
        battleType: 'ランクマッチ',
        rank: 'ダイアモンド',
        groupName: 'AAA',
        myDeckId: 'deck_001',
        turn: '先攻',
        result: '勝ち',
        opponentDeckId: 'deck_master_001',
      }));

      const env = createMinimalMockEnv();
      const request = new Request('http://localhost/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'json',
          data: JSON.stringify(records),
        }),
      });

      const response = await app.fetch(request, env);

      expect(response.status).toBe(200);

      const data = await response.json();
      // レスポンス形式の検証
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('imported');
      expect(data.data).toHaveProperty('skipped');
      expect(data.data).toHaveProperty('errors');
      expect(data).toHaveProperty('meta');
      expect(data.meta).toHaveProperty('timestamp');
      expect(data.meta).toHaveProperty('requestId');
    });
  });
});

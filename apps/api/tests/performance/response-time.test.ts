/**
 * Performance Tests - Response Time
 * TASK-0032: APIテスト・最適化
 *
 * @description 各エンドポイントのレスポンスタイムテスト
 * 🔵 信頼性レベル: 青信号（cloudflare-migration-phase2-part3-ii.md より）
 *
 * 目標レスポンスタイム:
 * - GET /api/battle-logs: 100ms以内
 * - POST /api/battle-logs: 50ms以内
 * - GET /api/statistics: 200ms以内
 * - POST /api/import: 500ms以内
 */
import { describe, it, expect } from 'vitest';
import app from '../../src/index';

/**
 * テスト用の最小モック環境
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
  };
}

/**
 * レスポンスタイムを計測するユーティリティ
 */
async function measureResponseTime(
  request: Request,
  env: ReturnType<typeof createMinimalMockEnv>
): Promise<{ response: Response; durationMs: number }> {
  const start = performance.now();
  const response = await app.fetch(request, env);
  const durationMs = performance.now() - start;
  return { response, durationMs };
}

describe('Performance Tests - Response Time', () => {
  describe('Health Check', () => {
    it('GET /health が50ms以内に応答する', async () => {
      const env = createMinimalMockEnv();
      const request = new Request('http://localhost/health');

      const { response, durationMs } = await measureResponseTime(request, env);

      expect(response.status).toBe(200);
      expect(durationMs).toBeLessThan(50);
    });
  });

  describe('Root Endpoint', () => {
    it('GET / が50ms以内に応答する', async () => {
      const env = createMinimalMockEnv();
      const request = new Request('http://localhost/');

      const { response, durationMs } = await measureResponseTime(request, env);

      expect(response.status).toBe(200);
      expect(durationMs).toBeLessThan(50);
    });
  });

  describe('Statistics API', () => {
    it('GET /api/statistics が200ms以内に応答する（バリデーション）', async () => {
      const env = createMinimalMockEnv();
      const request = new Request('http://localhost/api/statistics?startDate=invalid');

      const { response, durationMs } = await measureResponseTime(request, env);

      // バリデーションエラーなので400を期待
      expect(response.status).toBe(400);
      expect(durationMs).toBeLessThan(200);
    });
  });

  describe('Import API', () => {
    it('POST /api/import が200ms以内に応答する（バリデーション）', async () => {
      const env = createMinimalMockEnv();
      const request = new Request('http://localhost/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'json' }), // data未指定でバリデーションエラー
      });

      const { response, durationMs } = await measureResponseTime(request, env);

      expect(response.status).toBe(400);
      expect(durationMs).toBeLessThan(200);
    });
  });

  describe('404 Error', () => {
    it('存在しないルートが50ms以内に応答する', async () => {
      const env = createMinimalMockEnv();
      const request = new Request('http://localhost/unknown-route');

      const { response, durationMs } = await measureResponseTime(request, env);

      expect(response.status).toBe(404);
      expect(durationMs).toBeLessThan(50);
    });
  });

  describe('Multiple Sequential Requests', () => {
    it('連続10リクエストの平均が50ms以内', async () => {
      const env = createMinimalMockEnv();
      const durations: number[] = [];

      for (let i = 0; i < 10; i++) {
        const request = new Request('http://localhost/');
        const { durationMs } = await measureResponseTime(request, env);
        durations.push(durationMs);
      }

      const average = durations.reduce((a, b) => a + b, 0) / durations.length;
      expect(average).toBeLessThan(50);
    });
  });

  describe('Request Overhead', () => {
    it('JSONパース処理のオーバーヘッドが許容範囲内', async () => {
      const env = createMinimalMockEnv();

      // 大きなJSONボディ
      const largeData = {
        format: 'json',
        data: JSON.stringify({
          deckMaster: Array(100)
            .fill(null)
            .map((_, i) => ({
              id: `deck_${i}`,
              name: `Deck ${i}`,
              class: 'エルフ',
            })),
          battleLogs: [],
          myDecks: [],
        }),
      };

      const request = new Request('http://localhost/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(largeData),
      });

      const { durationMs } = await measureResponseTime(request, env);

      // 大きなボディでも500ms以内
      expect(durationMs).toBeLessThan(500);
    });
  });
});

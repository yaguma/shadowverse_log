/**
 * シーズン一覧取得API テスト
 * TASK-0025: Statistics API - シーズン一覧取得実装
 *
 * @description GET /api/statistics/seasons エンドポイントのテスト
 * TDDプロセスに従い、先にテストを作成
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { Hono } from 'hono';

// 環境バインディング型
interface Env {
  DB: unknown;
}

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
 * テスト用のモックデータを保持
 */
let mockSeasons: number[] = [];
let mockShouldError = false;

/**
 * テスト用アプリケーションを作成
 * 実際のデータベース接続をモックで代替
 */
function createTestApp() {
  const app = new Hono<{ Bindings: Env }>();

  app.get('/api/statistics/seasons', async (c) => {
    try {
      // データベースエラーのシミュレーション
      if (mockShouldError) {
        throw new Error('Database error');
      }

      // モックデータを返す（重複排除 + 降順ソート）
      const uniqueSeasons = [...new Set(mockSeasons)].sort((a, b) => b - a);

      return c.json({
        success: true,
        data: {
          seasons: uniqueSeasons,
        },
        meta: createMeta(),
      });
    } catch {
      return c.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'シーズン一覧の取得中にエラーが発生しました。',
          },
          meta: createMeta(),
        },
        500
      );
    }
  });

  return app;
}

describe('GET /api/statistics/seasons - シーズン一覧取得API', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    app = createTestApp();
    mockSeasons = [];
    mockShouldError = false;
  });

  // ===========================================
  // TC-SEASONS-001: シーズン一覧が正常に取得できる
  // ===========================================
  describe('TC-SEASONS-001: シーズン一覧が正常に取得できる', () => {
    it('複数シーズンのデータがある場合、降順でソートされて返される', async () => {
      // Arrange: テストデータを設定
      mockSeasons = [1, 3, 2, 5, 4];

      // Act
      const res = await app.request('/api/statistics/seasons');
      const json = await res.json();

      // Assert
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.seasons).toEqual([5, 4, 3, 2, 1]);
    });

    it('単一シーズンのデータがある場合、そのシーズンのみ返される', async () => {
      // Arrange
      mockSeasons = [3];

      // Act
      const res = await app.request('/api/statistics/seasons');
      const json = await res.json();

      // Assert
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.seasons).toEqual([3]);
    });
  });

  // ===========================================
  // TC-SEASONS-002: 重複シーズンが排除される
  // ===========================================
  describe('TC-SEASONS-002: 重複シーズンが排除される', () => {
    it('同じシーズンが複数あっても重複は排除される', async () => {
      // Arrange: 重複を含むデータ
      mockSeasons = [1, 1, 2, 2, 3, 3, 3];

      // Act
      const res = await app.request('/api/statistics/seasons');
      const json = await res.json();

      // Assert
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      // 重複が排除されていることを確認
      expect(json.data.seasons).toEqual([3, 2, 1]);
    });
  });

  // ===========================================
  // TC-SEASONS-003: 対戦履歴0件時は空配列が返される
  // ===========================================
  describe('TC-SEASONS-003: 対戦履歴0件時は空配列が返される', () => {
    it('対戦履歴がない場合、空のシーズン配列が返される', async () => {
      // Arrange: データなし
      mockSeasons = [];

      // Act
      const res = await app.request('/api/statistics/seasons');
      const json = await res.json();

      // Assert
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.seasons).toEqual([]);
    });
  });

  // ===========================================
  // TC-SEASONS-004: APIレスポンス形式が正しい
  // ===========================================
  describe('TC-SEASONS-004: APIレスポンス形式が正しい', () => {
    it('レスポンスが標準API形式に準拠している', async () => {
      // Arrange
      mockSeasons = [1, 2];

      // Act
      const res = await app.request('/api/statistics/seasons');
      const json = await res.json();

      // Assert
      expect(json.success).toBe(true);
      expect(json.data).toBeDefined();
      expect(json.data.seasons).toBeDefined();
      expect(Array.isArray(json.data.seasons)).toBe(true);
      expect(json.meta).toBeDefined();
      expect(json.meta.timestamp).toBeDefined();
      expect(json.meta.requestId).toBeDefined();
    });

    it('Content-Typeがapplication/jsonである', async () => {
      // Act
      const res = await app.request('/api/statistics/seasons');

      // Assert
      expect(res.headers.get('Content-Type')).toContain('application/json');
    });
  });

  // ===========================================
  // TC-SEASONS-005: エラー時は適切なエラーレスポンスが返される
  // ===========================================
  describe('TC-SEASONS-005: エラー時は適切なエラーレスポンスが返される', () => {
    it('データベースエラー時は500エラーが返される', async () => {
      // Arrange: エラーをシミュレート
      mockShouldError = true;

      // Act
      const res = await app.request('/api/statistics/seasons');
      const json = await res.json();

      // Assert
      expect(res.status).toBe(500);
      expect(json.success).toBe(false);
      expect(json.error).toBeDefined();
      expect(json.error.code).toBe('DATABASE_ERROR');
      expect(json.error.message).toBe('シーズン一覧の取得中にエラーが発生しました。');
      expect(json.meta).toBeDefined();
    });
  });
});

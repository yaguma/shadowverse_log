/**
 * Import API の統合テストスイート
 *
 * テストフレームワーク: Jest 29.7.0 + ts-jest
 * テスト対象: backend/src/functions/import.ts
 *
 * テストケース定義書: docs/implements/shadowverse-battle-log/TASK-0012/testcases.md
 * 要件定義書: docs/implements/shadowverse-battle-log/TASK-0012/requirements.md
 *
 * テストケース総数: 7件（Azure Function API統合テスト）
 */

import type { HttpRequest, InvocationContext } from '@azure/functions';
import { importData } from '../../src/functions/import';
import { BlobStorageClient } from '../../src/storage/blobStorageClient';

// BlobStorageClient のモック
jest.mock('../../src/storage/blobStorageClient');

describe('POST /api/import - 統合テスト', () => {
  let mockContext: InvocationContext;

  beforeEach(() => {
    jest.clearAllMocks();

    // InvocationContext のモック
    mockContext = {
      invocationId: 'test-invocation-id',
      error: jest.fn(),
    } as unknown as InvocationContext;

    // 環境変数のモック
    process.env.AZURE_STORAGE_CONNECTION_STRING =
      'DefaultEndpointsProtocol=https;AccountName=test;';
    process.env.AZURE_STORAGE_CONTAINER_NAME = 'test-container';

    // BlobStorageClient のモック設定
    const MockBlobStorageClient = BlobStorageClient as jest.MockedClass<typeof BlobStorageClient>;
    MockBlobStorageClient.prototype.getBattleLogs = jest.fn().mockResolvedValue([]);
    MockBlobStorageClient.prototype.saveBattleLogs = jest.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // =============================================================================
  // 10. Azure Function (import.ts) - 統合テスト
  // =============================================================================

  describe('正常系 API テスト', () => {
    // TC-API-001: 正常なJSONインポートAPI
    test('[TC-API-001] should successfully import JSON data via API', async () => {
      const request = {
        json: async () => ({
          format: 'json',
          data: JSON.stringify([
            {
              date: '2025-01-24',
              battleType: 'ランクマッチ',
              rank: 'ダイアモンド',
              group: 'AA',
              myDeckId: 'ロイヤル',
              turn: '先攻',
              result: '勝ち',
              opponentDeckId: 'ネクロ',
            },
          ]),
        }),
      } as HttpRequest;

      const response = await importData(request, mockContext);

      expect(response.status).toBe(200);

      const body = JSON.parse(response.body as string);
      expect(body.success).toBe(true);
      expect(body.data.imported).toBeGreaterThan(0);
      expect(body.meta.timestamp).toBeDefined();
      expect(body.meta.requestId).toBe('test-invocation-id');
    });

    // TC-API-002: 正常なCSVインポートAPI
    test('[TC-API-002] should successfully import CSV data via API', async () => {
      const request = {
        json: async () => ({
          format: 'csv',
          data: 'date,battleType,rank,group,myDeckId,turn,result,opponentDeckId\n2025-01-24,ランクマッチ,ダイアモンド,AA,ロイヤル,先攻,勝ち,ネクロ',
        }),
      } as HttpRequest;

      const response = await importData(request, mockContext);

      expect(response.status).toBe(200);

      const body = JSON.parse(response.body as string);
      expect(body.success).toBe(true);
      expect(body.data.imported).toBeGreaterThan(0);
      expect(body.meta.timestamp).toBeDefined();
      expect(body.meta.requestId).toBe('test-invocation-id');
    });
  });

  describe('異常系 API テスト', () => {
    // TC-API-ERR-001: format未指定エラー
    test('[TC-API-ERR-001] should return 400 when format is missing', async () => {
      const request = {
        json: async () => ({
          data: '[]',
        }),
      } as HttpRequest;

      const response = await importData(request, mockContext);

      expect(response.status).toBe(400);

      const body = JSON.parse(response.body as string);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_REQUEST');
      expect(body.error.message).toContain('format');
    });

    // TC-API-ERR-002: data未指定エラー
    test('[TC-API-ERR-002] should return 400 when data is missing', async () => {
      const request = {
        json: async () => ({
          format: 'json',
        }),
      } as HttpRequest;

      const response = await importData(request, mockContext);

      expect(response.status).toBe(400);

      const body = JSON.parse(response.body as string);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_REQUEST');
      expect(body.error.message).toContain('data');
    });

    // TC-API-ERR-003: 不正なformat値
    test('[TC-API-ERR-003] should return 400 when format is invalid', async () => {
      const request = {
        json: async () => ({
          format: 'xml',
          data: '[]',
        }),
      } as HttpRequest;

      const response = await importData(request, mockContext);

      expect(response.status).toBe(400);

      const body = JSON.parse(response.body as string);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_FORMAT');
      expect(body.error.message).toContain('json');
      expect(body.error.message).toContain('csv');
    });

    // TC-API-ERR-004: JSONパースエラー
    test('[TC-API-ERR-004] should return 400 for invalid JSON format', async () => {
      const request = {
        json: async () => ({
          format: 'json',
          data: '{ invalid json }',
        }),
      } as HttpRequest;

      const response = await importData(request, mockContext);

      expect(response.status).toBe(400);

      const body = JSON.parse(response.body as string);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_FORMAT');
      expect(body.error.message).toContain('JSON');
    });

    // TC-API-ERR-005: CSVヘッダー不足エラー
    test('[TC-API-ERR-005] should return 400 for missing CSV headers', async () => {
      const request = {
        json: async () => ({
          format: 'csv',
          data: 'date,battleType\n2025-01-24,ランクマッチ',
        }),
      } as HttpRequest;

      const response = await importData(request, mockContext);

      expect(response.status).toBe(400);

      const body = JSON.parse(response.body as string);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_FORMAT');
      expect(body.error.message).toContain('ヘッダー');
    });

    // TC-API-ERR-006: 内部サーバーエラー
    test('[TC-API-ERR-006] should return 500 for Blob Storage errors', async () => {
      // BlobStorageClient のモックをエラーを返すように設定
      const MockBlobStorageClient = BlobStorageClient as jest.MockedClass<typeof BlobStorageClient>;
      MockBlobStorageClient.prototype.getBattleLogs = jest
        .fn()
        .mockRejectedValue(new Error('Connection failed'));

      const request = {
        json: async () => ({
          format: 'json',
          data: JSON.stringify([
            {
              date: '2025-01-24',
              battleType: 'ランクマッチ',
              rank: 'ダイアモンド',
              group: 'AA',
              myDeckId: 'ロイヤル',
              turn: '先攻',
              result: '勝ち',
              opponentDeckId: 'ネクロ',
            },
          ]),
        }),
      } as HttpRequest;

      const response = await importData(request, mockContext);

      expect(response.status).toBe(500);

      const body = JSON.parse(response.body as string);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INTERNAL_SERVER_ERROR');
      expect(body.error.message).toBeDefined();
      expect(mockContext.error).toHaveBeenCalled();
    });
  });
});

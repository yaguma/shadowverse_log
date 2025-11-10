import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './client';

// 【テストファイル概要】: API Clientの単体テスト
// 【テスト目的】: Backend APIとの通信を行うAPI Clientの動作を検証する
// 【テスト範囲】: GET, POST, DELETEリクエストの正常系とエラー系

describe('API Client', () => {
  // 【テスト前準備】: 各テスト実行前にfetchをモック化し、一貫したテスト環境を構築
  // 【環境初期化】: グローバルなfetch関数をVitest のモック関数に置き換える
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  // 【テスト後処理】: 各テスト実行後にモックをクリアして次のテストに影響を与えないようにする
  // 【状態復元】: モックの呼び出し履歴をリセットし、テスト間の独立性を保証
  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==================== GET リクエストテスト ====================

  describe('GET リクエスト', () => {
    it('TC-API-001: GETリクエストが成功し、レスポンスデータが正しく返される', async () => {
      // 【テスト目的】: API Clientの get<T>() 関数が正常にGETリクエストを送信し、レスポンスをパースできること 🔵
      // 【テスト内容】: Backend APIから対戦履歴一覧を取得する典型的なリクエストをシミュレート 🔵
      // 【期待される動作】: ApiResponse<T> 型のレスポンスが返され、data フィールドにデータが含まれる 🔵
      // 🔵 信頼性レベル: Backend API仕様（docs/implements/shadowverse-battle-log/TASK-0008/requirements.md）に準拠

      // 【テストデータ準備】: Backend APIから返される典型的なレスポンスデータを作成 🔵
      // 【初期条件設定】: 対戦履歴1件を含む成功レスポンスをモック化
      const mockResponse = {
        success: true,
        data: {
          battleLogs: [
            {
              id: 'log_20251104_001',
              date: '2025/11/04',
              battleType: 'ランクマッチ',
              rank: 'ダイアモンド',
              group: 'AA',
              myDeckId: 'deck-001',
              turn: '先攻',
              result: '勝ち',
              opponentDeckId: 'deck-101',
            },
          ],
          total: 1,
          limit: 100,
          offset: 0,
        },
        meta: {
          timestamp: '2025-11-04T12:00:00Z',
          requestId: 'req-001',
        },
      };

      // 【モック設定】: fetch関数が成功レスポンスを返すように設定
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // 【実際の処理実行】: API Clientの get() メソッドを呼び出す 🔵
      // 【処理内容】: GET /battle-logs エンドポイントにリクエストを送信し、レスポンスをパース
      const result = await apiClient.get('/battle-logs');

      // 【結果検証】: レスポンスデータが正しく取得できることを確認 🔵
      // 【期待値確認】: Backend API仕様に準拠したデータ構造が返されること
      expect(result).toEqual(mockResponse.data); // 【確認内容】: data フィールドが正しくパースされている 🔵
      expect(result.battleLogs).toHaveLength(1); // 【確認内容】: 対戦履歴が1件含まれている 🔵
      expect(result.total).toBe(1); // 【確認内容】: total が正しく設定されている 🔵

      // 【API呼び出し確認】: fetch関数が正しいパラメータで呼ばれていることを確認 🔵
      expect(global.fetch).toHaveBeenCalledTimes(1); // 【確認内容】: fetch が1回だけ呼ばれている 🔵
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/battle-logs'), // 【確認内容】: 正しいエンドポイントが呼ばれている 🔵
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json', // 【確認内容】: Content-Type ヘッダーが設定されている 🔵
          }),
        })
      );
    });
  });

  // ==================== POST リクエストテスト ====================

  describe('POST リクエスト', () => {
    it('TC-API-002: POSTリクエストが成功し、作成されたデータが返される', async () => {
      // 【テスト目的】: API Clientの post<T>() 関数が正常にPOSTリクエストを送信し、リクエストボディを正しく送信できること 🔵
      // 【テスト内容】: 新規対戦履歴を登録する典型的なリクエストをシミュレート 🔵
      // 【期待される動作】: 新規リソースが作成され、作成されたデータが返される 🔵
      // 🔵 信頼性レベル: Backend API仕様（docs/implements/shadowverse-battle-log/TASK-0007/requirements.md）に準拠

      // 【テストデータ準備】: 新規対戦履歴を登録するリクエストボディを作成 🔵
      // 【初期条件設定】: 8項目の対戦履歴データを用意
      const requestData = {
        date: '2025-11-04',
        battleType: 'ランクマッチ',
        rank: 'ダイアモンド',
        group: 'AA',
        myDeckId: 'deck-001',
        turn: '先攻',
        result: '勝ち',
        opponentDeckId: 'deck-101',
      };

      const mockResponse = {
        success: true,
        data: {
          id: 'log_20251104_001',
          date: '2025/11/04',
          ...requestData,
        },
        meta: {
          timestamp: '2025-11-04T12:00:00Z',
          requestId: 'req-002',
        },
      };

      // 【モック設定】: fetch関数が成功レスポンスを返すように設定
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // 【実際の処理実行】: API Clientの post() メソッドを呼び出す 🔵
      // 【処理内容】: POST /battle-logs エンドポイントにリクエストを送信し、レスポンスをパース
      const result = await apiClient.post('/battle-logs', requestData);

      // 【結果検証】: 作成されたデータが正しく取得できることを確認 🔵
      // 【期待値確認】: Backend API仕様に準拠したデータ構造が返されること
      expect(result).toEqual(mockResponse.data); // 【確認内容】: data フィールドが正しくパースされている 🔵
      expect(result.id).toBe('log_20251104_001'); // 【確認内容】: idがBackend側で生成されている 🔵

      // 【API呼び出し確認】: fetch関数が正しいパラメータで呼ばれていることを確認 🔵
      expect(global.fetch).toHaveBeenCalledTimes(1); // 【確認内容】: fetch が1回だけ呼ばれている 🔵
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/battle-logs'), // 【確認内容】: 正しいエンドポイントが呼ばれている 🔵
        expect.objectContaining({
          method: 'POST', // 【確認内容】: POST メソッドが使用されている 🔵
          body: JSON.stringify(requestData), // 【確認内容】: リクエストボディが正しくJSON化されている 🔵
          headers: expect.objectContaining({
            'Content-Type': 'application/json', // 【確認内容】: Content-Type ヘッダーが設定されている 🔵
          }),
        })
      );
    });
  });

  // ==================== DELETE リクエストテスト ====================

  describe('DELETE リクエスト', () => {
    it('TC-API-003: DELETEリクエストが成功し、削除完了メッセージが返される', async () => {
      // 【テスト目的】: API Clientの del<T>() 関数が正常にDELETEリクエストを送信できること 🔵
      // 【テスト内容】: 特定の対戦履歴を削除するリクエストをシミュレート 🔵
      // 【期待される動作】: リソースが削除され、成功レスポンスが返される 🔵
      // 🔵 信頼性レベル: Backend API仕様（docs/implements/shadowverse-battle-log/TASK-0008/requirements.md）に準拠

      // 【テストデータ準備】: 削除成功時のレスポンスデータを作成 🔵
      // 【初期条件設定】: 削除完了メッセージを含む成功レスポンスをモック化
      const mockResponse = {
        success: true,
        data: {
          message: '対戦履歴を削除しました',
        },
        meta: {
          timestamp: '2025-11-04T12:00:00Z',
          requestId: 'req-003',
        },
      };

      // 【モック設定】: fetch関数が成功レスポンスを返すように設定
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // 【実際の処理実行】: API Clientの del() メソッドを呼び出す 🔵
      // 【処理内容】: DELETE /battle-logs/log_20251104_001 エンドポイントにリクエストを送信
      const result = await apiClient.del('/battle-logs/log_20251104_001');

      // 【結果検証】: 削除成功レスポンスが正しく取得できることを確認 🔵
      // 【期待値確認】: Backend API仕様に準拠したレスポンス構造が返されること
      expect(result).toEqual(mockResponse.data); // 【確認内容】: data フィールドが正しくパースされている 🔵
      expect(result.message).toBe('対戦履歴を削除しました'); // 【確認内容】: 削除完了メッセージが含まれている 🔵

      // 【API呼び出し確認】: fetch関数が正しいパラメータで呼ばれていることを確認 🔵
      expect(global.fetch).toHaveBeenCalledTimes(1); // 【確認内容】: fetch が1回だけ呼ばれている 🔵
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/battle-logs/log_20251104_001'), // 【確認内容】: 正しいエンドポイント（ID含む）が呼ばれている 🔵
        expect.objectContaining({
          method: 'DELETE', // 【確認内容】: DELETE メソッドが使用されている 🔵
        })
      );
    });
  });

  // ==================== エラーハンドリングテスト ====================

  describe('エラーハンドリング', () => {
    it('TC-API-004: バリデーションエラー時（400 Bad Request）に適切なエラーが投げられる', async () => {
      // 【テスト目的】: APIエラーレスポンスの適切な処理を確認する 🔵
      // 【テスト内容】: Backend APIが400 Bad Requestを返した場合の処理をシミュレート 🔵
      // 【期待される動作】: エラーメッセージが投げられ、ユーザーに適切なメッセージを表示できる 🔵
      // 🔵 信頼性レベル: Backend API仕様のエラーレスポンス形式に準拠

      // 【テストデータ準備】: バリデーションエラーのレスポンスデータを作成 🔵
      // 【初期条件設定】: 未来の日付を入力した場合のエラーレスポンスをモック化
      const mockErrorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '未来の日付は入力できません',
          details: {
            field: 'date',
            value: '2099-12-31',
          },
        },
        meta: {
          timestamp: '2025-11-04T12:00:00Z',
          requestId: 'req-004',
        },
      };

      // 【モック設定】: fetch関数が400 Bad Requestを返すように設定
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockErrorResponse,
      } as Response);

      // 【実際の処理実行】: API Clientの post() メソッドを呼び出し、エラーが投げられることを確認 🔵
      // 【処理内容】: POST /battle-logs エンドポイントに不正なデータを送信
      await expect(apiClient.post('/battle-logs', { date: '2099-12-31' })).rejects.toThrow(
        '未来の日付は入力できません'
      ); // 【確認内容】: Backend APIから返されたエラーメッセージが投げられる 🔵
    });

    it('TC-API-005: ネットワークエラー時に適切なエラーが投げられる', async () => {
      // 【テスト目的】: ネットワークエラーの適切な処理を確認する 🔵
      // 【テスト内容】: ネットワーク接続が切断されている、またはBackend APIが応答しない場合をシミュレート 🔵
      // 【期待される動作】: ユーザーが理解しやすい日本語エラーメッセージが投げられる 🔵
      // 🔵 信頼性レベル: オフライン時の動作を明確にし、ユーザーに適切なメッセージを表示するため

      // 【モック設定】: fetch関数がネットワークエラーを投げるように設定
      // 【エラーシミュレーション】: インターネット接続が利用できない状況を再現
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network Error'));

      // 【実際の処理実行】: API Clientの get() メソッドを呼び出し、ネットワークエラーが投げられることを確認 🔵
      // 【処理内容】: GET /battle-logs エンドポイントにリクエストを送信（ネットワークエラー発生）
      await expect(apiClient.get('/battle-logs')).rejects.toThrow(); // 【確認内容】: ネットワークエラーが投げられる 🔵
    });

    it('TC-API-006: サーバーエラー時（500 Internal Server Error）に適切なエラーが投げられる', async () => {
      // 【テスト目的】: サーバーエラーの適切な処理を確認する 🔵
      // 【テスト内容】: Backend APIで予期しないエラーが発生した場合をシミュレート 🔵
      // 【期待される動作】: ユーザーが理解しやすい日本語エラーメッセージが投げられる 🔵
      // 🔵 信頼性レベル: Backend APIのエラー時でもアプリケーションが安全に動作すること

      // 【テストデータ準備】: サーバーエラーのレスポンスデータを作成 🔵
      // 【初期条件設定】: 500エラーレスポンスをモック化
      const mockErrorResponse = {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'サーバーエラーが発生しました',
        },
        meta: {
          timestamp: '2025-11-04T12:00:00Z',
          requestId: 'req-006',
        },
      };

      // 【モック設定】: fetch関数が500 Internal Server Errorを返すように設定
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => mockErrorResponse,
      } as Response);

      // 【実際の処理実行】: API Clientの get() メソッドを呼び出し、サーバーエラーが投げられることを確認 🔵
      // 【処理内容】: GET /battle-logs エンドポイントにリクエストを送信（サーバーエラー発生）
      await expect(apiClient.get('/battle-logs')).rejects.toThrow('サーバーエラーが発生しました'); // 【確認内容】: Backend APIから返されたエラーメッセージが投げられる 🔵
    });
  });
});

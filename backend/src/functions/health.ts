/**
 * ヘルスチェックエンドポイント
 *
 * 【機能概要】: システムの正常性を確認するエンドポイント
 * 【実装方針】: 外部依存なしで高速に動作する軽量なヘルスチェック
 * 【テスト対応】: TC-HEALTH-001, TC-HEALTH-002, TC-HEALTH-003を通すための実装
 * 🔵 信頼性レベル: 青信号（testcases.md Lines 804-858より）
 */

import { app, type HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

/**
 * ヘルスチェックレスポンスの型
 */
interface HealthCheckResponse {
  success: boolean;
  data: {
    status: string;
    timestamp: string;
    version: string;
  };
}

/**
 * ヘルスチェックエンドポイント
 *
 * 【機能概要】: システムの正常性を確認する軽量なエンドポイント
 * 【実装方針】:
 *   - 外部依存なし（Blob Storage接続不要）
 *   - メモリ内の状態のみで応答
 *   - 100ms以内のレスポンス時間を保証
 * 【テスト対応】:
 *   - TC-HEALTH-001: 正常なレスポンスを返す
 *   - TC-HEALTH-002: 100ms以内に応答する
 *   - TC-HEALTH-003: HTTP 200を返す、タイムスタンプが現在時刻に近い
 * 🔵 信頼性レベル: 青信号（testcases.md Lines 804-858より）
 *
 * @param _request - HTTPリクエスト（使用しない）
 * @param _context - 実行コンテキスト（使用しない）
 * @returns HTTPレスポンス（status: 200, ヘルスチェック情報）
 */
async function health(
  _request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  // 【タイムスタンプ生成】: 現在時刻をISO 8601形式で取得
  // 【実装内容】: new Date().toISOString() でミリ秒精度のタイムスタンプを生成
  // 🔵 信頼性レベル: 青信号（testcases.md Lines 171-194より）
  const timestamp = new Date().toISOString();

  // 【レスポンスデータ作成】: 必須フィールドを含むヘルスチェック情報
  // 【実装内容】:
  //   - status: "healthy" (システムが正常に動作していることを示す)
  //   - timestamp: 実行時の現在時刻
  //   - version: システムバージョン（固定値 "1.0.0"）
  // 🔵 信頼性レベル: 青信号（testcases.md Lines 815-826より）
  const responseData: HealthCheckResponse = {
    success: true,
    data: {
      status: 'healthy',
      timestamp,
      version: '1.0.0',
    },
  };

  // 【HTTPレスポンス返却】: HTTP 200 OKとヘルスチェック情報を返す
  // 【実装内容】:
  //   - status: 200 (正常時のHTTPステータスコード)
  //   - jsonBody: ヘルスチェックレスポンス
  // 🔵 信頼性レベル: 青信号（testcases.md Lines 154-169より）
  return {
    status: 200,
    jsonBody: responseData,
  };
}

// Azure Functionsに登録
app.http('health', {
  methods: ['GET'],
  route: 'health',
  authLevel: 'anonymous',
  handler: health,
});

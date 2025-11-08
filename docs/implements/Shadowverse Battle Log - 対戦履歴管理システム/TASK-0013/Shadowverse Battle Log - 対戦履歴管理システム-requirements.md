# TDD要件定義書: Backend統合テストとCI/CD設定

**機能名**: Backend Integration Tests and CI/CD Pipeline
**タスクID**: TASK-0013
**実装者**: AI Assistant (Claude)
**作成日**: 2025-11-04
**更新日**: 2025-11-04

---

## 1. 機能の概要

### 🔵 何をする機能か

Backend統合テストとCI/CDパイプラインの構築を行う。すべてのAPIエンドポイント（TASK-0007~0012で実装）が連携して正常に動作することを検証し、GitHub Actionsによる自動テスト・デプロイパイプラインを確立する。

### 🔵 どのような問題を解決するか

**As a**: Backend開発者
**I want to**: すべてのAPIが統合環境で正しく動作することを自動検証したい
**So that**:

- 各APIの独立したテストだけでなく、API間の連携動作を保証できる
- コードの品質を継続的に維持できる（ゼロ警告ポリシー、カバレッジ70%以上）
- mainブランチへのマージ前にバグを検出できる
- デプロイ作業を自動化し、手動ミスを防止できる
- テスト実行とデプロイが標準化され、チーム全体で一貫性が保たれる

### 🔵 想定されるユーザー

- **直接ユーザー**: Backend開発者、CI/CD管理者
- **間接ユーザー**: プロジェクト全体の開発チーム、QA担当者
- **システム**: GitHub Actions（自動実行）

### 🔵 システム内での位置づけ

```
[開発者] → git push
    ↓
[GitHub Actions CI/CD Pipeline] ← 【今回実装】
    ├── Lint Check (Biome)
    ├── Type Check (TypeScript)
    ├── Unit Tests (TASK-0007~0012のテスト)
    ├── Integration Tests ← 【今回実装】
    │   ├── Battle Log API統合テスト
    │   ├── Statistics API統合テスト
    │   └── Import API統合テスト
    ├── Coverage Check (70%以上) ← 【今回実装】
    └── Deploy to Azure Functions (mainブランチのみ)
```

**アーキテクチャ上の役割**:
- **層**: インフラストラクチャ層 (Infrastructure Layer)
- **パターン**: CI/CDパイプラインパターン、自動テストパターン
- **責務**:
  - API統合テストの実装と実行
  - コード品質の自動検証（Lint, 型チェック, カバレッジ）
  - 自動デプロイの実行
  - テスト結果のレポート生成

### 🔵 参照したEARS要件

- **NFR-302**: システムは可能な範囲でTDD（テスト駆動開発）を適用しなければならない 🔵
- **NFR-303**: システムは可能な範囲でゼロ警告ポリシーを適用しなければならない 🔵
- **NFR-304**: システムはUnit テストとE2E テストを実装しなければならない 🔵
- **NFR-305**: システムはGitHub Actionsで自動テスト・デプロイを実行しなければならない 🔵

### 🔵 参照した設計文書

- **タスクファイル**: `docs/tasks/shadowverse-battle-log-phase2.md` (TASK-0013)
- **技術スタック定義**: `docs/tech-stack.md` (Jest, GitHub Actions, Node.js 22.x)
- **既存実装**: `backend/src/functions/*`, `backend/src/services/*`, `backend/tests/*`

---

## 2. 入力・出力の仕様

### 🔵 統合テスト入力

統合テストは実際のAPIエンドポイントを呼び出し、以下のフローを検証する:

#### 2.1 対戦履歴統合テスト入力

```typescript
// テストシナリオ: 対戦履歴登録 → 一覧取得 → 削除
interface BattleLogIntegrationTestInput {
  // 1. 登録APIへの入力
  createRequest: {
    date: string;              // "2025-11-04"
    battleType: BattleType;    // "ランクマッチ"
    rank: Rank;                // "ダイアモンド"
    group: Group;              // "AA"
    myDeckId: string;          // "deck-001"
    turn: Turn;                // "先攻"
    result: BattleResult;      // "勝ち"
    opponentDeckId: string;    // "deck-101"
  };

  // 2. 一覧取得APIへの入力
  listRequest: {
    startDate?: string;        // "2025-10-28"
    endDate?: string;          // "2025-11-04"
    limit?: number;            // 100
    offset?: number;           // 0
  };

  // 3. 削除APIへの入力
  deleteRequest: {
    id: string;                // 登録時に生成されたID
  };
}
```

#### 2.2 統計API統合テスト入力

```typescript
// テストシナリオ: 複数の対戦履歴登録 → 統計計算の検証
interface StatisticsIntegrationTestInput {
  // 複数の対戦履歴を登録
  battleLogs: Array<{
    date: string;
    battleType: BattleType;
    rank: Rank;
    group: Group;
    myDeckId: string;
    turn: Turn;
    result: BattleResult;
    opponentDeckId: string;
  }>;

  // 統計APIへの入力
  statisticsRequest: {
    startDate: string;         // "2025-10-01"
    endDate: string;           // "2025-11-04"
  };
}
```

#### 2.3 インポートAPI統合テスト入力

```typescript
// テストシナリオ: JSONインポート → 一覧取得で確認
interface ImportIntegrationTestInput {
  // インポートAPIへの入力
  importRequest: {
    format: 'json' | 'csv';
    data: string;              // JSON文字列またはCSV文字列
    overwrite?: boolean;       // true: 上書き, false: 追加
  };

  // 検証用の一覧取得
  listRequest: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  };
}
```

### 🔵 統合テスト出力

#### 2.1 対戦履歴統合テスト出力

```typescript
interface BattleLogIntegrationTestOutput {
  // 1. 登録APIレスポンス
  createResponse: {
    success: true;
    data: {
      id: string;              // "BL-20251104-0001"
      message: string;         // "対戦履歴を登録しました"
    };
    meta: {
      timestamp: string;
      requestId: string;
    };
  };

  // 2. 一覧取得APIレスポンス
  listResponse: {
    success: true;
    data: {
      battleLogs: BattleLog[]; // 登録したデータが含まれる
      total: number;
      limit: number;
      offset: number;
    };
    meta: {
      timestamp: string;
      requestId: string;
    };
  };

  // 3. 削除APIレスポンス
  deleteResponse: {
    success: true;
    data: {
      id: string;              // 削除されたID
      message: string;         // "対戦履歴を削除しました"
    };
    meta: {
      timestamp: string;
      requestId: string;
    };
  };

  // 4. 統合テスト結果
  testResult: {
    passed: boolean;           // true
    duration: number;          // 実行時間（ミリ秒）
    assertions: number;        // 検証項目数
  };
}
```

#### 2.2 統計API統合テスト出力

```typescript
interface StatisticsIntegrationTestOutput {
  // 統計APIレスポンス
  statisticsResponse: {
    success: true;
    data: StatisticsResponse;  // 計算結果
    meta: {
      timestamp: string;
      requestId: string;
    };
  };

  // 検証結果
  validationResult: {
    overallWinRate: boolean;     // 全体勝率が正しいか
    byMyDeckCalculation: boolean; // デッキ別統計が正しいか
    byOpponentCalculation: boolean; // 相手デッキ別統計が正しいか
    distributionSum: boolean;    // 分布の合計が100%か
  };
}
```

### 🔵 CI/CDパイプライン入出力

#### CI/CD入力

```yaml
# GitHub Actionsトリガー
trigger:
  push:
    branches: [main, develop]
    paths: ['backend/**']
  pull_request:
    branches: [main, develop]
    paths: ['backend/**']
```

#### CI/CD出力

```typescript
interface CICDPipelineOutput {
  // Lintチェック結果
  lintResult: {
    success: boolean;
    warnings: number;          // ゼロ警告ポリシー: 0が期待値
    errors: number;            // 0が期待値
  };

  // 型チェック結果
  typeCheckResult: {
    success: boolean;
    errors: number;            // 0が期待値
  };

  // テスト実行結果
  testResult: {
    success: boolean;
    totalTests: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;          // ミリ秒
  };

  // カバレッジ結果
  coverageResult: {
    success: boolean;
    lines: number;             // 70%以上が期待値
    branches: number;          // 70%以上が期待値
    functions: number;         // 70%以上が期待値
    statements: number;        // 70%以上が期待値
  };

  // デプロイ結果（mainブランチのみ）
  deployResult?: {
    success: boolean;
    environment: string;       // "production"
    url: string;               // Azure Functions URL
    timestamp: string;
  };
}
```

### 🔵 入出力の関係性

1. **統合テストフロー**:
   - 各APIを順番に呼び出し、レスポンスを検証
   - 前のAPIの出力が次のAPIの入力として使用される（例: 登録APIで生成されたIDを削除APIで使用）

2. **CI/CDパイプラインフロー**:
   - git push → Lint → Type Check → Unit Tests → Integration Tests → Coverage Check → Deploy
   - 各ステップが成功した場合のみ次のステップに進む
   - いずれかが失敗した場合、パイプライン全体が失敗

### 🔵 データフロー

```
[git push]
    ↓
[GitHub Actions Trigger]
    ↓
[Checkout Code]
    ↓
[Setup Node.js 22.x]
    ↓
[npm ci] (依存関係インストール)
    ↓
[Biome Lint] → 失敗 → Pipeline停止
    ↓ 成功
[TypeScript Build] → 失敗 → Pipeline停止
    ↓ 成功
[Jest Unit Tests] → 失敗 → Pipeline停止
    ↓ 成功
[Jest Integration Tests] → 失敗 → Pipeline停止
    ↓ 成功
[Coverage Check (70%)] → 失敗 → Pipeline停止
    ↓ 成功
[Codecov Upload] (カバレッジレポート)
    ↓
[Deploy to Azure] (mainブランチのみ)
    ↓
[Success Notification]
```

### 🔵 参照したEARS要件

- **NFR-305**: GitHub Actionsで自動テスト・デプロイを実行 🔵
- **NFR-302**: TDD適用（統合テストの実装） 🔵
- **NFR-304**: Unit テストとE2E テストを実装 🔵

### 🔵 参照した設計文書

- **タスクファイル**: `docs/tasks/shadowverse-battle-log-phase2.md` (TASK-0013セクション)
- **型定義**: `backend/src/types/index.ts` (ApiResponse, BattleLog, StatisticsResponse)
- **既存テスト**: `backend/tests/**/*.test.ts` (既存のUnit Test構造)

---

## 3. 制約条件

### 🔵 パフォーマンス要件

- **NFR-001**: 統合テストは3秒以内に完了しなければならない 🔵
  - 各API呼び出しは1秒以内
  - 統合テスト全体は10秒以内

- **NFR-002**: CI/CDパイプライン全体は5分以内に完了しなければならない 🟡
  - Lint + Type Check: 1分以内
  - Unit Tests: 2分以内
  - Integration Tests: 1分以内
  - Deploy: 1分以内

### 🔵 品質要件

- **NFR-303**: ゼロ警告ポリシー（Biome lintで警告0） 🔵
- **NFR-301**: TypeScript strict mode（型エラー0） 🔵
- **カバレッジ基準**: 70%以上（lines, branches, functions, statements） 🔵
  - 現在のカバレッジ: 80.8% (lines)
  - 目標: 70%以上を維持

### 🔵 テスト要件

- **NFR-304**: Unit テストと統合テストを実装 🔵
  - すべてのAPIエンドポイントの統合テストを実装
  - 正常系・異常系の両方をカバー
  - エラーケースの検証を含む

- **テスト分離**: 統合テストは独立して実行可能でなければならない 🟡
  - テスト間でデータが共有されない
  - 任意の順序で実行可能
  - 並列実行に対応（将来的に）

### 🔵 CI/CD要件

- **NFR-305**: GitHub Actionsで自動実行 🔵
  - main, developブランチへのpush時に自動実行
  - Pull Request作成時に自動実行
  - mainブランチへのマージ時のみデプロイ

- **セキュリティ**: 認証情報は環境変数で管理 🔵
  - `AZURE_FUNCTIONAPP_NAME`: Azure Functions名
  - `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`: 発行プロファイル

### 🔵 Azure Functions制約

- **REQ-604**: Azure Functionsで動作しなければならない 🔵
  - Node.js 22.x ランタイム
  - HTTP Trigger関数
  - Azure Blob Storage接続

### 🔵 互換性制約

- **NFR-401**: 既存のJSONデータ形式との互換性を維持 🔵
  - 統合テストでも既存データ形式を使用
  - インポート機能のテストで既存データの読み込みを検証

### 🔵 参照したEARS要件

- **NFR-001**: ページ読み込み時間3秒以内 🔵
- **NFR-301**: TypeScript strict mode 🔵
- **NFR-302**: TDD適用 🔵
- **NFR-303**: ゼロ警告ポリシー 🔵
- **NFR-304**: Unit/E2Eテスト実装 🔵
- **NFR-305**: GitHub Actions自動テスト・デプロイ 🔵
- **REQ-604**: Azure Static Web Apps + Azure Functions 🔵

### 🔵 参照した設計文書

- **技術スタック定義**: `docs/tech-stack.md`
  - CI/CD: GitHub Actions (月2000分無料枠)
  - テスト: Jest + pytest
  - カバレッジ基準: 70%以上
- **既存設定**: `backend/jest.config.js` (現在のカバレッジ設定)

---

## 4. 想定される使用例

### 🔵 基本的な使用パターン

#### 4.1 統合テスト実行（ローカル）

```bash
# 統合テストのみ実行
npm run test:integration

# すべてのテスト実行（Unit + Integration）
npm run test:all

# カバレッジ付きで実行
npm run test:coverage
```

**期待される動作**:
1. 統合テストが実行される
2. すべてのAPIエンドポイントが連携して動作する
3. テスト結果が表示される
4. カバレッジレポートが生成される

#### 4.2 CI/CDパイプライン実行（自動）

```bash
# developブランチにpush
git push origin develop

# GitHub Actionsが自動実行される
# 1. Lint Check
# 2. Type Check
# 3. Unit Tests
# 4. Integration Tests
# 5. Coverage Check
```

**期待される動作**:
1. GitHub Actionsが自動でトリガーされる
2. すべてのチェックが順番に実行される
3. 失敗した場合、パイプラインが停止し、通知が送信される
4. 成功した場合、次のステップに進む

#### 4.3 本番デプロイ（mainブランチ）

```bash
# mainブランチにマージ
git checkout main
git merge develop
git push origin main

# GitHub Actionsが自動実行される
# 1. Lint Check
# 2. Type Check
# 3. Unit Tests
# 4. Integration Tests
# 5. Coverage Check
# 6. Deploy to Azure Functions (mainのみ)
```

**期待される動作**:
1. すべてのテストが成功する
2. Azure Functionsに自動デプロイされる
3. デプロイ成功の通知が送信される

### 🔵 データフロー

#### 統合テストのデータフロー

```
[Test Setup: テストデータ準備]
    ↓
[API 1: 対戦履歴登録] → POST /api/battle-logs
    ↓ (登録されたID)
[API 2: 一覧取得] → GET /api/battle-logs
    ↓ (登録データが含まれることを検証)
[API 3: 統計計算] → GET /api/statistics
    ↓ (統計が正しく計算されることを検証)
[API 4: 削除] → DELETE /api/battle-logs/{id}
    ↓
[Test Teardown: テストデータ削除]
```

### 🔵 エッジケース

#### EDGE-001: ネットワークエラー時の統合テスト

```typescript
// テストシナリオ: Azure Blob Storageへの接続エラー
it('Blob Storage接続エラー時に適切なエラーを返す', async () => {
  // モックでエラーを発生させる
  blobStorageClient.getBattleLogs.mockRejectedValue(
    new Error('Network error')
  );

  // APIを呼び出す
  const response = await callListAPI();

  // エラーレスポンスを検証
  expect(response.success).toBe(false);
  expect(response.error.code).toBe('STORAGE_ERROR');
  expect(response.error.message).toContain('データの取得に失敗しました');
});
```

#### EDGE-002: カバレッジが70%未満の場合

```bash
# CI/CDパイプラインでカバレッジチェック失敗
Coverage: 65.5%
❌ Coverage is below 70%
Pipeline failed: Coverage threshold not met
```

**期待される動作**:
1. カバレッジチェックが失敗する
2. パイプラインが停止する
3. 開発者に通知が送信される
4. Pull Requestのステータスが"Failed"になる

#### EDGE-003: 統合テストでデータ競合が発生

```typescript
// テストシナリオ: 並列実行時のデータ競合
describe('並列実行テスト', () => {
  it('複数の登録が同時に実行されても正しく処理される', async () => {
    // 複数のAPIを並列で呼び出す
    const promises = [
      createBattleLog(data1),
      createBattleLog(data2),
      createBattleLog(data3),
    ];

    const results = await Promise.all(promises);

    // すべて成功することを検証
    results.forEach(result => {
      expect(result.success).toBe(true);
      expect(result.data.id).toBeDefined();
    });

    // IDが重複していないことを検証
    const ids = results.map(r => r.data.id);
    expect(new Set(ids).size).toBe(3);
  });
});
```

### 🔵 エラーケース

#### ERROR-001: Lintエラーで失敗

```bash
# Biome lint実行
npm run lint

# エラー出力
error[no-unused-vars]: 'unused' is defined but never used
  backend/src/services/battleLogService.ts:10:7

❌ Lint check failed
Pipeline stopped
```

**期待される動作**:
1. Lintエラーが検出される
2. パイプラインが停止する
3. エラーメッセージが表示される

#### ERROR-002: 統合テスト失敗

```bash
# Integration Test実行
npm run test:integration

# エラー出力
FAIL tests/integration/api.test.ts
  ● API統合テスト › 対戦履歴フロー › 登録→一覧取得→削除が正常に動作する

    Expected: 201
    Received: 500

    at Object.<anonymous> (tests/integration/api.test.ts:25:32)

❌ Integration test failed
Pipeline stopped
```

**期待される動作**:
1. 統合テストが失敗する
2. パイプラインが停止する
3. 失敗したテストの詳細が表示される

#### ERROR-003: デプロイ失敗

```bash
# Deploy to Azure Functions
npm run deploy

# エラー出力
Error: Failed to deploy to Azure Functions
Error: Invalid publish profile

❌ Deploy failed
```

**期待される動作**:
1. デプロイが失敗する
2. エラーメッセージが表示される
3. ロールバックが実行される（Azure Functionsの機能）

### 🔵 参照したEARS要件

- **EDGE-001**: ネットワークエラー時の処理 🟡
- **EDGE-002**: Azure Blob Storage接続エラー時の処理 🟡
- **NFR-305**: GitHub Actions自動テスト・デプロイ 🔵

### 🔵 参照した設計文書

- **タスクファイル**: `docs/tasks/shadowverse-battle-log-phase2.md` (TASK-0013統合テスト要件)
- **既存テスト**: `backend/tests/**/*.test.ts` (テストパターンの参考)

---

## 5. EARS要件・設計文書との対応関係

### 🔵 参照したユーザストーリー

- **ストーリー**: Backend開発者として、すべてのAPIが統合環境で正しく動作することを自動検証したい
- **理由**: コードの品質を継続的に維持し、バグを早期に発見するため

### 🔵 参照した機能要件

統合テストでは以下の機能要件を間接的に検証する:

- **REQ-001**: 対戦履歴の新規登録機能 🔵
- **REQ-101**: 対戦履歴の一覧表示機能 🔵
- **REQ-105**: 対戦履歴の削除機能 🔵
- **REQ-201**: 統計・分析ダッシュボード機能 🔵
- **REQ-301**: JSONインポート機能 🔵
- **REQ-602**: Azure Blob Storageへのデータ保存 🔵

### 🔵 参照した非機能要件

- **NFR-001**: ページ読み込み時間3秒以内 🔵
- **NFR-301**: TypeScript strict mode 🔵
- **NFR-302**: TDD適用 🔵
- **NFR-303**: ゼロ警告ポリシー 🔵
- **NFR-304**: Unit/E2Eテスト実装 🔵
- **NFR-305**: GitHub Actions自動テスト・デプロイ 🔵

### 🔵 参照したEdgeケース

- **EDGE-001**: ネットワークエラー時の処理 🟡
- **EDGE-002**: Azure Blob Storage接続エラー時の処理 🟡

### 🔵 参照した受け入れ基準

- [ ] すべてのAPIエンドポイントの統合テストが実装されている
- [ ] Azure Functions ローカル実行テストが成功する
- [ ] GitHub Actions CI/CD設定が完了している
- [ ] Biome lint チェックが成功する（警告0）
- [ ] TypeScript型チェックが成功する（エラー0）
- [ ] テストカバレッジが70%以上
- [ ] `npm start` でローカル起動できる
- [ ] すべてのAPIが3秒以内に応答する

### 🔵 参照した設計文書

#### アーキテクチャ

- **技術スタック定義**: `docs/tech-stack.md`
  - CI/CD: GitHub Actions
  - テストフレームワーク: Jest
  - Node.js: 22.x LTS
  - カバレッジ基準: 70%以上

#### 既存実装

- **Battle Log API**: `backend/src/functions/battle-logs.ts` (TASK-0007, 0008)
- **Deck Master API**: `backend/src/functions/deck-master.ts` (TASK-0009)
- **Statistics API**: `backend/src/functions/statistics.ts` (TASK-0010, 0011)
- **Import API**: `backend/src/functions/import.ts` (TASK-0012)

#### 型定義

- **型定義ファイル**: `backend/src/types/index.ts`
  - `ApiResponse<T>`: API共通レスポンス型
  - `BattleLog`: 対戦履歴エンティティ
  - `StatisticsResponse`: 統計データレスポンス
  - `BattleLogsResponse`: 一覧レスポンス

#### 既存テスト

- **Unit Tests**: `backend/tests/**/*.test.ts`
  - `tests/services/battleLogService.test.ts` (26 tests)
  - `tests/services/statisticsService.test.ts` (60 tests)
  - `tests/services/importService.test.ts` (23 tests)
  - `tests/storage/blobStorageClient.test.ts` (existing)
  - 合計: 109 passed tests

#### CI/CD設定

- **既存設定**: `.github/workflows/backend-deploy.yml`
  - 現在: ビルド + デプロイのみ
  - 今回追加: Lint + Type Check + Tests + Coverage

---

## 6. 実装アプローチ

### 🔵 Phase 1: 統合テストセットアップ

1. **統合テストディレクトリ作成**
   ```bash
   mkdir -p backend/tests/integration
   ```

2. **統合テストファイル作成**
   - `backend/tests/integration/api.test.ts`
   - `backend/tests/integration/battle-log-flow.test.ts`
   - `backend/tests/integration/statistics-flow.test.ts`
   - `backend/tests/integration/import-flow.test.ts`

### 🔵 Phase 2: CI/CD設定

1. **GitHub Actions ワークフロー作成**
   - `.github/workflows/backend-ci.yml`

2. **Jest設定更新**
   - `backend/jest.config.js`
   - カバレッジ基準を70%に設定

3. **package.json スクリプト追加**
   - `test:integration`
   - `test:unit`
   - `test:all`

### 🔵 Phase 3: ヘルスチェック実装

1. **ヘルスチェックエンドポイント作成**
   - `backend/src/functions/health.ts`

2. **ローカル実行確認スクリプト作成**
   - `backend/scripts/test-local.sh`

### 🔵 Phase 4: テスト実行と検証

1. **ローカルでテスト実行**
   ```bash
   npm run test:all
   npm run test:coverage
   ```

2. **CI/CDパイプライン実行**
   - developブランチにpushしてテスト

3. **カバレッジ確認**
   - 70%以上を確認

---

## 7. 品質判定

### ✅ 高品質: 要件定義完了

- **要件の曖昧さ**: なし
- **入出力定義**: 完全（統合テスト、CI/CD出力）
- **制約条件**: 明確（カバレッジ70%、実行時間、ゼロ警告）
- **実装可能性**: 確実（既存テスト・CI/CD設定の拡張）

### 評価コメント

- すべての要件がNFR-302, NFR-303, NFR-304, NFR-305に準拠している
- 既存の実装（TASK-0007~0012）を統合するテストとして適切
- CI/CDパイプラインの構成が明確
- カバレッジ基準（70%）が技術スタック定義と一致
- エラーケースとエッジケースが網羅的に定義されている

---

## 8. 次のステップ

次のお勧めステップ: `/tsumiki:tdd-testcases` でテストケースの洗い出しを行います。

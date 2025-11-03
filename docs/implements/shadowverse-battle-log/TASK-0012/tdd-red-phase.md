# TASK-0012: Import API実装 - TDD Red Phase レポート

## 概要

- **フェーズ**: Red Phase (失敗するテスト作成)
- **作成日**: 2025-11-03
- **実行者**: Claude Code
- **タスクID**: TASK-0012
- **タスク名**: Import API実装

## Red Phaseの目的

TDDのRed Phaseでは、**実装が存在しない状態でテストを先に作成し、すべてのテストが失敗することを確認**します。これにより、以下が保証されます:

1. テストが正しく実装をチェックしている（テストが機能している）
2. 実装前にテストケースが明確に定義されている
3. Green Phaseで実装を進める際の明確なゴールが設定されている

## 作成したテストファイル

### 1. backend/tests/services/importService.test.ts

**テストケース総数**: 30件（単体テスト）

**カバー範囲**:
- importFromJson - 正常系: 5件
  - TC-JSON-001: 正常なJSONインポート (単一データ)
  - TC-JSON-002: 複数件のJSONインポート
  - TC-JSON-003: ID付きJSONインポート (既存ID指定)
  - TC-JSON-004: 空配列のJSONインポート
  - TC-JSON-005: すべてのランク・グループパターン

- importFromJson - 異常系: 6件
  - TC-JSON-ERR-001: 不正なJSON形式
  - TC-JSON-ERR-002: 配列でないJSON形式
  - TC-JSON-ERR-003: バリデーションエラー（未来日付）
  - TC-JSON-ERR-004: バリデーションエラー（不正な対戦タイプ）
  - TC-JSON-ERR-005: バリデーションエラー（空文字列のデッキID）
  - TC-JSON-ERR-006: 複数フィールドのバリデーションエラー

- importFromJson - 重複チェック: 3件
  - TC-JSON-DUP-001: 重複IDのスキップ（単一）
  - TC-JSON-DUP-002: 重複IDのスキップ（複数）
  - TC-JSON-DUP-003: 一部重複、一部正常

- importFromCsv - 正常系: 5件
  - TC-CSV-001: 正常なCSVインポート (単一データ)
  - TC-CSV-002: 複数行のCSVインポート
  - TC-CSV-003: ヘッダーのみのCSV（データ行なし）
  - TC-CSV-004: ヘッダー順序が異なるCSV
  - TC-CSV-005: IDカラムを含むCSV

- importFromCsv - 異常系: 5件
  - TC-CSV-ERR-001: 空のCSVデータ
  - TC-CSV-ERR-002: 必須ヘッダー不足
  - TC-CSV-ERR-003: カラム数不一致
  - TC-CSV-ERR-004: バリデーションエラー（未来日付）
  - TC-CSV-ERR-005: 複数行のバリデーションエラー

- importFromCsv - 重複チェック: 1件
  - TC-CSV-DUP-001: CSV重複IDのスキップ

- 複合エラーケース: 2件
  - TC-MIX-001: 重複ID + バリデーションエラー + 正常データ
  - TC-MIX-002: CSV複合エラー

- パフォーマンステスト: 2件
  - TC-PERF-001: 100件のデータインポート
  - TC-PERF-002: 1000件のデータインポート

- Blob Storageエラー: 2件
  - TC-STORAGE-001: Blob Storage接続エラー
  - TC-STORAGE-002: Blob Storage保存エラー

### 2. backend/tests/functions/import.test.ts

**テストケース総数**: 7件（API統合テスト）

**カバー範囲**:
- 正常系 API テスト: 2件
  - TC-API-001: 正常なJSONインポートAPI
  - TC-API-002: 正常なCSVインポートAPI

- 異常系 API テスト: 5件
  - TC-API-ERR-001: format未指定エラー
  - TC-API-ERR-002: data未指定エラー
  - TC-API-ERR-003: 不正なformat値
  - TC-API-ERR-004: JSONパースエラー
  - TC-API-ERR-005: CSVヘッダー不足エラー
  - TC-API-ERR-006: 内部サーバーエラー

## テスト実行結果

### 実行コマンド

```bash
cd backend
npm test -- tests/services/importService.test.ts
npm test -- tests/functions/import.test.ts
```

### テスト実行サマリー

#### ImportService単体テスト

```
FAIL tests/services/importService.test.ts
  ● Test suite failed to run

    tests/services/importService.test.ts:13:31 - error TS2307: Cannot find module '../../src/services/importService' or its corresponding type declarations.

    13 import { ImportService } from '../../src/services/importService';
                                     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        3.53 s
```

**結果**: ✅ 期待通り失敗（ImportServiceが未実装のため）

#### Import API統合テスト

```
FAIL tests/functions/import.test.ts
  ● Test suite failed to run

    tests/functions/import.test.ts:14:28 - error TS2307: Cannot find module '../../src/functions/import' or its corresponding type declarations.

    14 import { importData } from '../../src/functions/import';
                              ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        3.532 s
```

**結果**: ✅ 期待通り失敗（import.tsが未実装のため）

## 失敗したテスト一覧

### すべてのテストが実行前に失敗

実装が存在しないため、以下のモジュールインポートエラーが発生:

1. **ImportService not found**
   - エラー: `Cannot find module '../../src/services/importService'`
   - 理由: `backend/src/services/importService.ts` が未作成

2. **import function not found**
   - エラー: `Cannot find module '../../src/functions/import'`
   - 理由: `backend/src/functions/import.ts` が未作成

### 予想される個別テスト失敗（実装後にテスト実行した場合）

以下のテストケース（37件）がすべて失敗することが期待されます:

#### ImportService単体テスト（30件）
1. [TC-JSON-001] should import a single valid battle log from JSON
2. [TC-JSON-002] should import multiple battle logs from JSON
3. [TC-JSON-003] should import JSON with custom ID
4. [TC-JSON-004] should handle empty JSON array without errors
5. [TC-JSON-005] should import all rank and group combinations
6. [TC-JSON-ERR-001] should throw error for invalid JSON format
7. [TC-JSON-ERR-002] should throw error when JSON is not an array
8. [TC-JSON-ERR-003] should detect future date validation error
9. [TC-JSON-ERR-004] should detect invalid battle type
10. [TC-JSON-ERR-005] should detect empty deck ID
11. [TC-JSON-ERR-006] should detect multiple field validation errors
12. [TC-JSON-DUP-001] should skip duplicate ID (single)
13. [TC-JSON-DUP-002] should skip multiple duplicate IDs
14. [TC-JSON-DUP-003] should import valid logs and skip duplicates
15. [TC-CSV-001] should import a single valid battle log from CSV
16. [TC-CSV-002] should import multiple rows from CSV
17. [TC-CSV-003] should handle CSV with header only
18. [TC-CSV-004] should import CSV with different header order
19. [TC-CSV-005] should import CSV with ID column
20. [TC-CSV-ERR-001] should throw error for empty CSV
21. [TC-CSV-ERR-002] should throw error for missing required headers
22. [TC-CSV-ERR-003] should detect column count mismatch
23. [TC-CSV-ERR-004] should detect future date in CSV
24. [TC-CSV-ERR-005] should detect validation errors in multiple rows
25. [TC-CSV-DUP-001] should skip duplicate ID in CSV
26. [TC-MIX-001] should handle mixed duplicate, error, and valid data in JSON
27. [TC-MIX-002] should handle mixed errors in CSV
28. [TC-PERF-001] should import 100 records within 2000ms
29. [TC-PERF-002] should import 1000 records without timeout
30. [TC-STORAGE-001] should handle Blob Storage connection error
31. [TC-STORAGE-002] should handle Blob Storage save error

#### Import API統合テスト（7件）
32. [TC-API-001] should successfully import JSON data via API
33. [TC-API-002] should successfully import CSV data via API
34. [TC-API-ERR-001] should return 400 when format is missing
35. [TC-API-ERR-002] should return 400 when data is missing
36. [TC-API-ERR-003] should return 400 when format is invalid
37. [TC-API-ERR-004] should return 400 for invalid JSON format
38. [TC-API-ERR-005] should return 400 for missing CSV headers
39. [TC-API-ERR-006] should return 500 for Blob Storage errors

**合計**: 37件のテストケースすべてが失敗する予定

## Red Phaseの検証結果

### ✅ Red Phase成功条件

- [x] テストファイルが作成された
- [x] テストが実装を要求している（モジュールが見つからないエラー）
- [x] すべてのテストが失敗している
- [x] テストケース仕様書（testcases.md）のすべてのケースがカバーされている

### テストケースカバレッジ

| カテゴリ | テストケース数 | 作成済み |
|---------|---------------|---------|
| importFromJson - 正常系 | 5 | ✅ 5 |
| importFromJson - 異常系 | 6 | ✅ 6 |
| importFromJson - 重複チェック | 3 | ✅ 3 |
| importFromCsv - 正常系 | 5 | ✅ 5 |
| importFromCsv - 異常系 | 5 | ✅ 5 |
| importFromCsv - 重複チェック | 1 | ✅ 1 |
| 複合エラーケース | 2 | ✅ 2 |
| パフォーマンステスト | 2 | ✅ 2 |
| Blob Storageエラー | 2 | ✅ 2 |
| Azure Function API | 7 | ✅ 7 |
| **合計** | **37** | **✅ 37** |

## 次のステップ: Green Phase

Green Phase（実装フェーズ）では、以下のファイルを実装してすべてのテストを成功させます:

### 実装対象ファイル

1. **backend/src/services/importService.ts**
   - ImportServiceクラスの実装
   - importFromJson() メソッド
   - importFromCsv() メソッド
   - バリデーション処理
   - 重複チェック機能
   - ID自動生成機能
   - エラーハンドリング

2. **backend/src/functions/import.ts**
   - Azure Function エンドポイント実装
   - POST /api/import ハンドラ
   - リクエストバリデーション
   - レスポンスフォーマット（ApiResponse形式）
   - エラーハンドリング（400, 500）

### 実装方針

#### ImportService実装

```typescript
export interface ImportResult {
  imported: number;
  skipped: number;
  errors: number;
  details: {
    skippedIds?: string[];
    errorDetails?: Array<{
      line: number;
      field: string;
      error: string;
    }>;
  };
}

export class ImportService {
  constructor(private blobClient: BlobStorageClient) {}

  async importFromJson(jsonData: string): Promise<ImportResult> {
    // 1. JSONパース
    // 2. バリデーション
    // 3. 重複チェック
    // 4. ID自動生成
    // 5. Blob Storage保存
    // 6. 結果返却
  }

  async importFromCsv(csvData: string): Promise<ImportResult> {
    // 1. CSVパース
    // 2. ヘッダーチェック
    // 3. バリデーション
    // 4. 重複チェック
    // 5. ID自動生成
    // 6. Blob Storage保存
    // 7. 結果返却
  }
}
```

#### Azure Function実装

```typescript
export async function importData(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    // 1. リクエストボディ取得
    // 2. format, data パラメータバリデーション
    // 3. ImportService呼び出し
    // 4. ApiResponse形式で返却
  } catch (error) {
    // エラーハンドリング（400 or 500）
  }
}
```

### 実装時の注意事項

1. **ID生成ルール**
   - 通常作成: `log_${YYYY}${MM}${DD}_${連番}`
   - インポート: `log_import_${timestamp}_${index}`
   - ID指定時: 指定されたIDをそのまま使用

2. **日付フォーマット変換**
   - 入力: YYYY-MM-DD形式
   - 保存: YYYY/MM/DD形式（`convertDateFormat()` で変換）

3. **バリデーション**
   - Zodスキーマを使用（既存のcreateBattleLogSchemaを再利用）
   - 未来日付チェック（`isFutureDate()` 関数）
   - 空文字列チェック

4. **エラーハンドリング**
   - 部分的な成功を許可（All or Nothing ではない）
   - エラー行番号を記録
   - エラー詳細をレスポンスに含める

5. **パフォーマンス**
   - 100件: 2000ms以内
   - 1000件: タイムアウトなし

## まとめ

Red Phaseは完了しました。すべてのテストケース（37件）が作成され、期待通りに失敗しています。

次のステップは **Green Phase（実装）** です。以下のコマンドで実装を開始してください:

```bash
# Green Phaseコマンド
/tsumiki:tdd-green
```

---

**Red Phase完了日時**: 2025-11-03
**次フェーズ**: Green Phase（実装フェーズ）
**ステータス**: ✅ Red Phase完了

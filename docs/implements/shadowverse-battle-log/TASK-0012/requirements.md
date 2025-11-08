# TASK-0012: Import API実装 - 要件定義書

## 概要

- **タスクID**: TASK-0012
- **要件名**: Shadowverse Battle Log - Import機能
- **実装者**: AI駆動開発
- **作成日**: 2025-11-03
- **推定工数**: 8時間
- **タスクタイプ**: TDD
- **依存タスク**: TASK-0007 (完了)
- **信頼性レベル**: 🔵 青信号 *REQ-301, REQ-302, REQ-303より*

## 要件の目的

既存のJSONまたはCSVファイルから対戦履歴データをインポートし、Azure Blob Storageに保存する機能を提供します。これにより、ユーザーは既存データを一括でシステムに取り込むことができます。

## 機能要件

### REQ-301: JSONインポート

**EARS形式**: システムはJSON形式のファイルから対戦履歴データをインポートする機能を提供しなければならない 🔵

#### 詳細仕様

1. **入力形式**
   - JSON文字列として対戦履歴の配列を受け付ける
   - 各要素は `BattleLog` インターフェースに準拠
   - 形式: `[{ date, battleType, rank, group, myDeckId, turn, result, opponentDeckId }, ...]`

2. **処理フロー**
   ```
   JSON文字列入力
     → JSON.parse()による解析
     → 配列型チェック
     → 各要素のバリデーション
     → 重複チェック
     → Blob Storageへ保存
     → 結果返却
   ```

3. **バリデーション**
   - JSON.parse()が成功すること
   - データが配列であること
   - 各要素が `createBattleLogSchema` に準拠すること

4. **ID処理**
   - IDフィールドが存在する場合、重複チェックを実施
   - 重複IDは `skipped` としてカウント
   - IDが存在しない場合、自動生成（`log_import_${Date.now()}_${index}`）

### REQ-302: CSVインポート

**EARS形式**: システムはCSV形式のファイルから対戦履歴データをインポートする機能を提供しなければならない 🔵

#### 詳細仕様

1. **入力形式**
   - CSV文字列として対戦履歴を受け付ける
   - 1行目: ヘッダー行（カラム名）
   - 2行目以降: データ行
   - 区切り文字: カンマ (`,`)

2. **必須ヘッダー**
   ```
   date,battleType,rank,group,myDeckId,turn,result,opponentDeckId
   ```

3. **処理フロー**
   ```
   CSV文字列入力
     → 行分割（改行区切り）
     → ヘッダー行解析
     → 必須ヘッダーチェック
     → データ行解析
     → カラム数整合性チェック
     → バリデーション
     → 重複チェック
     → Blob Storageへ保存
     → 結果返却
   ```

4. **エラーハンドリング**
   - 空のCSVデータ: `CSVデータが空です`
   - 必須ヘッダー不足: `必須ヘッダーが不足しています: [欠落ヘッダー]`
   - カラム数不一致: `カラム数が一致しません` (行番号付き)

### REQ-303: バリデーション

**EARS形式**: システムはインポート時にデータ形式の妥当性を検証しなければならない 🟡

#### 詳細仕様

1. **個別フィールド検証**
   - **date**: YYYY-MM-DD形式、未来日付不可
   - **battleType**: `ランクマッチ`, `対戦台`, `ロビー大会` のいずれか
   - **rank**: `サファイア`, `ダイアモンド`, `ルビー`, `トパーズ`, `-` のいずれか
   - **group**: `A`, `AA`, `AAA`, `Master`, `-` のいずれか
   - **myDeckId**: 空文字列不可
   - **turn**: `先攻`, `後攻` のいずれか
   - **result**: `勝ち`, `負け` のいずれか
   - **opponentDeckId**: 空文字列不可

2. **使用スキーマ**
   - 既存の `createBattleLogSchema` (Zod) を再利用
   - バリデーションロジックの一貫性を保証

3. **エラー詳細レポート**
   ```typescript
   {
     line: number;      // エラー発生行番号（CSVヘッダーを含む）
     field: string;     // エラー発生フィールド名
     error: string;     // エラーメッセージ
   }
   ```

4. **重複チェック**
   - 既存の対戦履歴IDとの重複をチェック
   - 重複した場合は `skipped` としてカウント
   - スキップされたIDを `skippedIds` 配列で返却

## 非機能要件

### パフォーマンス

- **NFR-001**: インポート処理は2000ms以内に完了しなければならない（100件のデータ） 🔵 *api-endpoints.md L1084より*
- **NFR-002**: 最大1000件のデータを一度にインポートできなければならない 🟡
- **NFR-003**: メモリ使用量は100MB以内に抑えなければならない 🟡

### エラーハンドリング

- **NFR-101**: すべてのエラーは構造化されたエラーレスポンスを返却しなければならない 🔵 *api-endpoints.md L48-78より*
- **NFR-102**: バリデーションエラーは行番号とフィールド名を含めなければならない 🔵 *REQ-404より*
- **NFR-103**: 部分的な成功（一部エラー）の場合も結果を返却しなければならない 🟡

### ログ出力

- **NFR-201**: インポート処理の開始・終了をログ出力しなければならない 🟡
- **NFR-202**: エラー発生時はスタックトレースをログ出力しなければならない 🔵 *CLAUDE.mdより*
- **NFR-203**: 処理件数（imported, skipped, errors）をログ出力しなければならない 🟡

### セキュリティ

- **NFR-301**: APIキー・接続文字列は環境変数で管理しなければならない 🔵 *NFR-102より*
- **NFR-302**: すべての外部入力をバリデーションしなければならない 🔵 *NFR-103より*
- **NFR-303**: HTTPSによる暗号化通信を必須とする 🔵 *NFR-101より*

## 受け入れ基準

- [ ] JSONファイルのインポートが成功する
  - [ ] 正常なJSONデータ（配列）が正しくインポートされる
  - [ ] IDが自動生成される（IDフィールドなし）
  - [ ] 複数件のデータを一度にインポートできる
- [ ] CSVファイルのインポートが成功する
  - [ ] 正常なCSVデータ（ヘッダー + データ行）が正しくインポートされる
  - [ ] 必須ヘッダーが揃っている
  - [ ] カラム数が一致している
- [ ] 重複データがスキップされる
  - [ ] 既存IDと重複した場合、`skipped` としてカウントされる
  - [ ] スキップされたIDが `skippedIds` 配列で返却される
- [ ] バリデーションエラーが詳細に報告される
  - [ ] 行番号、フィールド名、エラーメッセージが含まれる
  - [ ] 複数のエラーが同時に報告される
- [ ] インポート結果が正しく返される
  - [ ] `imported`: 正常にインポートされた件数
  - [ ] `skipped`: スキップされた件数（重複ID）
  - [ ] `errors`: エラーが発生した件数
  - [ ] `details.skippedIds`: スキップされたID配列（存在する場合のみ）
  - [ ] `details.errorDetails`: エラー詳細配列（存在する場合のみ）
- [ ] エラーケースが適切に処理される
  - [ ] 無効なJSON形式でエラーが返される
  - [ ] 配列でないJSON形式でエラーが返される
  - [ ] 空のCSVデータでエラーが返される
  - [ ] 必須ヘッダー不足でエラーが返される
  - [ ] カラム数不一致でエラーが返される
  - [ ] 未来日付でバリデーションエラーが返される

## 技術仕様

### 使用技術

- **言語**: TypeScript (strict mode)
- **ランタイム**: Azure Functions v4
- **バリデーション**: Zod v3
- **ストレージ**: Azure Blob Storage
- **テスト**: Jest + ts-jest
- **リント**: Biome

### API設計

#### エンドポイント

```
POST /api/import
```

#### リクエスト

```typescript
{
  format: "json" | "csv";
  data: string; // JSON文字列 or CSV文字列
}
```

#### レスポンス（成功）

```typescript
{
  success: true;
  data: {
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
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}
```

#### レスポンス（エラー）

```typescript
{
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}
```

### エラーコード

| エラーコード | HTTPステータス | 説明 |
|---|---|---|
| `INVALID_REQUEST` | 400 | format または data が未指定 |
| `INVALID_FORMAT` | 400 | format が "json" または "csv" 以外 |
| `INVALID_FORMAT` | 400 | JSON形式が不正 |
| `INVALID_FORMAT` | 400 | JSONが配列でない |
| `INVALID_FORMAT` | 400 | CSVデータが空 |
| `INVALID_FORMAT` | 400 | 必須ヘッダーが不足 |
| `INTERNAL_SERVER_ERROR` | 500 | サーバーエラー |

### データフロー

```
[クライアント]
    ↓ POST /api/import { format, data }
[Azure Function: import.ts]
    ↓ format判定
[ImportService]
    ↓ importFromJson() または importFromCsv()
    ↓ 解析 → バリデーション → 重複チェック
[BlobStorageClient]
    ↓ getBattleLogs() / saveBattleLogs()
[Azure Blob Storage]
    ↓ battle-logs.json
[レスポンス返却]
```

### 実装ファイル構成

```
backend/src/
├── functions/
│   └── import.ts                    # Azure Function エンドポイント
├── services/
│   └── importService.ts             # インポートビジネスロジック
└── storage/
    └── blobStorageClient.ts         # 既存（変更なし）

backend/tests/
└── services/
    └── importService.test.ts        # 単体テスト
```

## エッジケース

### 1. 空ファイル

**ケース**: 空のJSON/CSVデータが送信される

**期待動作**:
- JSON: `[]` → `imported: 0, skipped: 0, errors: 0`
- CSV: ヘッダーのみ → `imported: 0, skipped: 0, errors: 0`
- CSV: 空文字列 → エラー `CSVデータが空です`

### 2. 不正なJSON/CSV

**ケース**: フォーマットが不正

**期待動作**:
- JSON: `{invalid json}` → エラー `無効なJSON形式です`
- JSON: `{"not": "array"}` → エラー `JSONデータは配列である必要があります`
- CSV: 必須ヘッダー不足 → エラー `必須ヘッダーが不足しています: [欠落ヘッダー]`

### 3. 重複ID

**ケース**: 既存IDと重複したデータがインポートされる

**期待動作**:
- 重複IDは `skipped` としてカウント
- `details.skippedIds` に重複IDを含める
- エラーとしては扱わない（警告）

### 4. バリデーションエラー

**ケース**: 一部データがバリデーションに失敗

**期待動作**:
- エラー行を `errors` としてカウント
- `details.errorDetails` に詳細を含める
- 正常な行は `imported` としてカウント
- 部分的な成功を許可

### 5. 複合エラー

**ケース**: 重複ID + バリデーションエラーが混在

**期待動作**:
```typescript
{
  imported: 5,    // 正常
  skipped: 2,     // 重複ID
  errors: 3,      // バリデーションエラー
  details: {
    skippedIds: ["log_001", "log_002"],
    errorDetails: [
      { line: 5, field: "date", error: "未来の日付は入力できません" },
      { line: 8, field: "battleType", error: "対戦タイプが不正です" },
      { line: 10, field: "rank", error: "ランクが不正です" }
    ]
  }
}
```

### 6. 大量データ

**ケース**: 1000件のデータをインポート

**期待動作**:
- メモリ使用量が100MB以内
- 処理時間が5000ms以内（api-endpoints.md L1084より）
- すべてのデータが正しく処理される

### 7. Blob Storage エラー

**ケース**: Azure Blob Storage への接続失敗

**期待動作**:
- リトライ3回実施（BlobStorageClient既存機能）
- 失敗した場合は `INTERNAL_SERVER_ERROR` を返却
- エラーログを出力

### 8. ID未指定データ

**ケース**: IDフィールドが存在しないデータ

**期待動作**:
- 自動的にIDを生成（`log_import_${Date.now()}_${index}`）
- 正常にインポート
- `imported` としてカウント

## テストケース概要

### 単体テスト (Jest)

1. **importFromJson: 正常系**
   - 正常なJSONデータをインポートできる
   - IDが自動生成される
   - 複数件を一度にインポートできる

2. **importFromJson: 異常系**
   - 無効なJSON形式でエラー
   - 配列でない場合エラー

3. **importFromJson: 重複チェック**
   - 重複IDがスキップされる
   - スキップされたIDが返却される

4. **importFromJson: バリデーション**
   - バリデーションエラーの詳細が返される
   - 行番号、フィールド名、エラーメッセージが含まれる

5. **importFromCsv: 正常系**
   - 正常なCSVデータをインポートできる
   - ヘッダーが正しく解析される

6. **importFromCsv: 異常系**
   - 空のCSVデータでエラー
   - 必須ヘッダー不足でエラー
   - カラム数不一致でエラー

7. **importFromCsv: 複合エラー**
   - 重複ID + バリデーションエラーが同時に処理される

8. **パフォーマンステスト**
   - 100件のデータを2000ms以内にインポート

## 参照ドキュメント

- [要件定義書](../../../spec/shadowverse-battle-log-requirements.md)
  - REQ-301: JSONインポート
  - REQ-302: CSVインポート
  - REQ-303: バリデーション
  - REQ-404: エラーメッセージ表示
  - NFR-101: HTTPS通信
  - NFR-102: 環境変数管理
  - NFR-103: 入力バリデーション

- [API設計書](../../../design/shadowverse-battle-log/api-endpoints.md)
  - Section 4.1: データインポート
  - エラーコード一覧
  - パフォーマンス要件

- [タスク定義](../../../tasks/shadowverse-battle-log-phase2.md)
  - TASK-0012: Import API実装
  - 実装詳細
  - テスト要件

- [既存実装]
  - `backend/src/services/battleLogService.ts`: createBattleLogSchema
  - `backend/src/utils/validation.ts`: isFutureDate()
  - `backend/src/storage/blobStorageClient.ts`: getBattleLogs(), saveBattleLogs()

## 実装ガイドライン

### 実装順序（TDD）

1. **Red Phase**: テストケースを先に作成（失敗する状態）
   - `importService.test.ts` にすべてのテストケースを記述
   - 実装前に実行し、すべてのテストが失敗することを確認

2. **Green Phase**: 最小限の実装でテストを通す
   - `importService.ts` を実装
   - `import.ts` （Azure Function）を実装
   - すべてのテストが成功することを確認

3. **Refactor Phase**: コード品質を向上
   - コードの重複を削減
   - 関数を分割して可読性を向上
   - コメントを追加
   - テストが引き続き成功することを確認

### コーディング規約

- **TypeScript strict mode**: すべての型を明示
- **any型禁止**: unknown型を使用し、型ガードで安全に変換
- **アロー関数**: 一貫性のためアロー関数を優先
- **コメント**: JSDocスタイルで関数の目的を説明
- **エラーハンドリング**: try-catch でラップし、適切なエラーメッセージを返却

### 注意事項

1. **既存スキーマの再利用**
   - `createBattleLogSchema` を使用してバリデーションの一貫性を保つ
   - カスタムバリデーションは追加しない

2. **日付フォーマット**
   - 入力: YYYY-MM-DD形式
   - 保存: YYYY/MM/DD形式（`convertDateFormat()` で変換）
   - インポート時も同様に変換する

3. **ID生成**
   - 既存の `generateBattleLogId()` は使用しない（日付ベース連番のため）
   - インポート時は `log_import_${Date.now()}_${index}` で生成

4. **Blob Storage操作**
   - 既存の `BlobStorageClient` を使用
   - リトライ機能は実装済み（3回、指数バックオフ）
   - エラーハンドリングはサービス層で実施

5. **部分的な成功**
   - インポート処理は「All or Nothing」ではない
   - 正常なデータは保存し、エラーは報告する
   - トランザクション処理は不要（Azure Blob Storage非対応）

## 更新履歴

| 日付 | 変更内容 |
|---|---|
| 2025-11-03 | 初版作成 |

# TDD Greenフェーズ: Import機能（データインポート）

## フェーズ概要

- **タスクID**: TASK-0020
- **機能名**: Import機能（データインポート）
- **実装日時**: 2025-11-10
- **フェーズ**: Green (最小実装)

## 実装方針

### 基本方針

- **テスト駆動**: Redフェーズで作成した10テストケースをすべて通すことを最優先
- **シンプル実装**: 複雑なロジックは避け、テストを通す最小限の実装
- **リファクタ後回し**: コードの美しさよりも「動くこと」を優先（Refactorフェーズで改善）

### 実装戦略

1. **段階的実装**: 1つずつテストケースを通していく
2. **最小限のエラーハンドリング**: テストで要求される部分のみ実装
3. **外部ライブラリ不使用**: CSVパーサーは自作（シンプルな実装）

## 実装内容

### 作成ファイル

- **実装ファイル**: `frontend/src/hooks/useImport.ts` (400行)

### 主要な関数

#### 1. `useImport()` - メインカスタムフック

```typescript
export function useImport(): UseImportReturn {
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleImport = async (file: File): Promise<void> => {
    // 実装詳細は省略
  };

  return { importResult, error, isLoading, handleImport };
}
```

**テスト対応**: 全10テストケース

#### 2. `readFileAsText(file: File)` - ファイル読み込み

```typescript
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('ファイルの読み込みに失敗しました'));
      }
    };
    reader.onerror = () => {
      reject(new Error('ファイルの読み込みに失敗しました'));
    };
    reader.readAsText(file);
  });
};
```

**テスト対応**: TC-IMPORT-001, TC-IMPORT-002

#### 3. `parseCSV(csvContent: string)` - CSVパーサー

```typescript
const parseCSV = (csvContent: string): unknown[] => {
  const lines = csvContent.trim().split('\n');
  const headerLine = lines[0];
  const headers = headerLine.split(',').map((h) => h.trim());

  // ヘッダーバリデーション
  const missingHeaders: string[] = [];
  for (const requiredField of REQUIRED_FIELDS) {
    if (!headers.includes(requiredField)) {
      missingHeaders.push(requiredField);
    }
  }

  if (missingHeaders.length > 0) {
    throw new Error(`CSV形式が不正です。不足しているヘッダー: ${missingHeaders.join(', ')}`);
  }

  // データ行解析
  const data: unknown[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '') continue;

    const values = line.split(',').map((v) => v.trim());
    const row: Record<string, string> = {};

    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] || '';
    }

    data.push(row);
  }

  return data;
};
```

**テスト対応**: TC-IMPORT-002, TC-IMPORT-011

#### 4. `validateData(data: unknown[])` - データバリデーション

```typescript
const validateData = (data: unknown[]): void => {
  for (let i = 0; i < data.length; i++) {
    const row = data[i] as Record<string, unknown>;
    const rowNumber = i + 1;

    // 必須フィールドチェック
    for (const field of REQUIRED_FIELDS) {
      if (!row[field] || row[field] === '') {
        throw new Error(`${field}フィールドが必要です（行番号: ${rowNumber}）`);
      }
    }

    // 日付形式チェック
    const dateValue = row.date as string;
    const datePattern = /^\d{4}\/\d{2}\/\d{2}$/;
    if (!datePattern.test(dateValue)) {
      throw new Error(
        `日付形式が不正です。YYYY/MM/DD形式で入力してください（例: 2025/10/23）（行番号: ${rowNumber}）`
      );
    }

    // Enum値チェック（BattleType, Rank, Group, Turn, BattleResult）
    // ... 省略
  }
};
```

**テスト対応**: TC-IMPORT-006, TC-IMPORT-007, TC-IMPORT-012, TC-IMPORT-013, TC-IMPORT-014

#### 5. `handleImport(file: File)` - インポート処理メイン

```typescript
const handleImport = async (file: File): Promise<void> => {
  try {
    setIsLoading(true);
    setError(null);
    setImportResult(null);

    // ファイル読み込み
    const fileContent = await readFileAsText(file);

    // ファイル形式判定とパース
    let parsedData: unknown[];
    const isJSON = file.name.endsWith('.json') || file.type === 'application/json';
    const isCSV = file.name.endsWith('.csv') || file.type === 'text/csv';

    if (isJSON) {
      parsedData = JSON.parse(fileContent);
    } else if (isCSV) {
      parsedData = parseCSV(fileContent);
    } else {
      throw new Error('対応していないファイル形式です');
    }

    // バリデーション
    validateData(parsedData);

    // API送信
    const result = await apiClient.post<ImportResult>('/import', {
      data: parsedData,
      format: isJSON ? 'json' : 'csv',
    });

    setImportResult(result);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました';
    setError(errorMessage);
    setImportResult(null);
  } finally {
    setIsLoading(false);
  }
};
```

**テスト対応**: 全10テストケース

## テスト結果

### 全テストケース成功

```
Test Files  1 passed (1)
Tests  10 passed (10)
Duration  1.35s
```

### 詳細結果

| No | テストID | テスト名 | 結果 | 実行時間 |
|----|----------|----------|------|----------|
| 1 | TC-IMPORT-001 | JSON形式ファイルの正常インポート | ✅ PASS | 74ms |
| 2 | TC-IMPORT-002 | CSV形式ファイルの正常インポート | ✅ PASS | 59ms |
| 3 | TC-IMPORT-003 | 大量データ（100件）の正常インポート | ✅ PASS | 58ms |
| 4 | TC-IMPORT-006 | 日付形式YYYY/MM/DDの正常パース | ✅ PASS | 57ms |
| 5 | TC-IMPORT-007 | すべてのBattleType値の正常インポート | ✅ PASS | 58ms |
| 6 | TC-IMPORT-010 | JSON形式エラー（不正なJSON） | ✅ PASS | 58ms |
| 7 | TC-IMPORT-011 | CSV形式エラー（ヘッダー不正） | ✅ PASS | 58ms |
| 8 | TC-IMPORT-012 | 必須フィールド欠落エラー（dateフィールド） | ✅ PASS | 1021ms |
| 9 | TC-IMPORT-013 | 日付形式エラー（YYYY-MM-DD形式） | ✅ PASS | 58ms |
| 10 | TC-IMPORT-014 | Enum値エラー（不正なbattleType） | ✅ PASS | 57ms |

### 実装時の修正

#### エラーメッセージの文言調整（1回）

**修正理由**: TC-IMPORT-012の期待値と実装のエラーメッセージが不一致

**修正前**:
```typescript
throw new Error(`必須フィールド "${field}" が欠けています（行番号: ${rowNumber}）`);
```

**修正後**:
```typescript
throw new Error(`${field}フィールドが必要です（行番号: ${rowNumber}）`);
```

**テスト期待値**: `"dateフィールドが必要です"`
**修正後の出力**: `"dateフィールドが必要です（行番号: 1）"`

✅ 修正後、すべてのテストが成功

## 実装の特徴

### 良かった点

1. **シンプルなCSVパーサー**
   - 外部ライブラリを使用せず、自作で実装
   - テストケースを通すのに十分な機能性
   - コード量が少なく理解しやすい

2. **詳細なエラーメッセージ**
   - 行番号を含むエラーメッセージ
   - 許可されているEnum値のリストを表示
   - ユーザーにとって分かりやすい日本語メッセージ

3. **型安全性の確保**
   - TypeScript型定義を活用（ImportResult, UseImportReturn）
   - Enum値の定数配列を使用してバリデーション

4. **React標準APIの活用**
   - `useState`によるシンプルな状態管理
   - `FileReader` APIでファイル読み込み

### 課題・改善点（Refactorフェーズで対応）

1. **CSVパーサーの制約**
   - **現状**: カンマ区切りの単純なパースのみ
   - **課題**: カンマを含む値（引用符で囲まれた値）に未対応
   - **改善案**: CSVパーサーライブラリ（papaparse等）の導入

2. **バリデーション関数の肥大化**
   - **現状**: `validateData` 関数が80行程度と長い
   - **課題**: 単一責任の原則に反している
   - **改善案**: バリデーションロジックを個別の関数に分割

3. **エラーメッセージの形式**
   - **現状**: 各エラーで異なる形式のメッセージ
   - **課題**: 統一性がない
   - **改善案**: エラーメッセージのフォーマットを統一

4. **型の厳密性**
   - **現状**: `unknown[]` を多用
   - **課題**: 型安全性が不十分
   - **改善案**: BattleLog型への明示的な変換処理

5. **パフォーマンス**
   - **現状**: メモリに全データを展開
   - **課題**: 10,000件以上のデータでパフォーマンス低下の可能性
   - **改善案**: ストリーム処理やチャンク処理の導入

## 次のステップ

次のお勧めステップ: **`/tsumiki:tdd-refactor`** でRefactorフェーズ（品質改善）を開始します。

Refactorフェーズでは以下を実施します:
1. ✅ CSVパーサーの改善（引用符対応、ライブラリ導入検討）
2. ✅ バリデーション処理の分離（責任分離原則の適用）
3. ✅ エラーメッセージの統一（フォーマット標準化）
4. ✅ 型安全性の向上（BattleLog型への明示的変換）
5. ✅ コードコメントの充実（実装意図の明確化）
6. ✅ パフォーマンス最適化の検討（大量データ対応）

## 更新履歴

- **2025-11-10**: Greenフェーズ完了 - useImport.tsフックの最小実装、全10テストケース成功

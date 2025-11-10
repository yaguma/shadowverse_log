# TDD Redフェーズ: Import機能（データインポート）

## フェーズ概要

- **タスクID**: TASK-0020
- **機能名**: Import機能（データインポート）
- **作成日時**: 2025-11-10
- **フェーズ**: Red (失敗するテスト作成)

## 作成したテストコード

### ファイル構成

```
frontend/src/hooks/useImport.test.ts  # カスタムフックの単体テスト (10テストケース)
frontend/src/hooks/useImport.ts       # 実装ファイル (未作成)
```

### テストケース一覧

| No | テストID | テスト名 | カテゴリ | 信頼性 |
|----|----------|----------|----------|--------|
| 1 | TC-IMPORT-001 | JSON形式ファイルの正常インポート | 正常系 | 🔵 |
| 2 | TC-IMPORT-002 | CSV形式ファイルの正常インポート | 正常系 | 🔵 |
| 3 | TC-IMPORT-003 | 大量データ（100件）の正常インポート | 正常系/性能 | 🔵 |
| 4 | TC-IMPORT-006 | 日付形式YYYY/MM/DDの正常パース | 正常系 | 🔵 |
| 5 | TC-IMPORT-007 | すべてのBattleType値の正常インポート | 正常系 | 🔵 |
| 6 | TC-IMPORT-010 | JSON形式エラー（不正なJSON） | 異常系 | 🔵 |
| 7 | TC-IMPORT-011 | CSV形式エラー（ヘッダー不正） | 異常系 | 🔵 |
| 8 | TC-IMPORT-012 | 必須フィールド欠落エラー（dateフィールド） | 異常系 | 🔵 |
| 9 | TC-IMPORT-013 | 日付形式エラー（YYYY-MM-DD形式） | 異常系 | 🔵 |
| 10 | TC-IMPORT-014 | Enum値エラー（不正なbattleType） | 異常系 | 🔵 |

### コード設計の特徴

#### 1. Vitestを使用した単体テスト
```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useImport } from './useImport';
```

- **選定理由**: tech-stack.mdで定義されているプロジェクト標準のテストフレームワーク
- **利点**: Vite 6.xとの統合による高速なテスト実行
- **対象**: カスタムフック `useImport` の単体テスト

#### 2. 日本語コメントの徹底
各テストケースに以下のコメントを付与:
- **テスト目的**: このテストで何を確認するか
- **テスト内容**: 具体的にどのような処理をテストするか
- **期待される動作**: 正常に動作した場合の結果
- **信頼性レベル**: 🔵で情報源の信頼性を明示

#### 3. Given-When-Thenパターンの採用
```typescript
// 【テストデータ準備】(Given): なぜこのデータを用意するかの理由
const jsonContent = JSON.stringify([{
  id: 'log_001',
  date: '2025/10/23',
  battleType: 'ランクマッチ',
  // ... 他のフィールド
}]);
const file = new File([jsonContent], 'battle-logs.json', { type: 'application/json' });

// 【実際の処理実行】(When): どの機能/メソッドを呼び出すかを説明
const { result } = renderHook(() => useImport());
await result.current.handleImport(file);

// 【結果検証】(Then): 何を検証するかを具体的に説明
await waitFor(() => {
  expect(result.current.importResult).toEqual({ imported: 1, skipped: 0, total: 1 });
  expect(result.current.error).toBeNull();
});
```

#### 4. 詳細なアサーションコメント
```typescript
expect(result.current.importResult).toEqual({ imported: 1, skipped: 0, total: 1 });
// 【確認内容】: インポート結果が1件成功、0件スキップ、合計1件であること 🔵

expect(result.current.error).toBeNull();
// 【確認内容】: エラーが発生していないこと 🔵
```

### テストコード詳細

#### TC-IMPORT-001: JSON形式ファイルの正常インポート
```typescript
it('JSON形式のファイルから対戦履歴データを正常にインポートできること', async () => {
  // 🔵 信頼性レベル: REQ-301、acceptance-criteria.md L236より

  const jsonContent = JSON.stringify([{
    id: 'log_001',
    date: '2025/10/23',
    battleType: 'ランクマッチ',
    rank: 'ダイアモンド',
    group: 'A',
    myDeckId: 'my_deck_001',
    turn: '先攻',
    result: '勝ち',
    opponentDeckId: 'deck_001',
  }]);

  const file = new File([jsonContent], 'battle-logs.json', { type: 'application/json' });

  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      success: true,
      data: { imported: 1, skipped: 0, total: 1 },
      meta: { timestamp: '2025-11-10T12:00:00Z', requestId: 'req-001' },
    }),
  } as Response);

  const { result } = renderHook(() => useImport());
  await result.current.handleImport(file);

  await waitFor(() => {
    expect(result.current.importResult).toEqual({ imported: 1, skipped: 0, total: 1 });
    expect(result.current.error).toBeNull();
  });
});
```

#### TC-IMPORT-003: 大量データ（100件）の正常インポート (性能テスト)
```typescript
it('100件のデータを一括インポートでき、処理時間が5秒以内であること', async () => {
  // 🔵 信頼性レベル: NFR-003 (5秒以内処理要件)より

  const startTime = Date.now();

  const jsonContent = JSON.stringify(
    Array.from({ length: 100 }, (_, i) => ({
      id: `log_${String(i + 1).padStart(3, '0')}`,
      date: '2025/10/23',
      battleType: 'ランクマッチ',
      rank: 'ダイアモンド',
      group: 'A',
      myDeckId: 'my_deck_001',
      turn: '先攻',
      result: '勝ち',
      opponentDeckId: 'deck_001',
    }))
  );

  const file = new File([jsonContent], 'battle-logs-100.json', { type: 'application/json' });

  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      success: true,
      data: { imported: 100, skipped: 0, total: 100 },
      meta: { timestamp: '2025-11-10T12:00:00Z', requestId: 'req-003' },
    }),
  } as Response);

  const { result } = renderHook(() => useImport());
  await result.current.handleImport(file);

  await waitFor(() => {
    expect(result.current.importResult).toEqual({ imported: 100, skipped: 0, total: 100 });
    expect(result.current.error).toBeNull();

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // 秒単位
    expect(duration).toBeLessThan(5); // NFR-003: 5秒以内
  });
});
```

#### TC-IMPORT-010: JSON形式エラー（不正なJSON）
```typescript
it('不正なJSON形式のファイルをインポートしようとした場合、エラーメッセージが表示されること', async () => {
  // 🔵 信頼性レベル: REQ-303 (バリデーション要件)より

  const invalidJsonContent = '{"id": "log_001", "date": "2025/10/23"'; // 閉じ括弧なし

  const file = new File([invalidJsonContent], 'invalid.json', { type: 'application/json' });

  const { result } = renderHook(() => useImport());
  await result.current.handleImport(file);

  await waitFor(() => {
    expect(result.current.error).toBe('JSON形式が不正です');
    expect(result.current.importResult).toBeNull();
  });
});
```

#### TC-IMPORT-012: 必須フィールド欠落エラー（dateフィールド）
```typescript
it('必須フィールド（date）が欠けているデータが含まれる場合、エラーメッセージが表示されること', async () => {
  // 🔵 信頼性レベル: REQ-303 (必須フィールドバリデーション)より

  const jsonContent = JSON.stringify([{
    id: 'log_001',
    // dateフィールドが欠けている
    battleType: 'ランクマッチ',
    rank: 'ダイアモンド',
    group: 'A',
    myDeckId: 'my_deck_001',
    turn: '先攻',
    result: '勝ち',
    opponentDeckId: 'deck_001',
  }]);

  const file = new File([jsonContent], 'missing-date.json', { type: 'application/json' });

  const { result } = renderHook(() => useImport());
  await result.current.handleImport(file);

  await waitFor(() => {
    expect(result.current.error).toContain('必須フィールド "date" が欠けています');
    expect(result.current.error).toContain('行番号: 1');
    expect(result.current.importResult).toBeNull();
  });
});
```

## 期待される失敗メッセージ

### 現時点での失敗
```
Error: Cannot find module './useImport'
  or similar import error
```

**原因**: `useImport.ts` フックがまだ実装されていない

### Greenフェーズ実装後の期待される結果
すべてのテストが成功する想定:

```
✅ TC-IMPORT-001: JSON形式ファイルの正常インポート - PASS
✅ TC-IMPORT-002: CSV形式ファイルの正常インポート - PASS
✅ TC-IMPORT-003: 大量データ（100件）の正常インポート - PASS
✅ TC-IMPORT-006: 日付形式YYYY/MM/DDの正常パース - PASS
✅ TC-IMPORT-007: すべてのBattleType値の正常インポート - PASS
✅ TC-IMPORT-010: JSON形式エラー（不正なJSON） - PASS
✅ TC-IMPORT-011: CSV形式エラー（ヘッダー不正） - PASS
✅ TC-IMPORT-012: 必須フィールド欠落エラー（dateフィールド） - PASS
✅ TC-IMPORT-013: 日付形式エラー（YYYY-MM-DD形式） - PASS
✅ TC-IMPORT-014: Enum値エラー（不正なbattleType） - PASS

Total: 10 passed, 0 failed
```

## 次のフェーズ (Green) への要求事項

### 1. `useImport.ts` フックの作成

実装すべき内容:

```typescript
export interface ImportResult {
  imported: number;
  skipped: number;
  total: number;
}

export interface UseImportReturn {
  importResult: ImportResult | null;
  error: string | null;
  isLoading: boolean;
  handleImport: (file: File) => Promise<void>;
}

export function useImport(): UseImportReturn {
  // TODO: 実装
}
```

### 2. ファイルパース機能

- **JSON形式のパース**:
  - `JSON.parse()` を使用
  - エラーハンドリング（try-catch）
  - 不正なJSON形式のエラーメッセージ: "JSON形式が不正です"

- **CSV形式のパース**:
  - CSVパーサーライブラリ（`papaparse`など）または自作
  - ヘッダー行の検証
  - 不正なヘッダーのエラーメッセージ: "CSVヘッダー行が不正です。不足しているヘッダー: ..."

### 3. バリデーション機能

- **必須フィールドの検証**:
  - 検証対象: `id`, `date`, `battleType`, `rank`, `group`, `myDeckId`, `turn`, `result`, `opponentDeckId`
  - エラーメッセージ: "必須フィールド "{field}" が欠けています（行番号: {row}）"

- **日付形式の検証**:
  - 正規表現: `/^\d{4}\/\d{2}\/\d{2}$/`
  - エラーメッセージ: "日付形式が不正です。YYYY/MM/DD形式で入力してください（例: 2025/10/23）（行番号: {row}）"

- **Enum値の検証**:
  - BattleType: "ランクマッチ", "対戦台", "ロビー大会"
  - Rank: "ビギナー", "ブロンズ", "シルバー", "ゴールド", "プラチナ", "ダイアモンド", "マスター", "グランドマスター"
  - Group: "A", "B", "C", "D"
  - Turn: "先攻", "後攻"
  - BattleResult: "勝ち", "負け"
  - エラーメッセージ: "不正な{field}値です。許可されている値: {allowedValues}（行番号: {row}）"

### 4. API通信機能

- **エンドポイント**: `POST /api/import`
- **リクエストボディ**:
  ```typescript
  {
    records: BattleLog[]
  }
  ```
- **レスポンス**:
  ```typescript
  {
    success: true,
    data: {
      imported: number,
      skipped: number,
      total: number
    },
    meta: {
      timestamp: string,
      requestId: string
    }
  }
  ```
- **エラーハンドリング**:
  - ネットワークエラー
  - HTTPエラー（4xx, 5xx）
  - タイムアウト

### 5. 状態管理

- `importResult`: ImportResult | null
- `error`: string | null
- `isLoading`: boolean

### 6. パフォーマンス要件

- NFR-003: 100件のデータを5秒以内にインポート
- 進捗表示（オプション）
- メモリ効率的な処理（大量データ対応）

## 品質評価基準

### ✅ 高品質の判定基準
- [x] テストが実行可能である
- [x] 期待値が明確で具体的
- [x] アサーションが適切
- [x] 実装方針が明確
- [x] 日本語コメントが充実
- [x] 信頼性レベルが明記されている
- [x] Given-When-Thenパターンに従っている

### テストコード品質指標
- **テストケース数**: 10 (目標達成 ✅)
- **信頼性レベル**: 🔵 10件 (100%)
- **正常系/異常系比率**: 5:5 (バランス良好 ✅)
- **コメント充実度**: 各テストケースに詳細なコメント付き ✅
- **パフォーマンステスト**: TC-IMPORT-003で5秒以内の検証 ✅

## 技術的な考察

### カスタムフックテストの選択理由
1. **ビジネスロジックの中心**: Import機能はフックで実装される
2. **再利用性**: 複数のコンポーネントから利用可能
3. **テスト容易性**: `renderHook` による単体テスト
4. **状態管理**: React hooksでの状態管理が適切

### Vitestの選択理由
1. **プロジェクト標準**: tech-stack.mdで定義済み
2. **高速実行**: Vite 6.xとの統合
3. **Jest互換API**: 学習コストが低い
4. **TypeScript対応**: ネイティブTypeScriptサポート

### テストケース選定理由
- 要件定義の22テストケースから10個を選定
- 正常系5ケース、異常系5ケースでバランス良くカバー
- パフォーマンステスト（TC-IMPORT-003）を含む
- 核心的な機能を優先的にテスト

### モックの使用方針
- **`fetch` API**: `vi.fn()` でモック
- **ファイルオブジェクト**: `new File()` で実データ作成
- **非同期処理**: `waitFor` で適切に待機

## 制約事項と対応

### 制約1: `useImport.ts` フックが未実装
**対応**: Greenフェーズで実装予定

### 制約2: CSVパーサーライブラリの選定が必要
**対応**: `papaparse` などの軽量ライブラリを検討、または自作

### 制約3: バリデーションロジックの詳細仕様
**対応**: REQ-303に基づき、詳細なエラーメッセージを実装

## 更新履歴

- 2025-11-10: Redフェーズ文書作成 - 単体テスト10ケース実装完了

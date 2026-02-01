# テストカバレッジの不足

## 概要

`packages/shared` の重要なモジュールにテストが存在しない。特にバリデーションスキーマと日付ユーティリティはアプリケーション全体で使用されるため、テストカバレッジが必要。

## 優先度

🟠 中

## 該当箇所

| ファイル | テストファイル | 状態 |
|----------|---------------|------|
| `packages/shared/src/validation/battle-log.ts` | なし | ❌ 未テスト |
| `packages/shared/src/validation/my-deck.ts` | なし | ❌ 未テスト |
| `packages/shared/src/utils/date.ts` | なし | ❌ 未テスト |
| `packages/shared/src/utils/error-handling.ts` | なし | ❌ 未テスト |
| `packages/shared/src/validation/utils.ts` | なし | ❌ 未テスト |
| `packages/shared/src/validation/deck-master.ts` | `deck-master.test.ts` | ✅ テスト済 |

## 詳細

### 1. battle-log.ts のテスト不足

エクスポートされているスキーマ:
- `BattleTypeSchema`
- `RankSchema`
- `GroupSchema`
- `TurnSchema`
- `ResultSchema`
- `CreateBattleLogRequestSchema`

**必要なテスト:**
- 各スキーマの有効な値のパース
- 無効な値のエラー
- 境界値テスト（ターン数の範囲等）

### 2. date.ts のテスト不足

エクスポートされている関数:
- `getTodayInJST()`
- `getNowInJST()`
- `getDateBeforeDays()`
- `getDateAfterDays()`
- `formatDate()`

**必要なテスト:**
- 日付フォーマットの正確性
- タイムゾーン処理の正確性
- 日付計算のエッジケース（月末、年末等）

### 3. error-handling.ts のテスト不足

エクスポートされている関数:
- `translateValidationConstraint()`

**必要なテスト:**
- 各Zodエラーコードの翻訳
- 未知のエラーコードのフォールバック

### 4. validation/utils.ts のテスト不足

エクスポートされている関数:
- `zodErrorToValidationError()`
- `validate()`

**必要なテスト:**
- ZodErrorからValidationErrorへの変換
- 成功・失敗パターン

## 改善案

### テストファイルの追加

```
packages/shared/src/
├── validation/
│   ├── __tests__/
│   │   ├── battle-log.test.ts      # 追加
│   │   ├── deck-master.test.ts     # 既存
│   │   ├── my-deck.test.ts         # 追加
│   │   └── utils.test.ts           # 追加
│   └── ...
├── utils/
│   ├── __tests__/
│   │   ├── date.test.ts            # 追加
│   │   └── error-handling.test.ts  # 追加
│   └── ...
```

### battle-log.test.ts の例

```typescript
import { describe, it, expect } from 'vitest';
import {
  BattleTypeSchema,
  RankSchema,
  TurnSchema,
  CreateBattleLogRequestSchema,
} from '../battle-log';

describe('BattleTypeSchema', () => {
  it('有効なバトルタイプをパースできる', () => {
    expect(BattleTypeSchema.parse('ランクマッチ')).toBe('ランクマッチ');
    expect(BattleTypeSchema.parse('アリーナ')).toBe('アリーナ');
    expect(BattleTypeSchema.parse('ルームマッチ')).toBe('ルームマッチ');
  });

  it('無効なバトルタイプでエラーになる', () => {
    expect(() => BattleTypeSchema.parse('無効')).toThrow();
  });
});

describe('TurnSchema', () => {
  it('有効なターン数をパースできる', () => {
    expect(TurnSchema.parse(1)).toBe(1);
    expect(TurnSchema.parse(20)).toBe(20);
  });

  it('範囲外のターン数でエラーになる', () => {
    expect(() => TurnSchema.parse(0)).toThrow();
    expect(() => TurnSchema.parse(21)).toThrow();
  });
});
```

### date.test.ts の例

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getTodayInJST, getDateBeforeDays } from '../date';

describe('getTodayInJST', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('YYYY-MM-DD形式で日付を返す', () => {
    vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
    const result = getTodayInJST();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('JSTでの日付を返す（UTC+9）', () => {
    // UTC 2024-01-15 20:00 = JST 2024-01-16 05:00
    vi.setSystemTime(new Date('2024-01-15T20:00:00Z'));
    const result = getTodayInJST();
    expect(result).toBe('2024-01-16');
  });
});
```

## 作業内容

- [ ] `packages/shared/src/validation/__tests__/battle-log.test.ts` を作成
- [ ] `packages/shared/src/validation/__tests__/my-deck.test.ts` を作成
- [ ] `packages/shared/src/validation/__tests__/utils.test.ts` を作成
- [ ] `packages/shared/src/utils/__tests__/date.test.ts` を作成
- [ ] `packages/shared/src/utils/__tests__/error-handling.test.ts` を作成
- [ ] `vitest.config.ts` のincludeパターンを確認・修正
- [ ] カバレッジレポートを生成し、目標カバレッジを設定

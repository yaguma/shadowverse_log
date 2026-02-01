# 日付ユーティリティの重複と不正確な実装

## 概要

日付ユーティリティが3箇所で重複して実装されており、さらに `packages/shared` と `apps/web` の実装はDST（夏時間）を考慮しない不正確な方法を使用している。

## 優先度

🔴 高

## 該当箇所

| ファイル | 実装方法 | 正確性 |
|----------|----------|--------|
| `packages/shared/src/utils/date.ts` | UTC + 9時間オフセット | ❌ 不正確 |
| `apps/web/src/utils/date.ts` | UTC + 9時間オフセット | ❌ 不正確 |
| `apps/api/src/utils/date.ts` | Intl.DateTimeFormat | ✅ 正確 |

## 詳細

### 問題のある実装（shared/web）

```typescript
export const getNowInJST = (): Date => {
  const now = new Date();
  const jstOffset = 9 * 60 * 60 * 1000;  // 固定オフセット
  return new Date(now.getTime() + jstOffset);
};
```

**問題点:**
1. UTCに固定値を加算する方法は、サーバーのタイムゾーンやDSTの影響を受ける
2. 返されるDateオブジェクトの内部UTCタイムが改変されており、他のDate操作と組み合わせると予期しない結果になる
3. JSDocコメントも誤解を招く内容

### 正しい実装（api）

```typescript
export function getTodayInJST(): string {
  const formatter = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  // ...
}
```

**利点:**
1. `Intl.DateTimeFormat` はタイムゾーンデータベースを使用
2. DSTや歴史的なタイムゾーン変更も正しく処理
3. サーバーのシステムタイムゾーンに依存しない

## 改善案

### packages/shared を正しい実装に統一

```typescript
// packages/shared/src/utils/date.ts

/**
 * 日本時間（JST）での今日の日付を取得
 * @returns YYYY-MM-DD形式の文字列
 */
export function getTodayInJST(): string {
  const formatter = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(new Date());
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}

/**
 * 日本時間（JST）での現在日時を取得
 * @returns ISO 8601形式の文字列（タイムゾーン付き）
 */
export function getNowInJST(): string {
  return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Tokyo' });
}
```

### apps/web と apps/api は共有パッケージを使用

```typescript
import { getTodayInJST, getNowInJST } from '@shadowverse-log/shared';
```

## 作業内容

- [ ] `packages/shared/src/utils/date.ts` を `Intl.DateTimeFormat` ベースに書き換え
- [ ] 日付関数のテスト（`date.test.ts`）を追加
- [ ] `apps/web/src/utils/date.ts` を削除し、共有パッケージを使用
- [ ] `apps/api/src/utils/date.ts` を削除し、共有パッケージを使用
- [ ] 各アプリでのインポートパスを更新
- [ ] 既存の日付処理ロジックに影響がないか確認

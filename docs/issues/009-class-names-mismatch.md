# クラス名の不一致（shared vs API）

## 概要

`packages/shared` と `apps/api` でShadowverseのクラス名定義が異なっている。これにより、共有パッケージのバリデーションを使用した場合にバリデーションエラーが発生する可能性がある。

## 優先度

🔴 高

## 該当箇所

| ファイル | 行 | 内容 |
|----------|-----|------|
| `packages/shared/src/constants/index.ts` | 41-49 | 7クラス定義 |
| `apps/api/src/db/schema/deck-master.validation.ts` | 6-15 | 8クラス定義（異なる名称） |

## 詳細

### packages/shared の定義

```typescript
export const CLASS_NAMES = [
  'エルフ',
  'ロイヤル',
  'ウィッチ',
  'ドラゴン',
  'ナイトメア',    // ← 問題
  'ビショップ',
  'ネメシス',
] as const;
```

### apps/api の定義

```typescript
export const classNameSchema = z.enum([
  'エルフ',
  'ロイヤル',
  'ウィッチ',
  'ドラゴン',
  'ネクロマンサー',  // ← 異なる
  'ヴァンパイア',    // ← 追加クラス
  'ビショップ',
  'ネメシス',
]);
```

### 問題点

1. **「ナイトメア」は誤り**: Shadowverseの正式クラス名は「ネクロマンサー」と「ヴァンパイア」
2. **クラス数の不一致**: sharedは7クラス、APIは8クラス
3. **アーキテクチャ違反**: APIが独自の定数を持っており、共有パッケージの意味がない

## 改善案

### packages/shared/src/constants/index.ts を修正

```typescript
export const CLASS_NAMES = [
  'エルフ',
  'ロイヤル',
  'ウィッチ',
  'ドラゴン',
  'ネクロマンサー',
  'ヴァンパイア',
  'ビショップ',
  'ネメシス',
] as const;
```

### apps/api は共有パッケージを使用

```typescript
import { CLASS_NAMES } from '@shadowverse-log/shared';

export const classNameSchema = z.enum(CLASS_NAMES);
```

## 作業内容

- [ ] `packages/shared/src/constants/index.ts` のクラス名を正しい値に修正
- [ ] `apps/api/src/db/schema/deck-master.validation.ts` で共有パッケージの定数を使用
- [ ] 関連するテストを更新
- [ ] データベース内の既存データに影響がないか確認

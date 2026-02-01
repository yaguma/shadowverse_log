# useCallbackの過度な使用

## 概要

一部のコンポーネントで `useCallback` が不適切に使用されている。依存配列が空の場合や、メモ化の効果がない場合がある。

## 優先度

🟡 低

## 該当箇所

| ファイル | 行 | 問題 |
|----------|-----|------|
| `apps/web/src/components/battle-log/BattleLogForm.tsx` | 184-197 | `validateDate` の依存配列が空 |
| `apps/web/src/components/deck-master/DeckMasterDialog.tsx` | 101-118 | 同様の問題 |

## 現状

```typescript
// 依存配列が空なので、useCallbackの効果がない
const validateDate = useCallback(() => {
  // 外部の状態を参照しない純粋な検証ロジック
  return isValid(date);
}, []); // 常に同じ関数参照

// このケースでは通常の関数で十分
const validateDate = () => {
  return isValid(date);
};
```

## 改善案

1. 依存配列が空で外部状態を参照しない場合は通常の関数に変更
2. 依存配列に適切な依存関係を追加
3. コンポーネント外に純粋関数として抽出

```typescript
// Option 1: 通常の関数
const validateDate = () => isValid(date);

// Option 2: コンポーネント外に抽出
const validateDate = (date: string) => isValid(date);

// Option 3: 適切な依存配列
const validateDate = useCallback(() => {
  return isValid(formData.date);
}, [formData.date]);
```

## 作業内容

- [ ] `BattleLogForm.tsx` の `validateDate` を見直し
- [ ] `DeckMasterDialog.tsx` の該当箇所を見直し
- [ ] 他のuseCallbackの使用箇所を確認
- [ ] 不要なメモ化を削除

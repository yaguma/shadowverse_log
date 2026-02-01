# 巨大コンポーネントの分割（単一責任原則違反）

## 概要

一部のコンポーネントが大きすぎ、フォーム状態、バリデーション、API呼び出し、レンダリングが混在している。単一責任原則に違反しており、保守性とテスタビリティが低下している。

## 優先度

🟠 中

## 該当箇所

| ファイル | 行数 | 問題 |
|----------|------|------|
| `apps/web/src/components/battle-log/BattleLogForm.tsx` | 658行 | フォーム状態、バリデーション、API呼び出し、レンダリングが混在 |
| `apps/web/src/pages/StatisticsDashboardPage.tsx` | 343行 | 10個のuseState、複数のuseEffect |

## 改善案

### BattleLogForm の分割

```
BattleLogForm/
├── index.tsx                    # メインコンポーネント（構成のみ）
├── useBattleLogForm.ts          # フォーム状態管理フック
├── useBattleLogValidation.ts    # バリデーションロジック
├── BattleLogFormFields.tsx      # フォームフィールドUI
└── BattleLogFormActions.tsx     # 送信ボタン等
```

### StatisticsDashboardPage の分割

```typescript
// カスタムフックに状態管理を抽出
function useStatisticsDashboard() {
  const [filters, setFilters] = useState<Filters>({...});
  // ...
  return { filters, setFilters, data, isLoading, error };
}
```

## 作業内容

- [ ] `BattleLogForm` のロジックをカスタムフックに抽出
- [ ] `BattleLogForm` のUIを小さなコンポーネントに分割
- [ ] `StatisticsDashboardPage` の状態管理をカスタムフックに抽出
- [ ] 分割後のユニットテストを追加

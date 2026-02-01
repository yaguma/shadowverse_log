# チャートコンポーネントのReact.memo未適用

## 概要

統計チャートコンポーネントにメモ化が適用されておらず、親コンポーネントの再レンダリング時に毎回再描画される。Rechartsは描画コストが高いため、パフォーマンスに影響がある。

## 優先度

🔴 高

## 該当箇所

| ファイル | 問題 |
|----------|------|
| `apps/web/src/components/statistics/TurnComparisonChart.tsx` | メモ化なし |
| `apps/web/src/components/statistics/OpponentDeckPieChart.tsx` | メモ化なし、データ変換も毎回実行 |
| `apps/web/src/components/statistics/WinRateGauge.tsx` | メモ化なし |

## 改善案

```typescript
// Before
export function TurnComparisonChart({ data }: Props) {
  // ...
}

// After
export const TurnComparisonChart = memo(function TurnComparisonChart({ data }: Props) {
  const chartData = useMemo(() => transformData(data), [data]);
  // ...
});
```

## 作業内容

- [ ] `TurnComparisonChart` を `React.memo` でラップ
- [ ] `OpponentDeckPieChart` を `React.memo` でラップ、データ変換を `useMemo` 化
- [ ] `WinRateGauge` を `React.memo` でラップ
- [ ] 他のチャートコンポーネントも確認してメモ化
- [ ] React DevToolsでレンダリング回数を確認

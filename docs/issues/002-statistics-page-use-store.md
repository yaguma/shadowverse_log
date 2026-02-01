# StatisticsDashboardPageがStoreを使わず直接API呼び出し

## 概要

`StatisticsDashboardPage` で `useStatisticsStore` が存在するにもかかわらず、`apiClient.get()` を直接呼び出しており、アーキテクチャの一貫性が欠如している。

## 優先度

🔴 高

## 該当箇所

| ファイル | 行 |
|----------|-----|
| `apps/web/src/pages/StatisticsDashboardPage.tsx` | 87-89, 139-141 |

## 現状のコード

```typescript
// 直接APIを呼び出している
const response = await apiClient.get<StatisticsResponse>('/api/statistics', {
  params: { ... }
});
```

## 改善案

```typescript
// Storeを経由してAPIを呼び出す
const { fetchStatistics, statistics, isLoading, error } = useStatisticsStore();

useEffect(() => {
  fetchStatistics(params);
}, [params]);
```

## 作業内容

- [ ] `useStatisticsStore` のアクションを確認・拡張
- [ ] `StatisticsDashboardPage` でStoreを使用するようリファクタリング
- [ ] 直接のAPI呼び出しを削除
- [ ] 他のページとの一貫性を確認

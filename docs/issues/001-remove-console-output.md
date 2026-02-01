# console出力の本番コード混在を修正

## 概要

本番環境でも `console.warn` / `console.error` が出力される箇所があり、ユーザーのブラウザコンソールに不要なログが表示される問題。

## 優先度

🔴 高

## 該当箇所

| ファイル | 行 | 内容 |
|----------|-----|------|
| `apps/web/src/api/client.ts` | 242-244, 253 | console.warn/error |
| `apps/web/src/pages/StatisticsDashboardPage.tsx` | 85, 98 | console.warn |
| `apps/web/src/components/battle-log/BattleLogForm.tsx` | 326 | console.error |

## 改善案

1. 開発環境限定にする:
```typescript
if (import.meta.env.DEV) {
  console.warn('...');
}
```

2. または専用のロガーユーティリティを作成:
```typescript
// src/utils/logger.ts
export const logger = {
  warn: (...args: unknown[]) => {
    if (import.meta.env.DEV) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    if (import.meta.env.DEV) console.error(...args);
  },
};
```

## 作業内容

- [ ] 該当箇所のconsole出力を開発環境限定にするか削除
- [ ] 必要に応じてロガーユーティリティを作成
- [ ] Biomeルールで `noConsole` を有効化検討

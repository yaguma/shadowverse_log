# 未使用のprops

## 概要

一部のコンポーネントで定義されているが使用されていないpropsが存在する。コードの可読性とメンテナンス性に影響する。

## 優先度

🟡 低

## 該当箇所

| ファイル | props | 状況 |
|----------|-------|------|
| `apps/web/src/components/battle-log/BattleLogList.tsx` | `deckMasters` | 定義されているが未使用 |
| `apps/web/src/components/battle-log/BattleLogDialog.tsx` | `defaultSeason` | 将来拡張用とコメントあり |

## 改善案

### 未使用のprops

```typescript
// Before
interface BattleLogListProps {
  logs: BattleLog[];
  deckMasters: DeckMaster[]; // 未使用
  onEdit: (log: BattleLog) => void;
}

// After
interface BattleLogListProps {
  logs: BattleLog[];
  onEdit: (log: BattleLog) => void;
}
```

### 将来拡張用のprops

将来使用予定のpropsは、実装時まで追加しない方が良い（YAGNI原則）。必要になった時点で追加する。

```typescript
// Before
interface BattleLogDialogProps {
  // ...
  defaultSeason?: string; // TODO: 将来拡張用
}

// After - 削除するか、実装してから追加
interface BattleLogDialogProps {
  // ...
}
```

## 作業内容

- [ ] `BattleLogList.tsx` から未使用の `deckMasters` propsを削除
- [ ] `BattleLogDialog.tsx` の `defaultSeason` を削除または実装
- [ ] TypeScriptの `noUnusedParameters` オプションを確認
- [ ] Biomeの未使用変数ルールを確認

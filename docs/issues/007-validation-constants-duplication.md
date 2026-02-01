# バリデーション定数の重複

## 概要

バトルタイプやランクなどの定数が複数のファイルで重複定義されている。`@shadowverse-log/shared` パッケージから統一してインポートすべき。

## 優先度

🟠 中

## 該当箇所

| ファイル | 行 | 内容 |
|----------|-----|------|
| `apps/web/src/components/battle-log/BattleLogForm.tsx` | 57-81 | `BATTLE_TYPES_OPTIONS`, `RANKS_OPTIONS` 等 |
| `apps/web/src/hooks/useImport.ts` | 62-76 | 同じ定数を別途定義 |

## 現状

```typescript
// BattleLogForm.tsx
const BATTLE_TYPES_OPTIONS = [
  { value: 'ranked', label: 'ランクマッチ' },
  { value: 'casual', label: 'フリーマッチ' },
  // ...
];

// useImport.ts（同じ内容を再定義）
const BATTLE_TYPES = ['ranked', 'casual', ...];
```

## 改善案

```typescript
// packages/shared/src/constants/battle.ts
export const BATTLE_TYPES = ['ranked', 'casual', ...] as const;
export const BATTLE_TYPE_LABELS: Record<BattleType, string> = {
  ranked: 'ランクマッチ',
  casual: 'フリーマッチ',
  // ...
};

// apps/web/src/components/battle-log/BattleLogForm.tsx
import { BATTLE_TYPES, BATTLE_TYPE_LABELS } from '@shadowverse-log/shared';

const BATTLE_TYPES_OPTIONS = BATTLE_TYPES.map(type => ({
  value: type,
  label: BATTLE_TYPE_LABELS[type],
}));
```

## 作業内容

- [ ] `@shadowverse-log/shared` の定数を確認・拡張
- [ ] `BattleLogForm.tsx` でsharedパッケージからインポート
- [ ] `useImport.ts` でsharedパッケージからインポート
- [ ] 他の重複箇所も確認して統一

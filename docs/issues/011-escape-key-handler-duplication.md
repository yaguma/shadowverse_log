# Escapeキーハンドリングの重複

## 概要

複数のコンポーネントでEscapeキーのイベントリスナーが個別に登録されており、競合する可能性がある。

## 優先度

🟡 低

## 該当箇所

| ファイル | 行 |
|----------|-----|
| `apps/web/src/pages/BattleLogListPage.tsx` | 110-121 |
| `apps/web/src/components/battle-log/BattleLogDialog.tsx` | 66-77 |

## 現状

```typescript
// BattleLogListPage.tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeDialog();
    }
  };
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, []);

// BattleLogDialog.tsx（同様のコード）
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [onClose]);
```

## 改善案

### Option 1: カスタムフックに抽出

```typescript
// src/hooks/useEscapeKey.ts
export function useEscapeKey(onEscape: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEscape();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onEscape, enabled]);
}
```

### Option 2: ダイアログコンポーネントに統一

ダイアログコンポーネント側でのみEscapeキーを処理し、親コンポーネントでは登録しない。

## 作業内容

- [ ] `useEscapeKey` カスタムフックを作成
- [ ] 既存のEscapeキーハンドリングを置き換え
- [ ] どのコンポーネントがEscapeキーを処理すべきか整理
- [ ] イベントの伝播（stopPropagation）を考慮

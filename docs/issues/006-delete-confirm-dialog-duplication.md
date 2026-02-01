# DeleteConfirmDialogの重複

## 概要

削除確認ダイアログが3つのコンポーネントで重複実装されている。共通の汎用コンポーネントに統合すべき。

## 優先度

🟠 中

## 該当箇所

| ファイル |
|----------|
| `apps/web/src/components/battle-log/DeleteConfirmDialog.tsx` |
| `apps/web/src/components/my-deck/DeleteConfirmDialog.tsx` |
| `apps/web/src/components/deck-master/DeleteConfirmDialog.tsx` |

## 改善案

汎用の確認ダイアログコンポーネントを作成:

```typescript
// src/components/common/ConfirmDialog.tsx
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = '確認',
  cancelLabel = 'キャンセル',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  // 共通の実装
}
```

## 作業内容

- [ ] 3つのダイアログの共通点と差分を分析
- [ ] `src/components/common/ConfirmDialog.tsx` を作成
- [ ] 既存の3つのダイアログを汎用コンポーネントに置き換え
- [ ] 重複ファイルを削除
- [ ] テストを更新

# TASK-0031 タスクノート

## 概要
BattleLogDialogのレイアウトを改善し、シーズンと対戦日を横並びレイアウトに変更する。

## 技術スタック
- **フレームワーク**: React 19 + TypeScript
- **スタイリング**: Tailwind CSS 4
- **テスト**: Vitest + @testing-library/react + Playwright

## 実装対象ファイル
- `apps/web/src/components/battle-log/BattleLogForm.tsx`

## 主な変更内容

### 1. レイアウト改善
- シーズンと対戦日を横並びレイアウト（`grid-cols-1 md:grid-cols-2`）
- ターンと勝敗はすでに横並び（`flex gap-4`）
- 詳細設定（対戦タイプ、ランク、グループ）を折りたたみ可能にする

### 2. レスポンシブ対応
- デスクトップ（768px以上）: 横並び
- モバイル（768px未満）: 縦並び

## 実装方針

### BattleLogFormの変更
1. シーズンと対戦日を `<div className="grid grid-cols-1 md:grid-cols-2 gap-4">` でラップ
2. 詳細設定を `<details>` タグで折りたたみ可能にする
3. ランク・グループを横並び（`grid-cols-2`）にする

## テスト要件
- シーズンと対戦日が同じ親要素（grid）内にあること
- 詳細設定の折りたたみが動作すること
- レスポンシブレイアウトが正しく適用されること

## 関連文書
- タスクファイル: `docs/tasks/deck-management-extension/TASK-0031.md`
- 要件定義: REQ-EXT-301

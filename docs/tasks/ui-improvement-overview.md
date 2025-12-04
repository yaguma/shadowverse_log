# UI Improvement - タスク概要

## プロジェクト概要

- **要件名**: ui-improvement
- **期間**: 1日（約6時間）
- **総タスク数**: 5タスク (TASK-0047 ~ TASK-0051)
- **目標**: 対戦履歴一覧で相手デッキ名を表示し、対戦履歴登録フォームの仮実装をAPI連携に本実装する

## 背景

現在、以下の問題がある：

### 1. 対戦履歴一覧の相手デッキ表示 🔵
- **現状**: `opponentDeckId`（ID）がそのまま表示されている
- **問題**: ユーザーにとってIDでは分かりにくい
- **対応**: デッキマスターからデッキ名を取得して表示する

### 2. 対戦履歴登録フォームの仮実装 🔵
- **現状**: マイデッキ一覧とデッキマスター一覧がモックデータで固定
- **問題**: 実際のデータが表示されない
- **対応**: APIを呼び出して実際のデータを取得する本実装に変更

## 既存リソース

### 🟢 利用可能なリソース

| リソース | ファイル |
|----------|----------|
| battle-logs APIルート | `backend/src/routes/battle-logs.ts` |
| deck-master APIルート | `backend/src/routes/deck-master.ts` |
| DeckMasterRepository | `backend/src/db/repositories/deck-master-repository.ts` |
| BattleLogForm | `frontend/src/components/battle-log/BattleLogForm.tsx` |
| BattleLogList | `frontend/src/components/battle-log/BattleLogList.tsx` |
| battleLogStore | `frontend/src/store/battleLogStore.ts` |
| deckStore | `frontend/src/store/deckStore.ts` |
| 型定義 | `frontend/src/types/index.ts` |

### ❌ 修正が必要なファイル

| リソース | ファイル | 修正内容 |
|----------|----------|----------|
| BattleLogForm | `frontend/src/components/battle-log/BattleLogForm.tsx` | モック→API連携 |
| BattleLogList | `frontend/src/components/battle-log/BattleLogList.tsx` | デッキ名表示 |
| deckStore（可能性あり） | `frontend/src/store/deckStore.ts` | API連携の追加 |
| 型定義（可能性あり） | `frontend/src/types/index.ts` | デッキ名付きBattleLog型 |

## フェーズ構成

| フェーズ | 内容 | タスク数 | 工数 | ファイル |
|----------|------|----------|------|----------|
| Phase 1 | 実装・テスト | 5タスク | 6h | [ui-improvement-phase1.md](./ui-improvement-phase1.md) |

## タスク番号管理

- **使用済み番号**: TASK-0001 ~ TASK-0046
- **今回使用**: TASK-0047 ~ TASK-0051
- **次回開始番号**: TASK-0052

## 全体進捗

- [ ] TASK-0047: 型定義の拡張（BattleLogWithDeckNames追加） (0.5h)
- [ ] TASK-0048: deckStoreへのAPI連携実装 (1h)
- [ ] TASK-0049: BattleLogForm本実装（モック→API連携） (1.5h)
- [ ] TASK-0050: BattleLogList相手デッキ名表示実装 (1.5h)
- [ ] TASK-0051: 統合テスト・動作確認 (1.5h)

## マイルストーン

| マイルストーン | 完了条件 | タスク |
|----------------|----------|--------|
| M1: 型定義・Store整備完了 | 型定義とStoreが拡張済み | TASK-0047, TASK-0048 |
| M2: フォーム本実装完了 | BattleLogFormがAPI連携で動作 | TASK-0049 |
| M3: 一覧表示改善完了 | BattleLogListで相手デッキ名が表示される | TASK-0050 |
| M4: 品質確認完了 | テスト通過、Lint通過 | TASK-0051 |

## 依存関係

```
TASK-0047 (型定義) ─→ TASK-0048 (deckStore) ─→ TASK-0049 (Form本実装)
                   ↘                       ↘
                     TASK-0050 (List改善) ─→ TASK-0051 (テスト)
```

- TASK-0047 は独立して実行可能（他の基盤）
- TASK-0048 は TASK-0047 完了後
- TASK-0049 は TASK-0047, TASK-0048 完了後
- TASK-0050 は TASK-0047 完了後（独立して進行可能）
- TASK-0051 は すべてのタスク完了後

## 技術スタック

- **Frontend**: React 19.x, TypeScript, Zustand, Tailwind CSS
- **Backend**: Cloudflare Workers, Hono, Drizzle ORM
- **Database**: Cloudflare D1 (SQLite)
- **Test**: Vitest, React Testing Library

## 参考資料

- `frontend/src/components/battle-log/BattleLogForm.tsx` - 現在の仮実装
- `frontend/src/components/battle-log/BattleLogList.tsx` - 現在のID表示実装
- `backend/src/routes/deck-master.ts` - デッキマスターAPI
- `docs/design/shadowverse-battle-log/interfaces.ts` - 型設計

## 更新履歴

| 日付 | バージョン | 変更内容 | 更新者 |
|------|------------|----------|--------|
| 2025-12-04 | 1.0.0 | 初版作成 | Claude Code |

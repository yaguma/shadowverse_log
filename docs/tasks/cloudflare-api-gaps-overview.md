# Cloudflare API ギャップ解消 - タスク概要

## プロジェクト概要

- **要件名**: cloudflare-api-gaps
- **期間**: 1日（約5.5時間）
- **総タスク数**: 4タスク (TASK-0043 ~ TASK-0046)
- **目標**: `/backend` にbattle-logsとdeck-master APIを統合し、Cloudflare移行を完了する

## 背景

現在、以下のAPIが `/backend/src/routes/` に存在しない：
- **battle-logs API** - 対戦履歴のCRUD操作
- **deck-master API** - デッキマスター一覧取得

これらは `/workers/src/routes/` には実装済みだが、`/backend` への統合が完了していない。

## 既存リソース

### 🟢 移行済み（使用可能）

| リソース | ファイル |
|----------|----------|
| BattleLogsRepository | `backend/src/db/repositories/battle-logs-repository.ts` |
| DeckMasterRepository | `backend/src/db/repositories/deck-master-repository.ts` |
| battle_logsスキーマ | `backend/src/db/schema/battle-logs.ts` |
| deck_masterスキーマ | `backend/src/db/schema/deck-master.ts` |
| バリデーションスキーマ | `backend/src/db/schema/battle-logs.validation.ts` |

### ❌ 未実装（今回作成）

| リソース | ファイル |
|----------|----------|
| battle-logsルート | `backend/src/routes/battle-logs.ts` |
| deck-masterルート | `backend/src/routes/deck-master.ts` |
| index.ts登録 | `backend/src/index.ts` の更新 |

## フェーズ構成

| フェーズ | 内容 | タスク数 | 工数 | ファイル |
|----------|------|----------|------|----------|
| Phase 1 | API実装・統合 | 4タスク | 5.5h | [cloudflare-api-gaps-phase1.md](./cloudflare-api-gaps-phase1.md) |

## タスク番号管理

- **使用済み番号**: TASK-0001 ~ TASK-0042
- **今回使用**: TASK-0043 ~ TASK-0046
- **次回開始番号**: TASK-0047

## 全体進捗

- [ ] TASK-0043: battle-logs ルート実装 (2h)
- [ ] TASK-0044: deck-master ルート実装 (1h)
- [ ] TASK-0045: index.ts へのルート登録 (0.5h)
- [ ] TASK-0046: 統合テスト・動作確認 (2h)

## マイルストーン

| マイルストーン | 完了条件 | タスク |
|----------------|----------|--------|
| M1: APIルート実装完了 | battle-logs, deck-master ルートが実装済み | TASK-0043, TASK-0044 |
| M2: 統合完了 | index.tsに登録され、全APIが動作 | TASK-0045 |
| M3: 品質確認完了 | テスト通過、Lint通過 | TASK-0046 |

## 依存関係

```
TASK-0043 (battle-logs)  ─┬─→ TASK-0045 (登録) ─→ TASK-0046 (テスト)
TASK-0044 (deck-master) ─┘
```

- TASK-0043, TASK-0044 は並行実行可能
- TASK-0045 は TASK-0043, TASK-0044 完了後
- TASK-0046 は TASK-0045 完了後

## 技術スタック

- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **ORM**: Drizzle ORM
- **Database**: Cloudflare D1 (SQLite)
- **Validation**: Zod
- **Language**: TypeScript

## 参考資料

- `/workers/src/routes/battle-logs.ts` - 参考実装
- `/workers/src/routes/deck-master.ts` - 参考実装
- `/backend/src/routes/statistics.ts` - 既存ルートの実装パターン

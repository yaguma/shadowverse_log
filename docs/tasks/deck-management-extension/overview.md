# デッキ管理機能拡張 タスク概要

**作成日**: 2025-01-26
**プロジェクト期間**: 推定68時間（約8.5日）
**推定工数**: 68時間
**総タスク数**: 34件
**タスク粒度**: 2時間単位

## 関連文書

- **要件定義書**: [📋 requirements.md](../../spec/deck-management-extension/requirements.md)
- **設計文書**: [📐 architecture.md](../../design/deck-management-extension/architecture.md)
- **API仕様**: [🔌 api-endpoints.md](../../design/deck-management-extension/api-endpoints.md)
- **インターフェース定義**: [📝 interfaces.ts](../../design/deck-management-extension/interfaces.ts)
- **データフロー図**: [🔄 dataflow.md](../../design/deck-management-extension/dataflow.md)

## フェーズ構成

| フェーズ | 期間 | 成果物 | タスク数 | 工数 |
|---------|------|--------|----------|------|
| Phase 1 | 4タスク | 基盤・共通コンポーネント | 4件 | 8h |
| Phase 2 | 10タスク | デッキ種別管理機能 | 10件 | 20h |
| Phase 3 | 7タスク | 使用デッキ管理機能 | 7件 | 14h |
| Phase 4 | 3タスク | デッキ管理画面統合 | 3件 | 6h |
| Phase 5 | 6タスク | 統計画面機能拡張 | 6件 | 12h |
| Phase 6 | 4タスク | 対戦履歴UI改善 | 4件 | 8h |

## タスク番号管理

**使用済みタスク番号**: TASK-0001 ~ TASK-0034
**次回開始番号**: TASK-0035

## 全体進捗

- [ ] Phase 1: 基盤・共通コンポーネント
- [ ] Phase 2: デッキ種別管理機能
- [ ] Phase 3: 使用デッキ管理機能
- [ ] Phase 4: デッキ管理画面統合
- [ ] Phase 5: 統計画面機能拡張
- [ ] Phase 6: 対戦履歴UI改善

## マイルストーン

- **M1: 基盤完成**: Phase 1完了（型定義・バリデーション・エラー処理・APIクライアント）
- **M2: デッキ種別管理完成**: Phase 2完了（CRUD機能・UI・E2Eテスト）
- **M3: 使用デッキ管理完成**: Phase 3完了（CRUD機能・UI・E2Eテスト）
- **M4: デッキ管理画面完成**: Phase 4完了（タブ切り替え・ナビゲーション）
- **M5: 統計画面拡張完成**: Phase 5完了（シーズン選択・対戦履歴登録）
- **M6: リリース準備完了**: Phase 6完了（UI改善・全機能統合テスト）

---

## Phase 1: 基盤・共通コンポーネント

**期間**: 8時間（4タスク × 2時間）
**目標**: 型定義・バリデーション・エラーハンドリング・APIクライアントの基盤構築
**成果物**: 共通型・バリデーション・エラー処理・APIクライアント

### タスク一覧

- [ ] [TASK-0001: 共通インターフェース・型定義の実装](TASK-0001.md) - 2h (DIRECT) 🔵
- [ ] [TASK-0002: エラーハンドリング共通コンポーネント実装](TASK-0002.md) - 2h (TDD) 🔵
- [ ] [TASK-0003: バリデーション共通ユーティリティ実装](TASK-0003.md) - 2h (TDD) 🔵
- [ ] [TASK-0004: APIクライアント共通処理拡張](TASK-0004.md) - 2h (TDD) 🟡

### 依存関係

```
TASK-0001 ──┬── TASK-0002 ──┬── TASK-0004
            └── TASK-0003 ──┘
```

---

## Phase 2: デッキ種別管理機能

**期間**: 20時間（10タスク × 2時間）
**目標**: デッキ種別（DeckMaster）のCRUD機能完全実装
**成果物**: DeckMaster API・Store・UIコンポーネント・E2Eテスト

### タスク一覧

- [ ] [TASK-0005: DeckMaster API - GET（使用履歴付き）実装](TASK-0005.md) - 2h (TDD) 🔵
- [ ] [TASK-0006: DeckMaster API - POST 実装](TASK-0006.md) - 2h (TDD) 🔵
- [ ] [TASK-0007: DeckMaster API - PUT 実装](TASK-0007.md) - 2h (TDD) 🔵
- [ ] [TASK-0008: DeckMaster API - DELETE 実装](TASK-0008.md) - 2h (TDD) 🔵
- [ ] [TASK-0009: DeckStore拡張（DeckMaster CRUD）](TASK-0009.md) - 2h (TDD) 🔵
- [ ] [TASK-0010: DeckMasterListコンポーネント実装](TASK-0010.md) - 2h (TDD) 🔵
- [ ] [TASK-0011: DeckMasterItemコンポーネント実装](TASK-0011.md) - 2h (TDD) 🔵
- [ ] [TASK-0012: DeckMasterDialogコンポーネント実装](TASK-0012.md) - 2h (TDD) 🔵
- [ ] [TASK-0013: デッキ種別管理機能統合テスト](TASK-0013.md) - 2h (TDD) 🔵
- [ ] [TASK-0014: デッキ種別管理E2Eテスト](TASK-0014.md) - 2h (TDD) 🔵

### 依存関係

```
Phase 1 ─┬── TASK-0005 ──┬
         ├── TASK-0006 ──┼── TASK-0009 ── TASK-0010 ── TASK-0011 ── TASK-0012 ── TASK-0013 ── TASK-0014
         ├── TASK-0007 ──┤
         └── TASK-0008 ──┘
```

---

## Phase 3: 使用デッキ管理機能

**期間**: 14時間（7タスク × 2時間）
**目標**: 使用デッキ（MyDeck）の追加・削除機能完全実装
**成果物**: MyDeck API・Store・UIコンポーネント・E2Eテスト

### タスク一覧

- [ ] [TASK-0015: MyDeck API - POST 実装](TASK-0015.md) - 2h (TDD) 🔵
- [ ] [TASK-0016: MyDeck API - DELETE 実装](TASK-0016.md) - 2h (TDD) 🔵
- [ ] [TASK-0017: DeckStore拡張（MyDeck CRUD）](TASK-0017.md) - 2h (TDD) 🔵
- [ ] [TASK-0018: MyDeckListコンポーネント実装](TASK-0018.md) - 2h (TDD) 🔵
- [ ] [TASK-0019: MyDeckItemコンポーネント実装](TASK-0019.md) - 2h (TDD) 🔵
- [ ] [TASK-0020: MyDeckDialogコンポーネント実装](TASK-0020.md) - 2h (TDD) 🔵
- [ ] [TASK-0021: 使用デッキ管理E2Eテスト](TASK-0021.md) - 2h (TDD) 🔵

### 依存関係

```
Phase 1 ─┬── TASK-0015 ──┬── TASK-0017 ── TASK-0018 ── TASK-0019 ── TASK-0020 ── TASK-0021
         └── TASK-0016 ──┘
```

---

## Phase 4: デッキ管理画面統合

**期間**: 6時間（3タスク × 2時間）
**目標**: デッキ管理画面の統合とナビゲーション追加
**成果物**: DeckManagePage・ナビゲーション・E2Eテスト

### タスク一覧

- [ ] [TASK-0022: DeckManagePageタブ切り替え実装](TASK-0022.md) - 2h (TDD) 🔵
- [ ] [TASK-0023: ナビゲーション拡張（デッキ管理リンク追加）](TASK-0023.md) - 2h (DIRECT) 🔵
- [ ] [TASK-0024: デッキ管理画面E2Eテスト](TASK-0024.md) - 2h (TDD) 🔵

### 依存関係

```
Phase 2, Phase 3 ── TASK-0022 ── TASK-0023 ── TASK-0024
```

---

## Phase 5: 統計画面機能拡張

**期間**: 12時間（6タスク × 2時間）
**目標**: 統計画面へのシーズン選択・対戦履歴登録機能追加
**成果物**: Statistics API拡張・Store・UIコンポーネント・E2Eテスト

### タスク一覧

- [ ] [TASK-0025: Statistics API - シーズン一覧取得実装](TASK-0025.md) - 2h (TDD) 🔵
- [ ] [TASK-0026: Statistics API - シーズン別統計取得実装](TASK-0026.md) - 2h (TDD) 🔵
- [ ] [TASK-0027: StatisticsStore拡張（シーズン選択状態）](TASK-0027.md) - 2h (TDD) 🔵
- [ ] [TASK-0028: 統計画面シーズン選択UI実装](TASK-0028.md) - 2h (TDD) 🔵
- [ ] [TASK-0029: 統計画面対戦履歴登録ボタン追加](TASK-0029.md) - 2h (TDD) 🔵
- [ ] [TASK-0030: 統計画面E2Eテスト](TASK-0030.md) - 2h (TDD) 🔵

### 依存関係

```
Phase 1 ── TASK-0025 ──┬── TASK-0027 ── TASK-0028 ── TASK-0029 ── TASK-0030
           TASK-0026 ──┘
```

---

## Phase 6: 対戦履歴UI改善

**期間**: 8時間（4タスク × 2時間）
**目標**: 対戦履歴登録UIの改善と全機能統合テスト
**成果物**: BattleLogDialog改善・相手デッキソート・E2Eテスト

### タスク一覧

- [ ] [TASK-0031: BattleLogDialogレイアウト改善](TASK-0031.md) - 2h (TDD) 🔵
- [ ] [TASK-0032: 相手デッキ選択肢ソート機能実装](TASK-0032.md) - 2h (TDD) 🔵
- [ ] [TASK-0033: 対戦履歴UI改善E2Eテスト](TASK-0033.md) - 2h (TDD) 🔵
- [ ] [TASK-0034: 全機能統合E2Eテスト](TASK-0034.md) - 2h (TDD) 🔵

### 依存関係

```
Phase 5, TASK-0005 ── TASK-0031 ── TASK-0032 ── TASK-0033 ── TASK-0034
```

---

## 信頼性レベルサマリー

### 全タスク統計

- **総タスク数**: 34件
- 🔵 **青信号**: 33件 (97%)
- 🟡 **黄信号**: 1件 (3%) - TASK-0004のみ
- 🔴 **赤信号**: 0件 (0%)

### フェーズ別信頼性

| フェーズ | 🔵 青 | 🟡 黄 | 🔴 赤 | 合計 |
|---------|-------|-------|-------|------|
| Phase 1 | 3 | 1 | 0 | 4 |
| Phase 2 | 10 | 0 | 0 | 10 |
| Phase 3 | 7 | 0 | 0 | 7 |
| Phase 4 | 3 | 0 | 0 | 3 |
| Phase 5 | 6 | 0 | 0 | 6 |
| Phase 6 | 4 | 0 | 0 | 4 |

**品質評価**: 高品質（ほぼすべてのタスクが要件定義・設計文書に基づく）

## クリティカルパス

```
TASK-0001 → TASK-0002 → TASK-0004 → TASK-0005 → TASK-0009 → TASK-0010 → TASK-0011 → TASK-0012 → TASK-0013 → TASK-0014 → TASK-0022 → TASK-0023 → TASK-0024
```

**クリティカルパス工数**: 26時間

---

## タスクタイプ凡例

- **DIRECT**: 直接実装タスク（設定ファイル、型定義など）
- **TDD**: テスト駆動開発タスク（Red-Green-Refactorサイクル）

## 信頼性レベル凡例

- 🔵 **青信号**: ユーザヒアリング・設計文書を参考にした確実な設計
- 🟡 **黄信号**: ユーザヒアリング・設計文書から妥当な推測による設計
- 🔴 **赤信号**: ユーザヒアリング・設計文書にない推測による設計

---

## 実装コマンド

### TDDタスクの場合
```bash
/tsumiki:tdd-requirements TASK-XXXX   # 詳細要件定義
/tsumiki:tdd-testcases                # テストケース作成
/tsumiki:tdd-red                      # テスト実装（失敗）
/tsumiki:tdd-green                    # 最小実装
/tsumiki:tdd-refactor                 # リファクタリング
/tsumiki:tdd-verify-complete          # 品質確認
```

### DIRECTタスクの場合
```bash
/tsumiki:direct-setup                 # 直接実装・設定
/tsumiki:direct-verify                # 動作確認・品質確認
```

---

## 次のステップ

タスクを実装するには:
- 全タスク順番に実装: `/tsumiki:kairo-implement`
- 特定タスクを実装: `/tsumiki:kairo-implement TASK-0001`

---

## 更新履歴

- **2025-01-26**: 初版作成（tsumiki:kairo-tasks により生成）
  - Phase 1〜6のタスク34件を作成
  - タスク粒度: 2時間単位
  - 実装優先順位: 機能単位で縦切り
  - テストカバレッジ目標: 80%以上
  - E2Eテスト: エッジケース含む

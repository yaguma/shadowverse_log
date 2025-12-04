# TASK-0050: BattleLogList相手デッキ名表示実装 - 要件定義

## 概要

対戦履歴一覧表示（BattleLogListコンポーネント）において、`opponentDeckId`をデッキマスターからデッキ名に変換して表示する機能を実装する。

## 信頼性レベル

🔵 **青信号**: TASK-0050タスク定義、REQ-009、REQ-101〜106に基づく

## 背景

現在の`BattleLogList`コンポーネントでは、対戦履歴の「使用デッキ」と「相手デッキ」の列に`myDeckId`と`opponentDeckId`がそのまま表示されている。これはユーザーにとって分かりにくいため、デッキ名で表示する必要がある。

## 機能要件

### FR-001: 相手デッキ名表示

- **説明**: 対戦履歴一覧の「相手デッキ」列に、`opponentDeckId`に対応するデッキ名を表示する
- **受け入れ基準**:
  - デッキマスター一覧から`opponentDeckId`に該当するデッキを検索し、`deckName`を表示する
  - 該当するデッキが見つからない場合は、`opponentDeckId`をフォールバックとして表示する
- **信頼性レベル**: 🔵 青信号（REQ-009、TASK-0050に基づく）

### FR-002: デスクトップ表示（テーブル形式）

- **説明**: デスクトップ表示（lg以上）のテーブル形式でデッキ名を表示する
- **受け入れ基準**:
  - `<td>`要素内にデッキ名が表示される
  - 既存のスタイリング（ボーダー、パディング）が維持される
- **信頼性レベル**: 🔵 青信号（REQ-009、REQ-603に基づく）

### FR-003: モバイル表示（カード形式）

- **説明**: モバイル表示（lg未満）のカード形式でデッキ名を表示する
- **受け入れ基準**:
  - カード内の「相手デッキ:」の後にデッキ名が表示される
  - 既存のスタイリングが維持される
- **信頼性レベル**: 🔵 青信号（REQ-034、REQ-603に基づく）

### FR-004: propsの拡張

- **説明**: `BattleLogListProps`に`deckMasters`を追加する
- **受け入れ基準**:
  - `deckMasters: DeckMaster[]`がpropsに追加される
  - 親コンポーネント（`BattleLogListPage`）からデッキマスター一覧が渡される
- **信頼性レベル**: 🔵 青信号（TASK-0050タスク定義に基づく）

## 非機能要件

### NFR-001: TypeScript型安全性

- **説明**: 全てのコードがTypeScript strict modeでコンパイルエラーなしで動作する
- **受け入れ基準**:
  - `pnpm type-check`が成功する
  - 型エラーが0件
- **信頼性レベル**: 🔵 青信号（品質基準に基づく）

### NFR-002: テスト

- **説明**: 既存テストが通り、新規テストが追加される
- **受け入れ基準**:
  - `pnpm test`が成功する
  - デッキ名表示に関するテストケースが追加される
- **信頼性レベル**: 🔵 青信号（品質基準に基づく）

### NFR-003: Lintエラーなし

- **説明**: コードがBiomeのLint/Formatルールに準拠する
- **受け入れ基準**:
  - `pnpm lint`が成功する
- **信頼性レベル**: 🔵 青信号（品質基準に基づく）

## 実装詳細

### 変更対象ファイル

1. **`frontend/src/components/battle-log/BattleLogList.tsx`**
   - `BattleLogListProps`に`deckMasters: DeckMaster[]`を追加
   - デッキ名ルックアップ関数を追加
   - テーブル表示の相手デッキ列をデッキ名表示に変更
   - カード表示の相手デッキをデッキ名表示に変更

2. **`frontend/src/components/battle-log/BattleLogList.test.tsx`**
   - デッキマスターを渡すテストケースを追加
   - デッキ名表示のテストケースを追加
   - フォールバック表示のテストケースを追加

3. **`frontend/src/pages/BattleLogListPage.tsx`**
   - `useDeckStore`からデッキマスター一覧を取得
   - `BattleLogList`に`deckMasters`を渡す

## テスト要件

### 単体テスト

- TC-DECK-NAME-001: デッキマスターが渡された場合、デッキ名が表示される
- TC-DECK-NAME-002: デッキマスターが空の場合、IDがフォールバック表示される
- TC-DECK-NAME-003: デッキIDがデッキマスターに存在しない場合、IDがフォールバック表示される

## 依存関係

- **TASK-0047**: 型定義の拡張（BattleLogWithDeckNames追加）- **完了済み**
- `DeckMaster`型は既に`frontend/src/types/index.ts`に定義済み
- `useDeckStore`は既に`frontend/src/store/deckStore.ts`に実装済み

## 完了条件

- [x] 要件定義書作成
- [ ] テストケース作成
- [ ] テスト実装（Red）
- [ ] 最小実装（Green）
- [ ] リファクタリング
- [ ] 品質確認

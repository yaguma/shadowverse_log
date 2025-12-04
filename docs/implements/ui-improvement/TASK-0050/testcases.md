# TASK-0050: BattleLogList相手デッキ名表示実装 - テストケース定義

## 概要

BattleLogListコンポーネントでデッキ名表示機能をテストするためのテストケース定義。

## 信頼性レベル

🔵 **青信号**: TASK-0050要件定義に基づく

## テストケース一覧

### 1. デッキ名表示テスト

#### TC-DECK-NAME-001: デッキマスターが渡された場合、相手デッキ名が表示される

| 項目 | 内容 |
|------|------|
| **テスト目的** | デッキマスター一覧が渡された場合、opponentDeckIdに対応するデッキ名が表示されること |
| **前提条件** | デッキマスター一覧に該当するデッキが存在する |
| **入力** | battleLogs: [{ opponentDeckId: 'deck-master-001' }], deckMasters: [{ id: 'deck-master-001', deckName: 'エルフデッキ' }] |
| **期待結果** | 「相手デッキ」列に「エルフデッキ」が表示される |
| **信頼性レベル** | 🔵 青信号（FR-001に基づく） |

#### TC-DECK-NAME-002: デッキマスターが空の場合、IDがフォールバック表示される

| 項目 | 内容 |
|------|------|
| **テスト目的** | デッキマスター一覧が空の場合、opponentDeckIdがそのまま表示されること |
| **前提条件** | デッキマスター一覧が空配列 |
| **入力** | battleLogs: [{ opponentDeckId: 'deck-master-001' }], deckMasters: [] |
| **期待結果** | 「相手デッキ」列に「deck-master-001」が表示される |
| **信頼性レベル** | 🔵 青信号（FR-001に基づく） |

#### TC-DECK-NAME-003: デッキIDがデッキマスターに存在しない場合、IDがフォールバック表示される

| 項目 | 内容 |
|------|------|
| **テスト目的** | opponentDeckIdに対応するデッキがデッキマスター一覧に存在しない場合、IDがそのまま表示されること |
| **前提条件** | デッキマスター一覧に該当するデッキが存在しない |
| **入力** | battleLogs: [{ opponentDeckId: 'unknown-deck' }], deckMasters: [{ id: 'deck-master-001', deckName: 'エルフデッキ' }] |
| **期待結果** | 「相手デッキ」列に「unknown-deck」が表示される |
| **信頼性レベル** | 🔵 青信号（FR-001に基づく） |

#### TC-DECK-NAME-004: 複数件のデッキ名が正しく表示される

| 項目 | 内容 |
|------|------|
| **テスト目的** | 複数の対戦履歴で、各デッキ名が正しく表示されること |
| **前提条件** | 複数の対戦履歴とデッキマスターが存在する |
| **入力** | battleLogs: 3件（各異なるopponentDeckId）, deckMasters: 3件 |
| **期待結果** | 各行に対応するデッキ名が表示される |
| **信頼性レベル** | 🔵 青信号（FR-001に基づく） |

### 2. 既存テストの互換性

#### TC-COMPAT-001: 既存テストがdeckMastersなしでも動作する

| 項目 | 内容 |
|------|------|
| **テスト目的** | deckMastersがオプショナルな場合、既存テストが壊れないこと |
| **前提条件** | deckMastersを渡さない |
| **入力** | 既存のテストデータ |
| **期待結果** | 既存のテストが全て成功する |
| **信頼性レベル** | 🟡 黄信号（後方互換性の考慮） |

## テストデータ

### デッキマスターモックデータ

```typescript
const mockDeckMasters: DeckMaster[] = [
  { id: 'deck-master-001', className: 'エルフ', deckName: 'エルフデッキ', sortOrder: 1 },
  { id: 'deck-master-002', className: 'ロイヤル', deckName: 'ロイヤルデッキ', sortOrder: 2 },
  { id: 'deck-master-003', className: 'ウィッチ', deckName: 'ウィッチデッキ', sortOrder: 3 },
];
```

### 対戦履歴モックデータ（デッキ名表示用）

```typescript
const mockBattleLogsWithDeckIds: BattleLog[] = [
  {
    id: 'log_20251108_001',
    date: '2025/11/08',
    battleType: 'ランクマッチ',
    rank: 'ダイアモンド',
    groupName: 'AAA',
    myDeckId: 'deck-001',
    turn: '先攻',
    result: '勝ち',
    opponentDeckId: 'deck-master-001', // エルフデッキ
  },
  {
    id: 'log_20251107_001',
    date: '2025/11/07',
    battleType: 'ランクマッチ',
    rank: 'ダイアモンド',
    groupName: 'AA',
    myDeckId: 'deck-002',
    turn: '後攻',
    result: '負け',
    opponentDeckId: 'deck-master-002', // ロイヤルデッキ
  },
  {
    id: 'log_20251106_001',
    date: '2025/11/06',
    battleType: '対戦台',
    rank: '-',
    groupName: '-',
    myDeckId: 'deck-001',
    turn: '先攻',
    result: '勝ち',
    opponentDeckId: 'deck-master-003', // ウィッチデッキ
  },
];
```

## 実装方針

1. `BattleLogListProps`に`deckMasters?: DeckMaster[]`を追加（オプショナル）
2. デッキ名ルックアップヘルパー関数を作成
3. 既存テストを修正せずに通すため、deckMastersがundefinedの場合はIDをそのまま表示
4. 新規テストケースを追加

## 完了条件

- [ ] TC-DECK-NAME-001が成功
- [ ] TC-DECK-NAME-002が成功
- [ ] TC-DECK-NAME-003が成功
- [ ] TC-DECK-NAME-004が成功
- [ ] TC-COMPAT-001が成功（既存テスト互換性）

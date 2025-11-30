# TASK-0030: 統計計算API実装 - テストケース定義

## テストスイート概要

### テスト対象
- `StatisticsService` (D1版)
- `GET /api/statistics` エンドポイント

### テスト分類
- **TC-001〜TC-010**: 正常系テスト
- **TC-101〜TC-105**: 異常系テスト
- **TC-201〜TC-210**: 境界値テスト

---

## 正常系テストケース

### TC-001: 全体統計を取得できる 🔵

**説明**: 期間内の全体統計（総試合数、勝利数、敗北数、勝率）を計算する

**前提条件**:
- battle_logs テーブルに対戦履歴が存在する

**入力**:
```typescript
{
  startDate: '2025-01-01',
  endDate: '2025-01-31'
}
```

**期待結果**:
```typescript
{
  overall: {
    totalGames: 10,
    wins: 6,
    losses: 4,
    winRate: 60.0
  }
}
```

---

### TC-002: マイデッキ別統計を取得できる 🔵

**説明**: my_deck_id でグループ化し、各デッキの統計を計算する

**前提条件**:
- battle_logs テーブルに複数デッキの対戦履歴が存在する
- my_decks テーブルにデッキ名が登録されている

**期待結果**:
- `byMyDeck` 配列に各デッキの統計が含まれる
- 試合数降順でソートされている
- `deckName` が参照されている

---

### TC-003: 相手デッキ別統計を取得できる 🔵

**説明**: opponent_deck_id でグループ化し、各相手デッキの統計を計算する

**前提条件**:
- battle_logs テーブルに複数相手デッキの対戦履歴が存在する
- deck_master テーブルにデッキ名が登録されている

**期待結果**:
- `byOpponentDeck` 配列に各相手デッキの統計が含まれる
- 試合数降順でソートされている
- `deckName` が参照されている

---

### TC-004: ランク別統計を取得できる 🔵

**説明**: rank + group_name でグループ化し、各ランク帯の統計を計算する

**前提条件**:
- battle_logs テーブルに複数ランクの対戦履歴が存在する

**期待結果**:
- `byRank` 配列に各ランク帯の統計が含まれる
- 試合数降順でソートされている

---

### TC-005: ターン別統計を取得できる 🔵

**説明**: turn = '先攻' と '後攻' で分けて統計を計算する

**前提条件**:
- battle_logs テーブルに先攻・後攻両方の対戦履歴が存在する

**期待結果**:
```typescript
{
  byTurn: {
    first: {
      totalGames: 5,
      wins: 3,
      losses: 2,
      winRate: 60.0
    },
    second: {
      totalGames: 5,
      wins: 2,
      losses: 3,
      winRate: 40.0
    }
  }
}
```

---

### TC-006: 期間フィルタリングが正常動作する 🔵

**説明**: startDate と endDate で期間を絞り込める

**入力**:
```typescript
{
  startDate: '2025-01-15',
  endDate: '2025-01-20'
}
```

**期待結果**:
- 指定期間内のデータのみが統計に含まれる

---

### TC-007: 対戦タイプフィルタリングが正常動作する 🔵

**説明**: battleType で対戦タイプを絞り込める

**入力**:
```typescript
{
  battleType: 'ランクマッチ'
}
```

**期待結果**:
- 指定対戦タイプのデータのみが統計に含まれる

---

### TC-008: デフォルト期間が設定される 🔵

**説明**: startDate/endDate が省略された場合、デフォルト値が適用される

**入力**: なし（パラメータ省略）

**期待結果**:
- `startDate`: 7日前
- `endDate`: 今日

---

### TC-009: APIレスポンス形式が正しい 🔵

**説明**: レスポンスが標準API形式に準拠している

**期待結果**:
```typescript
{
  success: true,
  data: {
    overall: { ... },
    byMyDeck: [ ... ],
    byOpponentDeck: [ ... ],
    byRank: [ ... ],
    byTurn: { ... }
  },
  meta: {
    timestamp: '2025-01-01T00:00:00.000Z',
    requestId: 'uuid-v4'
  }
}
```

---

### TC-010: 統計APIエンドポイントが正常応答する 🔵

**説明**: GET /api/statistics が200 OKを返す

**リクエスト**:
```http
GET /api/statistics
```

**期待結果**:
- ステータスコード: 200 OK
- Content-Type: application/json

---

## 異常系テストケース

### TC-101: 不正な日付形式でエラーを返す 🔵

**説明**: 不正なstartDate/endDate形式の場合、400エラーを返す

**入力**:
```typescript
{
  startDate: '2025/01/01'  // 不正な形式
}
```

**期待結果**:
- ステータスコード: 400 Bad Request
- エラーコード: `INVALID_DATE_FORMAT`

---

### TC-102: startDate > endDate でエラーを返す 🔵

**説明**: startDate が endDate より後の場合、400エラーを返す

**入力**:
```typescript
{
  startDate: '2025-01-31',
  endDate: '2025-01-01'
}
```

**期待結果**:
- ステータスコード: 400 Bad Request
- エラーコード: `INVALID_DATE_RANGE`

---

### TC-103: 未来日付でエラーを返す 🟡

**説明**: endDate が未来の場合、エラーまたは今日までのデータを返す

**入力**:
```typescript
{
  endDate: '2030-01-01'
}
```

**期待結果**:
- 警告を出すか、今日までのデータを返却

---

### TC-104: DBエラー時に500エラーを返す 🔵

**説明**: データベースエラーの場合、500エラーを返す

**前提条件**:
- DBがエラーを返すようにモック設定

**期待結果**:
- ステータスコード: 500 Internal Server Error
- エラーコード: `DATABASE_ERROR`

---

### TC-105: 存在しないbattleTypeでも空データを返す 🔵

**説明**: 存在しない対戦タイプでフィルタリングした場合、空データを返す

**入力**:
```typescript
{
  battleType: '存在しないタイプ'
}
```

**期待結果**:
- `overall.totalGames`: 0
- 空の配列

---

## 境界値テストケース

### TC-201: データ0件の場合の処理 🔵

**説明**: 対戦履歴が0件の場合、適切な初期値を返す

**前提条件**:
- battle_logs テーブルが空

**期待結果**:
```typescript
{
  overall: {
    totalGames: 0,
    wins: 0,
    losses: 0,
    winRate: 0
  },
  byMyDeck: [],
  byOpponentDeck: [],
  byRank: [],
  byTurn: {
    first: { totalGames: 0, wins: 0, losses: 0, winRate: 0 },
    second: { totalGames: 0, wins: 0, losses: 0, winRate: 0 }
  }
}
```

---

### TC-202: 全勝の場合の勝率計算 🔵

**説明**: 全勝の場合、勝率が100.0になる

**前提条件**:
- すべての対戦結果が '勝ち'

**期待結果**:
- `winRate`: 100.0

---

### TC-203: 全敗の場合の勝率計算 🔵

**説明**: 全敗の場合、勝率が0.0になる

**前提条件**:
- すべての対戦結果が '負け'

**期待結果**:
- `winRate`: 0.0

---

### TC-204: 勝率の小数点第1位丸め 🔵

**説明**: 勝率が小数点第1位まで四捨五入される

**前提条件**:
- 3勝2敗 (66.666...%)

**期待結果**:
- `winRate`: 66.7

---

### TC-205: 1件のみの統計計算 🔵

**説明**: 対戦履歴が1件のみの場合も正常に計算できる

**前提条件**:
- battle_logs に1件のみ登録

**期待結果**:
- `totalGames`: 1
- `winRate`: 100.0 or 0.0

---

### TC-206: 大量データでのパフォーマンス 🟡

**説明**: 1000件以上のデータでも200ms以内に応答する

**前提条件**:
- battle_logs に1000件以上登録

**期待結果**:
- レスポンスタイム: 200ms以内

---

### TC-207: 存在しないデッキIDの処理 🔵

**説明**: deck_master に存在しないデッキIDがある場合も処理できる

**前提条件**:
- battle_logs に存在しない opponent_deck_id が含まれる

**期待結果**:
- `deckName`: '不明なデッキ' または NULL

---

### TC-208: 日付境界値の処理 🔵

**説明**: startDate と endDate が同日の場合も正常に動作する

**入力**:
```typescript
{
  startDate: '2025-01-15',
  endDate: '2025-01-15'
}
```

**期待結果**:
- 1日分のデータが正しく集計される

---

### TC-209: 空文字列パラメータの処理 🟡

**説明**: 空文字列のパラメータはデフォルト値として処理される

**入力**:
```typescript
{
  startDate: '',
  battleType: ''
}
```

**期待結果**:
- デフォルト値が適用される

---

### TC-210: 複合条件フィルタリング 🔵

**説明**: 期間 + 対戦タイプの複合フィルタリングが正常動作する

**入力**:
```typescript
{
  startDate: '2025-01-01',
  endDate: '2025-01-31',
  battleType: 'ランクマッチ'
}
```

**期待結果**:
- 両条件を満たすデータのみが統計に含まれる

---

## テスト実行コマンド

```bash
# 統計API単体テスト
pnpm test backend/tests/routes/statistics.test.ts

# 統計サービス単体テスト
pnpm test backend/tests/services/d1-statistics-service.test.ts

# カバレッジ付きテスト
pnpm test:coverage
```

## 更新履歴

| バージョン | 日付 | 変更内容 |
|---|---|---|
| 1.0.0 | 2025-11-30 | 初版作成 |

# TASK-0030: 統計計算API実装 - 要件定義書

## 概要

Cloudflare Workers + D1 環境で動作する統計計算APIの実装。
対戦履歴データから各種統計情報を計算し、JSON形式で返却する。

## 機能要件

### 1. エンドポイント定義 🔵

**GET /api/statistics**

統計データを取得するAPIエンドポイント。

#### クエリパラメータ

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|---|---|---|---|---|
| `startDate` | string (YYYY-MM-DD) | No | 7日前 | 集計開始日 |
| `endDate` | string (YYYY-MM-DD) | No | 今日 | 集計終了日 |
| `battleType` | string | No | 全て | 対戦タイプ絞り込み |

### 2. レスポンス形式 🔵

```typescript
interface StatisticsResponse {
  success: true;
  data: {
    overall: OverallStatistics;
    byMyDeck: DeckStatistics[];
    byOpponentDeck: DeckStatistics[];
    byRank: RankStatistics[];
    byTurn: {
      first: OverallStatistics;
      second: OverallStatistics;
    };
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

interface OverallStatistics {
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
}

interface DeckStatistics {
  deckId: string;
  deckName: string;
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
}

interface RankStatistics {
  rank: string;
  group: string;
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
}
```

### 3. 統計計算ロジック 🔵

#### 3.1 全体統計 (overall)
- **totalGames**: 期間内の総試合数
- **wins**: result = '勝ち' の試合数
- **losses**: result = '負け' の試合数
- **winRate**: 勝利数 / 総試合数 × 100 (小数点第1位まで)

#### 3.2 マイデッキ別統計 (byMyDeck)
- `my_deck_id` でグループ化
- 各デッキの統計を計算
- 試合数降順でソート

#### 3.3 相手デッキ別統計 (byOpponentDeck)
- `opponent_deck_id` でグループ化
- 各相手デッキの統計を計算
- 試合数降順でソート

#### 3.4 ランク別統計 (byRank)
- `rank` + `group_name` でグループ化
- 各ランク帯の統計を計算
- 試合数降順でソート

#### 3.5 先攻後攻別統計 (byTurn)
- `turn = '先攻'` と `turn = '後攻'` で分けて計算
- それぞれの統計を返却

### 4. データベースクエリ 🔵

D1データベースの `battle_logs` テーブルから統計を計算。

#### SQL例（全体統計）

```sql
SELECT
  COUNT(*) as totalGames,
  SUM(CASE WHEN result = '勝ち' THEN 1 ELSE 0 END) as wins,
  SUM(CASE WHEN result = '負け' THEN 1 ELSE 0 END) as losses,
  ROUND(SUM(CASE WHEN result = '勝ち' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as winRate
FROM battle_logs
WHERE date BETWEEN ? AND ?
```

### 5. パフォーマンス要件 🔵

- レスポンスタイム: 200ms以内
- D1クエリ最適化を実施
- インデックスを活用

### 6. エラーハンドリング 🔵

#### 6.1 バリデーションエラー
- 不正な日付形式: 400 Bad Request
- startDate > endDate: 400 Bad Request

#### 6.2 サーバーエラー
- DBエラー: 500 Internal Server Error

## 非機能要件

### 1. セキュリティ 🟡
- CORS設定
- 入力パラメータのバリデーション

### 2. 保守性 🟡
- TypeScript型定義
- コードコメント
- 単体テスト対応

## 受け入れ基準

1. [ ] GET /api/statistics が正常動作
2. [ ] 全体統計計算が正常動作
3. [ ] デッキ別統計計算が正常動作
4. [ ] ランク別統計計算が正常動作
5. [ ] ターン別統計計算が正常動作
6. [ ] 期間フィルタリングが正常動作
7. [ ] すべての単体テストがパス

## 依存関係

- TASK-0028: 対戦履歴CRUD API ✅ 完了
- D1データベース: `battle_logs` テーブル
- Drizzle ORM

## 更新履歴

| バージョン | 日付 | 変更内容 |
|---|---|---|
| 1.0.0 | 2025-11-30 | 初版作成 |

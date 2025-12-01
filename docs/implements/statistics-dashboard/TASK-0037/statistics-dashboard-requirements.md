# TASK-0037: 統計ダッシュボード実装 - TDD要件定義書

## 1. 概要

### 1.1 タスク情報
- **タスクID**: TASK-0037
- **タスク名**: 統計ダッシュボード実装
- **推定工数**: 10時間
- **タスクタイプ**: TDD
- **依存タスク**: TASK-0035 (API接続)
- **実装フェーズ**: Phase 3 Part 2-ii

### 1.2 目的
Cloudflare Workers APIから取得した統計データを視覚的に表示する統計ダッシュボードUIを実装します。ユーザーが期間を選択し、全体統計、デッキ別統計、ランク別統計を確認できる機能を提供します。

### 1.3 要件対応
- **REQ-201**: Dashboard表示
- **REQ-202**: 期間選択
- **REQ-203**: 統計情報
- **REQ-204**: グラフ表示

---

## 2. 機能要件

### 2.1 全体統計表示 (OverallStats.tsx)

#### 2.1.1 機能概要
ユーザーの全体的な対戦成績を表示するコンポーネント

#### 2.1.2 表示項目
1. **総対戦数**: 選択期間内の総試合数
2. **勝利数**: 勝利した試合数
3. **敗北数**: 敗北した試合数
4. **全体勝率**: 勝利数 / 総対戦数 × 100 (小数点第1位まで)

#### 2.1.3 UI設計
- **レイアウト**: カード形式（2列グリッド × PC: 4列グリッド）
- **スタイル**: Tailwind CSS使用
  - `grid grid-cols-2 md:grid-cols-4 gap-4`
  - 各カード: `border rounded p-3`

#### 2.1.4 Props型定義
```typescript
interface OverallStatsProps {
  stats: {
    totalGames: number;    // 総試合数
    wins: number;          // 勝数
    losses: number;        // 敗数
    winRate: number;       // 勝率（パーセンテージ）
  };
}
```

#### 2.1.5 既存実装との整合性
- **既存ファイル**: `frontend/src/components/statistics/OverallStats.tsx`
- **実装状況**: 実装済み
- **現在の実装**:
  - StatisticsResponse['overall']型を使用
  - カード形式の表示
  - レスポンシブ対応（2列→4列）

---

### 2.2 デッキ別統計グラフ (OpponentDeckPieChart.tsx)

#### 2.2.1 機能概要
対戦相手デッキの分布を円グラフで表示するコンポーネント

#### 2.2.2 表示項目
1. **円グラフ**: 各デッキの対戦回数を割合で表示
2. **凡例**: デッキ名と対戦回数（「デッキ名: X回」形式）
3. **ツールチップ**: セグメントホバー時に詳細情報を表示

#### 2.2.3 技術仕様
- **ライブラリ**: Recharts v3.3.0
- **コンポーネント**: `<PieChart>`, `<Pie>`, `<Cell>`, `<Legend>`, `<Tooltip>`, `<ResponsiveContainer>`
- **カラーパレット**: 色覚多様性に配慮した25色（DECK_COLORS配列）
  - 青 (#3b82f6), 赤 (#ef4444), 緑 (#10b981), オレンジ (#f59e0b), 紫 (#8b5cf6), など
- **アニメーション**: 無効化 (`isAnimationActive={false}`)

#### 2.2.4 Props型定義
```typescript
interface OpponentDeckPieChartProps {
  data: StatisticsResponse['byOpponentDeck'];
  // Array<{
  //   deckId: string;
  //   deckName: string;
  //   totalGames: number;
  //   wins: number;
  //   losses: number;
  //   winRate: number;
  // }>
}
```

#### 2.2.5 内部データ変換
```typescript
interface PieChartData {
  name: string;       // 表示用の名前（デッキ名: X回）
  value: number;      // 対戦回数（グラフの値）
  deckName: string;   // 元のデッキ名
}
```

#### 2.2.6 エラーハンドリング
1. **空データ時**: 「この期間にはデータがありません」メッセージを表示
2. **不正データ時**: バリデーション後、「データ形式が不正です」メッセージを表示
3. **描画エラー時**: try-catchでキャッチし、「グラフの表示に失敗しました」メッセージを表示

#### 2.2.7 既存実装との整合性
- **既存ファイル**: `frontend/src/components/statistics/OpponentDeckPieChart.tsx`
- **実装状況**: 実装済み（TDD Green完了）
- **テストファイル**: `frontend/src/components/statistics/OpponentDeckPieChart.test.tsx`
- **テストケース**: 11ケース実装済み
  - 正常系: TC-GRAPH-001〜007
  - 異常系: TC-GRAPH-009〜011
  - 境界値: TC-GRAPH-012〜014

---

### 2.3 ランク別統計グラフ (RankStatsTable.tsx)

#### 2.3.1 機能概要
ランク帯とグループ別の統計情報をテーブル形式で表示するコンポーネント

#### 2.3.2 表示項目
1. **ランク**: サファイア、ダイアモンド、ルビー、トパーズ、-
2. **グループ**: A, AA, AAA, Master, -
3. **試合数**: 総対戦数
4. **勝数**: 勝利数（緑色テキスト）
5. **敗数**: 敗北数（赤色テキスト）
6. **勝率**: パーセンテージ（青色、太字）

#### 2.3.3 UI設計
- **テーブルレイアウト**: フルテーブル（6列）
- **レスポンシブ**: `overflow-x-auto`でスクロール対応
- **ヘッダー**: グレー背景 (`bg-gray-100`)
- **ホバー**: 行ホバー時に背景色変更 (`hover:bg-gray-50`)

#### 2.3.4 Props型定義
```typescript
interface RankStatsTableProps {
  rankStats: Array<{
    rank: Rank;           // 'サファイア' | 'ダイアモンド' | 'ルビー' | 'トパーズ' | '-'
    group: Group;         // 'A' | 'AA' | 'AAA' | 'Master' | '-'
    totalGames: number;   // 総試合数
    wins: number;         // 勝数
    losses: number;       // 敗数
    winRate: number;      // 勝率（パーセンテージ）
  }>;
}
```

#### 2.3.5 既存実装との整合性
- **既存ファイル**: `frontend/src/components/statistics/RankStatsTable.tsx`
- **実装状況**: 実装済み
- **型定義**: `frontend/src/types/index.ts`のRank, Group型を使用

---

### 2.4 期間フィルター (PeriodSelector.tsx)

#### 2.4.1 機能概要
統計データの表示期間を選択するためのフォームコンポーネント

#### 2.4.2 表示項目
1. **開始日入力**: HTML5 date input
2. **終了日入力**: HTML5 date input
3. **検索ボタン**: 期間変更時に統計を再取得

#### 2.4.3 デフォルト動作
- **デフォルト期間**: 過去7日間
- **開始日**: 今日 - 7日
- **終了日**: 今日

#### 2.4.4 Props型定義
```typescript
interface PeriodSelectorProps {
  startDate: string;                      // 開始日 (YYYY-MM-DD形式)
  endDate: string;                        // 終了日 (YYYY-MM-DD形式)
  onStartDateChange: (date: string) => void;  // 開始日変更ハンドラ
  onEndDateChange: (date: string) => void;    // 終了日変更ハンドラ
  onSearch: () => void;                   // 検索ボタンクリックハンドラ
  isLoading: boolean;                     // ローディング状態
}
```

#### 2.4.5 UI設計
- **レイアウト**: Flexbox横並び (`flex gap-4 items-end`)
- **ローディング中**: 入力フィールドとボタンを無効化 (`disabled={isLoading}`)
- **ボタンスタイル**: 青色背景、ホバー時に濃い青、無効時はグレー

#### 2.4.6 既存実装との整合性
- **既存ファイル**: `frontend/src/components/statistics/PeriodSelector.tsx`
- **実装状況**: 実装済み

---

## 3. 受け入れ基準

### 3.1 コンポーネントテスト
- [ ] OverallStats コンポーネントが実装されている
- [ ] OpponentDeckPieChart コンポーネントが実装されている
- [ ] RankStatsTable コンポーネントが実装されている
- [ ] PeriodSelector コンポーネントが実装されている

### 3.2 機能テスト
- [ ] 期間選択が動作する
- [ ] グラフが正しく表示される
- [ ] ローディング状態が表示される
- [ ] エラー状態が表示される
- [ ] 空データ状態が表示される

### 3.3 テストカバレッジ
- [ ] コンポーネントテストが100%成功する (8ケース以上)
  1. 全体統計が正しく表示される
  2. デッキ別統計グラフが表示される
  3. ランク別統計が表示される
  4. 期間選択が動作する
  5. カスタム期間が設定できる
  6. ローディング状態が表示される
  7. エラー状態が表示される
  8. 空データ状態が表示される

### 3.4 品質基準
- [ ] レスポンシブデザインが動作する
- [ ] Biome lintエラーが0件
- [ ] TypeScript型エラーが0件

---

## 4. 技術仕様

### 4.1 使用ライブラリ
1. **React 19**: UIコンポーネントフレームワーク
2. **Recharts 3.3.0**: データビジュアライゼーションライブラリ
3. **Tailwind CSS 4.0.0**: CSSフレームワーク
4. **Vitest 4.0.7**: テストフレームワーク
5. **Testing Library**: React コンポーネントテスト

### 4.2 状態管理
- **useState**: ローカルステート管理
  - startDate, endDate
  - statistics
  - isLoading
  - error
- **useEffect**: 自動データ取得
  - 初期化時にデフォルト期間を設定
  - 期間変更時に統計を再取得

### 4.3 API連携
- **エンドポイント**: `GET /api/statistics?startDate={startDate}&endDate={endDate}`
- **レスポンス型**: `StatisticsResponse`
- **クライアント**: `apiClient.get<StatisticsResponse>()`

### 4.4 エラーハンドリング
1. **ネットワークエラー**: 「ネットワークエラーが発生しました」
2. **APIエラー**: Backend APIから返されたエラーメッセージを表示
3. **再試行機能**: エラー時に「再試行」ボタンを表示

---

## 5. インターフェース定義

### 5.1 型定義（既存）

```typescript
// frontend/src/types/index.ts

export type Rank = 'サファイア' | 'ダイアモンド' | 'ルビー' | 'トパーズ' | '-';
export type Group = 'A' | 'AA' | 'AAA' | 'Master' | '-';

export interface StatisticsResponse {
  overall: {
    totalGames: number;
    wins: number;
    losses: number;
    winRate: number;
  };
  byMyDeck: Array<{
    deckId: string;
    deckName: string;
    totalGames: number;
    wins: number;
    losses: number;
    winRate: number;
  }>;
  byOpponentDeck: Array<{
    deckId: string;
    deckName: string;
    totalGames: number;
    wins: number;
    losses: number;
    winRate: number;
  }>;
  byRank: Array<{
    rank: Rank;
    group: Group;
    totalGames: number;
    wins: number;
    losses: number;
    winRate: number;
  }>;
  byTurn: {
    先攻: {
      totalGames: number;
      wins: number;
      losses: number;
      winRate: number;
    };
    後攻: {
      totalGames: number;
      wins: number;
      losses: number;
      winRate: number;
    };
  };
  opponentDeckDistribution: Array<{
    deckId: string;
    deckName: string;
    count: number;
    percentage: number;
  }>;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}
```

---

## 6. 既存コードとの整合性確認

### 6.1 既存コンポーネント一覧
1. **OverallStats.tsx**: 実装済み ✅
2. **OpponentDeckPieChart.tsx**: 実装済み（TDD完了）✅
3. **RankStatsTable.tsx**: 実装済み ✅
4. **PeriodSelector.tsx**: 実装済み ✅
5. **DeckStatsTable.tsx**: 実装済み（マイデッキ/相手デッキ別統計）✅
6. **TurnStats.tsx**: 実装済み（先攻後攻別統計）✅
7. **Loading.tsx**: 実装済み ✅
8. **Error.tsx**: 実装済み ✅
9. **EmptyState.tsx**: 実装済み ✅

### 6.2 既存ページ
- **StatisticsDashboardPage.tsx**: 実装済み ✅
  - 全コンポーネントを統合
  - useEffect による自動データ取得
  - エラーハンドリング、再試行機能
  - ローディング、エラー、空データ状態の管理

### 6.3 既存API
- **apiClient.get<StatisticsResponse>()**: 実装済み ✅
  - タイムアウト: 30秒
  - リトライ: 3回（指数バックオフ）
  - キャッシュ: 5分（統計データ）

### 6.4 既存テスト
- **OpponentDeckPieChart.test.tsx**: 11ケース実装済み ✅
  - 正常系: 7ケース
  - 異常系: 3ケース
  - 境界値: 5ケース（3ケース実装）

---

## 7. テスト要件

### 7.1 テストケース一覧

#### 7.1.1 全体統計表示
- [ ] TC-OVERALL-001: 全体統計が正しく表示される
  - 総対戦数、勝利数、敗北数、勝率が表示される
  - 勝率は小数点第1位まで表示される

#### 7.1.2 デッキ別統計グラフ
- [x] TC-GRAPH-001: 複数の相手デッキが存在する場合、円グラフが正しく表示される ✅
- [x] TC-GRAPH-002: 各セグメントが異なる色で表示される ✅
- [x] TC-GRAPH-003: 凡例にデッキ名と対戦回数が表示される ✅
- [x] TC-GRAPH-004: セグメントホバー時にツールチップが表示される ✅
- [x] TC-GRAPH-007: 円グラフがアニメーションなしで即座に表示される ✅
- [x] TC-GRAPH-009: データが0件の場合、「データなし」メッセージが表示される ✅
- [x] TC-GRAPH-010: Recharts描画エラー時にエラーメッセージが表示される ✅
- [x] TC-GRAPH-011: 不正なデータ形式の場合にエラーハンドリングされる ✅
- [x] TC-GRAPH-012: 対戦相手が1種類のみの場合、100%の単一セグメントが表示される ✅
- [x] TC-GRAPH-013: 対戦相手デッキが20種類以上の場合でも円グラフが正しく表示される ✅
- [x] TC-GRAPH-014: 対戦回数が1回のデッキもセグメントとして表示される ✅

#### 7.1.3 ランク別統計テーブル
- [ ] TC-RANK-001: ランク別統計が正しく表示される
  - ランク、グループ、試合数、勝数、敗数、勝率が表示される
  - 勝数は緑色、敗数は赤色、勝率は青色太字で表示される

#### 7.1.4 期間選択
- [ ] TC-PERIOD-001: デフォルト期間が過去7日間に設定される
- [ ] TC-PERIOD-002: 開始日を変更できる
- [ ] TC-PERIOD-003: 終了日を変更できる
- [ ] TC-PERIOD-004: 検索ボタンをクリックするとデータが再取得される
- [ ] TC-PERIOD-005: ローディング中は入力とボタンが無効化される

#### 7.1.5 状態管理
- [ ] TC-STATE-001: ローディング状態が表示される
- [ ] TC-STATE-002: エラー状態が表示される
- [ ] TC-STATE-003: エラー時に「再試行」ボタンが表示される
- [ ] TC-STATE-004: 空データ状態が表示される

---

## 8. 完了条件

### 8.1 実装完了
- [ ] OverallStats コンポーネントが実装されている
- [ ] OpponentDeckPieChart コンポーネントが実装されている
- [ ] RankStatsTable コンポーネントが実装されている
- [ ] PeriodSelector コンポーネントが実装されている
- [ ] StatisticsDashboardPage が実装されている

### 8.2 機能完了
- [ ] 期間選択が動作する
- [ ] グラフが正しく表示される
- [ ] コンポーネントテストが100%成功する (8ケース以上)

### 8.3 品質完了
- [ ] レスポンシブデザインが動作する
- [ ] Biome lintエラーが0件
- [ ] TypeScript型エラーが0件

---

## 9. 実装優先順位

### 9.1 Phase 1: 既存コンポーネントの確認（完了）
- [x] OverallStats.tsx 確認
- [x] OpponentDeckPieChart.tsx 確認
- [x] RankStatsTable.tsx 確認
- [x] PeriodSelector.tsx 確認
- [x] StatisticsDashboardPage.tsx 確認

### 9.2 Phase 2: テストケース追加（必要に応じて）
- [ ] TC-OVERALL-001 追加
- [ ] TC-RANK-001 追加
- [ ] TC-PERIOD-001〜005 追加
- [ ] TC-STATE-001〜004 追加

### 9.3 Phase 3: Greenフェーズ実装（必要に応じて）
- [ ] 不足している機能の実装
- [ ] 全テストケースの成功を確認

### 9.4 Phase 4: Refactorフェーズ
- [ ] コード品質の改善
- [ ] パフォーマンス最適化
- [ ] ドキュメント追加

---

## 10. 備考

### 10.1 既存実装の活用
本タスクの主要コンポーネントは既に実装済みです。TDDプロセスでは以下の点に注力します:
1. **テストケースの充実**: 未実装のテストケースを追加
2. **エッジケースの検証**: 境界値テストの追加
3. **コード品質の向上**: Refactorフェーズでの改善

### 10.2 注意事項
- **既存コードの尊重**: 実装済みのコンポーネントを最大限活用
- **テスト駆動**: テストケースを先に追加してから実装を確認
- **段階的改善**: 一度に全てを変更せず、段階的にリファクタリング

---

**ドキュメント作成日**: 2025-11-30
**作成者**: Claude (Sonnet 4.5)
**バージョン**: 1.0

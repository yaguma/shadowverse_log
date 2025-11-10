# TDD Red Phase: Statistics Dashboard実装 - 基本統計

**タスクID**: TASK-0018
**フェーズ**: Red（失敗するテスト作成）
**作成日**: 2025-11-09
**ステータス**: 完了 ✅

---

## 実装したテストケース一覧

### 正常系テストケース（10件）

| No | テストケースID | テスト名 | 信頼性レベル |
|----|----------------|----------|-------------|
| 1 | TC-STATS-001 | ページ初期表示 - デフォルト期間（過去7日間）で統計情報が表示される | 🔵 REQ-201, REQ-202 |
| 2 | TC-STATS-002 | 全体統計が正しく表示される | 🔵 REQ-203 |
| 3 | TC-STATS-003 | デッキ別統計が正しく表示される | 🔵 REQ-203 |
| 4 | TC-STATS-004 | ランク帯別統計が正しく表示される | 🔵 REQ-203 |
| 5 | TC-STATS-005 | 先攻後攻別統計が正しく表示される | 🔵 REQ-203 |
| 6 | TC-STATS-006 | 期間選択で統計情報が更新される | 🔵 REQ-202 |
| 7 | TC-STATS-007 | ローディング状態が正しく表示される | 🔵 REQ-502 |
| 8 | TC-STATS-008 | データが0件の場合に「データなし」メッセージが表示される | 🔵 REQ-405 |
| 9 | TC-STATS-009 | 期間選択のデフォルト値が正しく設定される | 🟡 一般的なUX要件 |
| 10 | TC-STATS-010 | API呼び出しが正しいクエリパラメータで実行される | 🔵 TASK-0010 API仕様 |

---

## テスト実行結果

### 実行コマンド

```bash
cd frontend
npm test -- StatisticsDashboardPage.test.tsx --run
```

### 実行結果

```
❯ src/pages/StatisticsDashboardPage.test.tsx (10 tests | 10 failed) 9.07s
       × TC-STATS-001: ページ初期表示 - デフォルト期間（過去7日間）で統計情報が表示される 1025ms
       × TC-STATS-002: 全体統計が正しく表示される 1005ms
       × TC-STATS-003: デッキ別統計が正しく表示される 1004ms
       × TC-STATS-004: ランク帯別統計が正しく表示される 1004ms
       × TC-STATS-005: 先攻後攻別統計が正しく表示される 1004ms
       × TC-STATS-006: 期間選択で統計情報が更新される 1003ms
       × TC-STATS-007: ローディング状態が正しく表示される 11ms
       × TC-STATS-008: データが0件の場合に「データなし」メッセージが表示される 1003ms
       × TC-STATS-009: 期間選択のデフォルト値が正しく設定される 1005ms
       × TC-STATS-010: API呼び出しが正しいクエリパラメータで実行される 1005ms

Test Files  1 failed (1)
      Tests  10 failed (10)
   Duration  9.88s (transform 111ms, setup 132ms, collect 204ms, tests 9.07s, environment 325ms, prepare 9ms)
```

✅ **期待通り全テストが失敗** - Red Phase成功

---

## 期待される失敗メッセージ

### TC-STATS-001の失敗内容

```
AssertionError: expected "vi.fn()" to be called with arguments: [ Array(1) ]

Number of calls: 0
```

**理由**: API呼び出しが実装されていないため、`apiClient.get`がモックされていない状態では呼ばれない

### TC-STATS-002〜TC-STATS-008の失敗内容

```
TestingLibraryElementError: Unable to find an element with the text: /総試合数.*150/
```

**理由**: 統計情報を表示するコンポーネントが実装されていないため、期待されるテキストが見つからない

### TC-STATS-009の失敗内容

```
TestingLibraryElementError: Unable to find a label with the text of: 開始日
```

**理由**: 期間選択フォーム（PeriodSelector）が実装されていないため、ラベル要素が見つからない

---

## 実装が必要な機能（Greenフェーズへの要求事項）

### 1. StatisticsDashboardPageコンポーネント

#### State管理

```typescript
const [startDate, setStartDate] = useState<string>('');
const [endDate, setEndDate] = useState<string>('');
const [statistics, setStatistics] = useState<StatisticsResponse | null>(null);
const [isLoading, setIsLoading] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);
```

#### デフォルト期間の計算

```typescript
useEffect(() => {
  const today = new Date().toISOString().split('T')[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  setStartDate(sevenDaysAgo);
  setEndDate(today);
}, []);
```

#### API呼び出し（初回 + 検索時）

```typescript
const fetchStatistics = async () => {
  setIsLoading(true);
  setError(null);
  try {
    const data = await apiClient.get<StatisticsResponse>(
      `/statistics?startDate=${startDate}&endDate=${endDate}`
    );
    setStatistics(data);
  } catch (err) {
    setError(extractErrorMessage(err, 'ネットワークエラーが発生しました'));
  } finally {
    setIsLoading(false);
  }
};

useEffect(() => {
  if (startDate && endDate) {
    fetchStatistics();
  }
}, [startDate, endDate]);
```

### 2. PeriodSelectorコンポーネント

```typescript
interface PeriodSelectorProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onSearch: () => void;
  isLoading: boolean;
}

export function PeriodSelector({ ... }: PeriodSelectorProps) {
  return (
    <div className="mb-4">
      <label htmlFor="startDate">開始日</label>
      <input type="date" id="startDate" value={startDate} onChange={(e) => onStartDateChange(e.target.value)} />

      <label htmlFor="endDate">終了日</label>
      <input type="date" id="endDate" value={endDate} onChange={(e) => onEndDateChange(e.target.value)} />

      <button onClick={onSearch} disabled={isLoading}>検索</button>
    </div>
  );
}
```

### 3. 統計表示コンポーネント

#### OverallStatsコンポーネント

```typescript
interface OverallStatsProps {
  stats: {
    totalGames: number;
    wins: number;
    losses: number;
    winRate: number;
  };
}

export function OverallStats({ stats }: OverallStatsProps) {
  return (
    <div>
      <p>総試合数: {stats.totalGames}試合</p>
      <p>勝数: {stats.wins}勝</p>
      <p>敗数: {stats.losses}敗</p>
      <p>勝率: {stats.winRate.toFixed(1)}%</p>
    </div>
  );
}
```

#### DeckStatsTableコンポーネント

```typescript
interface DeckStatsTableProps {
  title: string;
  deckStats: Array<{
    deckId: string;
    deckName: string;
    totalGames: number;
    wins: number;
    losses: number;
    winRate: number;
  }>;
}

export function DeckStatsTable({ title, deckStats }: DeckStatsTableProps) {
  return (
    <div>
      <h3>{title}</h3>
      <table>
        <thead>
          <tr>
            <th>デッキ名</th>
            <th>試合数</th>
            <th>勝数</th>
            <th>敗数</th>
            <th>勝率</th>
          </tr>
        </thead>
        <tbody>
          {deckStats.map((deck) => (
            <tr key={deck.deckId}>
              <td>{deck.deckName}</td>
              <td>{deck.totalGames}</td>
              <td>{deck.wins}</td>
              <td>{deck.losses}</td>
              <td>{deck.winRate.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

#### RankStatsTableコンポーネント

```typescript
interface RankStatsTableProps {
  rankStats: Array<{
    rank: Rank;
    group: Group;
    totalGames: number;
    wins: number;
    losses: number;
    winRate: number;
  }>;
}

export function RankStatsTable({ rankStats }: RankStatsTableProps) {
  return (
    <table>
      <thead>
        <tr>
          <th>ランク</th>
          <th>グループ</th>
          <th>試合数</th>
          <th>勝数</th>
          <th>敗数</th>
          <th>勝率</th>
        </tr>
      </thead>
      <tbody>
        {rankStats.map((rank, index) => (
          <tr key={index}>
            <td>{rank.rank}</td>
            <td>{rank.group}</td>
            <td>{rank.totalGames}</td>
            <td>{rank.wins}</td>
            <td>{rank.losses}</td>
            <td>{rank.winRate.toFixed(1)}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

#### TurnStatsコンポーネント

```typescript
interface TurnStatsProps {
  turnStats: {
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
}

export function TurnStats({ turnStats }: TurnStatsProps) {
  return (
    <div>
      <h3>先攻後攻別統計</h3>
      <p>先攻: {turnStats.先攻.totalGames}試合 {turnStats.先攻.wins}勝 {turnStats.先攻.losses}敗 勝率{turnStats.先攻.winRate.toFixed(1)}%</p>
      <p>後攻: {turnStats.後攻.totalGames}試合 {turnStats.後攻.wins}勝 {turnStats.後攻.losses}敗 勝率{turnStats.後攻.winRate.toFixed(1)}%</p>
    </div>
  );
}
```

### 4. UI状態管理コンポーネント

#### Loadingコンポーネント

```typescript
export function Loading() {
  return <div role="status">読み込み中...</div>;
}
```

#### EmptyStateコンポーネント

```typescript
export function EmptyState() {
  return <p>指定期間にデータがありません</p>;
}
```

#### Errorコンポーネント

```typescript
interface ErrorProps {
  message: string;
  onRetry: () => void;
}

export function Error({ message, onRetry }: ErrorProps) {
  return (
    <div>
      <p>{message}</p>
      <button onClick={onRetry}>再試行</button>
    </div>
  );
}
```

---

## 品質判定

✅ **高品質**:
- ✅ テスト実行: 成功（全10件が期待通り失敗）
- ✅ 期待値: 明確で具体的（統計値、エラーメッセージ、UI状態）
- ✅ アサーション: 適切（getByText, toHaveBeenCalledWithなど）
- ✅ 実装方針: 明確（必要なコンポーネント、State、API呼び出しが明示されている）
- ✅ 日本語コメント: すべてのテストケースに詳細なコメント付き
- ✅ 信頼性レベル: 各テストケースに明示（🔵 or 🟡）

**判定結果**: ✅ 高品質 - Greenフェーズ（最小実装）へ進む準備が整いました

---

## 次のステップ

次のお勧めステップ: `/tsumiki:tdd-green` でGreenフェーズ（最小実装）を開始します。

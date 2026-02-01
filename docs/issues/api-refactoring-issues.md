# API リファクタリング イシュー一覧

調査日: 2026-02-01

以下の各セクションをGitHubイシューとして作成してください。

---

## Issue 1: レスポンス生成関数の重複解消

### Title
refactor(api): レスポンス生成関数を共通ユーティリティに抽出する

### Labels
`refactor`, `tech-debt`, `priority:high`

### Body

## 概要

`createMeta()` と `createErrorResponse()` が複数のルートファイルで重複実装されています。

## 影響を受けるファイル

- `apps/api/src/routes/battle-logs.ts` (L24-40)
- `apps/api/src/routes/deck-master.ts` (L29-51)
- `apps/api/src/routes/my-decks.ts` (L24-47)

## 現在の実装

```typescript
// 各ファイルで重複
function createMeta() {
  return {
    timestamp: new Date().toISOString(),
    requestId: crypto.randomUUID(),
  };
}

function createErrorResponse(code: string, message: string, details?: Record<string, string>) {
  return {
    success: false as const,
    error: { code, message, ...(details && { details }) },
    meta: createMeta(),
  };
}
```

## 提案する解決策

1. `apps/api/src/utils/response.ts` を作成
2. 共通関数を抽出
3. 各ルートファイルからインポートして使用

## 追加の問題点

`details` の型が不一致:
- `battle-logs.ts`: `details?: Record<string, string>`
- `deck-master.ts` / `my-decks.ts`: `details?: unknown`

型を統一する必要があります。

---

## Issue 2: UUID検証ロジックの一元化

### Title
refactor(api): UUID検証関数を共通ユーティリティに抽出する

### Labels
`refactor`, `tech-debt`, `priority:high`

### Body

## 概要

`isValidUUID()` が複数ファイルで重複実装されており、一部のルートでは欠落しています。

## 影響を受けるファイル

- `apps/api/src/routes/deck-master.ts` (L56-59) - 実装あり
- `apps/api/src/routes/my-decks.ts` (L52-55) - 実装あり
- `apps/api/src/routes/battle-logs.ts` - **実装なし（一貫性の欠如）**

## 現在の実装

```typescript
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}
```

## 提案する解決策

1. `apps/api/src/utils/validation.ts` を作成
2. `isValidUUID()` を共通関数として定義
3. 全ルートファイルで統一的に使用

---

## Issue 3: デバッグモードの環境変数制御

### Title
fix(api): デバッグモードを環境変数で制御する

### Labels
`security`, `bug`, `priority:high`

### Body

## 概要

認証ミドルウェアの `debug` オプションが `true` にハードコードされており、本番環境でも有効になる可能性があります。

## 影響を受けるファイル

- `apps/api/src/index.ts` (L59-74)

## 現在の実装

```typescript
app.use('/api/*', authMiddleware({
  skipPaths: [...],
  debug: true,  // ハードコード
}));
```

## 提案する解決策

```typescript
app.use('/api/*', authMiddleware({
  skipPaths: [...],
  debug: c.env.ENVIRONMENT === 'development',
}));
```

## セキュリティへの影響

本番環境で認証情報がログに出力される可能性があります。

---

## Issue 4: 認証skipPathsの見直し

### Title
security(api): 認証skipPathsを適切に設定する

### Labels
`security`, `priority:high`

### Body

## 概要

現在、実質的に全てのAPIエンドポイントが認証をスキップする設定になっています。

## 影響を受けるファイル

- `apps/api/src/index.ts` (L64-71)

## 現在の実装

```typescript
skipPaths: [
  '/api/health',
  /^\/api\/migration/,
  /^\/api\/import/,
  /^\/api\/battle-logs/,
  /^\/api\/deck-masters/,
  /^\/api\/my-decks/,
  /^\/api\/statistics/,
],
```

## 問題点

- 全主要エンドポイントがスキップされており、認証機能が実質無効
- セキュリティ上の懸念

## 提案する解決策

1. 本当に認証不要なエンドポイントのみを `skipPaths` に含める
2. `/api/health` のみをスキップし、他は認証必須とする
3. 開発環境用の設定を分離する

---

## Issue 5: 日付処理関数の修正

### Title
fix(api): 日付処理関数のタイムゾーン処理を修正する

### Labels
`bug`, `priority:high`

### Body

## 概要

`getTodayInJST()` の実装が不正確で、タイムゾーン情報が正しく処理されていません。

## 影響を受けるファイル

- `apps/api/src/utils/date.ts` (L10-15)

## 現在の実装

```typescript
export const getTodayInJST = (): string => {
  const now = new Date();
  const jstOffset = 9 * 60 * 60 * 1000;
  const jstDate = new Date(now.getTime() + jstOffset);
  return jstDate.toISOString().split('T')[0] || '';
};
```

## 問題点

- 単純にミリ秒を加算しているだけで、タイムゾーン情報が失われている
- `toISOString()` は常にUTCで出力するため、意図した動作にならない

## 提案する解決策

```typescript
export const getTodayInJST = (): string => {
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date()).replace(/\//g, '-');
};
```

---

## Issue 6: 統計クエリのN+1問題解消

### Title
perf(api): 統計サービスのN+1クエリを解消する

### Labels
`performance`, `priority:medium`

### Body

## 概要

統計データ取得時に4回のクエリが連続実行されており、パフォーマンスに影響しています。

## 影響を受けるファイル

- `apps/api/src/services/d1-statistics-service.ts` (L116-152)

## 現在の実装

```typescript
const logs = await this.fetchBattleLogs(...);  // Query 1
const myDeckNameMap = await this.fetchMyDeckNames(logs);  // Query 2
const opponentDeckNameMap = await this.fetchDeckMasterNames(logs);  // Query 3
const opponentClassNameMap = await this.fetchDeckMasterClassNames(logs);  // Query 4
```

## 提案する解決策

JOINを使用して1回のクエリで必要なデータを全て取得する:

```typescript
const logs = await this.db
  .select({
    ...battleLogs,
    myDeckName: myDecks.deckName,
    opponentDeckName: deckMaster.deckName,
    opponentClassName: deckMaster.className,
  })
  .from(battleLogs)
  .leftJoin(myDecks, eq(battleLogs.myDeckId, myDecks.id))
  .leftJoin(deckMaster, eq(battleLogs.opponentDeckId, deckMaster.id))
  .where(...);
```

---

## Issue 7: 統計計算をSQL集計に移行

### Title
perf(api): 統計計算をインメモリからSQL集計に移行する

### Labels
`performance`, `priority:medium`

### Body

## 概要

統計計算が全てインメモリで行われており、大量データ時にパフォーマンス問題が発生します。

## 影響を受けるファイル

- `apps/api/src/services/d1-statistics-service.ts` (L250-382)

## 現在の実装

```typescript
private calculateOverall(logs: Array<{ result: string }>): OverallStatistics {
  const totalGames = logs.length;
  const { wins, losses } = logs.reduce(...);
}

private calculateByDeck<T extends { result: string }>(
  logs: T[],
  ...
): DeckStatistics[] {
  const grouped = logs.reduce(...);
}
```

## 問題点

- 数千〜数万件のデータをメモリ上でループ処理
- 不要なデータ転送

## 提案する解決策

SQLのGROUP BY集計を使用:

```sql
SELECT
  my_deck_id,
  COUNT(*) as total_games,
  SUM(CASE WHEN result = 'WIN' THEN 1 ELSE 0 END) as wins,
  SUM(CASE WHEN result = 'LOSE' THEN 1 ELSE 0 END) as losses
FROM battle_logs
WHERE date BETWEEN ? AND ?
GROUP BY my_deck_id
```

---

## Issue 8: バリデーションロジックの一元化

### Title
refactor(api): バリデーションロジックをZodスキーマに一元化する

### Labels
`refactor`, `priority:medium`

### Body

## 概要

一部のルートで手動バリデーションが実装されており、Zodスキーマと重複しています。

## 影響を受けるファイル

- `apps/api/src/routes/deck-master.ts` (L144-194)

## 現在の実装

```typescript
// リクエストボディの存在チェック
if (!body || typeof body !== 'object') {
  return c.json(createErrorResponse('VALIDATION_ERROR', '入力値が不正です'), 400);
}

const { className, deckName } = body;

// バリデーション: className必須チェック
if (!className || className === '') {
  return c.json(createErrorResponse('VALIDATION_ERROR', '入力値が不正です'), 400);
}
```

## 提案する解決策

`battle-logs.ts` と同様にZodスキーマでバリデーションを一元化する。

---

## Issue 9: 日付バリデーションの強化

### Title
fix(api): 日付バリデーションを強化する

### Labels
`bug`, `priority:medium`

### Body

## 概要

日付の正規表現バリデーションが不十分で、無効な日付が通過する可能性があります。

## 影響を受けるファイル

- `apps/api/src/services/d1-import-service.ts` (L22-50)

## 現在の実装

```typescript
date: z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式で入力してください')
```

## 問題点

正規表現 `/^\d{4}-\d{2}-\d{2}$/` は `2025-13-45` のような無効な日付も通過させます。

## 提案する解決策

```typescript
date: z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式で入力してください')
  .refine(
    (date) => !isNaN(new Date(date).getTime()),
    { message: '有効な日付を入力してください' }
  )
```

---

## Issue 10: リポジトリファクトリの活用

### Title
refactor(api): リポジトリファクトリパターンを活用する

### Labels
`refactor`, `priority:low`

### Body

## 概要

`createRepositories` ファクトリが定義されていますが、実際には使用されていません。

## 影響を受けるファイル

- `apps/api/src/db/repositories/index.ts` (L41-47)
- 各ルートファイル

## 現在の実装

```typescript
// ファクトリ（未使用）
export function createRepositories(db: Database): Repositories {
  return {
    battleLogs: new BattleLogsRepository(db),
    deckMaster: new DeckMasterRepository(db),
    myDecks: new MyDecksRepository(db),
  };
}

// 各ルートでの直接インスタンス化
const db = createDb(c.env.DB);
const repository = new BattleLogsRepository(db);
```

## 提案する解決策

ファクトリパターンを活用して依存性注入を改善し、テスタビリティを向上させる。

---

## Issue 11: レート制限のメモリリーク対策

### Title
fix(api): レート制限のメモリリークを修正する

### Labels
`bug`, `priority:low`

### Body

## 概要

レート制限のインメモリストアが期限切れエントリを削除しないため、メモリリークが発生します。

## 影響を受けるファイル

- `apps/api/src/middleware/rate-limit.ts` (L93-132)

## 問題点

1. 期限切れエントリが削除されない
2. Cloudflare Workersの複数インスタンス間でストアが共有されない

## 提案する解決策

1. 定期的に期限切れエントリをクリーンアップする
2. Cloudflare KVやDurable Objectsを使用した分散ストアの検討

---

## Issue 12: ID生成の競合状態対策

### Title
fix(api): バルクインポート時のID生成を改善する

### Labels
`bug`, `priority:low`

### Body

## 概要

バルクインポート時のID生成が `Date.now()` ベースで、高頻度リクエストで重複IDが生成される可能性があります。

## 影響を受けるファイル

- `apps/api/src/services/d1-import-service.ts` (L147)

## 現在の実装

```typescript
const id = validatedData.id || `${ID_PREFIX}_${Date.now()}_${i}`;
```

## 問題点

同じミリ秒内に複数のバルクリクエストがあった場合、インデックス `i` が同じで重複IDになる可能性があります。

## 提案する解決策

```typescript
const id = validatedData.id || crypto.randomUUID();
```

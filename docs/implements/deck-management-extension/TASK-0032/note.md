# TASK-0032: 相手デッキ選択肢ソート機能 - タスクノート

## 技術スタック

- **フロントエンド**: React 19 + TypeScript + Zustand + Tailwind CSS
- **バックエンド**: Cloudflare Workers + Hono + Drizzle ORM + D1
- **テスト**: Vitest + @testing-library/react

## 既存実装の確認

### API（実装済み）

- `GET /api/deck-master?includeUsage=true` が存在
- `DeckMasterRepository.findAllWithUsage()` で使用回数・最終使用日を集計
- ソート順: lastUsedDate降順 → sortOrder昇順（nullは末尾）

### Store（実装済み）

- `fetchDeckMastersWithUsage()`: 使用履歴付きデッキマスター取得
- `deckMastersWithUsage`: 使用履歴付きデータを保持

### BattleLogForm（要修正）

- 現状: `fetchDeckMasters()` を使用（ソートなし）
- 目標: 相手デッキ選択肢を最近使用順で表示

## 実装方針

### 方法1: BattleLogFormで`fetchDeckMastersWithUsage`を使用

```typescript
// BattleLogForm.tsx
const { deckMastersWithUsage, fetchDeckMastersWithUsage } = useDeckStore();

useEffect(() => {
  fetchDeckMastersWithUsage(true);
}, [fetchDeckMastersWithUsage]);

// 相手デッキ選択
{deckMastersWithUsage.map((deck) => (
  <option key={deck.id} value={deck.id}>
    {deck.deckName}
    {deck.usageCount > 0 && ` (${deck.usageCount}回)`}
  </option>
))}
```

### 方法2: `fetchDeckMasters`にincludeUsageオプションを追加

`fetchDeckMasters(includeUsage?: boolean)` として、内部でAPIパラメータを切り替える。

→ **方法1を採用**: 既存の`fetchDeckMastersWithUsage`を活用し、変更を最小限に抑える

## テスト要件

1. 最近使用したデッキが上位に表示される
2. 使用回数が表示される（オプション）
3. 対戦履歴0件時はsortOrder順にフォールバック
4. APIエラー時のエラーハンドリング

## 関連ファイル

- `apps/web/src/components/battle-log/BattleLogForm.tsx`
- `apps/web/src/store/deckStore.ts`
- `apps/api/src/routes/deck-master.ts`
- `apps/api/src/db/repositories/deck-master-repository.ts`

## 信頼性レベル

- 🔵 API実装: api-endpoints.md 2.1より
- 🔵 ソート仕様: dataflow.md 4.1より
- 🔵 UI仕様: REQ-EXT-302より

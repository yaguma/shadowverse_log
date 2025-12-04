# UI Improvement Phase 1 - 詳細タスク

## 要件名
ui-improvement

## フェーズ概要

- **期間**: 1日（約6時間）
- **目標**: 対戦履歴一覧で相手デッキ名を表示し、対戦履歴登録フォームの仮実装をAPI連携に本実装する
- **成果物**:
  - デッキ名付きBattleLog型定義
  - deckStoreへのAPI連携実装
  - BattleLogFormのAPI連携本実装
  - BattleLogListの相手デッキ名表示
  - 統合テスト

---

## Day 1 - 実装・テスト

### 目標
- 型定義の拡張とStore整備
- BattleLogFormのAPI連携本実装
- BattleLogListの相手デッキ名表示

### 成果物
- 拡張された型定義
- API連携済みのdeckStore
- 本実装されたBattleLogForm
- デッキ名表示のBattleLogList
- 統合テスト結果

---

## TASK-0047: 型定義の拡張（BattleLogWithDeckNames追加）

- [ ] タスク完了

### 基本情報

| 項目 | 内容 |
|------|------|
| タスクID | TASK-0047 |
| タスク名 | 型定義の拡張（BattleLogWithDeckNames追加） |
| タスクタイプ | TDD |
| 推定工数 | 0.5h |
| 要件リンク | REQ-009（対戦履歴一覧表示）、REQ-101〜106（データ表示要件） |
| 依存タスク | なし |

### 要件名
ui-improvement

### 実装詳細

🔵 **信頼性レベル**: 青信号（docs/design/shadowverse-battle-log/interfaces.ts の設計に基づく）

#### 概要
対戦履歴一覧表示でデッキ名を表示するため、`BattleLogWithDeckNames`型を追加する。

#### 実装内容

1. **`frontend/src/types/index.ts`の修正**:
   ```typescript
   /**
    * 対戦履歴エンティティ（デッキ名付き）
    * 🔵 信頼性レベル: docs/design/shadowverse-battle-log/interfaces.ts に基づく
    */
   export interface BattleLogWithDeckNames extends BattleLog {
     /** マイデッキ名 */
     myDeckName: string;
     /** 相手デッキ名 */
     opponentDeckName: string;
   }
   ```

2. **`BattleLogsResponse`の修正**:
   - `battleLogs: BattleLog[]` → `battleLogs: BattleLogWithDeckNames[]` に変更

#### 変更ファイル
- `frontend/src/types/index.ts`

### 完了条件
- [ ] `BattleLogWithDeckNames`型が定義されている
- [ ] `BattleLogsResponse`が`BattleLogWithDeckNames[]`を使用している
- [ ] TypeScriptコンパイルエラーがない
- [ ] 既存テストが通る

### テスト要件

#### 単体テスト
- [ ] 型定義が正しくエクスポートされている
- [ ] 既存の`BattleLog`型との互換性

---

## TASK-0048: deckStoreへのAPI連携実装

- [ ] タスク完了

### 基本情報

| 項目 | 内容 |
|------|------|
| タスクID | TASK-0048 |
| タスク名 | deckStoreへのAPI連携実装 |
| タスクタイプ | TDD |
| 推定工数 | 1h |
| 要件リンク | REQ-002（デッキマスター選択）、REQ-040（マイデッキ管理） |
| 依存タスク | TASK-0047 |

### 要件名
ui-improvement

### 実装詳細

🔵 **信頼性レベル**: 青信号（backend/src/routes/deck-master.ts のAPI仕様に基づく）

#### 概要
BattleLogFormで使用するデッキマスター一覧とマイデッキ一覧をAPIから取得するStoreを実装する。

#### 実装内容

1. **`frontend/src/store/deckStore.ts`の確認・修正**:
   - デッキマスター取得API (`GET /api/deck-master`) の呼び出し
   - マイデッキ取得API (`GET /api/my-decks`) の呼び出し（存在する場合）
   - ローディング状態とエラー状態の管理

2. **APIエンドポイント確認**:
   - `/api/deck-master` - デッキマスター一覧取得
   - `/api/my-decks` - マイデッキ一覧取得（認証後のみ、現時点では仮データ可）

#### 変更ファイル
- `frontend/src/store/deckStore.ts`
- `frontend/src/api/deckApi.ts`（新規作成の可能性）

### 完了条件
- [ ] `fetchDeckMasters`アクションがAPIを呼び出している
- [ ] デッキマスター一覧がStoreに保存される
- [ ] ローディング状態が正しく管理される
- [ ] エラーハンドリングが実装されている
- [ ] TypeScriptコンパイルエラーがない

### テスト要件

#### 単体テスト
- [ ] `fetchDeckMasters`がAPIを正しく呼び出す
- [ ] 成功時にデッキマスター一覧がStoreに保存される
- [ ] 失敗時にエラー状態が設定される
- [ ] ローディング状態が正しく遷移する

---

## TASK-0049: BattleLogForm本実装（モック→API連携）

- [ ] タスク完了

### 基本情報

| 項目 | 内容 |
|------|------|
| タスクID | TASK-0049 |
| タスク名 | BattleLogForm本実装（モック→API連携） |
| タスクタイプ | TDD |
| 推定工数 | 1.5h |
| 要件リンク | REQ-001（対戦履歴登録）、REQ-002（入力フィールド） |
| 依存タスク | TASK-0047, TASK-0048 |

### 要件名
ui-improvement

### 実装詳細

🔵 **信頼性レベル**: 青信号（現在のBattleLogForm.tsxのコメントに記載の仮実装指示に基づく）

#### 概要
BattleLogFormのモックデータをAPIから取得する本実装に変更する。

#### 現在の仮実装（削除対象）

```typescript
// 【モックデータ】: テストを通すための仮データ（空配列の場合を考慮） 🟡
const mockDecks = [
  { id: 'deck-001', deckName: 'テストデッキ1' },
  { id: 'deck-002', deckName: 'テストデッキ2' },
];
setMyDecks(mockDecks);
```

```typescript
// 【モックデータ】: テストを通すための仮データ（空配列の場合を考慮） 🟡
const mockDeckMasters = [
  { id: 'deck-master-001', deckName: '相手デッキ1' },
  { id: 'deck-master-002', deckName: '相手デッキ2' },
  { id: 'deck-master-005', deckName: '相手デッキ5' },
];
setDeckMasters(mockDeckMasters);
```

#### 本実装内容

1. **deckStoreからデータ取得に変更**:
   ```typescript
   import { useDeckStore } from '../../store/deckStore';

   const { deckMasters, fetchDeckMasters, isLoading: isDeckLoading } = useDeckStore();

   useEffect(() => {
     fetchDeckMasters();
   }, [fetchDeckMasters]);
   ```

2. **マイデッキ一覧取得**:
   - 現時点ではマイデッキAPIが未実装の可能性があるため、暫定的にモックデータを維持
   - または `fetchMyDecks` を実装

3. **ローディング状態の統合**:
   - フォーム全体のローディング状態にデッキ取得のローディングを含める

#### 変更ファイル
- `frontend/src/components/battle-log/BattleLogForm.tsx`
- `frontend/src/components/battle-log/BattleLogForm.test.tsx`（テスト修正）

### 完了条件
- [ ] マイデッキ一覧がAPIまたはStoreから取得される
- [ ] デッキマスター一覧がAPIから取得される
- [ ] モックデータが削除されている（または明示的なフォールバックとして残す）
- [ ] ローディング中は適切な表示がされる
- [ ] エラー時は適切なメッセージが表示される
- [ ] TypeScriptコンパイルエラーがない
- [ ] 既存テストが通る（または適切に修正される）

### テスト要件

#### 単体テスト
- [ ] コンポーネントがマウント時にデッキマスターを取得する
- [ ] ローディング中の表示が正しい
- [ ] エラー時の表示が正しい
- [ ] デッキ選択ドロップダウンにAPIデータが表示される

---

## TASK-0050: BattleLogList相手デッキ名表示実装

- [ ] タスク完了

### 基本情報

| 項目 | 内容 |
|------|------|
| タスクID | TASK-0050 |
| タスク名 | BattleLogList相手デッキ名表示実装 |
| タスクタイプ | TDD |
| 推定工数 | 1.5h |
| 要件リンク | REQ-009（対戦履歴一覧表示）、REQ-101〜106（データ表示要件） |
| 依存タスク | TASK-0047 |

### 要件名
ui-improvement

### 実装詳細

🔵 **信頼性レベル**: 青信号（REQ-009、現在のBattleLogList.tsxのコメントに記載の改善指示に基づく）

#### 概要
対戦履歴一覧で`opponentDeckId`をデッキ名に変換して表示する。

#### 現在の実装（改善対象）

```typescript
{/* 【相手デッキ】: デッキIDを表示（最小実装） 🔵 */}
{/* 【最小実装】: opponentDeckIdをそのまま表示（デッキ名表示は後で改善） */}
<td className="border border-gray-300 px-4 py-2">{log.opponentDeckId}</td>
```

#### 実装方法の選択肢

**方法A: バックエンドでJOINしてデッキ名を返す（推奨）**
- APIレスポンスに`opponentDeckName`を含める
- フロントエンドは受け取ったデータをそのまま表示

**方法B: フロントエンドでデッキマスターをルックアップ**
- デッキマスター一覧をStoreから取得
- `opponentDeckId`から`deckName`を検索して表示

#### 本実装内容（方法B - フロントエンド側で対応）

1. **BattleLogListPropsの変更**:
   ```typescript
   interface BattleLogListProps {
     battleLogs: BattleLog[];
     deckMasters: DeckMaster[]; // 追加
     onDelete: (id: string) => void;
     onDetail: (log: BattleLog) => void;
   }
   ```

2. **デッキ名ルックアップ関数の追加**:
   ```typescript
   const getDeckName = useCallback((deckId: string): string => {
     const deck = deckMasters.find(d => d.id === deckId);
     return deck?.deckName ?? deckId; // 見つからない場合はIDをフォールバック
   }, [deckMasters]);
   ```

3. **表示の変更**:
   ```typescript
   <td className="border border-gray-300 px-4 py-2">
     {getDeckName(log.opponentDeckId)}
   </td>
   ```

4. **マイデッキ名も同様に変更**（オプション）:
   ```typescript
   <td className="border border-gray-300 px-4 py-2">
     {getMyDeckName(log.myDeckId)}
   </td>
   ```

#### 変更ファイル
- `frontend/src/components/battle-log/BattleLogList.tsx`
- `frontend/src/components/battle-log/BattleLogList.test.tsx`（テスト修正）
- `frontend/src/pages/BattleLogListPage.tsx`（propsの追加）

### 完了条件
- [ ] 相手デッキがデッキ名で表示される
- [ ] デッキマスターに存在しないIDの場合はIDがフォールバック表示される
- [ ] モバイル表示（カード形式）でもデッキ名が表示される
- [ ] TypeScriptコンパイルエラーがない
- [ ] 既存テストが通る（または適切に修正される）

### テスト要件

#### 単体テスト
- [ ] デッキマスターが渡された場合、デッキ名が表示される
- [ ] デッキマスターが空の場合、IDがフォールバック表示される
- [ ] デッキIDがデッキマスターに存在しない場合、IDがフォールバック表示される

---

## TASK-0051: 統合テスト・動作確認

- [ ] タスク完了

### 基本情報

| 項目 | 内容 |
|------|------|
| タスクID | TASK-0051 |
| タスク名 | 統合テスト・動作確認 |
| タスクタイプ | TDD |
| 推定工数 | 1.5h |
| 要件リンク | REQ-001〜REQ-010（対戦履歴機能全般） |
| 依存タスク | TASK-0047, TASK-0048, TASK-0049, TASK-0050 |

### 要件名
ui-improvement

### 実装詳細

🔵 **信頼性レベル**: 青信号（品質基準に基づく）

#### 概要
すべての実装が完了した後、統合テストと動作確認を行う。

#### 確認内容

1. **フロントエンド起動確認**:
   - `pnpm dev` でフロントエンドが起動する
   - コンパイルエラーがない

2. **バックエンド起動確認**:
   - バックエンドが正常に起動する
   - API エンドポイントが応答する

3. **機能確認**:
   - 対戦履歴一覧画面で相手デッキ名が表示される
   - 対戦履歴登録フォームでデッキマスター一覧が表示される
   - 対戦履歴登録が正常に動作する
   - 登録後、一覧に新しい対戦履歴が表示される

4. **テスト実行**:
   - `pnpm test` ですべてのテストが通る
   - `pnpm lint` でエラーがない
   - `pnpm type-check` でエラーがない

#### 変更ファイル
- テストファイルの修正（必要に応じて）

### 完了条件
- [ ] フロントエンドが正常に起動する
- [ ] バックエンドが正常に起動する
- [ ] 対戦履歴一覧で相手デッキ名が表示される
- [ ] 対戦履歴登録フォームでデッキマスター一覧が表示される
- [ ] 対戦履歴登録が正常に動作する
- [ ] すべての単体テストが通る
- [ ] Lintエラーがない
- [ ] 型チェックエラーがない

### テスト要件

#### 統合テスト
- [ ] 対戦履歴一覧表示のE2Eシナリオ
- [ ] 対戦履歴登録のE2Eシナリオ
- [ ] エラーケースの確認

---

## 品質基準

### コード品質
- TypeScript strict mode 有効
- ゼロ警告ポリシー（コンパイル警告・リンター警告ゼロ）
- Biome による自動チェック

### テスト
- 単体テスト: すべての新規・変更コード
- 統合テスト: 主要ユーザーフロー
- テスト成功率: 100%

### パフォーマンス
- ページ読み込み時間: 2秒以内
- APIレスポンスタイム: 500ms以内

---

## 更新履歴

| 日付 | バージョン | 変更内容 | 更新者 |
|------|------------|----------|--------|
| 2025-12-04 | 1.0.0 | 初版作成 | Claude Code |

# TASK-0008: Battle Log CRUD API実装 - 一覧取得・削除機能 - TDD要件定義書

## メタ情報

- **タスクID**: TASK-0008
- **機能名**: Battle Log一覧取得・削除API
- **タスクタイプ**: TDD
- **作成日**: 2025-10-30
- **依存タスク**: TASK-0007 (Battle Log作成API) ✅ 完了
- **推定工数**: 8時間

---

## 1. 機能の概要

### 🔵 機能の目的（タスクファイルphase2.mdより）

この機能は、Shadowverse対戦履歴管理システムにおいて、以下の3つの主要機能を提供します：

1. **対戦履歴一覧取得API** - ページネーション、ソート機能付きで対戦履歴を取得
2. **デッキ名付与機能** - マイデッキとデッキマスター情報をjoinしてデッキ名を表示
3. **対戦履歴削除API** - 指定されたIDの対戦履歴を削除

### 🔵 解決する問題（タスクファイルphase2.mdより）

- **REQ-101**: 対戦履歴の一覧表示機能（ユーザーが過去の対戦を確認できる）
- **REQ-103**: ソート機能（日付降順がデフォルト）
- **REQ-105**: 削除機能（不要な対戦履歴を削除できる）
- **REQ-106**: デッキ名表示（IDだけでなく、人間が読めるデッキ名を表示）

### 🔵 想定されるユーザー

- Shadowverseプレイヤー（個人利用、認証なし - Phase 1）
- 対戦履歴を記録・分析したいユーザー

### 🔵 システム内での位置づけ（tech-stack.mdより）

- **アーキテクチャ**: Azure Functions v4 + TypeScript（サーバーレス）
- **ストレージ**: Azure Blob Storage（JSONファイルベース）
- **レイヤー**: ビジネスロジック層（BattleLogService）
- **既存コンポーネントとの関係**:
  - TASK-0006のBlobStorageClientを使用
  - TASK-0007のBattleLogService.createBattleLog()と同じサービスクラスに実装

---

## 2. 入力・出力の仕様

### 2.1 一覧取得API (`GET /api/battle-logs`)

#### 🔵 入力パラメータ（クエリパラメータ） - phase2.md L668-671

| パラメータ | 型 | 必須 | デフォルト | 制約 | 説明 |
|-----------|-----|-----|----------|------|------|
| `limit` | `number` | ❌ | 100 | 1 ≤ limit ≤ 1000 | 1ページあたりの取得件数 |
| `offset` | `number` | ❌ | 0 | offset ≥ 0 | スキップする件数（ページネーション） |
| `sortBy` | `string` | ❌ | `"date"` | BattleLogのプロパティ名 | ソートキー |
| `sortOrder` | `"asc" \| "desc"` | ❌ | `"desc"` | `"asc"` または `"desc"` | ソート順（昇順/降順） |

#### 🔵 出力形式（types/index.ts L98-120より）

```typescript
{
  success: true,
  data: {
    battleLogs: Array<{
      id: string;                    // log_YYYYMMDD_NNN形式
      date: string;                  // YYYY/MM/DD形式
      battleType: BattleType;
      rank: Rank;
      group: Group;
      myDeckId: string;
      turn: Turn;
      result: BattleResult;
      opponentDeckId: string;
      myDeckName: string;            // ← 新規追加（REQ-106）
      opponentDeckName: string;      // ← 新規追加（REQ-106）
    }>;
    total: number;                   // 総件数
    limit: number;                   // 適用されたlimit値
    offset: number;                  // 適用されたoffset値
  },
  meta: {
    timestamp: string;               // ISO 8601形式
    requestId: string;               // Azure Functions invocationId
  }
}
```

### 2.2 削除API (`DELETE /api/battle-logs/:id`)

#### 🔵 入力パラメータ（パスパラメータ） - phase2.md L629

| パラメータ | 型 | 必須 | 制約 | 説明 |
|-----------|-----|-----|------|------|
| `id` | `string` | ✅ | `log_YYYYMMDD_NNN`形式 | 削除対象の対戦履歴ID |

#### 🔵 出力形式（types/index.ts L98-110より）

**成功時 (200 OK)**:
```typescript
{
  success: true,
  data: {
    deletedId: string;  // 削除されたID
  },
  meta: {
    timestamp: string,
    requestId: string
  }
}
```

**失敗時 (404 Not Found)**:
```typescript
{
  success: false,
  error: {
    code: "NOT_FOUND",
    message: "対戦履歴が見つかりません: {id}"
  },
  meta: {
    timestamp: string,
    requestId: string
  }
}
```

### 🔵 データフロー（BattleLogService.ts + phase2.md L561-625）

#### 一覧取得のフロー:
1. クエリパラメータのバリデーション（limit, offset範囲チェック）
2. `BlobStorageClient.getBattleLogs()` でBlob Storageから全件取得
3. `Promise.all`で `getDeckMasters()` と `getMyDecks()` を並列取得
4. デッキIDをMapに変換（高速検索用）
5. ソート処理（指定されたキー・順序）
6. ページネーション（offset〜offset+limit件を切り出し）
7. デッキ名付与（Map.get()で各ログにデッキ名を追加）
8. レスポンス返却

#### 削除のフロー:
1. `BlobStorageClient.getBattleLogs()` で全件取得
2. `findIndex()` で対象IDを検索
3. 見つからなければエラー（404）
4. `splice()` で配列から削除
5. `BlobStorageClient.saveBattleLogs()` で保存
6. 削除IDをレスポンス返却

---

## 3. 制約条件

### 🔵 パフォーマンス要件（tech-stack.md L11-12）

- **レスポンス時間**: 3秒以内
- **同時利用者数**: 10人以下（MVP段階）
- **データ量**:
  - 想定: 個人利用で年間1000件程度
  - 全件メモリ読み込みでも問題なし（JSONファイル < 100KB）

### 🟡 セキュリティ要件（推測: tech-stack.md L13より）

- **認証レベル**: `anonymous`（Phase 1 - 認証なし）
- **CORS**: 開発環境 `http://localhost:5173` を許可
- **入力バリデーション**: クエリパラメータの型・範囲チェック
- **SQLインジェクション**: 該当なし（JSONファイルベース）

### 🔵 互換性要件（types/index.ts L29-48より）

- **既存データ構造との互換性**: BattleLogインターフェースを拡張しない
- **デッキ名フィールド**: レスポンス時にのみ追加（ストレージには保存しない）
- **日付形式**: 既存の `YYYY/MM/DD` 形式を維持

### 🔵 アーキテクチャ制約（tech-stack.md L33-45, phase2.mdより）

- **フレームワーク**: Azure Functions v4 + TypeScript
- **ストレージ**: Azure Blob Storage（JSONファイル）
- **リトライ**: BlobStorageClientで3回リトライ、指数バックオフ（既実装）
- **タイムアウト**: Azure Functions `functionTimeout: 5分`（host.json）

### 🔵 データベース制約（phase2.md L561-625）

- **JSON配列操作**:
  - 一覧取得: 全件メモリロード → ソート → スライス
  - 削除: 全件メモリロード → splice() → 全件保存
- **トランザクション**: なし（単一ファイル上書き）
- **並行書き込み**: 考慮不要（MVP段階、単一ユーザー想定）

### 🔵 API制約（phase2.md L662-723）

- **HTTPメソッド**:
  - `GET /api/battle-logs` - 一覧取得
  - `DELETE /api/battle-logs/:id` - 削除
- **ステータスコード**:
  - 200: 成功
  - 400: バリデーションエラー
  - 404: 削除対象が見つからない
  - 500: サーバーエラー

---

## 4. 想定される使用例

### 4.1 基本的な使用パターン（REQ-101, REQ-103）

#### 🔵 シナリオ1: 最新10件を取得（デフォルト）
```bash
GET /api/battle-logs
# デフォルトパラメータが適用される
# limit=100, offset=0, sortBy="date", sortOrder="desc"
```

**期待される結果**:
- 最新の対戦履歴（日付降順）を最大100件取得
- 各ログにデッキ名が付与されている

#### 🔵 シナリオ2: ページネーション（2ページ目）
```bash
GET /api/battle-logs?limit=20&offset=20
```

**期待される結果**:
- 21〜40件目の対戦履歴を取得
- total=全件数、limit=20、offset=20 がレスポンスに含まれる

#### 🔵 シナリオ3: 古い順にソート
```bash
GET /api/battle-logs?sortOrder=asc
```

**期待される結果**:
- 古い順（日付昇順）に対戦履歴を取得

#### 🔵 シナリオ4: 対戦履歴を削除
```bash
DELETE /api/battle-logs/log_20251024_001
```

**期待される結果**:
- 指定されたIDの対戦履歴が削除される
- `{ success: true, data: { deletedId: "log_20251024_001" } }` が返却される

### 4.2 エッジケース（EDGE-XXX推測）

#### 🟡 EDGE-201: limit が範囲外
```bash
GET /api/battle-logs?limit=5000
```

**期待される結果**:
- 400 Bad Request
- エラーメッセージ: "limitは1から1000の間で指定してください"

#### 🟡 EDGE-202: offset が負の値
```bash
GET /api/battle-logs?offset=-10
```

**期待される結果**:
- 400 Bad Request
- エラーメッセージ: "offsetは0以上で指定してください"

#### 🟡 EDGE-203: 存在しないIDを削除
```bash
DELETE /api/battle-logs/log_99999999_999
```

**期待される結果**:
- 404 Not Found
- エラーメッセージ: "対戦履歴が見つかりません: log_99999999_999"

#### 🟡 EDGE-204: battle-logs.jsonが空配列
```bash
GET /api/battle-logs
```

**期待される結果**:
- 200 OK
- `{ battleLogs: [], total: 0, limit: 100, offset: 0 }`

#### 🟡 EDGE-205: デッキ名が見つからない
```
# マイデッキまたはデッキマスターに該当IDがない場合
```

**期待される結果**:
- デッキ名フィールドに `"不明なデッキ"` が設定される
- エラーにはならない

### 4.3 エラーケース

#### 🔵 エラーケース1: Blob Storage接続エラー
```
# ネットワーク切断、Azure障害など
```

**期待される動作**:
- BlobStorageClient が3回リトライ（指数バックオフ）
- すべて失敗後、500 Internal Server Error
- エラーメッセージ: "サーバーエラーが発生しました"

#### 🔵 エラーケース2: JSONパースエラー
```
# battle-logs.json が壊れている場合
```

**期待される動作**:
- JSON.parse() でエラー
- 500 Internal Server Error
- エラーメッセージ: "サーバーエラーが発生しました"

---

## 5. EARS要件・設計文書との対応関係

### 参照した要件（タスクファイルphase2.md L528より）

- **REQ-101**: 一覧表示機能（対戦履歴を一覧で表示できる）
- **REQ-103**: ソート機能（日付降順がデフォルト）
- **REQ-105**: 削除機能（不要な対戦履歴を削除できる）
- **REQ-106**: デッキ名表示（IDだけでなく、デッキ名を表示）

### 参照した非機能要件（tech-stack.mdより）

- **NFR-Performance**: レスポンス時間3秒以内
- **NFR-Concurrency**: 同時利用者数10人以下
- **NFR-Security**: 基本的なWebセキュリティ対策

### 参照したEdgeケース（推測）

- **EDGE-201**: limit範囲外
- **EDGE-202**: offset負の値
- **EDGE-203**: 存在しないID削除
- **EDGE-204**: 空配列
- **EDGE-205**: デッキ名未存在

### 参照した設計文書

- **型定義**: `backend/src/types/index.ts`
  - BattleLog インターフェース（L29-48）
  - ApiResponse インターフェース（L98-110）
  - BattleLogsResponse インターフェース（L115-120）
  - DeckMaster, MyDeck インターフェース（L53-80）

- **既存サービス**: `backend/src/services/battleLogService.ts`
  - BattleLogService クラス（L92-138）
  - Zodバリデーションパターン（L40-80）
  - BlobStorageClient使用パターン（L113）

- **技術スタック**: `docs/tech-stack.md`
  - Azure Functions v4 + TypeScript
  - Biome (linter/formatter)
  - Jest (テストフレームワーク)

- **タスクファイル**: `docs/tasks/shadowverse-battle-log-phase2.md`
  - TASK-0008実装詳細（L523-936）
  - エンドポイント仕様（L536, L629）
  - 実装パターン（L540-654）

---

## 6. 受け入れ基準

### 6.1 一覧取得API

✅ **AC-1**: `GET /api/battle-logs` でデフォルトパラメータ（limit=100, offset=0, sortBy="date", sortOrder="desc"）で取得できる
✅ **AC-2**: クエリパラメータ `limit`, `offset`, `sortBy`, `sortOrder` が正しく処理される
✅ **AC-3**: 各対戦履歴に `myDeckName` と `opponentDeckName` フィールドが追加されている
✅ **AC-4**: デッキIDに対応する名前がない場合、`"不明なデッキ"` が設定される
✅ **AC-5**: `limit` が範囲外（1〜1000以外）の場合、400エラー
✅ **AC-6**: `offset` が負の値の場合、400エラー
✅ **AC-7**: battle-logs.jsonが空配列の場合、空の配列が返る（エラーにならない）

### 6.2 削除API

✅ **AC-8**: `DELETE /api/battle-logs/:id` で指定されたIDの対戦履歴が削除される
✅ **AC-9**: 削除後、Blob Storageに保存される
✅ **AC-10**: 削除成功時、`{ deletedId: string }` が返却される
✅ **AC-11**: 存在しないIDを削除しようとした場合、404エラー
✅ **AC-12**: エラーメッセージ: "対戦履歴が見つかりません: {id}"

### 6.3 品質要件

✅ **AC-13**: すべての単体テストが成功する（8ケース以上）
✅ **AC-14**: Biome lintエラーが0件
✅ **AC-15**: TypeScript型エラーが0件
✅ **AC-16**: テストカバレッジが70%以上

---

## 7. 実装上の注意事項

### 7.1 パフォーマンス最適化

- デッキマスターとマイデッキの取得を `Promise.all` で並列化
- デッキIDのMapを使用した高速検索（O(1)）
- 全件メモリロードは問題なし（MVP段階、データ量が少ない）

### 7.2 既存コードとの一貫性

- バリデーションパターンはTASK-0007と同様（Zodスキーマ）
- エラーハンドリングパターンはTASK-0007と同様（ZodError, BlobStorageエラー）
- レスポンス形式はApiResponseインターフェースに準拠

### 7.3 将来の拡張性

- ソートキー `sortBy` は任意のBattleLogプロパティに対応
- ページネーション機能は既に実装（将来のデータ量増加に対応）
- デッキ名付与はレスポンス時のみ（ストレージ構造は変更しない）

---

## 8. 次のステップ

要件定義が完了しました。次は **テストケースの洗い出し** を行います。

```bash
/tsumiki:tdd-testcases
```

このコマンドで、上記の受け入れ基準に基づいた具体的なテストケースを作成します。

---

**作成日**: 2025-10-30
**信頼性レベル**: 🔵 高（タスクファイル、既存実装、型定義から抽出） / 🟡 中（Edgeケースは一部推測）

# TASK-0009: Deck Master API実装 - TDD要件定義書

**作成日**: 2025-10-31
**タスクID**: TASK-0009
**タスク名**: Deck Master API実装
**タスクタイプ**: TDD
**推定工数**: 8時間
**依存タスク**: TASK-0006 (Blob Storage Client) ✅ 完了済み

---

## 🎯 要件概要

本タスクは、デッキマスター（相手デッキ選択肢）のAPI実装を行います。Blob Storageから`deck-master.json`を取得し、ソート機能とキャッシュ機構を提供するREST APIエンドポイントを実装します。

**信頼性レベル**: 🔵 青信号 (REQ-002、API設計書、TASK-0009より確定)

---

## 📋 機能要件

### REQ-002: デッキ選択肢（抜粋）

**要件文（EARS記法）**:
> システムは以下の8項目を対戦履歴として記録しなければならない
> - 相手デッキID (opponentDeckId)

**詳細**:
- デッキマスターデータは`deck-master.json`に保存されている
- ユーザーが対戦履歴登録時に相手デッキを選択する際の選択肢として使用
- 一覧画面で対戦相手デッキIDを対応するデッキ名で表示する（REQ-106）

**信頼性レベル**: 🔵 青信号（REQ-002、REQ-106より）

### 機能仕様

#### 1. DeckMasterService

**責務**: デッキマスターデータの取得とキャッシュ管理

**メソッド**:
- `getDeckMasters(sortOrder: 'asc' | 'desc' = 'asc'): Promise<DeckMaster[]>`
  - Blob Storageから`deck-master.json`を取得
  - sortOrderに基づいてソート（asc: 昇順、desc: 降順）
  - キャッシュ機構により5分間データを保持
- `clearCache(): void`
  - キャッシュをクリア（テスト用・強制再取得用）

**キャッシュ仕様**:
- TTL: 5分間（300,000ミリ秒）
- キャッシュヒット時: Blob Storage呼び出しをスキップ
- キャッシュミス時: Blob Storageからデータ取得し、キャッシュ更新

**ソート仕様**:
- ソートキー: `sortOrder`フィールド（number型）
- デフォルト: 昇順（asc）
- 昇順（asc）: sortOrderの小さい順
- 降順（desc）: sortOrderの大きい順

**信頼性レベル**: 🔵 青信号（TASK-0009実装詳細より）

#### 2. Azure Functions エンドポイント

**エンドポイント**: `GET /api/deck-master`

**HTTPメソッド**: GET

**認証レベル**: anonymous（Phase 1のため）

**クエリパラメータ**:

| パラメータ | 型 | 必須 | デフォルト | 説明 | 信頼性 |
|---|---|---|---|---|---|
| `sortOrder` | "asc" \| "desc" | No | "asc" | ソート順（asc: 昇順、desc: 降順） | 🔵 API設計書より |

**レスポンス形式（成功）**:

```json
{
  "success": true,
  "data": {
    "deckMaster": [
      {
        "id": "1",
        "className": "ウィッチ",
        "deckName": "土スペルウィッチ",
        "sortOrder": 1
      },
      {
        "id": "2",
        "className": "ロイヤル",
        "deckName": "ミッドレンジロイヤル",
        "sortOrder": 2
      }
    ]
  },
  "meta": {
    "timestamp": "2025-10-31T12:34:56.789Z",
    "requestId": "req_abc123"
  }
}
```

**レスポンス形式（エラー）**:

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "サーバーエラーが発生しました"
  },
  "meta": {
    "timestamp": "2025-10-31T12:34:56.789Z",
    "requestId": "req_abc123"
  }
}
```

**HTTPステータスコード**:
- 200 OK: 成功
- 500 Internal Server Error: サーバーエラー

**信頼性レベル**: 🔵 青信号（API設計書 Lines 468-502より）

---

## ✅ 受け入れ基準 (Acceptance Criteria)

### 1. 機能要件

- [ ] **AC-001**: GET /api/deck-masterエンドポイントが実装されている
- [ ] **AC-002**: Blob Storageから`deck-master.json`を取得できる
- [ ] **AC-003**: sortOrder=ascで`sortOrder`フィールドの昇順にソートされる
- [ ] **AC-004**: sortOrder=descで`sortOrder`フィールドの降順にソートされる
- [ ] **AC-005**: デフォルト（クエリパラメータなし）で昇順ソートされる
- [ ] **AC-006**: キャッシュが5分間（300,000ms）有効である
- [ ] **AC-007**: キャッシュヒット時にBlob Storage呼び出しがスキップされる
- [ ] **AC-008**: `clearCache()`実行後にキャッシュが再取得される

**信頼性レベル**: 🔵 青信号（TASK-0009完了条件より）

### 2. 非機能要件

- [ ] **NFR-001**: レスポンスタイム500ms以内（キャッシュヒット時）
- [ ] **NFR-002**: レスポンスタイム1000ms以内（キャッシュミス時）
- [ ] **NFR-003**: エラー発生時に適切なエラーレスポンスを返す
- [ ] **NFR-004**: TypeScript strict mode準拠（型エラー0件）
- [ ] **NFR-005**: Biome lintエラー0件

**信頼性レベル**: 🔵 青信号（NFR-001、NFR-301、NFR-303より）

### 3. テスト要件

- [ ] **TEST-001**: 単体テストカバレッジ100%
- [ ] **TEST-002**: テストケース5件以上実装
- [ ] **TEST-003**: すべてのテストケースが成功する
- [ ] **TEST-004**: Jest実行時に警告・エラーが0件

**信頼性レベル**: 🔵 青信号（NFR-302、NFR-303、NFR-304より）

---

## 📊 データ構造

### DeckMaster型定義

既存の型定義（`backend/src/types/index.ts` Lines 51-62）:

```typescript
/**
 * デッキマスターエンティティ（相手デッキ）
 */
export interface DeckMaster {
  /** デッキID */
  id: string;
  /** クラス名 */
  className: string;
  /** デッキ名 */
  deckName: string;
  /** ソート順 */
  sortOrder: number;
}
```

**信頼性レベル**: 🔵 青信号（既存実装より）

### deck-master.jsonサンプル

実データ（`data/json/deck-master.json`）:

```json
[
  { "id": "1", "className": "ウィッチ", "deckName": "土スペルウィッチ", "sortOrder": 1 },
  { "id": "2", "className": "ロイヤル", "deckName": "ミッドレンジロイヤル", "sortOrder": 2 },
  { "id": "3", "className": "ナイトメア", "deckName": "ミッドレンジナイトメア", "sortOrder": 3 },
  ...（全19件）
]
```

**信頼性レベル**: 🔵 青信号（既存データより）

### APIレスポンス型定義

```typescript
export interface DeckMasterResponse {
  deckMaster: DeckMaster[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}
```

**信頼性レベル**: 🔵 青信号（API設計書、既存型定義より）

---

## 🔧 技術要件

### 依存関係

- **TASK-0006**: Blob Storage Client実装 ✅ 完了済み
  - `BlobStorageClient.getDeckMasters(): Promise<DeckMaster[]>` メソッド利用可能
  - リトライ機構（3回、指数バックオフ）実装済み
  - エラーハンドリング実装済み

**信頼性レベル**: 🔵 青信号（TASK-0006完了、blobStorageClient.ts実装済み）

### 実装ファイル

#### サービス層
- **ファイル**: `backend/src/services/deckMasterService.ts`
- **クラス**: `DeckMasterService`
- **責務**: キャッシュ管理、ソート処理

#### API層
- **ファイル**: `backend/src/functions/deck-master.ts`
- **関数**: `getDeckMaster`（Azure Functions HTTPトリガー）
- **責務**: HTTPリクエスト処理、レスポンス生成

#### テストファイル
- **ファイル**: `backend/tests/services/deckMasterService.test.ts`
- **フレームワーク**: Jest
- **カバレッジ**: 100%

**信頼性レベル**: 🔵 青信号（TASK-0009実装詳細より）

### 環境変数

| 変数名 | 説明 | 必須 | 信頼性 |
|---|---|---|---|
| `AZURE_STORAGE_CONNECTION_STRING` | Azure Blob Storage接続文字列 | Yes | 🔵 REQ-602より |

**信頼性レベル**: 🔵 青信号（REQ-602、NFR-102より）

---

## 🚦 制約事項

### 技術的制約

- Azure Blob Storageへの接続が必須
- Blob Storageに`deck-master.json`が存在している必要がある
- Azure Functions実行環境（Node.js 20 LTS）
- TypeScript strict mode有効

**信頼性レベル**: 🔵 青信号（REQ-601、REQ-602、NFR-301より）

### ビジネス的制約

- Phase 1では認証なし（anonymous access）
- 単一ユーザー想定（レート制限なし）
- デッキマスターデータは手動メンテナンス

**信頼性レベル**: 🔵 青信号（API設計書Phase 1仕様より）

---

## 🧪 テスト戦略

### 単体テストケース（5件以上）

#### TC-001: デッキマスター一覧取得（正常系）
- **目的**: `getDeckMasters()`が正常に動作する
- **前提**: BlobStorageClientが19件のデッキマスターを返す
- **期待結果**: 19件のデッキマスターが返される

#### TC-002: ソート機能（昇順）
- **目的**: `sortOrder=asc`で昇順ソートされる
- **前提**: 順不同のデッキマスターデータ
- **期待結果**: sortOrderフィールドの昇順にソートされる（1, 2, 3...）

#### TC-003: ソート機能（降順）
- **目的**: `sortOrder=desc`で降順ソートされる
- **前提**: 順不同のデッキマスターデータ
- **期待結果**: sortOrderフィールドの降順にソートされる（19, 18, 17...）

#### TC-004: キャッシュ機構（ヒット）
- **目的**: キャッシュが5分間有効である
- **前提**: 1回目の取得後、5分以内に2回目を実行
- **期待結果**: BlobStorageClientが1回のみ呼ばれる（2回目はキャッシュから取得）

#### TC-005: キャッシュクリア
- **目的**: `clearCache()`でキャッシュが無効化される
- **前提**: 1回目取得後、`clearCache()`実行、2回目取得
- **期待結果**: BlobStorageClientが2回呼ばれる

**信頼性レベル**: 🔵 青信号（TASK-0009テスト要件より）

### エラーケーステスト

#### TC-101: Blob Storage接続エラー
- **目的**: Blob Storageエラー時に適切なエラーをスローする
- **前提**: BlobStorageClientがエラーをスロー
- **期待結果**: エラーがそのまま伝播される

**信頼性レベル**: 🟡 黄信号（一般的なエラーハンドリング要件から）

---

## 📈 パフォーマンス要件

### レスポンスタイム目標

| 状況 | 目標 | 最大許容 | 信頼性 |
|---|---|---|---|
| キャッシュヒット | < 100ms | < 500ms | 🔵 NFR-001より |
| キャッシュミス | < 500ms | < 1000ms | 🔵 API設計書より |

**計測方法**: Jest実行時にレスポンスタイムを計測

**信頼性レベル**: 🔵 青信号（NFR-001、API設計書 Lines 1076-1086より）

---

## 📚 参照資料

### 要件定義書
- **REQ-002**: デッキ選択肢（`docs/spec/shadowverse-battle-log-requirements.md` Lines 32-41）
  - 対戦履歴として相手デッキIDを記録
- **REQ-106**: デッキ名表示（Lines 52）
  - デッキIDを対応するデッキ名で表示

### 設計書
- **API設計書**: `docs/design/shadowverse-battle-log/api-endpoints.md` Lines 468-502
  - GET /api/deck-master エンドポイント仕様
- **タスク定義**: `docs/tasks/shadowverse-battle-log-phase2.md` Lines 955-1192
  - TASK-0009実装詳細、テスト要件、完了条件

### 既存実装
- **型定義**: `backend/src/types/index.ts` Lines 51-62
  - DeckMasterインターフェース
- **Blob Storage Client**: `backend/src/storage/blobStorageClient.ts` Lines 103-106
  - getDeckMasters()メソッド
- **実データ**: `data/json/deck-master.json`
  - デッキマスターデータ（19件）

**信頼性レベル**: 🔵 青信号（すべて確定済み）

---

## 📝 実装手順（TDDサイクル）

### Phase 1: TDD Requirements（本フェーズ）✅
- 要件整理ドキュメント作成
- 受け入れ基準明確化
- テストケース洗い出し

### Phase 2: TDD Test Cases
- `/tsumiki:tdd-testcases` 実行
- テストケース詳細化（5件以上）
- エッジケース特定

### Phase 3: TDD Red
- `/tsumiki:tdd-red` 実行
- 失敗するテストケース作成
- テスト実行（すべて失敗を確認）

### Phase 4: TDD Green
- `/tsumiki:tdd-green` 実行
- テストを通す最小限の実装
- テスト実行（すべて成功を確認）

### Phase 5: TDD Refactor
- `/tsumiki:tdd-refactor` 実行
- コード品質改善
- リファクタリング後もテスト成功を確認

### Phase 6: TDD Verify Complete
- `/tsumiki:tdd-verify-complete` 実行
- 完了条件チェック
- ドキュメント更新

---

## ✅ 完了条件チェックリスト

### 実装完了条件
- [ ] GET /api/deck-master エンドポイントが実装されている
- [ ] Blob Storage からdeck-master.jsonが取得できる
- [ ] ソート処理 (sortOrder) が正しく動作する
- [ ] キャッシュ機構 (5分TTL) が実装されている
- [ ] 単体テストが100%成功する (5ケース以上)
- [ ] Biome lintエラーが0件
- [ ] TypeScript型エラーが0件

### ドキュメント完了条件
- [x] TDD要件定義書作成（本ドキュメント）
- [ ] TDDテストケース仕様書作成
- [ ] 実装完了後のドキュメント更新

---

## 🔄 更新履歴

| 日付 | バージョン | 変更内容 | 担当 |
|---|---|---|---|
| 2025-10-31 | 1.0.0 | 初版作成（TDD Requirements Phase） | Claude Code |

---

**ドキュメント終了**

# TASK-0009: Deck Master API実装 - TDD Red Phase実行結果

**作成日**: 2025-10-31
**タスクID**: TASK-0009
**フェーズ**: Phase 3 - TDD Red Phase
**テストフレームワーク**: Jest 29.7+

---

## 🔴 Red Phase: 失敗するテスト実装

### 概要

TDD（テスト駆動開発）のRed Phaseとして、DeckMasterServiceの機能を検証するテストケースを実装しました。
このフェーズでは、実装が存在しないため、すべてのテストが失敗することが期待されます。

### 実装ファイル

- **テストファイル**: `backend/tests/services/deckMasterService.test.ts`
- **テスト件数**: 6件
- **テストフレームワーク**: Jest 29.7+ with ts-jest
- **テスト対象**: `backend/src/services/deckMasterService.ts` (未実装)

---

## 📋 実装されたテストケース

### 正常系テストケース（5件）

| テストID | テストケース名 | 検証内容 |
|---|---|---|
| TC-001 | デッキマスター一覧が取得できる | 基本的なデータ取得とデフォルト昇順ソート |
| TC-002 | sortOrder=ascでソートされる | 明示的な昇順ソート |
| TC-003 | sortOrder=descでソートされる | 降順ソート |
| TC-004 | キャッシュが5分間有効 | キャッシュヒット時の動作 |
| TC-005 | キャッシュクリア後は再取得される | clearCache()メソッドの動作 |

### 異常系テストケース（1件）

| テストID | テストケース名 | 検証内容 |
|---|---|---|
| TC-101 | Blob Storage接続エラー時にエラーをスローする | エラーハンドリング |

---

## 🧪 テスト実行結果

### 実行コマンド

```bash
cd backend
npm test -- tests/services/deckMasterService.test.ts
```

### 実行結果

```
> shadowverse-battle-log-backend@1.0.0 test
> jest tests/services/deckMasterService.test.ts

FAIL tests/services/deckMasterService.test.ts
  ● Test suite failed to run

    tests/services/deckMasterService.test.ts:11:35 - error TS2307: Cannot find module '../../src/services/deckMasterService' or its corresponding type declarations.

    11 import { DeckMasterService } from '../../src/services/deckMasterService';
                                         ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        4.024 s
```

### エラー内容

- **エラー理由**: DeckMasterServiceクラスが未実装
- **エラーコード**: TS2307
- **エラーメッセージ**: Cannot find module '../../src/services/deckMasterService' or its corresponding type declarations.
- **影響範囲**: テストスイート全体（6テスト）

---

## ✅ Red Phase完了条件の達成確認

### 完了条件チェックリスト

- [x] **テストファイルが作成されている**
  - ファイルパス: `backend/tests/services/deckMasterService.test.ts`
  - 行数: 197行
  - ファイルサイズ: 約8KB

- [x] **6件のテストケースが実装されている**
  - TC-001: デッキマスター一覧取得（正常系）
  - TC-002: ソート機能（昇順）
  - TC-003: ソート機能（降順）
  - TC-004: キャッシュヒット
  - TC-005: キャッシュクリア
  - TC-101: Blob Storage接続エラー（異常系）

- [x] **テストを実行して失敗することを確認**
  - 実行日時: 2025-10-31
  - 実行結果: FAIL (期待通り)
  - エラータイプ: TypeScript Compilation Error

- [x] **エラー内容が期待通り（実装が存在しない）**
  - エラー: Cannot find module
  - 理由: DeckMasterServiceクラスが未実装
  - 状態: 正常（Red Phaseの意図通り）

---

## 🎯 テストケースの詳細設計

### TC-001: デッキマスター一覧取得

**検証項目**:
- 結果が定義されている
- 配列の長さが3である
- BlobStorageClient.getDeckMasters()が1回呼ばれる
- sortOrderが昇順（1, 2, 3）でソートされている

**関連する受け入れ基準**:
- AC-002: Blob Storageから`deck-master.json`を取得できる
- AC-005: デフォルト（クエリパラメータなし）で昇順ソートされる

### TC-002: ソート機能（昇順）

**検証項目**:
- 配列の長さが3である
- sortOrderが昇順（1, 2, 3）である
- IDの順序も正しい（'2', '3', '1'）

**関連する受け入れ基準**:
- AC-003: sortOrder=ascで`sortOrder`フィールドの昇順にソートされる

### TC-003: ソート機能（降順）

**検証項目**:
- 配列の長さが3である
- sortOrderが降順（3, 2, 1）である
- IDの順序も正しい（'1', '3', '2'）

**関連する受け入れ基準**:
- AC-004: sortOrder=descで`sortOrder`フィールドの降順にソートされる

### TC-004: キャッシュヒット

**検証項目**:
- 1回目でBlobStorageClientが呼ばれる
- 2回目でBlobStorageClientが呼ばれない（キャッシュヒット）
- 1回目と2回目で同じ結果が返される

**関連する受け入れ基準**:
- AC-006: キャッシュが5分間（300,000ms）有効である
- AC-007: キャッシュヒット時にBlob Storage呼び出しがスキップされる

### TC-005: キャッシュクリア

**検証項目**:
- 1回目でBlobStorageClientが呼ばれる
- clearCache()実行後、2回目でBlobStorageClientが再度呼ばれる
- 合計2回BlobStorageClientが呼ばれる

**関連する受け入れ基準**:
- AC-008: `clearCache()`実行後にキャッシュが再取得される

### TC-101: Blob Storage接続エラー

**検証項目**:
- getDeckMasters()がエラーをスローする
- エラーメッセージが'Blob Storage connection failed'である
- BlobStorageClientが1回呼ばれる

**関連する受け入れ基準**:
- NFR-003: エラー発生時に適切なエラーレスポンスを返す

---

## 🔧 テスト実装の詳細

### モック設計

**BlobStorageClientモック**:
```typescript
mockBlobClient = {
  getDeckMasters: jest.fn(),
} as unknown as jest.Mocked<BlobStorageClient>;
```

**モックデータ**:
```typescript
const mockDeckMasters: DeckMaster[] = [
  { id: '1', className: 'ウィッチ', deckName: '土スペルウィッチ', sortOrder: 3 },
  { id: '2', className: 'ロイヤル', deckName: 'ミッドレンジロイヤル', sortOrder: 1 },
  { id: '3', className: 'ネクロマンサー', deckName: '進化ネクロ', sortOrder: 2 },
];
```

### テストライフサイクル

**beforeEach**:
- jest.clearAllMocks()でモックをリセット
- BlobStorageClientのモックインスタンス作成
- DeckMasterServiceインスタンス作成

**afterEach**:
- jest.restoreAllMocks()でモックをクリーンアップ

---

## 🎯 次フェーズ: Green Phase

### 実装予定の内容

Green Phaseでは、以下の実装を行い、すべてのテストが成功するようにします:

1. **DeckMasterServiceクラス**
   - ファイルパス: `backend/src/services/deckMasterService.ts`
   - コンストラクタ: BlobStorageClientを依存注入

2. **getDeckMasters(sortOrder?: 'asc' | 'desc')メソッド**
   - BlobStorageClientからデッキマスターを取得
   - キャッシュチェック（5分以内ならキャッシュを返す）
   - sortDeckMastersでソート
   - 結果をキャッシュに保存

3. **キャッシュ機構**
   - プライベートプロパティ: `private cache`
   - プライベートプロパティ: `private cacheTimestamp`
   - キャッシュ有効期限: 5分（300,000ms）

4. **sortDeckMasters(data, sortOrder)プライベートメソッド**
   - sortOrderフィールドで昇順/降順にソート

5. **clearCache()メソッド**
   - キャッシュとタイムスタンプをクリア

### 期待されるテスト結果

```
PASS tests/services/deckMasterService.test.ts
  DeckMasterService
    getDeckMasters
      ✓ デッキマスター一覧が取得できる (XX ms)
      ✓ sortOrder=ascでソートされる (XX ms)
      ✓ sortOrder=descでソートされる (XX ms)
      ✓ キャッシュが5分間有効 (XX ms)
      ✓ キャッシュクリア後は再取得される (XX ms)
      ✓ Blob Storage接続エラー時にエラーをスローする (XX ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        X.XXX s
```

---

## 📊 カバレッジ目標

### コードカバレッジ目標

| カバレッジ種別 | 目標 | 最小許容 |
|---|---|---|
| ステートメントカバレッジ | 100% | 100% |
| ブランチカバレッジ | 100% | 100% |
| 関数カバレッジ | 100% | 100% |
| ラインカバレッジ | 100% | 100% |

---

## 📝 備考

### テスト設計の特徴

1. **既存コードとの一貫性**
   - battleLogService.test.tsの構造を踏襲
   - コメントスタイルを統一（【目的】【期待される動作】）
   - 信頼性レベル（🔵青信号、🟡黄信号）の明示

2. **モックの完全な分離**
   - 外部依存（BlobStorageClient）を完全にモック化
   - テストの独立性を確保

3. **詳細なアサーション**
   - 各テストケースで複数の期待値を検証
   - エッジケースも含めた包括的なカバレッジ

---

## ✅ Red Phase完了

すべての完了条件を達成し、Red Phaseが正常に完了しました。

**次のステップ**:
- Phase 4 (TDD Green): DeckMasterServiceの実装
- Phase 5 (TDD Refactor): コード品質の改善

---

**ドキュメント終了**

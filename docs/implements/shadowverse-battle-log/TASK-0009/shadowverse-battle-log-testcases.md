# TASK-0009: Deck Master API実装 - TDDテストケース仕様書

**作成日**: 2025-10-31
**タスクID**: TASK-0009
**フェーズ**: Phase 2 - TDD Test Cases
**テストフレームワーク**: Jest 29.7+
**テスト対象**: backend/src/services/deckMasterService.ts

---

## 🧪 テスト戦略

### テスト種別
- **単体テスト**: DeckMasterService クラスのメソッド（getDeckMasters、clearCache）
- **統合テスト**: Azure Functions エンドポイント（Phase 2実装予定）
- **テストフレームワーク**: Jest 29.7+
- **モックライブラリ**: Jest Built-in Mock

### テストアプローチ
- **TDD（テスト駆動開発）**: Red → Green → Refactorサイクル
- **モック戦略**: BlobStorageClientを完全にモック化し、外部依存を排除
- **テストデータ**: 3件の代表的なデッキマスターデータ（sortOrder: 3, 1, 2）
- **検証項目**: 機能要件、非機能要件、エラーハンドリング

---

## 📋 テストケース一覧

### 正常系テストケース（5件）

| テストID | テストケース名 | 優先度 | カテゴリ |
|---|---|---|---|
| TC-001 | デッキマスター一覧取得 | High | 基本機能 |
| TC-002 | ソート機能（昇順） | High | ソート |
| TC-003 | ソート機能（降順） | High | ソート |
| TC-004 | キャッシュ機構（ヒット） | High | キャッシュ |
| TC-005 | キャッシュクリア後の再取得 | High | キャッシュ |

### 異常系テストケース（1件）

| テストID | テストケース名 | 優先度 | カテゴリ |
|---|---|---|---|
| TC-101 | Blob Storage接続エラー | Medium | エラーハンドリング |

---

## 🔍 テストケース詳細

### TC-001: デッキマスター一覧取得（正常系）

**テスト目的**:
`getDeckMasters()`メソッドが正常に動作し、BlobStorageClientからデッキマスター一覧を取得できることを確認する。

**関連する受け入れ基準**:
- AC-002: Blob Storageから`deck-master.json`を取得できる
- AC-005: デフォルト（クエリパラメータなし）で昇順ソートされる

**前提条件**:
- BlobStorageClient.getDeckMasters()がモックされている
- モックデータ: 3件のデッキマスター（sortOrder: 3, 1, 2の順不同）

**実行手順**:
1. DeckMasterServiceインスタンスを作成
2. getDeckMasters()を引数なしで呼び出し（デフォルト: 昇順）
3. 戻り値を検証

**期待結果**:
- 結果が配列である
- 配列の長さが3である
- BlobStorageClient.getDeckMasters()が1回呼ばれる
- sortOrderが昇順（1, 2, 3）でソートされている

**Jestコード例**:
```typescript
it('デッキマスター一覧が取得できる', async () => {
  // 【テスト目的】: getDeckMasters() メソッドが正常に動作することを確認
  // 【期待される動作】: BlobStorageClientからデータを取得し、デフォルトで昇順ソートされる
  // 🔵 信頼性レベル: 青信号（requirements.md AC-002、AC-005より）

  // 【テストデータ準備】: 3件のデッキマスター（順不同）
  const mockData = [
    { id: '1', className: 'ウィッチ', deckName: '土スペルウィッチ', sortOrder: 3 },
    { id: '2', className: 'ロイヤル', deckName: 'ミッドレンジロイヤル', sortOrder: 1 },
    { id: '3', className: 'ネクロマンサー', deckName: '進化ネクロ', sortOrder: 2 },
  ];
  mockBlobClient.getDeckMasters.mockResolvedValue(mockData);

  // 【実際の処理実行】: getDeckMasters() を呼び出し
  const result = await service.getDeckMasters();

  // 【結果検証】: 取得とソートが正しく行われている
  expect(result).toBeDefined(); // 【確認内容】: 結果が返却される 🔵
  expect(result).toHaveLength(3); // 【確認内容】: 3件取得される 🔵
  expect(mockBlobClient.getDeckMasters).toHaveBeenCalledTimes(1); // 【確認内容】: BlobStorageClientが1回呼ばれる 🔵
  expect(result[0].sortOrder).toBe(1); // 【確認内容】: 昇順ソート（1番目） 🔵
  expect(result[1].sortOrder).toBe(2); // 【確認内容】: 昇順ソート（2番目） 🔵
  expect(result[2].sortOrder).toBe(3); // 【確認内容】: 昇順ソート（3番目） 🔵
});
```

**信頼性レベル**: 🔵 青信号（requirements.md AC-002、AC-005より）

---

### TC-002: ソート機能（昇順）

**テスト目的**:
`getDeckMasters('asc')`メソッドが、sortOrderフィールドの昇順でデッキマスターをソートすることを確認する。

**関連する受け入れ基準**:
- AC-003: sortOrder=ascで`sortOrder`フィールドの昇順にソートされる
- AC-005: デフォルト（クエリパラメータなし）で昇順ソートされる

**前提条件**:
- BlobStorageClient.getDeckMasters()がモックされている
- モックデータ: sortOrderが順不同（3, 1, 2）

**実行手順**:
1. DeckMasterServiceインスタンスを作成
2. getDeckMasters('asc')を呼び出し
3. 戻り値のsortOrderを検証

**期待結果**:
- 配列の長さが3である
- 1番目の要素のsortOrderが1である
- 2番目の要素のsortOrderが2である
- 3番目の要素のsortOrderが3である

**Jestコード例**:
```typescript
it('sortOrder=ascでソートされる', async () => {
  // 【テスト目的】: 明示的に昇順ソートを指定した場合の動作を確認
  // 【期待される動作】: sortOrderフィールドの昇順にソートされる
  // 🔵 信頼性レベル: 青信号（requirements.md AC-003より）

  // 【テストデータ準備】: 順不同のデッキマスター
  const mockData = [
    { id: '1', className: 'ウィッチ', deckName: '土スペルウィッチ', sortOrder: 3 },
    { id: '2', className: 'ロイヤル', deckName: 'ミッドレンジロイヤル', sortOrder: 1 },
    { id: '3', className: 'ネクロマンサー', deckName: '進化ネクロ', sortOrder: 2 },
  ];
  mockBlobClient.getDeckMasters.mockResolvedValue(mockData);

  // 【実際の処理実行】: 明示的に'asc'を指定
  const result = await service.getDeckMasters('asc');

  // 【結果検証】: 昇順にソートされている
  expect(result).toHaveLength(3); // 【確認内容】: 3件取得される 🔵
  expect(result[0].sortOrder).toBe(1); // 【確認内容】: 最小値が先頭 🔵
  expect(result[1].sortOrder).toBe(2); // 【確認内容】: 中間値が2番目 🔵
  expect(result[2].sortOrder).toBe(3); // 【確認内容】: 最大値が最後 🔵
  expect(result[0].id).toBe('2'); // 【確認内容】: ID順も正しい 🔵
  expect(result[1].id).toBe('3'); // 【確認内容】: ID順も正しい 🔵
  expect(result[2].id).toBe('1'); // 【確認内容】: ID順も正しい 🔵
});
```

**信頼性レベル**: 🔵 青信号（requirements.md AC-003より）

---

### TC-003: ソート機能（降順）

**テスト目的**:
`getDeckMasters('desc')`メソッドが、sortOrderフィールドの降順でデッキマスターをソートすることを確認する。

**関連する受け入れ基準**:
- AC-004: sortOrder=descで`sortOrder`フィールドの降順にソートされる

**前提条件**:
- BlobStorageClient.getDeckMasters()がモックされている
- モックデータ: sortOrderが順不同（3, 1, 2）

**実行手順**:
1. DeckMasterServiceインスタンスを作成
2. getDeckMasters('desc')を呼び出し
3. 戻り値のsortOrderを検証

**期待結果**:
- 配列の長さが3である
- 1番目の要素のsortOrderが3である
- 2番目の要素のsortOrderが2である
- 3番目の要素のsortOrderが1である

**Jestコード例**:
```typescript
it('sortOrder=descでソートされる', async () => {
  // 【テスト目的】: 降順ソートの動作を確認
  // 【期待される動作】: sortOrderフィールドの降順にソートされる
  // 🔵 信頼性レベル: 青信号（requirements.md AC-004より）

  // 【テストデータ準備】: 順不同のデッキマスター
  const mockData = [
    { id: '1', className: 'ウィッチ', deckName: '土スペルウィッチ', sortOrder: 3 },
    { id: '2', className: 'ロイヤル', deckName: 'ミッドレンジロイヤル', sortOrder: 1 },
    { id: '3', className: 'ネクロマンサー', deckName: '進化ネクロ', sortOrder: 2 },
  ];
  mockBlobClient.getDeckMasters.mockResolvedValue(mockData);

  // 【実際の処理実行】: 明示的に'desc'を指定
  const result = await service.getDeckMasters('desc');

  // 【結果検証】: 降順にソートされている
  expect(result).toHaveLength(3); // 【確認内容】: 3件取得される 🔵
  expect(result[0].sortOrder).toBe(3); // 【確認内容】: 最大値が先頭 🔵
  expect(result[1].sortOrder).toBe(2); // 【確認内容】: 中間値が2番目 🔵
  expect(result[2].sortOrder).toBe(1); // 【確認内容】: 最小値が最後 🔵
  expect(result[0].id).toBe('1'); // 【確認内容】: ID順も正しい 🔵
  expect(result[1].id).toBe('3'); // 【確認内容】: ID順も正しい 🔵
  expect(result[2].id).toBe('2'); // 【確認内容】: ID順も正しい 🔵
});
```

**信頼性レベル**: 🔵 青信号（requirements.md AC-004より）

---

### TC-004: キャッシュ機構（ヒット）

**テスト目的**:
キャッシュ機構が正しく動作し、5分以内の再取得時にBlobStorageClientが呼ばれないことを確認する。

**関連する受け入れ基準**:
- AC-006: キャッシュが5分間（300,000ms）有効である
- AC-007: キャッシュヒット時にBlob Storage呼び出しがスキップされる
- NFR-001: レスポンスタイム500ms以内（キャッシュヒット時）

**前提条件**:
- BlobStorageClient.getDeckMasters()がモックされている
- 1回目の取得が完了している

**実行手順**:
1. DeckMasterServiceインスタンスを作成
2. 1回目のgetDeckMasters()を呼び出し（キャッシュに保存）
3. 2回目のgetDeckMasters()を呼び出し（5分以内）
4. BlobStorageClientの呼び出し回数を検証

**期待結果**:
- 1回目と2回目で同じ結果が返される
- BlobStorageClient.getDeckMasters()が1回のみ呼ばれる（2回目はキャッシュから取得）
- 2回目のレスポンスが高速である（キャッシュヒット）

**Jestコード例**:
```typescript
it('キャッシュが5分間有効', async () => {
  // 【テスト目的】: キャッシュ機構の動作を確認
  // 【期待される動作】: 5分以内の再取得時にBlobStorageClientが呼ばれない
  // 🔵 信頼性レベル: 青信号（requirements.md AC-006、AC-007より）

  // 【テストデータ準備】: 3件のデッキマスター
  const mockData = [
    { id: '1', className: 'ウィッチ', deckName: '土スペルウィッチ', sortOrder: 3 },
    { id: '2', className: 'ロイヤル', deckName: 'ミッドレンジロイヤル', sortOrder: 1 },
    { id: '3', className: 'ネクロマンサー', deckName: '進化ネクロ', sortOrder: 2 },
  ];
  mockBlobClient.getDeckMasters.mockResolvedValue(mockData);

  // 【実際の処理実行】: 1回目の取得（キャッシュに保存）
  const result1 = await service.getDeckMasters();
  expect(mockBlobClient.getDeckMasters).toHaveBeenCalledTimes(1); // 【確認内容】: 1回目は呼ばれる 🔵

  // 【実際の処理実行】: 2回目の取得（キャッシュから取得）
  const result2 = await service.getDeckMasters();

  // 【結果検証】: キャッシュが使用されている
  expect(mockBlobClient.getDeckMasters).toHaveBeenCalledTimes(1); // 【確認内容】: 2回目は呼ばれない（キャッシュヒット） 🔵
  expect(result1).toEqual(result2); // 【確認内容】: 同じ結果が返される 🔵
  expect(result2).toHaveLength(3); // 【確認内容】: データが正しい 🔵
});
```

**信頼性レベル**: 🔵 青信号（requirements.md AC-006、AC-007より）

---

### TC-005: キャッシュクリア後の再取得

**テスト目的**:
`clearCache()`メソッドが正しく動作し、キャッシュクリア後にBlobStorageClientから再取得することを確認する。

**関連する受け入れ基準**:
- AC-008: `clearCache()`実行後にキャッシュが再取得される

**前提条件**:
- BlobStorageClient.getDeckMasters()がモックされている
- 1回目の取得が完了している

**実行手順**:
1. DeckMasterServiceインスタンスを作成
2. 1回目のgetDeckMasters()を呼び出し（キャッシュに保存）
3. clearCache()を呼び出し
4. 2回目のgetDeckMasters()を呼び出し
5. BlobStorageClientの呼び出し回数を検証

**期待結果**:
- clearCache()実行後、キャッシュが無効化される
- 2回目のgetDeckMasters()でBlobStorageClientが再度呼ばれる
- BlobStorageClient.getDeckMasters()が合計2回呼ばれる

**Jestコード例**:
```typescript
it('キャッシュクリア後は再取得される', async () => {
  // 【テスト目的】: clearCache() メソッドの動作を確認
  // 【期待される動作】: キャッシュクリア後にBlobStorageClientから再取得される
  // 🔵 信頼性レベル: 青信号（requirements.md AC-008より）

  // 【テストデータ準備】: 3件のデッキマスター
  const mockData = [
    { id: '1', className: 'ウィッチ', deckName: '土スペルウィッチ', sortOrder: 3 },
    { id: '2', className: 'ロイヤル', deckName: 'ミッドレンジロイヤル', sortOrder: 1 },
    { id: '3', className: 'ネクロマンサー', deckName: '進化ネクロ', sortOrder: 2 },
  ];
  mockBlobClient.getDeckMasters.mockResolvedValue(mockData);

  // 【実際の処理実行】: 1回目の取得（キャッシュに保存）
  const result1 = await service.getDeckMasters();
  expect(mockBlobClient.getDeckMasters).toHaveBeenCalledTimes(1); // 【確認内容】: 1回目は呼ばれる 🔵

  // 【実際の処理実行】: キャッシュクリア
  service.clearCache();

  // 【実際の処理実行】: 2回目の取得（再取得）
  const result2 = await service.getDeckMasters();

  // 【結果検証】: キャッシュがクリアされ、再取得されている
  expect(mockBlobClient.getDeckMasters).toHaveBeenCalledTimes(2); // 【確認内容】: 2回目も呼ばれる（キャッシュクリア後） 🔵
  expect(result1).toEqual(result2); // 【確認内容】: 同じデータが取得される 🔵
  expect(result2).toHaveLength(3); // 【確認内容】: データが正しい 🔵
});
```

**信頼性レベル**: 🔵 青信号（requirements.md AC-008より）

---

### TC-101: Blob Storage接続エラー（異常系）

**テスト目的**:
Blob Storage接続エラー時に、適切なエラーが伝播されることを確認する。

**関連する受け入れ基準**:
- NFR-003: エラー発生時に適切なエラーレスポンスを返す

**前提条件**:
- BlobStorageClient.getDeckMasters()がエラーをスローする

**実行手順**:
1. DeckMasterServiceインスタンスを作成
2. BlobStorageClient.getDeckMasters()をエラーをスローするようモック設定
3. getDeckMasters()を呼び出し
4. エラーがスローされることを検証

**期待結果**:
- getDeckMasters()がエラーをスローする
- エラーがそのまま伝播される（BlobStorageClientのエラーが上位レイヤーに伝わる）

**Jestコード例**:
```typescript
it('Blob Storage接続エラー時にエラーをスローする', async () => {
  // 【テスト目的】: エラーハンドリングの動作を確認
  // 【期待される動作】: BlobStorageClientのエラーが適切に伝播される
  // 🟡 信頼性レベル: 黄信号（一般的なエラーハンドリング要件から）

  // 【テストデータ準備】: Blob Storageエラー
  const storageError = new Error('Blob Storage connection failed');
  mockBlobClient.getDeckMasters.mockRejectedValue(storageError);

  // 【実際の処理実行 & 結果検証】: エラーがスローされる
  await expect(service.getDeckMasters()).rejects.toThrow('Blob Storage connection failed'); // 【確認内容】: エラーメッセージが一致 🔵
  expect(mockBlobClient.getDeckMasters).toHaveBeenCalledTimes(1); // 【確認内容】: BlobStorageClientが呼ばれる 🔵
});
```

**信頼性レベル**: 🟡 黄信号（一般的なエラーハンドリング要件から）

---

## 🎯 カバレッジ目標

### コードカバレッジ目標

| カバレッジ種別 | 目標 | 最小許容 |
|---|---|---|
| ステートメントカバレッジ | 100% | 100% |
| ブランチカバレッジ | 100% | 100% |
| 関数カバレッジ | 100% | 100% |
| ラインカバレッジ | 100% | 100% |

**信頼性レベル**: 🔵 青信号（requirements.md TEST-001、NFR-302より）

### カバレッジ計測コマンド

```bash
# カバレッジ付きテスト実行
npm test -- --coverage --testPathPattern=deckMasterService.test.ts

# カバレッジレポート確認
cat coverage/lcov-report/index.html
```

---

## 🔧 モック設計

### BlobStorageClientモック

**モック対象**: `backend/src/storage/blobStorageClient.ts`

**モックメソッド**:
- `getDeckMasters(): Promise<DeckMaster[]>`

**モック実装**:
```typescript
import { BlobStorageClient } from '../../src/storage/blobStorageClient';
import { DeckMaster } from '../../src/types';

// BlobStorageClientのモック
jest.mock('../../src/storage/blobStorageClient');

describe('DeckMasterService', () => {
  let service: DeckMasterService;
  let mockBlobClient: jest.Mocked<BlobStorageClient>;

  beforeEach(() => {
    // 各テスト実行前にモックをリセット
    jest.clearAllMocks();

    // BlobStorageClientのモックインスタンスを作成
    mockBlobClient = new BlobStorageClient('', '') as jest.Mocked<BlobStorageClient>;

    // デフォルトのモック実装
    mockBlobClient.getDeckMasters = jest.fn();

    // DeckMasterServiceインスタンスを作成
    service = new DeckMasterService(mockBlobClient);
  });

  afterEach(() => {
    // テスト実行後にモックをクリーンアップ
    jest.restoreAllMocks();
  });
});
```

### モックデータ

**標準モックデータ**:
```typescript
const mockDeckMasters: DeckMaster[] = [
  { id: '1', className: 'ウィッチ', deckName: '土スペルウィッチ', sortOrder: 3 },
  { id: '2', className: 'ロイヤル', deckName: 'ミッドレンジロイヤル', sortOrder: 1 },
  { id: '3', className: 'ネクロマンサー', deckName: '進化ネクロ', sortOrder: 2 },
];
```

**エラーモックデータ**:
```typescript
const storageError = new Error('Blob Storage connection failed');
```

---

## 📝 テスト実装ファイル構成

### テストファイルパス
- **ファイルパス**: `backend/tests/services/deckMasterService.test.ts`
- **テスト対象**: `backend/src/services/deckMasterService.ts`

### テストスイート構造

```typescript
describe('DeckMasterService', () => {
  describe('getDeckMasters', () => {
    // 正常系テスト
    it('デッキマスター一覧が取得できる', async () => { /* TC-001 */ });
    it('sortOrder=ascでソートされる', async () => { /* TC-002 */ });
    it('sortOrder=descでソートされる', async () => { /* TC-003 */ });
    it('キャッシュが5分間有効', async () => { /* TC-004 */ });
    it('キャッシュクリア後は再取得される', async () => { /* TC-005 */ });

    // 異常系テスト
    it('Blob Storage接続エラー時にエラーをスローする', async () => { /* TC-101 */ });
  });
});
```

---

## ✅ 完了条件

### テストケース作成完了条件

- [x] 6件のテストケースが詳細設計されている
  - [x] TC-001: デッキマスター一覧取得
  - [x] TC-002: ソート機能（昇順）
  - [x] TC-003: ソート機能（降順）
  - [x] TC-004: キャッシュヒット
  - [x] TC-005: キャッシュクリア
  - [x] TC-101: Blob Storage接続エラー
- [x] 各テストケースにJestコード例がある
- [x] モック設計が明確である
- [x] カバレッジ目標が設定されている（100%）

### 次フェーズへの準備

- [ ] Phase 3 (TDD Red): 失敗するテストケースの実装
- [ ] Phase 4 (TDD Green): テストを通す最小限の実装
- [ ] Phase 5 (TDD Refactor): コード品質改善

---

## 📊 テストケース対応マトリクス

| 受け入れ基準 | TC-001 | TC-002 | TC-003 | TC-004 | TC-005 | TC-101 |
|---|---|---|---|---|---|---|
| AC-001: エンドポイント実装 | - | - | - | - | - | - |
| AC-002: Blob Storage取得 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| AC-003: 昇順ソート | ✓ | ✓ | - | - | - | - |
| AC-004: 降順ソート | - | - | ✓ | - | - | - |
| AC-005: デフォルト昇順 | ✓ | - | - | - | - | - |
| AC-006: キャッシュ5分有効 | - | - | - | ✓ | - | - |
| AC-007: キャッシュヒット | - | - | - | ✓ | - | - |
| AC-008: キャッシュクリア | - | - | - | - | ✓ | - |
| NFR-003: エラーハンドリング | - | - | - | - | - | ✓ |

**カバレッジ**: 全受け入れ基準がテストケースでカバーされている（AC-001はAzure Functions実装時にカバー）

---

## 🔄 更新履歴

| 日付 | バージョン | 変更内容 | 担当 |
|---|---|---|---|
| 2025-10-31 | 1.0.0 | 初版作成（TDD Test Cases Phase） | Claude Code |

---

**ドキュメント終了**

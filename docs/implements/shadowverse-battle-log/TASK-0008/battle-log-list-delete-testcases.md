# TASK-0008: Battle Log CRUD API - 一覧取得・削除機能 - テストケース定義書

## メタ情報

- **タスクID**: TASK-0008
- **機能名**: Battle Log一覧取得・削除API
- **テストフレームワーク**: Jest 29.7.0 + ts-jest
- **プログラミング言語**: TypeScript 5.7+
- **作成日**: 2025-10-30
- **要件定義書**: `battle-log-list-delete-requirements.md`

---

## テスト環境・フレームワーク

### 🔵 プログラミング言語: TypeScript 5.7+

- **言語選択の理由**:
  - プロジェクトの技術スタックとして採用（tech-stack.md）
  - 型安全性により、バグの早期発見が可能
  - 既存実装（TASK-0007）との一貫性

- **テストに適した機能**:
  - strictモードによる厳密な型チェック
  - `as const`によるリテラル型の保証
  - モック用の型定義（jest.Mocked<T>）

### 🔵 テストフレームワーク: Jest 29.7.0 + ts-jest

- **フレームワーク選択の理由**:
  - プロジェクトで既に採用済み（jest.config.js）
  - TypeScriptとの統合が容易（ts-jest）
  - BlobStorageClientのモック機能が強力
  - 既存テストパターン（TASK-0007）の踏襲

- **テスト実行環境**:
  - Node.js 22.x LTS
  - `testEnvironment: 'node'`（jest.config.js）
  - カバレッジ閾値: 関数100%, 行90%以上

---

## テストケース一覧

### 1. 一覧取得API (`getBattleLogs`) - 正常系テストケース

#### 🔵 TC-001: デフォルトパラメータでの一覧取得

- **テスト名**: デフォルトパラメータで対戦履歴一覧が正しく取得される
  - **何をテストするか**: パラメータを省略した場合、デフォルト値（limit=100, offset=0, sortBy="date", sortOrder="desc"）が適用され、正しく一覧が取得される
  - **期待される動作**: 最新の対戦履歴が日付降順で取得され、ページネーション情報が含まれる

- **入力値**:
  ```typescript
  params: {} // パラメータなし
  ```
  - **入力データの意味**: 初回アクセス時やフィルタなしでの全件表示を想定
  - **デフォルト値の適用**: limit=100, offset=0, sortBy="date", sortOrder="desc"

- **期待される結果**:
  ```typescript
  {
    battleLogs: BattleLog[], // 日付降順でソート済み
    total: number,           // 総件数
    limit: 100,              // デフォルトlimit
    offset: 0                // デフォルトoffset
  }
  ```
  - **期待結果の理由**: REQ-101（一覧表示）、REQ-103（デフォルトソート降順）に準拠

- **テストの目的**: デフォルトパラメータの動作確認
  - **確認ポイント**: limit, offset, sortBy, sortOrderのデフォルト値が正しく適用される

- 🔵 **信頼性レベル**: 青信号（requirements.md L206-215, phase2.md L544-586より）

---

#### 🔵 TC-002: limit と offset を指定したページネーション

- **テスト名**: limitとoffsetを指定して、正しくページネーションが動作する
  - **何をテストするか**: limit=20, offset=10を指定した場合、11〜30件目のデータが取得される
  - **期待される動作**: 指定された範囲のデータのみが返却され、total, limit, offset情報が正しく含まれる

- **入力値**:
  ```typescript
  params: {
    limit: 20,
    offset: 10
  }
  ```
  - **入力データの意味**: 2ページ目（11〜30件目）を表示する実用的なシナリオ
  - **実際の使用場面**: ユーザーが「次のページ」ボタンをクリックした場合

- **期待される結果**:
  ```typescript
  {
    battleLogs: BattleLog[], // 11〜30件目のデータ（最大20件）
    total: 全件数,           // 例: 50
    limit: 20,
    offset: 10
  }
  ```
  - **期待結果の理由**: REQ-101（一覧表示）、ページネーション機能の基本動作

- **テストの目的**: ページネーション機能の正確性確認
  - **確認ポイント**:
    - slice(offset, offset + limit) が正しく動作
    - totalが全件数と一致
    - 返却されるbattleLogsの件数がlimit以下

- 🔵 **信頼性レベル**: 青信号（requirements.md L217-224, phase2.md L576-578より）

---

#### 🔵 TC-003: sortOrder を "asc" に指定した昇順ソート

- **テスト名**: sortOrder="asc"を指定して、古い順（昇順）にソートされる
  - **何をテストするか**: 日付の古い順に対戦履歴が並び替えられる
  - **期待される動作**: 最も古い対戦履歴が配列の先頭に来る

- **入力値**:
  ```typescript
  params: {
    sortOrder: 'asc'
  }
  ```
  - **入力データの意味**: 時系列で最初から対戦履歴を確認したい場合
  - **実際の使用場面**: 「古い順」ボタンをクリックした場合

- **期待される結果**:
  ```typescript
  {
    battleLogs: [
      { id: 'log_20250101_001', date: '2025/01/01', ... }, // 最古
      { id: 'log_20250102_001', date: '2025/01/02', ... },
      ...
    ],
    total: number,
    limit: 100,
    offset: 0
  }
  ```
  - **期待結果の理由**: REQ-103（ソート機能）、昇順指定の動作確認

- **テストの目的**: ソート順の切り替え機能確認
  - **確認ポイント**:
    - battleLogs[0].date ≤ battleLogs[1].date ≤ ... が成立
    - sortOrderが正しく適用される

- 🔵 **信頼性レベル**: 青信号（requirements.md L226-232, phase2.md L565-574より）

---

#### 🔵 TC-004: 空配列の場合（battle-logs.jsonが空）

- **テスト名**: battle-logs.jsonが空配列の場合、空の結果が返る（エラーにならない）
  - **何をテストするか**: 対戦履歴が1件もない状態での一覧取得が正常に処理される
  - **期待される動作**: エラーを発生させず、空の配列とtotal=0を返却

- **入力値**:
  ```typescript
  params: {} // デフォルトパラメータ
  mockBlobClient.getBattleLogs.mockResolvedValue([]) // 空配列
  ```
  - **入力データの意味**: 初回利用時や、全削除後の状態
  - **実際の使用場面**: 新規ユーザーが初めてアプリを開いた時

- **期待される結果**:
  ```typescript
  {
    battleLogs: [], // 空配列
    total: 0,
    limit: 100,
    offset: 0
  }
  ```
  - **期待結果の理由**: EDGE-204（空配列ケース）、堅牢性の確保

- **テストの目的**: エッジケースでのエラーハンドリング確認
  - **確認ポイント**:
    - 例外が発生しない
    - total=0が正しく返る
    - battleLogsが空配列

- 🟡 **信頼性レベル**: 黄信号（requirements.md L272-279より推測）

---

### 2. デッキ名付与機能 (`getBattleLogsWithDeckNames`) - 正常系テストケース

#### 🔵 TC-005: デッキ名が正しく付与される

- **テスト名**: マイデッキとデッキマスターの名前が正しくjoinされる
  - **何をテストするか**: 対戦履歴のmyDeckId, opponentDeckIdに対応するデッキ名が追加される
  - **期待される動作**: `myDeckName`, `opponentDeckName` フィールドが追加され、正しい名前が設定される

- **入力値**:
  ```typescript
  mockBlobClient.getBattleLogs.mockResolvedValue([
    {
      id: 'log_20250124_001',
      myDeckId: 'deck_001',
      opponentDeckId: 'deck_master_002',
      ...
    }
  ]);
  mockBlobClient.getMyDecks.mockResolvedValue([
    { id: 'deck_001', deckName: '秘術オデンスペル', ... }
  ]);
  mockBlobClient.getDeckMasters.mockResolvedValue([
    { id: 'deck_master_002', deckName: 'ミッドレンジロイヤル', ... }
  ]);
  ```
  - **入力データの意味**: 実際の対戦履歴とデッキマスター情報を模倣
  - **実際の使用場面**: 対戦履歴画面でデッキ名を表示する時

- **期待される結果**:
  ```typescript
  {
    battleLogs: [
      {
        id: 'log_20250124_001',
        myDeckId: 'deck_001',
        myDeckName: '秘術オデンスペル',      // ← 新規追加
        opponentDeckId: 'deck_master_002',
        opponentDeckName: 'ミッドレンジロイヤル', // ← 新規追加
        ...
      }
    ],
    total: 1,
    limit: 100,
    offset: 0
  }
  ```
  - **期待結果の理由**: REQ-106（デッキ名表示）、ユーザビリティ向上

- **テストの目的**: デッキ名join処理の正確性確認
  - **確認ポイント**:
    - Mapによる高速検索が正しく動作
    - `Promise.all`で並列取得が実行される
    - デッキ名が正しくマッピングされる

- 🔵 **信頼性レベル**: 青信号（requirements.md L589-625, phase2.md L603-625より）

---

#### 🟡 TC-006: デッキIDに対応する名前がない場合

- **テスト名**: デッキIDがマスターに存在しない場合、"不明なデッキ"が設定される
  - **何をテストするか**: 存在しないデッキIDの場合、デフォルト値が設定される
  - **期待される動作**: エラーを発生させず、"不明なデッキ"という文字列を設定

- **入力値**:
  ```typescript
  mockBlobClient.getBattleLogs.mockResolvedValue([
    {
      id: 'log_20250124_001',
      myDeckId: 'nonexistent_deck', // 存在しないID
      opponentDeckId: 'nonexistent_master', // 存在しないID
      ...
    }
  ]);
  mockBlobClient.getMyDecks.mockResolvedValue([]); // 空
  mockBlobClient.getDeckMasters.mockResolvedValue([]); // 空
  ```
  - **入力データの意味**: デッキマスターが削除された、または未登録デッキとの対戦
  - **実際の使用場面**: データ不整合やマイグレーション時

- **期待される結果**:
  ```typescript
  {
    battleLogs: [
      {
        id: 'log_20250124_001',
        myDeckId: 'nonexistent_deck',
        myDeckName: '不明なデッキ',        // ← デフォルト値
        opponentDeckId: 'nonexistent_master',
        opponentDeckName: '不明なデッキ',   // ← デフォルト値
        ...
      }
    ]
  }
  ```
  - **期待結果の理由**: EDGE-205（デッキ名未存在ケース）、堅牢性の確保

- **テストの目的**: データ不整合時のエラーハンドリング確認
  - **確認ポイント**:
    - 例外が発生しない
    - Map.get()がundefined時にデフォルト値が使用される
    - ユーザーに分かりやすいメッセージ

- 🟡 **信頼性レベル**: 黄信号（requirements.md L281-288, phase2.md L616より推測）

---

### 3. 削除API (`deleteBattleLog`) - 正常系テストケース

#### 🔵 TC-007: 対戦履歴が正しく削除される

- **テスト名**: 指定されたIDの対戦履歴が削除され、Blob Storageに保存される
  - **何をテストするか**: deleteBattleLog(id)で対象レコードが配列から削除され、保存される
  - **期待される動作**: findIndex() → splice() → saveBattleLogs() の一連の処理が正常に実行される

- **入力値**:
  ```typescript
  id: 'log_20250124_001'
  mockBlobClient.getBattleLogs.mockResolvedValue([
    { id: 'log_20250124_001', ... },
    { id: 'log_20250124_002', ... },
    { id: 'log_20250124_003', ... },
  ]);
  ```
  - **入力データの意味**: 3件の対戦履歴から2件目を削除
  - **実際の使用場面**: ユーザーが「削除」ボタンをクリックした時

- **期待される結果**:
  ```typescript
  {
    deletedId: 'log_20250124_001'
  }

  // saveBattleLogs が以下の配列で呼び出される
  [
    { id: 'log_20250124_002', ... },
    { id: 'log_20250124_003', ... },
  ]
  ```
  - **期待結果の理由**: REQ-105（削除機能）、データ整合性の保証

- **テストの目的**: 削除処理の正確性確認
  - **確認ポイント**:
    - findIndex()で対象が正しく検索される
    - splice()で1件のみ削除される
    - saveBattleLogs()が削除後の配列で呼び出される
    - deletedIdが返却される

- 🔵 **信頼性レベル**: 青信号（requirements.md L627-654, phase2.md L635-653より）

---

### 4. 一覧取得API - 異常系テストケース（バリデーションエラー）

#### 🟡 TC-101: limit が範囲外（1000超過）

- **テスト名**: limit が1000を超える場合、バリデーションエラーが発生する
  - **エラーケースの概要**: 不正に大きなlimit値を指定した場合
  - **エラー処理の重要性**: サーバー負荷の過剰、メモリ不足を防止

- **入力値**:
  ```typescript
  params: {
    limit: 5000 // 最大値1000を超過
  }
  ```
  - **不正な理由**: 最大値制限（1≤limit≤1000）を違反
  - **実際の発生シナリオ**:
    - APIの誤用（手動でURL構築）
    - 悪意あるリクエスト
    - フロントエンドのバグ

- **期待される結果**:
  ```typescript
  // エラーがスローされる
  throw new Error('limitは1から1000の間で指定してください')
  ```
  - **エラーメッセージの内容**: ユーザーに制約を明確に伝える
  - **システムの安全性**: メモリ不足や過負荷を防止

- **テストの目的**: バリデーションの境界値チェック
  - **品質保証の観点**: サーバーリソース保護、安定性確保

- 🟡 **信頼性レベル**: 黄信号（requirements.md L245-252, phase2.md L553-555より推測）

---

#### 🟡 TC-102: limit が範囲外（0以下）

- **テスト名**: limit が0以下の場合、バリデーションエラーが発生する
  - **エラーケースの概要**: 不正に小さいlimit値を指定した場合
  - **エラー処理の重要性**: 無意味なリクエストの排除

- **入力値**:
  ```typescript
  params: {
    limit: 0 // または -10
  }
  ```
  - **不正な理由**: 最小値制限（limit≥1）を違反
  - **実際の発生シナリオ**: プログラムのバグ、誤入力

- **期待される結果**:
  ```typescript
  throw new Error('limitは1から1000の間で指定してください')
  ```
  - **エラーメッセージの内容**: 最小値1を明示
  - **システムの安全性**: 無駄なDB/Storage アクセスの防止

- **テストの目的**: バリデーションの境界値チェック（最小値）
  - **品質保証の観点**: 不正リクエストの排除

- 🟡 **信頼性レベル**: 黄信号（requirements.md L245-252, phase2.md L553-555より推測）

---

#### 🟡 TC-103: offset が負の値

- **テスト名**: offset が負の値の場合、バリデーションエラーが発生する
  - **エラーケースの概要**: 負のoffset値を指定した場合
  - **エラー処理の重要性**: 配列のマイナスインデックスによる予期しない動作を防止

- **入力値**:
  ```typescript
  params: {
    offset: -10
  }
  ```
  - **不正な理由**: 最小値制限（offset≥0）を違反
  - **実際の発生シナリオ**: プログラムのバグ、計算ミス

- **期待される結果**:
  ```typescript
  throw new Error('offsetは0以上で指定してください')
  ```
  - **エラーメッセージの内容**: 最小値0を明示
  - **システムの安全性**: slice()の予期しない動作を防止

- **テストの目的**: バリデーションの境界値チェック（offset）
  - **品質保証の観点**: データ取得の正確性保証

- 🟡 **信頼性レベル**: 黄信号（requirements.md L254-261, phase2.md L557-559より推測）

---

### 5. 削除API - 異常系テストケース（エラーハンドリング）

#### 🟡 TC-104: 存在しないIDを削除

- **テスト名**: 存在しないIDを削除しようとした場合、404エラーがスローされる
  - **エラーケースの概要**: データベースに存在しないIDを指定した場合
  - **エラー処理の重要性**: 不正な削除操作を防止、ユーザーに適切なフィードバック

- **入力値**:
  ```typescript
  id: 'log_99999999_999' // 存在しないID
  mockBlobClient.getBattleLogs.mockResolvedValue([
    { id: 'log_20250124_001', ... }
  ]);
  ```
  - **不正な理由**: findIndex()が-1を返す（対象が見つからない）
  - **実際の発生シナリオ**:
    - 既に削除済みのIDを再度削除
    - URLの手動編集
    - 同時削除による競合

- **期待される結果**:
  ```typescript
  throw new Error('対戦履歴が見つかりません: log_99999999_999')
  ```
  - **エラーメッセージの内容**: 具体的なIDを含む分かりやすいメッセージ
  - **システムの安全性**: 不正な削除操作を防止

- **テストの目的**: エラーハンドリングの正確性確認
  - **品質保証の観点**: ユーザビリティ向上、データ整合性保証

- 🟡 **信頼性レベル**: 黄信号（requirements.md L263-270, phase2.md L642-644より推測）

---

### 6. 統合処理 - 異常系テストケース（外部依存エラー）

#### 🔵 TC-105: Blob Storage読み込みエラー（一覧取得）

- **テスト名**: getBattleLogs()でBlob Storage接続エラーが発生した場合、エラーがスローされる
  - **エラーケースの概要**: ネットワーク切断、Azure障害など
  - **エラー処理の重要性**: 外部依存の障害時の適切なエラーハンドリング

- **入力値**:
  ```typescript
  mockBlobClient.getBattleLogs.mockRejectedValue(
    new Error('Failed to read battle-logs.json after 3 attempts: Network error')
  );
  ```
  - **不正な理由**: Blob Storageが3回リトライ後も接続失敗
  - **実際の発生シナリオ**:
    - Wi-Fi接続の不安定
    - Azureデータセンター障害
    - アカウント権限の問題

- **期待される結果**:
  ```typescript
  // エラーがスローされる（BlobStorageClientで既にリトライ済み）
  throw new Error('Failed to read battle-logs.json after 3 attempts: Network error')
  ```
  - **エラーメッセージの内容**: リトライ回数と元のエラーを含む
  - **システムの安全性**: 無限リトライを防止、迅速なエラー報告

- **テストの目的**: 外部依存のエラーハンドリング確認
  - **品質保証の観点**: 障害時の適切なエラー伝播、ユーザーへの通知

- 🔵 **信頼性レベル**: 青信号（requirements.md L292-300より）

---

#### 🔵 TC-106: Blob Storage書き込みエラー（削除）

- **テスト名**: saveBattleLogs()でBlob Storage書き込みエラーが発生した場合、エラーがスローされる
  - **エラーケースの概要**: 書き込み権限不足、ストレージ容量不足など
  - **エラー処理の重要性**: データ損失の防止、ユーザーへの適切なフィードバック

- **入力値**:
  ```typescript
  mockBlobClient.getBattleLogs.mockResolvedValue([
    { id: 'log_20250124_001', ... }
  ]);
  mockBlobClient.saveBattleLogs.mockRejectedValue(
    new Error('Failed to write battle-logs.json after 3 attempts: Permission denied')
  );
  ```
  - **不正な理由**: Blob Storageへの書き込み失敗
  - **実際の発生シナリオ**:
    - 書き込み権限の不足
    - ストレージ容量の不足
    - ネットワークの切断

- **期待される結果**:
  ```typescript
  // エラーがスローされる（削除処理が完了していない）
  throw new Error('Failed to write battle-logs.json after 3 attempts: Permission denied')
  ```
  - **エラーメッセージの内容**: 書き込み失敗の理由を含む
  - **システムの安全性**: データの不整合を防止（削除が中途半端な状態を回避）

- **テストの目的**: 外部依存のエラーハンドリング確認（書き込み）
  - **品質保証の観点**: データ整合性の保証、トランザクション的な動作

- 🔵 **信頼性レベル**: 青信号（requirements.md L292-300より）

---

### 7. 境界値テストケース

#### 🟡 TC-201: limit = 1（最小値）

- **テスト名**: limit=1を指定した場合、1件のみ取得される
  - **境界値の意味**: 最小有効値での動作確認
  - **境界値での動作保証**: 最小値でも正常に動作することを保証

- **入力値**:
  ```typescript
  params: {
    limit: 1
  }
  ```
  - **境界値選択の根拠**: バリデーション条件（1≤limit≤1000）の下限
  - **実際の使用場面**: 1件ずつ詳細確認する場合

- **期待される結果**:
  ```typescript
  {
    battleLogs: [最新1件のみ],
    total: 全件数,
    limit: 1,
    offset: 0
  }
  ```
  - **境界での正確性**: slice(0, 1)が正しく動作
  - **一貫した動作**: 他の件数と同様の処理フロー

- **テストの目的**: 境界条件の確認（最小値）
  - **堅牢性の確認**: 極端に小さい値でも安定動作

- 🟡 **信頼性レベル**: 黄信号（phase2.md L553-555より推測）

---

#### 🟡 TC-202: limit = 1000（最大値）

- **テスト名**: limit=1000を指定した場合、最大1000件取得される
  - **境界値の意味**: 最大有効値での動作確認
  - **境界値での動作保証**: 最大値でも正常に動作し、メモリ不足にならない

- **入力値**:
  ```typescript
  params: {
    limit: 1000
  }
  ```
  - **境界値選択の根拠**: バリデーション条件（1≤limit≤1000）の上限
  - **実際の使用場面**: 大量データの一括表示・エクスポート

- **期待される結果**:
  ```typescript
  {
    battleLogs: [最大1000件],
    total: 全件数,
    limit: 1000,
    offset: 0
  }
  ```
  - **境界での正確性**: 1000件を超えない
  - **一貫した動作**: パフォーマンスが許容範囲内

- **テストの目的**: 境界条件の確認（最大値）
  - **堅牢性の確認**: 大量データでもメモリエラーが発生しない

- 🟡 **信頼性レベル**: 黄信号（phase2.md L553-555より推測）

---

#### 🟡 TC-203: offset = 0（最小値）

- **テスト名**: offset=0を指定した場合、先頭から取得される
  - **境界値の意味**: ページネーションの開始点
  - **境界値での動作保証**: 1ページ目の表示が正しく動作

- **入力値**:
  ```typescript
  params: {
    offset: 0
  }
  ```
  - **境界値選択の根拠**: バリデーション条件（offset≥0）の下限
  - **実際の使用場面**: 初回アクセス、最初のページ

- **期待される結果**:
  ```typescript
  {
    battleLogs: [先頭からlimit件],
    total: 全件数,
    limit: 100,
    offset: 0
  }
  ```
  - **境界での正確性**: slice(0, limit)が正しく動作
  - **一貫した動作**: デフォルト動作と同じ

- **テストの目的**: 境界条件の確認（offset最小値）
  - **堅牢性の確認**: 開始位置での正確性

- 🟡 **信頼性レベル**: 黄信号（phase2.md L557-559より推測）

---

#### 🟡 TC-204: offset が total を超える場合

- **テスト名**: offsetが総件数を超える場合、空の配列が返る
  - **境界値の意味**: ページネーションの終端を超えた場合
  - **境界値での動作保証**: エラーにならず、空配列を返す

- **入力値**:
  ```typescript
  params: {
    offset: 1000 // total=50の場合
  }
  mockBlobClient.getBattleLogs.mockResolvedValue([
    // 50件のデータ
  ]);
  ```
  - **境界値選択の根拠**: offset > total の境界ケース
  - **実際の使用場面**: URLの手動編集、古いブックマーク

- **期待される結果**:
  ```typescript
  {
    battleLogs: [], // 空配列
    total: 50,
    limit: 100,
    offset: 1000
  }
  ```
  - **境界での正確性**: slice(1000, 1100)が空配列を返す
  - **一貫した動作**: エラーにならず、正常なレスポンス

- **テストの目的**: 境界条件の確認（offset超過）
  - **堅牢性の確認**: 極端な条件でも安定動作

- 🟡 **信頼性レベル**: 黄信号（phase2.md L576-578より推測）

---

## テストケース実装時のコメント例

以下は、TC-001を実装する場合のコメント例です：

```typescript
describe('getBattleLogs - 正常系', () => {
  describe('正常系: TC-001 - デフォルトパラメータでの一覧取得', () => {
    test('デフォルトパラメータで対戦履歴一覧が正しく取得される', async () => {
      // 【テスト目的】: getBattleLogs() がデフォルトパラメータ（limit=100, offset=0, sortBy="date", sortOrder="desc"）で正しく動作することを確認
      // 【テスト内容】: パラメータを省略した場合、デフォルト値が適用され、日付降順でソートされた一覧が取得される
      // 【期待される動作】: 最新の対戦履歴が先頭に来る形で、ページネーション情報を含むレスポンスが返却される
      // 🔵 信頼性レベル: 青信号（requirements.md L206-215より）

      // 【テストデータ準備】: 3件の対戦履歴データを用意（日付がバラバラ）
      // 【初期条件設定】: Blob Storageに3件のデータが存在する状態をモック
      // 【前提条件確認】: デッキマスターとマイデッキ情報も用意
      const mockBattleLogs: BattleLog[] = [
        {
          id: 'log_20250124_001',
          date: '2025/01/24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_002',
        },
        {
          id: 'log_20250123_001',
          date: '2025/01/23', // 1日前
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '後攻',
          result: '負け',
          opponentDeckId: 'deck_master_003',
        },
        {
          id: 'log_20250125_001',
          date: '2025/01/25', // 1日後（最新）
          battleType: '対戦台',
          rank: '-',
          group: '-',
          myDeckId: 'deck_002',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_001',
        },
      ];

      const mockMyDecks = [
        { id: 'deck_001', deckName: '秘術オデンスペル', ... },
        { id: 'deck_002', deckName: '進化ロイヤル', ... },
      ];

      const mockDeckMasters = [
        { id: 'deck_master_001', deckName: '土スペルウィッチ', ... },
        { id: 'deck_master_002', deckName: 'ミッドレンジロイヤル', ... },
        { id: 'deck_master_003', deckName: 'OTKエルフ', ... },
      ];

      mockBlobClient.getBattleLogs.mockResolvedValue(mockBattleLogs);
      mockBlobClient.getMyDecks.mockResolvedValue(mockMyDecks);
      mockBlobClient.getDeckMasters.mockResolvedValue(mockDeckMasters);

      // 【実際の処理実行】: getBattleLogs() をパラメータなしで呼び出す
      // 【処理内容】: デフォルトパラメータの適用 → Blob Storage取得 → ソート → ページネーション → デッキ名付与
      // 【実行タイミング】: 初回アクセス時を想定
      const result = await service.getBattleLogsWithDeckNames({});

      // 【結果検証】: 返却されたデータが期待値と一致することを確認
      // 【期待値確認】: 日付降順、デッキ名付与、ページネーション情報が正しい
      // 【品質保証】: デフォルトパラメータの動作を保証し、初回アクセス時の正常動作を確保

      // 【検証項目】: ページネーション情報が正しい
      // 🔵 信頼性レベル: 青信号
      expect(result.total).toBe(3); // 【確認内容】: 総件数が3件
      expect(result.limit).toBe(100); // 【確認内容】: デフォルトlimit=100
      expect(result.offset).toBe(0); // 【確認内容】: デフォルトoffset=0

      // 【検証項目】: 日付降順でソートされている
      // 🔵 信頼性レベル: 青信号
      expect(result.battleLogs).toHaveLength(3); // 【確認内容】: 3件すべて取得
      expect(result.battleLogs[0].id).toBe('log_20250125_001'); // 【確認内容】: 最新（1/25）が先頭
      expect(result.battleLogs[1].id).toBe('log_20250124_001'); // 【確認内容】: 2番目（1/24）
      expect(result.battleLogs[2].id).toBe('log_20250123_001'); // 【確認内容】: 最古（1/23）が最後

      // 【検証項目】: デッキ名が正しく付与されている
      // 🔵 信頼性レベル: 青信号（REQ-106）
      expect(result.battleLogs[0].myDeckName).toBe('進化ロイヤル'); // 【確認内容】: deck_002の名前
      expect(result.battleLogs[0].opponentDeckName).toBe('土スペルウィッチ'); // 【確認内容】: deck_master_001の名前
      expect(result.battleLogs[1].myDeckName).toBe('秘術オデンスペル'); // 【確認内容】: deck_001の名前
      expect(result.battleLogs[1].opponentDeckName).toBe('ミッドレンジロイヤル'); // 【確認内容】: deck_master_002の名前
    });
  });
});
```

---

## テストカバレッジ目標

### 🔵 カバレッジ閾値（jest.config.js）

- **関数カバレッジ**: 100% （すべての関数をテスト）
- **行カバレッジ**: 90%以上
- **分岐カバレッジ**: 85%以上
- **ステートメントカバレッジ**: 90%以上

---

## テスト実行コマンド

```bash
# すべてのテストを実行
npm test

# カバレッジ付きで実行
npm run test:coverage

# ウォッチモードで実行（開発中）
npm run test:watch

# 特定のテストファイルのみ実行
npm test battleLogService.test.ts
```

---

## 受け入れ基準との対応

| 受け入れ基準 | 対応テストケース |
|-------------|----------------|
| AC-1: デフォルトパラメータで取得 | TC-001 |
| AC-2: クエリパラメータ処理 | TC-002, TC-003 |
| AC-3: デッキ名フィールド追加 | TC-005 |
| AC-4: デッキ名未存在時のデフォルト値 | TC-006 |
| AC-5: limit範囲外エラー | TC-101, TC-102 |
| AC-6: offset負の値エラー | TC-103 |
| AC-7: 空配列の正常処理 | TC-004 |
| AC-8: 削除処理 | TC-007 |
| AC-9: 削除後のBlob Storage保存 | TC-007 |
| AC-10: 削除成功レスポンス | TC-007 |
| AC-11: 存在しないID削除エラー | TC-104 |
| AC-12: 削除エラーメッセージ | TC-104 |
| AC-13: 単体テスト成功（8ケース以上） | **合計14ケース** ✅ |
| AC-14: Biome lintエラー0件 | 実装時に確認 |
| AC-15: TypeScript型エラー0件 | 実装時に確認 |
| AC-16: カバレッジ70%以上 | **目標90%以上** ✅ |

---

## 品質判定結果

### ✅ 高品質

- **テストケース分類**: 正常系（7ケース）、異常系（6ケース）、境界値（4ケース）が網羅されている ✅
- **期待値定義**: 各テストケースの期待値が明確に定義されている ✅
- **技術選択**: TypeScript 5.7+ + Jest 29.7.0（既存実装と一貫性あり） ✅
- **実装可能性**: 既存のテストパターン（TASK-0007）を踏襲しており、確実に実装可能 ✅

### 追加の強み

- **詳細なコメント**: Given-When-Then形式のコメントで実装が容易
- **既存パターン踏襲**: BlobStorageClientモックパターンの再利用
- **高カバレッジ目標**: 90%以上を目指す設定

---

## 次のステップ

テストケースの洗い出しが完了しました。次は **Redフェーズ（失敗するテスト作成）** を開始します。

**次のお勧めステップ**: `/tsumiki:tdd-red` でRedフェーズ（失敗テスト作成）を開始します。

このテストケース定義書に基づいて、14個のテストケースを実装し、すべてのテストが失敗することを確認します（実装がまだないため）。

---

**作成日**: 2025-10-30
**テストケース総数**: 14ケース（正常系7 + 異常系6 + 境界値4 - 重複1）
**信頼性レベル**: 🔵 高（70%）/ 🟡 中（30%）

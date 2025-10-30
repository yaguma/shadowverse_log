# TDD開発メモ: Battle Log一覧取得・削除API

## 概要

- **機能名**: Battle Log一覧取得・削除API
- **タスクID**: TASK-0008
- **開発開始**: 2025-10-30
- **現在のフェーズ**: Red（失敗するテスト作成完了）

## 関連ファイル

- **元タスクファイル**: `docs/tasks/shadowverse-battle-log-phase2.md`
- **要件定義**: `docs/implements/shadowverse-battle-log/TASK-0008/battle-log-list-delete-requirements.md`
- **テストケース定義**: `docs/implements/shadowverse-battle-log/TASK-0008/battle-log-list-delete-testcases.md`
- **実装ファイル**: `backend/src/services/battleLogService.ts`
- **テストファイル**: `backend/tests/services/battleLogService.test.ts`

---

## Redフェーズ（失敗するテスト作成）

### 作成日時

2025-10-30

### テストケース概要

以下の14個のテストケースを作成しました：

#### 正常系テストケース（7ケース）

1. **TC-001**: デフォルトパラメータでの一覧取得
   - パラメータなしで呼び出し、limit=100, offset=0, sortBy="date", sortOrder="desc"が適用される
   - 日付降順でソートされ、デッキ名が付与される

2. **TC-002**: limit と offset を指定したページネーション
   - limit=20, offset=10を指定して11〜30件目のデータを取得
   - ページネーション情報（total, limit, offset）が正しく含まれる

3. **TC-003**: sortOrder を "asc" に指定した昇順ソート
   - sortOrder="asc"を指定して古い順にソート
   - 最古のデータが先頭に来る

4. **TC-004**: 空配列の場合（battle-logs.jsonが空）
   - 対戦履歴が0件の場合、エラーにならず空配列とtotal=0を返却

5. **TC-005**: デッキ名が正しく付与される
   - マイデッキとデッキマスターの名前が正しくjoinされる
   - myDeckName, opponentDeckName フィールドが追加される

6. **TC-006**: デッキIDに対応する名前がない場合
   - 存在しないデッキIDの場合、"不明なデッキ"が設定される
   - エラーにならず、デフォルト値で処理を継続

7. **TC-007**: 対戦履歴が正しく削除される
   - 指定されたIDの対戦履歴が削除され、Blob Storageに保存される
   - deletedIdが返却される

#### 異常系テストケース（6ケース）

1. **TC-101**: limit が範囲外（1000超過）
   - limit=5000を指定した場合、バリデーションエラー
   - エラーメッセージ: "limitは1から1000の間で指定してください"

2. **TC-102**: limit が範囲外（0以下）
   - limit=0を指定した場合、バリデーションエラー
   - エラーメッセージ: "limitは1から1000の間で指定してください"

3. **TC-103**: offset が負の値
   - offset=-10を指定した場合、バリデーションエラー
   - エラーメッセージ: "offsetは0以上で指定してください"

4. **TC-104**: 存在しないIDを削除
   - 存在しないIDを削除しようとした場合、404エラー
   - エラーメッセージ: "対戦履歴が見つかりません: {id}"

5. **TC-105**: Blob Storage読み込みエラー（一覧取得）
   - getBattleLogs()でBlob Storage接続エラーが発生した場合、エラーがスローされる
   - BlobStorageClientで3回リトライ後、エラーが伝播される

6. **TC-106**: Blob Storage書き込みエラー（削除）
   - saveBattleLogs()でBlob Storage書き込みエラーが発生した場合、エラーがスローされる
   - データの不整合を防止

#### 境界値テストケース（4ケース）

1. **TC-201**: limit = 1（最小値）
   - 最小有効値での動作確認
   - 1件のみ取得される

2. **TC-202**: limit = 1000（最大値）
   - 最大有効値での動作確認
   - 最大1000件取得、メモリエラーが発生しない

3. **TC-203**: offset = 0（最小値）
   - ページネーションの開始点での動作確認
   - 先頭から取得される

4. **TC-204**: offset が total を超える場合
   - ページネーションの終端を超えた場合、空配列が返る（エラーにならない）

### テストコード

テストコードは `backend/tests/services/battleLogService.test.ts` に追加しました。

**テストケース総数**: 14ケース

**コメント方針**:
- 各テストに日本語コメント付き（Given-When-Then形式）
- テスト目的、テスト内容、期待される動作を明記
- 信頼性レベル（🔵青信号 / 🟡黄信号）を記載

### 期待される失敗

すべてのテストケースで以下のTypeScriptエラーが発生します：

```
Property 'getBattleLogsWithDeckNames' does not exist on type 'BattleLogService'.
Property 'deleteBattleLog' does not exist on type 'BattleLogService'.
```

これは意図的なもので、まだメソッドが実装されていないためです。

### TypeScriptエラー一覧

合計17箇所でTypeScriptエラーが発生しています：

1. `getBattleLogsWithDeckNames()` メソッドが存在しない: 13箇所
2. `deleteBattleLog()` メソッドが存在しない: 4箇所

### 次のフェーズへの要求事項

#### Greenフェーズで実装すべき内容

1. **`getBattleLogsWithDeckNames()` メソッド**
   - **パラメータ型定義**:
     ```typescript
     interface GetBattleLogsParams {
       limit?: number;    // デフォルト: 100, 範囲: 1〜1000
       offset?: number;   // デフォルト: 0, 範囲: 0以上
       sortBy?: string;   // デフォルト: "date"
       sortOrder?: 'asc' | 'desc'; // デフォルト: "desc"
     }
     ```

   - **返却値型定義**:
     ```typescript
     interface BattleLogsWithDeckNamesResponse {
       battleLogs: BattleLogWithDeckNames[]; // デッキ名付きの対戦履歴
       total: number;      // 総件数
       limit: number;      // 適用されたlimit値
       offset: number;     // 適用されたoffset値
     }

     interface BattleLogWithDeckNames extends BattleLog {
       myDeckName: string;        // マイデッキ名
       opponentDeckName: string;  // 相手デッキ名
     }
     ```

   - **実装ステップ**:
     1. パラメータのバリデーション（Zodスキーマ）
     2. `Promise.all`で並列取得（`getBattleLogs()`, `getMyDecks()`, `getDeckMasters()`）
     3. デッキIDをMapに変換（高速検索用）
     4. ソート処理（指定されたキー・順序）
     5. ページネーション処理（`slice(offset, offset + limit)`）
     6. デッキ名付与（Map.get()で各ログにデッキ名を追加、存在しない場合は"不明なデッキ"）
     7. レスポンス返却

2. **`deleteBattleLog()` メソッド**
   - **パラメータ**: `id: string`（log_YYYYMMDD_NNN形式）

   - **返却値型定義**:
     ```typescript
     interface DeleteBattleLogResponse {
       deletedId: string; // 削除されたID
     }
     ```

   - **実装ステップ**:
     1. `getBattleLogs()`で全件取得
     2. `findIndex()`で対象IDを検索
     3. 見つからなければエラー（404）: `"対戦履歴が見つかりません: {id}"`
     4. `splice()`で配列から削除
     5. `saveBattleLogs()`で保存
     6. 削除IDをレスポンス返却

3. **バリデーションスキーマ（Zod）**
   ```typescript
   const getBattleLogsSchema = z.object({
     limit: z.number().int().min(1).max(1000).default(100),
     offset: z.number().int().min(0).default(0),
     sortBy: z.string().default('date'),
     sortOrder: z.enum(['asc', 'desc']).default('desc'),
   });
   ```

### 実装時の注意事項

1. **パフォーマンス最適化**
   - デッキマスターとマイデッキの取得を `Promise.all` で並列化
   - デッキIDのMapを使用した高速検索（O(1)）

2. **既存コードとの一貫性**
   - バリデーションパターンはTASK-0007と同様（Zodスキーマ）
   - エラーハンドリングパターンはTASK-0007と同様（ZodError, BlobStorageエラー）

3. **将来の拡張性**
   - ソートキー `sortBy` は任意のBattleLogプロパティに対応
   - ページネーション機能は既に実装（将来のデータ量増加に対応）

---

## 品質評価（Redフェーズ）

### ✅ 高品質

- **テストケース数**: 14ケース（正常系7 + 異常系6 + 境界値4）✅
- **テスト実行**: すべてのテストが失敗することを確認（意図的）✅
- **期待値**: 明確で具体的✅
- **アサーション**: 適切✅
- **実装方針**: 次のフェーズへの要求事項が明確✅
- **日本語コメント**: Given-When-Then形式で詳細✅
- **信頼性レベル**: 各テストに記載（🔵70% / 🟡30%）✅

### 次のステップ

**次のお勧めコマンド**: `/tsumiki:tdd-green` でGreenフェーズ（最小実装）を開始します。

Greenフェーズでは、上記の要求事項に基づいて最小限の実装を行い、すべてのテストが通ることを確認します。

---

**作成日**: 2025-10-30
**フェーズ**: Red（失敗するテスト作成完了）
**次フェーズ**: Green（最小実装）

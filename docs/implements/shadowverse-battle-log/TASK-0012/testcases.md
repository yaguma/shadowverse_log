# TASK-0012: Import API実装 - テストケース仕様書

## 概要

- **タスクID**: TASK-0012
- **要件名**: Import API実装 (Shadowverse Battle Log - Import機能)
- **作成日**: 2025-11-03
- **対象コンポーネント**: ImportService, import.ts (Azure Function)
- **テスト環境**: Node.js 22.x, Jest 29.x, TypeScript 5.7+

## テストケース一覧

### 1. importFromJson - 正常系

#### TC-JSON-001: 正常なJSONインポート (単一データ)
- **目的**: 正常なJSON配列（1件）をインポートできる
- **前提条件**:
  - Blob Storageが接続可能
  - 既存データが0件
- **入力データ**:
  ```json
  [
    {
      "date": "2025-01-24",
      "battleType": "ランクマッチ",
      "rank": "ダイアモンド",
      "group": "AA",
      "myDeckId": "ロイヤル",
      "turn": "先攻",
      "result": "勝ち",
      "opponentDeckId": "ネクロ"
    }
  ]
  ```
- **期待結果**:
  ```typescript
  {
    imported: 1,
    skipped: 0,
    errors: 0,
    details: {}
  }
  ```
- **検証項目**:
  - [ ] Blob Storageに保存される
  - [ ] IDが自動生成される（`log_import_${timestamp}_0` 形式）
  - [ ] 日付が YYYY/MM/DD 形式に変換される
  - [ ] 保存後のデータが1件になる

---

#### TC-JSON-002: 複数件のJSONインポート
- **目的**: 複数件のJSON配列をインポートできる
- **前提条件**:
  - Blob Storageが接続可能
  - 既存データが0件
- **入力データ**:
  ```json
  [
    {
      "date": "2025-01-24",
      "battleType": "ランクマッチ",
      "rank": "ダイアモンド",
      "group": "AA",
      "myDeckId": "ロイヤル",
      "turn": "先攻",
      "result": "勝ち",
      "opponentDeckId": "ネクロ"
    },
    {
      "date": "2025-01-23",
      "battleType": "対戦台",
      "rank": "-",
      "group": "-",
      "myDeckId": "ウィッチ",
      "turn": "後攻",
      "result": "負け",
      "opponentDeckId": "ドラゴン"
    },
    {
      "date": "2025-01-22",
      "battleType": "ロビー大会",
      "rank": "-",
      "group": "-",
      "myDeckId": "ビショップ",
      "turn": "先攻",
      "result": "勝ち",
      "opponentDeckId": "ナイトメア"
    }
  ]
  ```
- **期待結果**:
  ```typescript
  {
    imported: 3,
    skipped: 0,
    errors: 0,
    details: {}
  }
  ```
- **検証項目**:
  - [ ] 3件すべてがBlob Storageに保存される
  - [ ] 各データに異なるIDが自動生成される
  - [ ] 保存順序が入力順序と一致する

---

#### TC-JSON-003: ID付きJSONインポート (既存ID指定)
- **目的**: IDフィールドが存在するJSONデータをインポートできる
- **前提条件**:
  - Blob Storageが接続可能
  - 既存データが0件
- **入力データ**:
  ```json
  [
    {
      "id": "log_custom_001",
      "date": "2025-01-24",
      "battleType": "ランクマッチ",
      "rank": "ダイアモンド",
      "group": "AA",
      "myDeckId": "ロイヤル",
      "turn": "先攻",
      "result": "勝ち",
      "opponentDeckId": "ネクロ"
    }
  ]
  ```
- **期待結果**:
  ```typescript
  {
    imported: 1,
    skipped: 0,
    errors: 0,
    details: {}
  }
  ```
- **検証項目**:
  - [ ] 指定されたIDで保存される
  - [ ] IDの自動生成は実行されない
  - [ ] 保存後のデータIDが "log_custom_001" である

---

#### TC-JSON-004: 空配列のJSONインポート
- **目的**: 空のJSON配列をインポートしてもエラーにならない
- **前提条件**:
  - Blob Storageが接続可能
  - 既存データが0件
- **入力データ**:
  ```json
  []
  ```
- **期待結果**:
  ```typescript
  {
    imported: 0,
    skipped: 0,
    errors: 0,
    details: {}
  }
  ```
- **検証項目**:
  - [ ] エラーが発生しない
  - [ ] Blob Storageへの保存は実行されない
  - [ ] 既存データが0件のまま

---

#### TC-JSON-005: すべてのランク・グループパターン
- **目的**: 許可されたすべてのランク・グループの組み合わせをインポートできる
- **前提条件**:
  - Blob Storageが接続可能
  - 既存データが0件
- **入力データ**:
  ```json
  [
    {
      "date": "2025-01-24",
      "battleType": "ランクマッチ",
      "rank": "サファイア",
      "group": "A",
      "myDeckId": "ロイヤル",
      "turn": "先攻",
      "result": "勝ち",
      "opponentDeckId": "ネクロ"
    },
    {
      "date": "2025-01-24",
      "battleType": "ランクマッチ",
      "rank": "ダイアモンド",
      "group": "AA",
      "myDeckId": "ロイヤル",
      "turn": "先攻",
      "result": "勝ち",
      "opponentDeckId": "ネクロ"
    },
    {
      "date": "2025-01-24",
      "battleType": "ランクマッチ",
      "rank": "ルビー",
      "group": "AAA",
      "myDeckId": "ロイヤル",
      "turn": "先攻",
      "result": "勝ち",
      "opponentDeckId": "ネクロ"
    },
    {
      "date": "2025-01-24",
      "battleType": "ランクマッチ",
      "rank": "トパーズ",
      "group": "Master",
      "myDeckId": "ロイヤル",
      "turn": "先攻",
      "result": "勝ち",
      "opponentDeckId": "ネクロ"
    },
    {
      "date": "2025-01-24",
      "battleType": "対戦台",
      "rank": "-",
      "group": "-",
      "myDeckId": "ロイヤル",
      "turn": "先攻",
      "result": "勝ち",
      "opponentDeckId": "ネクロ"
    }
  ]
  ```
- **期待結果**:
  ```typescript
  {
    imported: 5,
    skipped: 0,
    errors: 0,
    details: {}
  }
  ```
- **検証項目**:
  - [ ] すべてのランク（サファイア、ダイアモンド、ルビー、トパーズ、-）が正常に処理される
  - [ ] すべてのグループ（A、AA、AAA、Master、-）が正常に処理される

---

### 2. importFromJson - 異常系

#### TC-JSON-ERR-001: 不正なJSON形式
- **目的**: JSON形式エラーを検出できる
- **前提条件**: Blob Storageが接続可能
- **入力データ**:
  ```
  { invalid json }
  ```
- **期待結果**: エラーがthrowされる
  - エラーメッセージ: `無効なJSON形式です`
- **検証項目**:
  - [ ] エラーがthrowされる
  - [ ] Blob Storageへの保存が実行されない
  - [ ] 既存データが変更されない

---

#### TC-JSON-ERR-002: 配列でないJSON形式
- **目的**: JSONがオブジェクトの場合にエラーを検出できる
- **前提条件**: Blob Storageが接続可能
- **入力データ**:
  ```json
  {
    "date": "2025-01-24",
    "battleType": "ランクマッチ"
  }
  ```
- **期待結果**: エラーがthrowされる
  - エラーメッセージ: `JSONデータは配列である必要があります`
- **検証項目**:
  - [ ] エラーがthrowされる
  - [ ] Blob Storageへの保存が実行されない

---

#### TC-JSON-ERR-003: バリデーションエラー（未来日付）
- **目的**: 未来日付のデータを検出できる
- **前提条件**:
  - Blob Storageが接続可能
  - 現在日付が 2025-11-03
- **入力データ**:
  ```json
  [
    {
      "date": "2026-12-31",
      "battleType": "ランクマッチ",
      "rank": "ダイアモンド",
      "group": "AA",
      "myDeckId": "ロイヤル",
      "turn": "先攻",
      "result": "勝ち",
      "opponentDeckId": "ネクロ"
    }
  ]
  ```
- **期待結果**:
  ```typescript
  {
    imported: 0,
    skipped: 0,
    errors: 1,
    details: {
      errorDetails: [
        {
          line: 1,
          field: "date",
          error: "未来の日付は入力できません"
        }
      ]
    }
  }
  ```
- **検証項目**:
  - [ ] エラーが `errors` としてカウントされる
  - [ ] エラー詳細に行番号、フィールド名、エラーメッセージが含まれる
  - [ ] Blob Storageへの保存が実行されない

---

#### TC-JSON-ERR-004: バリデーションエラー（不正な対戦タイプ）
- **目的**: 不正な対戦タイプを検出できる
- **前提条件**: Blob Storageが接続可能
- **入力データ**:
  ```json
  [
    {
      "date": "2025-01-24",
      "battleType": "不正な対戦タイプ",
      "rank": "ダイアモンド",
      "group": "AA",
      "myDeckId": "ロイヤル",
      "turn": "先攻",
      "result": "勝ち",
      "opponentDeckId": "ネクロ"
    }
  ]
  ```
- **期待結果**:
  ```typescript
  {
    imported: 0,
    skipped: 0,
    errors: 1,
    details: {
      errorDetails: [
        {
          line: 1,
          field: "battleType",
          error: "対戦タイプは「ランクマッチ」「対戦台」「ロビー大会」のいずれかである必要があります"
        }
      ]
    }
  }
  ```
- **検証項目**:
  - [ ] エラーが正しく検出される
  - [ ] エラーメッセージが適切である

---

#### TC-JSON-ERR-005: バリデーションエラー（空文字列のデッキID）
- **目的**: 空文字列のデッキIDを検出できる
- **前提条件**: Blob Storageが接続可能
- **入力データ**:
  ```json
  [
    {
      "date": "2025-01-24",
      "battleType": "ランクマッチ",
      "rank": "ダイアモンド",
      "group": "AA",
      "myDeckId": "",
      "turn": "先攻",
      "result": "勝ち",
      "opponentDeckId": "ネクロ"
    }
  ]
  ```
- **期待結果**:
  ```typescript
  {
    imported: 0,
    skipped: 0,
    errors: 1,
    details: {
      errorDetails: [
        {
          line: 1,
          field: "myDeckId",
          error: "使用デッキを入力してください"
        }
      ]
    }
  }
  ```
- **検証項目**:
  - [ ] 空文字列が検出される
  - [ ] エラーメッセージが適切である

---

#### TC-JSON-ERR-006: 複数フィールドのバリデーションエラー
- **目的**: 複数フィールドにエラーがある場合、すべて検出できる
- **前提条件**: Blob Storageが接続可能
- **入力データ**:
  ```json
  [
    {
      "date": "2026-12-31",
      "battleType": "不正",
      "rank": "不正",
      "group": "不正",
      "myDeckId": "",
      "turn": "不正",
      "result": "不正",
      "opponentDeckId": ""
    }
  ]
  ```
- **期待結果**:
  ```typescript
  {
    imported: 0,
    skipped: 0,
    errors: 1,
    details: {
      errorDetails: [
        {
          line: 1,
          field: "multiple",
          error: "複数のフィールドにエラーがあります"
        }
      ]
    }
  }
  ```
- **検証項目**:
  - [ ] すべてのエラーが検出される
  - [ ] エラー詳細に複数のエラーが含まれる（または統合されたメッセージ）

---

### 3. importFromJson - 重複チェック

#### TC-JSON-DUP-001: 重複IDのスキップ（単一）
- **目的**: 既存IDと重複したデータがスキップされる
- **前提条件**:
  - Blob Storageに既存データが1件存在
  - 既存データID: "log_existing_001"
- **入力データ**:
  ```json
  [
    {
      "id": "log_existing_001",
      "date": "2025-01-24",
      "battleType": "ランクマッチ",
      "rank": "ダイアモンド",
      "group": "AA",
      "myDeckId": "ロイヤル",
      "turn": "先攻",
      "result": "勝ち",
      "opponentDeckId": "ネクロ"
    }
  ]
  ```
- **期待結果**:
  ```typescript
  {
    imported: 0,
    skipped: 1,
    errors: 0,
    details: {
      skippedIds: ["log_existing_001"]
    }
  }
  ```
- **検証項目**:
  - [ ] 重複IDが `skipped` としてカウントされる
  - [ ] スキップされたIDが `details.skippedIds` に含まれる
  - [ ] Blob Storageのデータ件数が変わらない

---

#### TC-JSON-DUP-002: 重複IDのスキップ（複数）
- **目的**: 複数の重複IDを同時に処理できる
- **前提条件**:
  - Blob Storageに既存データが2件存在
  - 既存データID: "log_001", "log_002"
- **入力データ**:
  ```json
  [
    {
      "id": "log_001",
      "date": "2025-01-24",
      "battleType": "ランクマッチ",
      "rank": "ダイアモンド",
      "group": "AA",
      "myDeckId": "ロイヤル",
      "turn": "先攻",
      "result": "勝ち",
      "opponentDeckId": "ネクロ"
    },
    {
      "id": "log_002",
      "date": "2025-01-24",
      "battleType": "ランクマッチ",
      "rank": "ダイアモンド",
      "group": "AA",
      "myDeckId": "ロイヤル",
      "turn": "先攻",
      "result": "勝ち",
      "opponentDeckId": "ネクロ"
    }
  ]
  ```
- **期待結果**:
  ```typescript
  {
    imported: 0,
    skipped: 2,
    errors: 0,
    details: {
      skippedIds: ["log_001", "log_002"]
    }
  }
  ```
- **検証項目**:
  - [ ] すべての重複IDがスキップされる
  - [ ] スキップされたIDが配列で返される

---

#### TC-JSON-DUP-003: 一部重複、一部正常
- **目的**: 重複と正常データが混在する場合、正常データのみインポートされる
- **前提条件**:
  - Blob Storageに既存データが1件存在
  - 既存データID: "log_001"
- **入力データ**:
  ```json
  [
    {
      "id": "log_001",
      "date": "2025-01-24",
      "battleType": "ランクマッチ",
      "rank": "ダイアモンド",
      "group": "AA",
      "myDeckId": "ロイヤル",
      "turn": "先攻",
      "result": "勝ち",
      "opponentDeckId": "ネクロ"
    },
    {
      "id": "log_new_001",
      "date": "2025-01-24",
      "battleType": "ランクマッチ",
      "rank": "ダイアモンド",
      "group": "AA",
      "myDeckId": "ウィッチ",
      "turn": "後攻",
      "result": "負け",
      "opponentDeckId": "ドラゴン"
    }
  ]
  ```
- **期待結果**:
  ```typescript
  {
    imported: 1,
    skipped: 1,
    errors: 0,
    details: {
      skippedIds: ["log_001"]
    }
  }
  ```
- **検証項目**:
  - [ ] 重複データがスキップされる
  - [ ] 新規データが正常にインポートされる
  - [ ] Blob Storageのデータ件数が1件増加する

---

### 4. importFromCsv - 正常系

#### TC-CSV-001: 正常なCSVインポート (単一データ)
- **目的**: 正常なCSVデータ（ヘッダー + 1行）をインポートできる
- **前提条件**:
  - Blob Storageが接続可能
  - 既存データが0件
- **入力データ**:
  ```csv
  date,battleType,rank,group,myDeckId,turn,result,opponentDeckId
  2025-01-24,ランクマッチ,ダイアモンド,AA,ロイヤル,先攻,勝ち,ネクロ
  ```
- **期待結果**:
  ```typescript
  {
    imported: 1,
    skipped: 0,
    errors: 0,
    details: {}
  }
  ```
- **検証項目**:
  - [ ] CSVヘッダーが正しく解析される
  - [ ] データがBlob Storageに保存される
  - [ ] IDが自動生成される
  - [ ] 日付が YYYY/MM/DD 形式に変換される

---

#### TC-CSV-002: 複数行のCSVインポート
- **目的**: 複数行のCSVデータをインポートできる
- **前提条件**:
  - Blob Storageが接続可能
  - 既存データが0件
- **入力データ**:
  ```csv
  date,battleType,rank,group,myDeckId,turn,result,opponentDeckId
  2025-01-24,ランクマッチ,ダイアモンド,AA,ロイヤル,先攻,勝ち,ネクロ
  2025-01-23,対戦台,-,-,ウィッチ,後攻,負け,ドラゴン
  2025-01-22,ロビー大会,-,-,ビショップ,先攻,勝ち,ナイトメア
  ```
- **期待結果**:
  ```typescript
  {
    imported: 3,
    skipped: 0,
    errors: 0,
    details: {}
  }
  ```
- **検証項目**:
  - [ ] 3行すべてが正常にインポートされる
  - [ ] 各行に異なるIDが自動生成される

---

#### TC-CSV-003: ヘッダーのみのCSV（データ行なし）
- **目的**: ヘッダーのみのCSVデータでもエラーにならない
- **前提条件**:
  - Blob Storageが接続可能
  - 既存データが0件
- **入力データ**:
  ```csv
  date,battleType,rank,group,myDeckId,turn,result,opponentDeckId
  ```
- **期待結果**:
  ```typescript
  {
    imported: 0,
    skipped: 0,
    errors: 0,
    details: {}
  }
  ```
- **検証項目**:
  - [ ] エラーが発生しない
  - [ ] Blob Storageへの保存が実行されない

---

#### TC-CSV-004: ヘッダー順序が異なるCSV
- **目的**: ヘッダーの順序が異なっても正しくインポートできる
- **前提条件**:
  - Blob Storageが接続可能
  - 既存データが0件
- **入力データ**:
  ```csv
  battleType,date,myDeckId,opponentDeckId,rank,group,turn,result
  ランクマッチ,2025-01-24,ロイヤル,ネクロ,ダイアモンド,AA,先攻,勝ち
  ```
- **期待結果**:
  ```typescript
  {
    imported: 1,
    skipped: 0,
    errors: 0,
    details: {}
  }
  ```
- **検証項目**:
  - [ ] ヘッダーに基づいて正しくフィールドがマッピングされる
  - [ ] データが正常に保存される

---

#### TC-CSV-005: IDカラムを含むCSV
- **目的**: IDカラムを含むCSVデータを正しくインポートできる
- **前提条件**:
  - Blob Storageが接続可能
  - 既存データが0件
- **入力データ**:
  ```csv
  id,date,battleType,rank,group,myDeckId,turn,result,opponentDeckId
  log_custom_001,2025-01-24,ランクマッチ,ダイアモンド,AA,ロイヤル,先攻,勝ち,ネクロ
  ```
- **期待結果**:
  ```typescript
  {
    imported: 1,
    skipped: 0,
    errors: 0,
    details: {}
  }
  ```
- **検証項目**:
  - [ ] 指定されたIDで保存される
  - [ ] IDの自動生成は実行されない

---

### 5. importFromCsv - 異常系

#### TC-CSV-ERR-001: 空のCSVデータ
- **目的**: 空のCSVデータを検出できる
- **前提条件**: Blob Storageが接続可能
- **入力データ**:
  ```

  ```
  (空文字列)
- **期待結果**: エラーがthrowされる
  - エラーメッセージ: `CSVデータが空です`
- **検証項目**:
  - [ ] エラーがthrowされる
  - [ ] Blob Storageへの保存が実行されない

---

#### TC-CSV-ERR-002: 必須ヘッダー不足
- **目的**: 必須ヘッダーが不足している場合にエラーを検出できる
- **前提条件**: Blob Storageが接続可能
- **入力データ**:
  ```csv
  date,battleType,rank
  2025-01-24,ランクマッチ,ダイアモンド
  ```
- **期待結果**: エラーがthrowされる
  - エラーメッセージ: `必須ヘッダーが不足しています: group, myDeckId, turn, result, opponentDeckId`
- **検証項目**:
  - [ ] エラーがthrowされる
  - [ ] 欠落したヘッダー名がエラーメッセージに含まれる

---

#### TC-CSV-ERR-003: カラム数不一致
- **目的**: データ行のカラム数がヘッダーと一致しない場合にエラーを検出できる
- **前提条件**: Blob Storageが接続可能
- **入力データ**:
  ```csv
  date,battleType,rank,group,myDeckId,turn,result,opponentDeckId
  2025-01-24,ランクマッチ,ダイアモンド
  ```
- **期待結果**:
  ```typescript
  {
    imported: 0,
    skipped: 0,
    errors: 1,
    details: {
      errorDetails: [
        {
          line: 2,
          field: "columns",
          error: "カラム数が一致しません。期待: 8, 実際: 3"
        }
      ]
    }
  }
  ```
- **検証項目**:
  - [ ] エラーが検出される
  - [ ] 行番号が含まれる（ヘッダー行を含めて2行目）
  - [ ] 期待カラム数と実際のカラム数が表示される

---

#### TC-CSV-ERR-004: バリデーションエラー（未来日付）
- **目的**: CSV内の未来日付を検出できる
- **前提条件**:
  - Blob Storageが接続可能
  - 現在日付が 2025-11-03
- **入力データ**:
  ```csv
  date,battleType,rank,group,myDeckId,turn,result,opponentDeckId
  2026-12-31,ランクマッチ,ダイアモンド,AA,ロイヤル,先攻,勝ち,ネクロ
  ```
- **期待結果**:
  ```typescript
  {
    imported: 0,
    skipped: 0,
    errors: 1,
    details: {
      errorDetails: [
        {
          line: 2,
          field: "date",
          error: "未来の日付は入力できません"
        }
      ]
    }
  }
  ```
- **検証項目**:
  - [ ] エラーが検出される
  - [ ] 行番号がヘッダーを含めて2行目として記録される

---

#### TC-CSV-ERR-005: 複数行のバリデーションエラー
- **目的**: 複数行にエラーがある場合、すべて検出できる
- **前提条件**: Blob Storageが接続可能
- **入力データ**:
  ```csv
  date,battleType,rank,group,myDeckId,turn,result,opponentDeckId
  2026-12-31,ランクマッチ,ダイアモンド,AA,ロイヤル,先攻,勝ち,ネクロ
  2025-01-24,不正な対戦タイプ,ダイアモンド,AA,ロイヤル,先攻,勝ち,ネクロ
  2025-01-23,ランクマッチ,ダイアモンド,AA,,先攻,勝ち,ネクロ
  ```
- **期待結果**:
  ```typescript
  {
    imported: 0,
    skipped: 0,
    errors: 3,
    details: {
      errorDetails: [
        {
          line: 2,
          field: "date",
          error: "未来の日付は入力できません"
        },
        {
          line: 3,
          field: "battleType",
          error: "対戦タイプは「ランクマッチ」「対戦台」「ロビー大会」のいずれかである必要があります"
        },
        {
          line: 4,
          field: "myDeckId",
          error: "使用デッキを入力してください"
        }
      ]
    }
  }
  ```
- **検証項目**:
  - [ ] すべてのエラーが検出される
  - [ ] 各エラーの行番号が正確である

---

### 6. 重複チェック（CSV）

#### TC-CSV-DUP-001: CSV重複IDのスキップ
- **目的**: CSV内の重複IDを検出してスキップできる
- **前提条件**:
  - Blob Storageに既存データが1件存在
  - 既存データID: "log_001"
- **入力データ**:
  ```csv
  id,date,battleType,rank,group,myDeckId,turn,result,opponentDeckId
  log_001,2025-01-24,ランクマッチ,ダイアモンド,AA,ロイヤル,先攻,勝ち,ネクロ
  ```
- **期待結果**:
  ```typescript
  {
    imported: 0,
    skipped: 1,
    errors: 0,
    details: {
      skippedIds: ["log_001"]
    }
  }
  ```
- **検証項目**:
  - [ ] 重複IDがスキップされる
  - [ ] スキップされたIDが返される

---

### 7. 複合エラーケース

#### TC-MIX-001: 重複ID + バリデーションエラー + 正常データ
- **目的**: 複合的なエラーと正常データが混在する場合、適切に処理できる
- **前提条件**:
  - Blob Storageに既存データが1件存在
  - 既存データID: "log_001"
- **入力データ**:
  ```json
  [
    {
      "id": "log_001",
      "date": "2025-01-24",
      "battleType": "ランクマッチ",
      "rank": "ダイアモンド",
      "group": "AA",
      "myDeckId": "ロイヤル",
      "turn": "先攻",
      "result": "勝ち",
      "opponentDeckId": "ネクロ"
    },
    {
      "date": "2026-12-31",
      "battleType": "ランクマッチ",
      "rank": "ダイアモンド",
      "group": "AA",
      "myDeckId": "ウィッチ",
      "turn": "先攻",
      "result": "勝ち",
      "opponentDeckId": "ドラゴン"
    },
    {
      "date": "2025-01-23",
      "battleType": "ランクマッチ",
      "rank": "ダイアモンド",
      "group": "AA",
      "myDeckId": "ビショップ",
      "turn": "先攻",
      "result": "勝ち",
      "opponentDeckId": "ナイトメア"
    }
  ]
  ```
- **期待結果**:
  ```typescript
  {
    imported: 1,
    skipped: 1,
    errors: 1,
    details: {
      skippedIds: ["log_001"],
      errorDetails: [
        {
          line: 2,
          field: "date",
          error: "未来の日付は入力できません"
        }
      ]
    }
  }
  ```
- **検証項目**:
  - [ ] 重複IDが `skipped` としてカウントされる
  - [ ] バリデーションエラーが `errors` としてカウントされる
  - [ ] 正常データが `imported` としてカウントされる
  - [ ] Blob Storageのデータ件数が1件増加する（log_001は既存、新規1件のみ追加）

---

#### TC-MIX-002: CSV複合エラー
- **目的**: CSVでも複合エラーを正しく処理できる
- **前提条件**:
  - Blob Storageに既存データが1件存在
  - 既存データID: "log_001"
- **入力データ**:
  ```csv
  id,date,battleType,rank,group,myDeckId,turn,result,opponentDeckId
  log_001,2025-01-24,ランクマッチ,ダイアモンド,AA,ロイヤル,先攻,勝ち,ナイトメア
  log_002,2026-12-31,ランクマッチ,ダイアモンド,AA,ウィッチ,先攻,勝ち,ドラゴン
  log_003,2025-01-23,ランクマッチ,ダイアモンド,AA,ビショップ,先攻,勝ち,ナイトメア
  ```
- **期待結果**:
  ```typescript
  {
    imported: 1,
    skipped: 1,
    errors: 1,
    details: {
      skippedIds: ["log_001"],
      errorDetails: [
        {
          line: 3,
          field: "date",
          error: "未来の日付は入力できません"
        }
      ]
    }
  }
  ```
- **検証項目**:
  - [ ] 重複、エラー、正常データがそれぞれ正しくカウントされる
  - [ ] 行番号がCSVヘッダーを含めて正確である

---

### 8. パフォーマンステスト

#### TC-PERF-001: 100件のデータインポート
- **目的**: 100件のデータを2000ms以内にインポートできる
- **前提条件**:
  - Blob Storageが接続可能
  - 既存データが0件
- **入力データ**: 100件のJSONデータ（すべて正常）
- **期待結果**:
  ```typescript
  {
    imported: 100,
    skipped: 0,
    errors: 0,
    details: {}
  }
  ```
- **検証項目**:
  - [ ] 処理時間が2000ms以内
  - [ ] すべてのデータが正常にインポートされる
  - [ ] メモリ使用量が100MB以内

---

#### TC-PERF-002: 1000件のデータインポート
- **目的**: 最大1000件のデータをインポートできる
- **前提条件**:
  - Blob Storageが接続可能
  - 既存データが0件
- **入力データ**: 1000件のJSONデータ（すべて正常）
- **期待結果**:
  ```typescript
  {
    imported: 1000,
    skipped: 0,
    errors: 0,
    details: {}
  }
  ```
- **検証項目**:
  - [ ] すべてのデータが正常にインポートされる
  - [ ] メモリ使用量が100MB以内
  - [ ] タイムアウトエラーが発生しない

---

### 9. Blob Storageエラー

#### TC-STORAGE-001: Blob Storage接続エラー
- **目的**: Blob Storageへの接続エラーを適切に処理できる
- **前提条件**: Blob Storageが接続不可（モック）
- **入力データ**:
  ```json
  [
    {
      "date": "2025-01-24",
      "battleType": "ランクマッチ",
      "rank": "ダイアモンド",
      "group": "AA",
      "myDeckId": "ロイヤル",
      "turn": "先攻",
      "result": "勝ち",
      "opponentDeckId": "ネクロ"
    }
  ]
  ```
- **期待結果**: エラーがthrowされる
  - エラーメッセージ: `Blob Storageへの接続に失敗しました`
- **検証項目**:
  - [ ] エラーがthrowされる
  - [ ] リトライが3回実行される（BlobStorageClient既存機能）
  - [ ] エラーログが出力される

---

#### TC-STORAGE-002: Blob Storage保存エラー
- **目的**: Blob Storageへの保存エラーを適切に処理できる
- **前提条件**:
  - Blob Storageが接続可能
  - saveBattleLogs() がエラーを返す（モック）
- **入力データ**:
  ```json
  [
    {
      "date": "2025-01-24",
      "battleType": "ランクマッチ",
      "rank": "ダイアモンド",
      "group": "AA",
      "myDeckId": "ロイヤル",
      "turn": "先攻",
      "result": "勝ち",
      "opponentDeckId": "ネクロ"
    }
  ]
  ```
- **期待結果**: エラーがthrowされる
  - エラーメッセージ: `対戦履歴の保存に失敗しました`
- **検証項目**:
  - [ ] エラーがthrowされる
  - [ ] エラーログが出力される

---

### 10. Azure Function (import.ts) - 統合テスト

#### TC-API-001: 正常なJSONインポートAPI
- **目的**: POST /api/import でJSONインポートが成功する
- **前提条件**:
  - Azure Functionが起動している
  - Blob Storageが接続可能
- **リクエスト**:
  ```http
  POST /api/import
  Content-Type: application/json

  {
    "format": "json",
    "data": "[{\"date\":\"2025-01-24\",\"battleType\":\"ランクマッチ\",\"rank\":\"ダイアモンド\",\"group\":\"AA\",\"myDeckId\":\"ロイヤル\",\"turn\":\"先攻\",\"result\":\"勝ち\",\"opponentDeckId\":\"ネクロ\"}]"
  }
  ```
- **期待レスポンス**:
  ```json
  {
    "success": true,
    "data": {
      "imported": 1,
      "skipped": 0,
      "errors": 0,
      "details": {}
    },
    "meta": {
      "timestamp": "2025-11-03T12:00:00Z",
      "requestId": "req_123"
    }
  }
  ```
- **検証項目**:
  - [ ] HTTPステータスコード: 200
  - [ ] レスポンス形式が正しい
  - [ ] Blob Storageにデータが保存される

---

#### TC-API-002: 正常なCSVインポートAPI
- **目的**: POST /api/import でCSVインポートが成功する
- **前提条件**:
  - Azure Functionが起動している
  - Blob Storageが接続可能
- **リクエスト**:
  ```http
  POST /api/import
  Content-Type: application/json

  {
    "format": "csv",
    "data": "date,battleType,rank,group,myDeckId,turn,result,opponentDeckId\n2025-01-24,ランクマッチ,ダイアモンド,AA,ロイヤル,先攻,勝ち,ネクロ"
  }
  ```
- **期待レスポンス**:
  ```json
  {
    "success": true,
    "data": {
      "imported": 1,
      "skipped": 0,
      "errors": 0,
      "details": {}
    },
    "meta": {
      "timestamp": "2025-11-03T12:00:00Z",
      "requestId": "req_124"
    }
  }
  ```
- **検証項目**:
  - [ ] HTTPステータスコード: 200
  - [ ] レスポンス形式が正しい

---

#### TC-API-ERR-001: format未指定エラー
- **目的**: format が未指定の場合にエラーを返す
- **前提条件**: Azure Functionが起動している
- **リクエスト**:
  ```http
  POST /api/import
  Content-Type: application/json

  {
    "data": "[...]"
  }
  ```
- **期待レスポンス**:
  ```json
  {
    "success": false,
    "error": {
      "code": "INVALID_REQUEST",
      "message": "format は必須です"
    },
    "meta": {
      "timestamp": "2025-11-03T12:00:00Z",
      "requestId": "req_125"
    }
  }
  ```
- **検証項目**:
  - [ ] HTTPステータスコード: 400
  - [ ] エラーコードが `INVALID_REQUEST`

---

#### TC-API-ERR-002: data未指定エラー
- **目的**: data が未指定の場合にエラーを返す
- **前提条件**: Azure Functionが起動している
- **リクエスト**:
  ```http
  POST /api/import
  Content-Type: application/json

  {
    "format": "json"
  }
  ```
- **期待レスポンス**:
  ```json
  {
    "success": false,
    "error": {
      "code": "INVALID_REQUEST",
      "message": "data は必須です"
    },
    "meta": {
      "timestamp": "2025-11-03T12:00:00Z",
      "requestId": "req_126"
    }
  }
  ```
- **検証項目**:
  - [ ] HTTPステータスコード: 400
  - [ ] エラーコードが `INVALID_REQUEST`

---

#### TC-API-ERR-003: 不正なformat値
- **目的**: format が "json" または "csv" 以外の場合にエラーを返す
- **前提条件**: Azure Functionが起動している
- **リクエスト**:
  ```http
  POST /api/import
  Content-Type: application/json

  {
    "format": "xml",
    "data": "[...]"
  }
  ```
- **期待レスポンス**:
  ```json
  {
    "success": false,
    "error": {
      "code": "INVALID_FORMAT",
      "message": "format は 'json' または 'csv' である必要があります"
    },
    "meta": {
      "timestamp": "2025-11-03T12:00:00Z",
      "requestId": "req_127"
    }
  }
  ```
- **検証項目**:
  - [ ] HTTPステータスコード: 400
  - [ ] エラーコードが `INVALID_FORMAT`

---

#### TC-API-ERR-004: JSONパースエラー
- **目的**: 不正なJSON形式の場合にエラーを返す
- **前提条件**: Azure Functionが起動している
- **リクエスト**:
  ```http
  POST /api/import
  Content-Type: application/json

  {
    "format": "json",
    "data": "{ invalid json }"
  }
  ```
- **期待レスポンス**:
  ```json
  {
    "success": false,
    "error": {
      "code": "INVALID_FORMAT",
      "message": "無効なJSON形式です"
    },
    "meta": {
      "timestamp": "2025-11-03T12:00:00Z",
      "requestId": "req_128"
    }
  }
  ```
- **検証項目**:
  - [ ] HTTPステータスコード: 400
  - [ ] エラーコードが `INVALID_FORMAT`

---

#### TC-API-ERR-005: CSVヘッダー不足エラー
- **目的**: 必須ヘッダーが不足している場合にエラーを返す
- **前提条件**: Azure Functionが起動している
- **リクエスト**:
  ```http
  POST /api/import
  Content-Type: application/json

  {
    "format": "csv",
    "data": "date,battleType\n2025-01-24,ランクマッチ"
  }
  ```
- **期待レスポンス**:
  ```json
  {
    "success": false,
    "error": {
      "code": "INVALID_FORMAT",
      "message": "必須ヘッダーが不足しています: rank, group, myDeckId, turn, result, opponentDeckId"
    },
    "meta": {
      "timestamp": "2025-11-03T12:00:00Z",
      "requestId": "req_129"
    }
  }
  ```
- **検証項目**:
  - [ ] HTTPステータスコード: 400
  - [ ] エラーコードが `INVALID_FORMAT`
  - [ ] 欠落したヘッダーがメッセージに含まれる

---

#### TC-API-ERR-006: 内部サーバーエラー
- **目的**: Blob Storageエラー時に500エラーを返す
- **前提条件**:
  - Azure Functionが起動している
  - Blob Storageが接続不可（モック）
- **リクエスト**:
  ```http
  POST /api/import
  Content-Type: application/json

  {
    "format": "json",
    "data": "[{\"date\":\"2025-01-24\",\"battleType\":\"ランクマッチ\",\"rank\":\"ダイアモンド\",\"group\":\"AA\",\"myDeckId\":\"ロイヤル\",\"turn\":\"先攻\",\"result\":\"勝ち\",\"opponentDeckId\":\"ネクロ\"}]"
  }
  ```
- **期待レスポンス**:
  ```json
  {
    "success": false,
    "error": {
      "code": "INTERNAL_SERVER_ERROR",
      "message": "サーバーエラーが発生しました"
    },
    "meta": {
      "timestamp": "2025-11-03T12:00:00Z",
      "requestId": "req_130"
    }
  }
  ```
- **検証項目**:
  - [ ] HTTPステータスコード: 500
  - [ ] エラーコードが `INTERNAL_SERVER_ERROR`
  - [ ] エラーログが出力される

---

## テストカバレッジ目標

### カバレッジ目標
- **単体テスト**: 90%以上
- **統合テスト**: 主要フロー100%
- **合計テストケース数**: 37件

### カバレッジ内訳
- importFromJson: 10件
- importFromCsv: 10件
- 重複チェック: 4件
- 複合エラー: 2件
- パフォーマンステスト: 2件
- Blob Storageエラー: 2件
- Azure Function API: 7件

## テスト環境

### 必要なツール・ライブラリ
- Node.js 22.x
- Jest 29.x
- TypeScript 5.7+
- ts-jest
- @azure/functions (Azure Functions v4)
- Zod v3

### モック対象
- BlobStorageClient
  - getBattleLogs()
  - saveBattleLogs()
- Date.now() (ID生成のため)

### テスト実行コマンド

```bash
# すべてのテストを実行
npm test

# importService のみ実行
npm test -- backend/tests/services/importService.test.ts

# カバレッジレポート生成
npm run test:coverage

# ウォッチモード
npm test -- --watch
```

## テストデータ

### 正常なデータサンプル
```json
{
  "date": "2025-01-24",
  "battleType": "ランクマッチ",
  "rank": "ダイアモンド",
  "group": "AA",
  "myDeckId": "ロイヤル",
  "turn": "先攻",
  "result": "勝ち",
  "opponentDeckId": "ネクロ"
}
```

### 許可された値
- **battleType**: `ランクマッチ`, `対戦台`, `ロビー大会`
- **rank**: `サファイア`, `ダイアモンド`, `ルビー`, `トパーズ`, `-`
- **group**: `A`, `AA`, `AAA`, `Master`, `-`
- **turn**: `先攻`, `後攻`
- **result**: `勝ち`, `負け`

## 実装順序（TDD）

### Phase 1: Red (テストケース作成)
1. `backend/tests/services/importService.test.ts` を作成
2. すべてのテストケースを記述
3. テストを実行し、すべて失敗することを確認

### Phase 2: Green (最小限の実装)
1. `backend/src/services/importService.ts` を実装
   - importFromJson()
   - importFromCsv()
   - バリデーション処理
   - 重複チェック
2. `backend/src/functions/import.ts` を実装
   - Azure Function エンドポイント
   - リクエストバリデーション
   - レスポンスフォーマット
3. すべてのテストが成功することを確認

### Phase 3: Refactor (コード品質向上)
1. コードの重複を削減
2. 関数を分割して可読性を向上
3. エラーハンドリングを強化
4. JSDocコメントを追加
5. テストが引き続き成功することを確認

## 参照ドキュメント

- **requirements.md**: TASK-0012要件定義書
  - REQ-301: JSONインポート
  - REQ-302: CSVインポート
  - REQ-303: バリデーション
  - NFR-001 ~ NFR-303: 非機能要件

- **既存実装**:
  - `backend/src/services/battleLogService.ts`: createBattleLogSchema
  - `backend/src/utils/validation.ts`: isFutureDate()
  - `backend/src/storage/blobStorageClient.ts`: getBattleLogs(), saveBattleLogs()

## 注意事項

### ID生成ルール
- **通常作成**: `log_${YYYY}${MM}${DD}_${連番}`（既存）
- **インポート**: `log_import_${timestamp}_${index}`（新規）

### 日付フォーマット変換
- **入力**: YYYY-MM-DD形式
- **保存**: YYYY/MM/DD形式（`convertDateFormat()` で変換）

### エラーハンドリング
- try-catch でラップし、適切なエラーメッセージを返却
- エラーログにスタックトレースを含める
- 部分的な成功を許可（All or Nothing ではない）

### Blob Storage操作
- リトライ機能は既存実装済み（3回、指数バックオフ）
- トランザクション処理は不要（Azure Blob Storage非対応）

## 更新履歴

| 日付 | 変更内容 |
|---|---|
| 2025-11-03 | 初版作成（37件のテストケース） |

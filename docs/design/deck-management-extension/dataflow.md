# デッキ管理機能拡張 データフロー設計

**作成日**: 2025-01-26
**関連要件定義**: [requirements.md](../../spec/deck-management-extension/requirements.md)
**ベースデータフロー**: [shadowverse-battle-log/dataflow.md](../shadowverse-battle-log/dataflow.md)

**【信頼性レベル凡例】**:
- 🔵 **青信号**: ユーザヒアリング・設計文書を参考にした確実な設計
- 🟡 **黄信号**: ユーザヒアリング・設計文書から妥当な推測による設計
- 🔴 **赤信号**: ユーザヒアリング・設計文書にない推測による設計

---

## 1. デッキ種別管理フロー 🔵

### 1.1 デッキ種別追加フロー 🔵

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant UI as DeckMasterDialog
    participant S as DeckStore
    participant API as /api/deck-master
    participant DB as D1 Database

    U->>UI: 「追加」ボタンクリック
    UI->>UI: ダイアログ表示
    U->>UI: クラス名選択、デッキ名入力
    U->>UI: 「登録」ボタンクリック

    UI->>S: addDeckMaster(data)
    S->>API: POST /api/deck-master

    Note over API: バリデーション
    alt deckNameが空
        API-->>S: 400 ValidationError
        S-->>UI: エラー表示
    else 正常
        API->>DB: 最大sortOrder取得
        DB-->>API: maxSortOrder
        API->>DB: INSERT deck_master
        Note over API: id=UUID自動生成<br/>sortOrder=max+1
        DB-->>API: 成功
        API-->>S: 201 Created
        S->>S: deckMasters配列更新
        S-->>UI: 成功
        UI->>UI: ダイアログ閉じる
        UI->>UI: 一覧更新
    end
```

### 1.2 デッキ種別編集フロー 🔵

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant UI as DeckMasterDialog
    participant S as DeckStore
    participant API as /api/deck-master
    participant DB as D1 Database

    U->>UI: 「編集」ボタンクリック
    UI->>UI: ダイアログ表示（既存データ反映）
    Note over UI: classNameは変更不可（disabled）
    U->>UI: デッキ名修正
    U->>UI: 「保存」ボタンクリック

    UI->>S: updateDeckMaster(id, data)
    S->>API: PUT /api/deck-master/:id

    Note over API: バリデーション
    alt deckNameが空
        API-->>S: 400 ValidationError
        S-->>UI: エラー表示
    else 正常
        API->>DB: UPDATE deck_master SET deck_name
        Note over API: updated_at自動更新
        DB-->>API: 成功
        API-->>S: 200 OK
        S->>S: deckMasters配列更新
        S-->>UI: 成功
        UI->>UI: ダイアログ閉じる
        UI->>UI: 一覧更新
    end
```

### 1.3 デッキ種別削除フロー 🔵

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant UI as DeckMasterList
    participant S as DeckStore
    participant API as /api/deck-master
    participant DB as D1 Database

    U->>UI: 「削除」ボタンクリック
    UI->>UI: 確認ダイアログ表示
    U->>UI: 「削除する」クリック

    UI->>S: deleteDeckMaster(id)
    S->>API: DELETE /api/deck-master/:id

    API->>DB: SELECT COUNT FROM battle_logs WHERE opponent_deck_id = :id
    DB-->>API: referenceCount

    alt 参照あり (referenceCount > 0)
        API-->>S: 409 DeleteConstraintError
        S-->>UI: エラー表示
        Note over UI: 「このデッキ種別は対戦履歴で使用されているため削除できません」
    else 参照なし
        API->>DB: DELETE FROM deck_master WHERE id = :id
        DB-->>API: 成功
        API-->>S: 204 No Content
        S->>S: deckMasters配列から削除
        S-->>UI: 成功
        UI->>UI: 一覧更新
    end
```

---

## 2. 使用デッキ管理フロー 🔵

### 2.1 使用デッキ追加フロー 🔵

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant UI as MyDeckDialog
    participant S as DeckStore
    participant API as /api/my-decks
    participant DB as D1 Database

    U->>UI: 「追加」ボタンクリック
    UI->>UI: ダイアログ表示
    U->>UI: クラス名選択（表示はclassName）
    Note over UI: 選択時にDeckMasterのidを保持
    U->>UI: デッキ名入力
    U->>UI: デッキコード入力（任意）
    U->>UI: 「登録」ボタンクリック

    UI->>S: addMyDeck(data)
    Note over S: data.deckId = 選択したDeckMasterのid
    S->>API: POST /api/my-decks

    Note over API: バリデーション
    alt deckNameが空
        API-->>S: 400 ValidationError
        S-->>UI: エラー表示
    else 正常
        API->>DB: INSERT my_decks
        Note over API: id=UUID自動生成<br/>isActive=true固定
        DB-->>API: 成功
        API-->>S: 201 Created
        S->>S: myDecks配列更新
        S-->>UI: 成功
        UI->>UI: ダイアログ閉じる
        UI->>UI: 一覧更新
    end
```

### 2.2 使用デッキ削除フロー 🔵

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant UI as MyDeckList
    participant S as DeckStore
    participant API as /api/my-decks
    participant DB as D1 Database

    U->>UI: 「削除」ボタンクリック
    UI->>UI: 確認ダイアログ表示
    U->>UI: 「削除する」クリック

    UI->>S: deleteMyDeck(id)
    S->>API: DELETE /api/my-decks/:id

    API->>DB: SELECT COUNT FROM battle_logs WHERE my_deck_id = :id
    DB-->>API: referenceCount

    alt 参照あり (referenceCount > 0)
        API-->>S: 409 DeleteConstraintError
        S-->>UI: エラー表示
        Note over UI: 「この使用デッキは対戦履歴で使用されているため削除できません」
    else 参照なし
        API->>DB: DELETE FROM my_decks WHERE id = :id
        DB-->>API: 成功
        API-->>S: 204 No Content
        S->>S: myDecks配列から削除
        S-->>UI: 成功
        UI->>UI: 一覧更新
    end
```

---

## 3. 統計画面フロー 🔵

### 3.1 統計画面初期表示フロー 🔵

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant UI as StatisticsPage
    participant S as StatisticsStore
    participant API as /api/statistics
    participant DB as D1 Database

    U->>UI: 統計画面にアクセス

    UI->>S: fetchSeasons()
    S->>API: GET /api/statistics/seasons
    API->>DB: SELECT DISTINCT season FROM battle_logs ORDER BY season DESC
    DB-->>API: シーズン一覧
    API-->>S: [27, 26, 25, ...]
    S->>S: availableSeasons更新
    S->>S: selectedSeason = 最新シーズン（配列の先頭）

    S->>API: GET /api/statistics?season=27
    API->>DB: SELECT統計データ WHERE season = 27
    DB-->>API: 統計データ
    API-->>S: Statistics
    S->>S: statistics更新
    S-->>UI: 描画

    UI->>UI: 最新シーズンの統計を表示
```

### 3.2 シーズン切り替えフロー 🔵

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant UI as StatisticsPage
    participant S as StatisticsStore
    participant API as /api/statistics
    participant DB as D1 Database

    U->>UI: シーズン選択ドロップダウンで「シーズン25」を選択

    UI->>S: setSelectedSeason(25)
    S->>S: selectedSeason = 25

    S->>API: GET /api/statistics?season=25
    API->>DB: SELECT統計データ WHERE season = 25
    DB-->>API: 統計データ
    API-->>S: Statistics
    S->>S: statistics更新
    S-->>UI: 描画

    UI->>UI: シーズン25の統計を表示
```

### 3.3 統計画面からの対戦履歴登録フロー 🔵

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant UI as StatisticsPage
    participant D as BattleLogDialog
    participant BS as BattleLogStore
    participant SS as StatisticsStore
    participant API as /api/battle-logs

    U->>UI: 「対戦を記録」ボタンクリック
    UI->>D: ダイアログ表示
    Note over D: 既存のBattleLogDialogを<br/>そのままimport使用

    U->>D: 対戦情報入力
    U->>D: 「登録」ボタンクリック

    D->>BS: addBattleLog(data)
    BS->>API: POST /api/battle-logs
    API-->>BS: 201 Created
    BS->>BS: battleLogs配列更新

    BS-->>D: 成功
    D->>D: ダイアログ閉じる

    D->>SS: fetchStatisticsBySeason(selectedSeason)
    Note over SS: 統計データを再取得して更新
    SS-->>UI: 統計データ更新
    UI->>UI: 統計画面を再描画
```

---

## 4. 対戦履歴登録UI改善フロー 🔵

### 4.1 相手デッキ選択肢ソートフロー 🔵

```mermaid
sequenceDiagram
    participant UI as BattleLogDialog
    participant S as DeckStore
    participant API as /api/deck-master
    participant DB as D1 Database

    UI->>S: fetchDeckMastersWithUsage()
    S->>API: GET /api/deck-master?includeUsage=true

    API->>DB: クエリ実行
    Note over DB: SELECT dm.*,<br/>MAX(bl.battle_date) as last_used_date<br/>FROM deck_master dm<br/>LEFT JOIN battle_logs bl<br/>ON dm.id = bl.opponent_deck_id<br/>GROUP BY dm.id<br/>ORDER BY<br/>CASE WHEN last_used_date IS NULL THEN 1 ELSE 0 END,<br/>last_used_date DESC,<br/>dm.sort_order ASC

    DB-->>API: ソート済みデッキ一覧
    API-->>S: DeckMasterWithUsage[]
    S->>S: deckMasters更新
    S-->>UI: ソート済み選択肢

    UI->>UI: 相手デッキ選択肢を表示
    Note over UI: 最近使用したデッキが上位に表示
```

### 4.2 対戦履歴が0件の場合のフォールバック 🔵

```mermaid
sequenceDiagram
    participant UI as BattleLogDialog
    participant S as DeckStore
    participant API as /api/deck-master
    participant DB as D1 Database

    UI->>S: fetchDeckMastersWithUsage()
    S->>API: GET /api/deck-master?includeUsage=true

    API->>DB: クエリ実行
    Note over DB: 対戦履歴が0件のため<br/>last_used_dateはすべてNULL

    DB-->>API: デッキ一覧（last_used_date全てNULL）
    Note over API: フォールバック:<br/>sortOrder順でソート
    API-->>S: DeckMaster[] (sortOrder順)
    S-->>UI: sortOrder順の選択肢

    UI->>UI: sortOrder順で表示
```

---

## 5. データ整合性フロー 🔵

### 5.1 削除制約チェックフロー 🔵

```mermaid
flowchart TD
    A[削除リクエスト] --> B{エンティティタイプ}
    B -->|DeckMaster| C[battle_logsのopponent_deck_id参照チェック]
    B -->|MyDeck| D[battle_logsのmy_deck_id参照チェック]

    C --> E{参照あり?}
    D --> E

    E -->|はい| F[409 DeleteConstraintError]
    E -->|いいえ| G[DELETE実行]

    F --> H[UIでエラー表示]
    G --> I[204 No Content]
    I --> J[Store更新]
    J --> K[UI一覧更新]
```

---

## 6. キャッシュ無効化フロー 🟡

### 6.1 デッキ種別CRUD時のキャッシュ無効化 🟡

```mermaid
sequenceDiagram
    participant UI as DeckMasterDialog
    participant S as DeckStore
    participant C as Cache
    participant API as /api/deck-master

    UI->>S: addDeckMaster/updateDeckMaster/deleteDeckMaster
    S->>API: API呼び出し
    API-->>S: 成功

    S->>C: invalidate('deckMasters')
    Note over C: deckMastersキャッシュを無効化

    S->>S: fetchDeckMasters()
    Note over S: 新しいデータを取得してキャッシュ更新
```

### 6.2 対戦履歴登録時のキャッシュ無効化 🟡

```mermaid
sequenceDiagram
    participant UI as BattleLogDialog
    participant BS as BattleLogStore
    participant SS as StatisticsStore
    participant DS as DeckStore
    participant C as Cache

    UI->>BS: addBattleLog(data)
    BS-->>UI: 成功

    BS->>C: invalidate('battleLogs')
    BS->>C: invalidate('statistics')
    BS->>C: invalidate('seasons')

    Note over DS: 相手デッキのusage情報が変わるため
    BS->>C: invalidate('deckMasters')
```

---

## 7. エラーハンドリングフロー 🔵

### 7.1 バリデーションエラーフロー 🔵

```mermaid
flowchart TD
    A[フォーム送信] --> B[クライアントバリデーション]
    B -->|失敗| C[UIでエラー表示]
    B -->|成功| D[API呼び出し]
    D --> E[サーバーバリデーション]
    E -->|失敗| F[400 ValidationError]
    F --> G[Store.error更新]
    G --> H[UIでエラー表示]
    E -->|成功| I[DB操作]
```

### 7.2 ネットワークエラーフロー 🔵

```mermaid
flowchart TD
    A[API呼び出し] --> B{通信成功?}
    B -->|いいえ| C[リトライ判定]
    C -->|リトライ可| D[指数バックオフで再試行]
    D --> A
    C -->|リトライ不可| E[Store.error更新]
    E --> F[UIでエラー表示]
    F --> G[リトライボタン表示]
    B -->|はい| H[正常処理]
```

---

## 8. 信頼性レベルサマリー

- 🔵 青信号: 18件 (90%)
- 🟡 黄信号: 2件 (10%)
- 🔴 赤信号: 0件 (0%)

**品質評価**: 高品質（ほぼすべてのフローがユーザヒアリングと既存設計に基づく）

---

## 更新履歴

- **2025-01-26**: 初版作成（tsumiki:kairo-design により生成）

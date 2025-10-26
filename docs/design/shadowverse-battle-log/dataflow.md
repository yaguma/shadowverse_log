# データフロー図

**【信頼性レベル凡例】**:
- 🔵 **青信号**: EARS要件定義書・設計文書を参考にしてほぼ推測していない場合
- 🟡 **黄信号**: EARS要件定義書・設計文書から妥当な推測の場合
- 🔴 **赤信号**: EARS要件定義書・設計文書にない推測の場合

---

## システム全体のデータフロー 🔵 *要件定義書より*

```mermaid
flowchart TD
    A[User: PC/スマホ] -->|HTTPS| B[Azure Static Web Apps<br/>React SPA]
    B -->|REST API| C[Azure Functions<br/>HTTP Trigger]
    C -->|Blob SDK| D[Azure Blob Storage<br/>JSON Files]

    subgraph "フロントエンド"
        B -->|State| E[Zustand Store]
        E -->|Render| B
    end

    subgraph "バックエンド"
        C -->|Validation| F[Zod Schema]
        C -->|Business Logic| G[Services]
        G -->|Read/Write| D
    end

    subgraph "データストレージ"
        D -->|Files| H[battle-logs.json]
        D -->|Files| I[deck-master.json]
        D -->|Files| J[my-decks.json]
    end
```

---

## Phase 1: 対戦履歴登録フロー 🔵 *REQ-001〜005より*

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend<br/>(React)
    participant Z as Zustand Store
    participant AF as Azure Functions<br/>(battle-log)
    participant BS as Blob Storage<br/>(battle-logs.json)

    Note over U,BS: Step 1: ダイアログ表示と前回値引き継ぎ
    U->>F: 「登録」ボタンクリック
    F->>Z: getPreviousInput()
    Z-->>F: 前回入力値を返却
    F->>F: ダイアログ表示（前回値をデフォルト設定）

    Note over U,BS: Step 2: データ入力とバリデーション
    U->>F: データ入力
    F->>F: リアルタイムバリデーション<br/>(日付・必須項目チェック)

    Note over U,BS: Step 3: データ送信と保存
    U->>F: 「登録」ボタンクリック
    F->>AF: POST /api/battle-logs<br/>{ date, battleType, rank, ... }

    AF->>AF: サーバー側バリデーション<br/>(Zod Schema)
    AF->>BS: GET battle-logs.json
    BS-->>AF: 既存データ返却<br/>[{ id: "1", ... }, ...]

    AF->>AF: 新規ID生成<br/>(既存最大ID + 1)
    AF->>AF: 新規データ追加<br/>push({ id: "NEW_ID", ... })

    AF->>BS: PUT battle-logs.json<br/>(更新後の全データ)
    BS-->>AF: 保存完了

    AF-->>F: 201 Created<br/>{ success: true, data: {...} }

    Note over U,BS: Step 4: 画面更新
    F->>Z: addBattleLog(newData)
    Z->>Z: State更新
    F->>F: 一覧画面再レンダリング
    F->>U: 登録完了メッセージ表示
```

---

## Phase 1: 対戦履歴一覧表示フロー 🔵 *REQ-101〜106より*

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend<br/>(React)
    participant Z as Zustand Store
    participant AF as Azure Functions<br/>(battle-log)
    participant BS as Blob Storage<br/>(battle-logs.json)
    participant DM as Blob Storage<br/>(deck-master.json)

    Note over U,DM: Step 1: 初回データ取得
    U->>F: ページ表示
    F->>AF: GET /api/battle-logs?period=1week&limit=100

    AF->>BS: GET battle-logs.json
    BS-->>AF: 全データ返却

    AF->>DM: GET deck-master.json
    DM-->>AF: デッキマスターデータ

    AF->>AF: フィルタリング<br/>(直近1週間)
    AF->>AF: ソート<br/>(日付降順)
    AF->>AF: 制限<br/>(最大100件)
    AF->>AF: デッキID→デッキ名変換

    AF-->>F: 200 OK<br/>{ success: true, data: [...] }

    F->>Z: setBattleLogs(data)
    Z->>Z: State更新
    F->>F: 一覧レンダリング
    F->>U: 対戦履歴一覧表示

    Note over U,DM: Step 2: 詳細表示
    U->>F: 詳細ボタンクリック
    F->>F: モーダル表示<br/>(Zustand Stateから取得)
    F->>U: 詳細モーダル表示

    Note over U,DM: Step 3: 削除
    U->>F: 削除ボタンクリック
    F->>F: 確認ダイアログ表示
    U->>F: 「削除する」選択

    F->>AF: DELETE /api/battle-logs/{id}
    AF->>BS: GET battle-logs.json
    BS-->>AF: 全データ返却
    AF->>AF: 該当ID削除<br/>(filter)
    AF->>BS: PUT battle-logs.json
    BS-->>AF: 保存完了
    AF-->>F: 200 OK<br/>{ success: true }

    F->>Z: removeBattleLog(id)
    Z->>Z: State更新
    F->>F: 一覧再レンダリング
    F->>U: 削除完了メッセージ
```

---

## Phase 1: 統計計算・ダッシュボード表示フロー 🔵 *REQ-201〜205より*

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend<br/>(StatsDashboard)
    participant Z as Zustand Store
    participant AF as Azure Functions<br/>(statistics)
    participant BS as Blob Storage<br/>(battle-logs.json)
    participant DM as Blob Storage<br/>(deck-master.json)

    Note over U,DM: Step 1: ダッシュボード表示
    U->>F: ダッシュボード画面に遷移
    F->>AF: GET /api/statistics?period=1week

    AF->>BS: GET battle-logs.json
    BS-->>AF: 全データ返却

    AF->>DM: GET deck-master.json
    DM-->>AF: デッキマスターデータ

    Note over AF: 統計計算処理
    AF->>AF: 期間フィルタリング<br/>(直近1週間)
    AF->>AF: 全体勝率計算<br/>(WIN/LOSE カウント)
    AF->>AF: デッキ別勝率計算<br/>(myDeckId ごとに集計)
    AF->>AF: 対戦相手デッキ別勝率計算<br/>(opponentDeckId ごとに集計)
    AF->>AF: ランク帯別成績計算<br/>(rank ごとに集計)
    AF->>AF: 相手デッキ分布計算<br/>(opponentDeckId の出現回数)

    AF-->>F: 200 OK<br/>{ success: true, data: {<br/>  overall: { winRate: 0.6, ... },<br/>  byMyDeck: [...],<br/>  byOpponentDeck: [...],<br/>  byRank: [...],<br/>  opponentDistribution: [...]<br/>}}

    F->>Z: setStatistics(data)
    Z->>Z: State更新

    Note over F: グラフ描画
    F->>F: Recharts で円グラフ描画<br/>(相手デッキ分布)
    F->>F: 統計情報表示<br/>(勝率、デッキ別勝率等)

    F->>U: ダッシュボード表示完了

    Note over U,DM: Step 2: 期間変更
    U->>F: 期間ドロップダウン変更<br/>(1週間 → 1ヶ月)
    F->>AF: GET /api/statistics?period=1month
    AF->>BS: GET battle-logs.json
    BS-->>AF: 全データ返却
    AF->>AF: 統計再計算<br/>(1ヶ月分)
    AF-->>F: 200 OK<br/>(更新後の統計データ)
    F->>Z: setStatistics(data)
    F->>F: グラフ・統計再描画
    F->>U: ダッシュボード更新
```

---

## Phase 1: データインポートフロー 🔵 *REQ-301〜303より*

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend<br/>(ImportDialog)
    participant AF as Azure Functions<br/>(import)
    participant BS as Blob Storage<br/>(battle-logs.json)

    Note over U,BS: Step 1: ファイル選択
    U->>F: インポートボタンクリック
    F->>F: ファイル選択ダイアログ表示
    U->>F: JSON/CSVファイル選択

    Note over U,BS: Step 2: クライアント側検証
    F->>F: ファイル形式チェック<br/>(.json / .csv)
    F->>F: ファイルサイズチェック<br/>(最大10MB)
    F->>F: ファイル読み込み<br/>(FileReader API)

    alt JSON形式の場合
        F->>F: JSON.parse()
        F->>F: データ構造検証<br/>(必須項目チェック)
    else CSV形式の場合
        F->>F: CSV パース
        F->>F: データ構造変換<br/>(CSV → JSON)
    end

    Note over U,BS: Step 3: サーバー送信
    F->>AF: POST /api/import<br/>{ data: [...], format: "json" }

    AF->>AF: サーバー側バリデーション<br/>(Zod Schema)
    AF->>AF: データ整合性チェック<br/>(日付形式、デッキID存在確認等)

    alt バリデーションエラーの場合
        AF-->>F: 400 Bad Request<br/>{ success: false, error: {<br/>  message: "不正なデータ",<br/>  details: [{line: 3, field: "date", ...}]<br/>}}
        F->>U: エラー詳細表示
    else バリデーション成功の場合
        Note over AF,BS: データマージ処理
        AF->>BS: GET battle-logs.json
        BS-->>AF: 既存データ返却

        AF->>AF: IDの重複チェック
        alt 重複IDがある場合
            AF-->>F: 409 Conflict<br/>{ success: false, error: {<br/>  message: "重複データあり",<br/>  duplicates: [...]<br/>}}
            F->>U: 重複データ確認ダイアログ表示
            U->>F: 上書き/スキップ選択
            F->>AF: POST /api/import<br/>{ data: [...], mode: "overwrite" }
        end

        AF->>AF: データマージ<br/>(既存 + 新規)
        AF->>AF: 日付順ソート
        AF->>BS: PUT battle-logs.json<br/>(マージ後のデータ)
        BS-->>AF: 保存完了

        AF-->>F: 200 OK<br/>{ success: true, data: {<br/>  imported: 50,<br/>  skipped: 3,<br/>  total: 53<br/>}}

        F->>F: インポート結果表示
        F->>U: "50件インポートしました"
        F->>F: 一覧画面リロード
    end
```

---

## Phase 2: 認証フロー (Azure AD B2C) 🔵 *REQ-701〜702より*

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend<br/>(React + MSAL)
    participant AAD as Azure AD B2C
    participant AF as Azure Functions
    participant BS as Blob Storage

    Note over U,BS: Step 1: 初回ログイン
    U->>F: アプリアクセス
    F->>F: 認証状態チェック<br/>(MSAL)
    F->>U: ログイン画面表示
    U->>F: 「ログイン」ボタンクリック

    F->>AAD: 認証リクエスト<br/>(Authorization Code Flow with PKCE)
    AAD->>U: Azure AD B2C ログイン画面表示
    U->>AAD: Microsoftアカウントでログイン

    AAD->>F: 認証コード返却<br/>(Authorization Code)
    F->>AAD: トークンリクエスト<br/>(Code + PKCE Verifier)
    AAD-->>F: アクセストークン + IDトークン<br/>(JWT)

    F->>F: トークンをLocalStorageに保存
    F->>F: ユーザー情報抽出<br/>(IDトークンから userId)
    F->>U: ダッシュボード画面表示

    Note over U,BS: Step 2: API呼び出し (認証あり)
    U->>F: 対戦履歴一覧表示
    F->>F: トークン取得<br/>(localStorage)
    F->>AF: GET /api/battle-logs<br/>Authorization: Bearer {token}

    AF->>AF: トークン検証<br/>(署名検証、有効期限チェック)
    AF->>AF: userId抽出<br/>(トークンのclaimから)

    alt トークン無効の場合
        AF-->>F: 401 Unauthorized
        F->>AAD: トークンリフレッシュ<br/>(Refresh Token)
        AAD-->>F: 新しいアクセストークン
        F->>AF: 再リクエスト
    end

    AF->>BS: GET {userId}/battle-logs.json
    BS-->>AF: ユーザー固有データ返却
    AF-->>F: 200 OK<br/>{ success: true, data: [...] }
    F->>U: 一覧表示

    Note over U,BS: Step 3: ログアウト
    U->>F: 「ログアウト」ボタンクリック
    F->>F: LocalStorage からトークン削除
    F->>AAD: ログアウトリクエスト
    AAD-->>F: ログアウト完了
    F->>U: ログイン画面表示
```

---

## エラーハンドリングフロー 🔵 *EDGE-001, EDGE-002より*

```mermaid
flowchart TD
    A[Frontend: API リクエスト] -->|try| B[Azure Functions]
    B -->|try| C[Blob Storage アクセス]

    C -->|成功| D[データ返却]
    D --> E[Frontend: 正常表示]

    C -->|ネットワークエラー| F[エラー検知]
    F -->|リトライ 1回目<br/>1秒待機| C
    F -->|リトライ 2回目<br/>2秒待機| C
    F -->|リトライ 3回目<br/>4秒待機| C
    F -->|3回失敗| G[500 Internal Server Error]

    B -->|バリデーションエラー| H[400 Bad Request]
    B -->|認証エラー| I[401 Unauthorized]
    B -->|権限エラー| J[403 Forbidden]

    G --> K[Frontend: エラーメッセージ表示]
    H --> K
    I --> K
    J --> K

    K --> L[ユーザーに通知]
    L -->|リトライボタン| A
```

---

## データキャッシュ戦略 🟡 *パフォーマンス要件から妥当な推測*

```mermaid
flowchart TD
    A[Frontend: データ要求] --> B{Zustand Store<br/>にキャッシュあり?}

    B -->|はい| C{TTL<br/>5分以内?}
    C -->|はい| D[キャッシュから返却]
    C -->|いいえ| E[API リクエスト]

    B -->|いいえ| E

    E --> F[Azure Functions]
    F --> G[Blob Storage]
    G --> H[データ取得]
    H --> I[Frontend: State 更新]
    I --> J[TTL設定: 5分]
    J --> K[データ表示]

    D --> K

    L[ユーザーがデータ変更<br/>(登録・削除)] --> M[キャッシュ無効化]
    M --> E
```

---

## Phase 1 データライフサイクル 🔵 *要件定義書より*

```mermaid
stateDiagram-v2
    [*] --> 未登録

    未登録 --> 登録済み: 対戦履歴登録<br/>(POST /api/battle-logs)

    登録済み --> 一覧表示: 一覧表示<br/>(GET /api/battle-logs)
    一覧表示 --> 詳細表示: 詳細ボタン<br/>(Frontend State)
    詳細表示 --> 一覧表示: 閉じる

    一覧表示 --> 削除確認: 削除ボタン
    削除確認 --> 削除済み: 削除実行<br/>(DELETE /api/battle-logs/{id})
    削除確認 --> 一覧表示: キャンセル

    削除済み --> [*]

    登録済み --> 統計計算: 統計画面表示<br/>(GET /api/statistics)
    統計計算 --> ダッシュボード表示: グラフ描画
    ダッシュボード表示 --> 統計計算: 期間変更

    未登録 --> インポート中: データインポート<br/>(POST /api/import)
    インポート中 --> 登録済み: インポート成功
    インポート中 --> エラー: インポート失敗
    エラー --> 未登録: エラー解消
```

---

## 更新履歴

- **2025-10-23**: 初版作成（tsumiki:kairo-design により自動生成）
  - Phase 1（基本機能）のデータフロー定義
  - Phase 2（認証機能）のデータフロー定義
  - エラーハンドリング・キャッシュ戦略・データライフサイクルを追加

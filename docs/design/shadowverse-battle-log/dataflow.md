# データフロー図 (Cloudflare版)

**【信頼性レベル凡例】**:
- 🔵 **青信号**: EARS要件定義書・設計文書を参考にしてほぼ推測していない場合
- 🟡 **黄信号**: EARS要件定義書・設計文書から妥当な推測の場合
- 🔴 **赤信号**: EARS要件定義書・設計文書にない推測の場合

---

## システム全体のデータフロー 🔵 *要件定義書より*

```mermaid
flowchart TD
    A[User: PC/スマホ] -->|HTTPS| B[Cloudflare Pages<br/>React SPA]
    B -->|REST API| C[Cloudflare Workers<br/>Hono Framework]
    C -->|D1 SDK| D[Cloudflare D1<br/>SQLite]

    subgraph "フロントエンド"
        B -->|State| E[Zustand Store + Persist]
        E -->|Render| B
        E -->|LocalStorage| LS[永続化ストレージ]
    end

    subgraph "バックエンド"
        C -->|Validation| F[Zod Schema]
        C -->|Business Logic| G[Services]
        G -->|Read/Write| D
    end

    subgraph "データストレージ"
        D -->|Tables| H[battle_logs<br/>+ season column]
        D -->|Tables| I[deck_master]
        D -->|Tables| J[my_decks]
    end
```

---

## Phase 1: 対戦履歴登録フロー 🔵 *REQ-001〜005より*

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend<br/>(React)
    participant Z as Zustand Store<br/>+ Persist
    participant CW as Cloudflare Workers<br/>(Hono)
    participant D1 as Cloudflare D1<br/>(SQLite)

    Note over U,D1: Step 1: ダイアログ表示と前回値引き継ぎ
    U->>F: 「登録」ボタンクリック
    F->>Z: getPreviousInput()
    Z-->>F: 前回入力値を返却<br/>(LocalStorageから復元)
    F->>F: ダイアログ表示（前回値をデフォルト設定）

    Note over U,D1: Step 2: データ入力とバリデーション
    U->>F: データ入力
    F->>F: リアルタイムバリデーション<br/>(日付・必須項目チェック)

    Note over U,D1: Step 3: データ送信と保存
    U->>F: 「登録」ボタンクリック
    F->>CW: POST /api/battle-logs<br/>{ date, battleType, rank, ... }

    CW->>CW: サーバー側バリデーション<br/>(Zod Schema)
    CW->>CW: 日付形式正規化<br/>(YYYY-MM-DD → YYYY/MM/DD)
    CW->>CW: UUID生成

    CW->>D1: INSERT INTO battle_logs
    D1-->>CW: 保存完了

    CW-->>F: 201 Created<br/>{ success: true, data: {...} }

    Note over U,D1: Step 4: 画面更新と入力値保存
    F->>Z: addBattleLog(newData)
    F->>Z: setPreviousInput(inputData)
    Z->>Z: State更新
    Z->>Z: LocalStorage永続化
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
    participant CW as Cloudflare Workers<br/>(Hono)
    participant D1 as Cloudflare D1<br/>(SQLite)

    Note over U,D1: Step 1: 初回データ取得
    U->>F: ページ表示
    F->>CW: GET /api/battle-logs?limit=100

    CW->>D1: SELECT * FROM battle_logs<br/>ORDER BY date DESC, created_at DESC<br/>LIMIT 100
    D1-->>CW: 対戦履歴データ

    CW->>D1: SELECT * FROM deck_master
    D1-->>CW: デッキマスターデータ

    CW->>CW: デッキID→デッキ名変換<br/>(myDeckName, opponentDeckName)

    CW-->>F: 200 OK<br/>{ success: true, data: [...] }

    F->>Z: setBattleLogs(data)
    Z->>Z: State更新
    F->>F: 一覧レンダリング
    F->>U: 対戦履歴一覧表示<br/>(デッキ名表示)

    Note over U,D1: Step 2: 詳細表示
    U->>F: 詳細ボタンクリック
    F->>F: モーダル表示<br/>(Zustand Stateから取得)
    F->>U: 詳細モーダル表示

    Note over U,D1: Step 3: 削除
    U->>F: 削除ボタンクリック
    F->>F: 確認ダイアログ表示
    U->>F: 「削除する」選択

    F->>CW: DELETE /api/battle-logs/{id}
    CW->>D1: DELETE FROM battle_logs WHERE id = ?
    D1-->>CW: 削除完了
    CW-->>F: 200 OK<br/>{ success: true }

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
    participant CW as Cloudflare Workers<br/>(Hono)
    participant D1 as Cloudflare D1<br/>(SQLite)

    Note over U,D1: Step 1: ダッシュボード表示（最新シーズン自動選択）
    U->>F: ダッシュボード画面に遷移
    F->>CW: GET /api/battle-logs/latest-season
    CW->>D1: SELECT MAX(season) FROM battle_logs
    D1-->>CW: 最新シーズン番号
    CW-->>F: { latestSeason: 30 }
    F->>CW: GET /api/statistics?season=30

    CW->>D1: SELECT COUNT(*), SUM(CASE WHEN result='勝ち'...)<br/>FROM battle_logs WHERE season = ?
    D1-->>CW: 統計データ返却

    Note over CW: 統計計算処理
    CW->>CW: 全体勝率計算
    CW->>CW: デッキ別勝率計算
    CW->>CW: 対戦相手クラス別統計
    CW->>CW: 先攻後攻別統計
    CW->>CW: ランク帯別成績計算

    CW-->>F: 200 OK<br/>{ success: true, data: {<br/>  overall: { winRate: 0.6, ... },<br/>  byMyDeck: [...],<br/>  byOpponentClass: [...],<br/>  byTurn: { first: {...}, second: {...} },<br/>  byRank: [...]<br/>}}

    F->>Z: setStatistics(data)
    Z->>Z: State更新

    Note over F: グラフ描画
    F->>F: WinRateGauge<br/>(勝率ゲージ、半円プログレス)
    F->>F: TurnComparisonChart<br/>(先攻後攻横棒グラフ)
    F->>F: OpponentClassPieChart<br/>(相手クラス分布円グラフ)
    F->>F: 統計情報表示<br/>(勝率、デッキ別勝率等)

    F->>U: ダッシュボード表示完了

    Note over U,D1: Step 2: シーズン変更
    U->>F: シーズンセレクター変更<br/>(30 → 29)
    F->>CW: GET /api/statistics?season=29
    CW->>D1: 統計クエリ実行
    D1-->>CW: 統計データ返却
    CW-->>F: 200 OK<br/>(更新後の統計データ)
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
    participant CW as Cloudflare Workers<br/>(Hono)
    participant D1 as Cloudflare D1<br/>(SQLite)

    Note over U,D1: Step 1: ファイル選択
    U->>F: インポートボタンクリック
    F->>F: ファイル選択ダイアログ表示
    U->>F: JSON/CSVファイル選択

    Note over U,D1: Step 2: クライアント側検証
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

    Note over U,D1: Step 3: サーバー送信
    F->>CW: POST /api/import<br/>{ data: [...], format: "json" }

    CW->>CW: サーバー側バリデーション<br/>(Zod Schema)
    CW->>CW: データ整合性チェック<br/>(日付形式正規化、デッキID確認)

    alt バリデーションエラーの場合
        CW-->>F: 400 Bad Request<br/>{ success: false, error: {<br/>  message: "不正なデータ",<br/>  details: [{line: 3, field: "date", ...}]<br/>}}
        F->>U: エラー詳細表示
    else バリデーション成功の場合
        Note over CW,D1: バッチINSERT処理
        CW->>CW: 日付形式正規化<br/>(YYYY-MM-DD → YYYY/MM/DD)
        CW->>D1: INSERT OR IGNORE INTO battle_logs<br/>(バッチ処理)
        D1-->>CW: 保存完了

        CW-->>F: 200 OK<br/>{ success: true, data: {<br/>  imported: 50,<br/>  skipped: 3,<br/>  total: 53<br/>}}

        F->>F: インポート結果表示
        F->>U: "50件インポートしました"
        F->>F: 一覧画面リロード
    end
```

---

## Phase 2: 認証フロー (Cloudflare Access) 🔵 *REQ-701〜702より*

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend<br/>(React)
    participant CA as Cloudflare Access
    participant CW as Cloudflare Workers<br/>(Hono)
    participant D1 as Cloudflare D1<br/>(SQLite)

    Note over U,D1: Step 1: 初回ログイン
    U->>F: アプリアクセス
    F->>CA: 認証リクエスト
    CA->>U: Cloudflare Accessログイン画面表示
    U->>CA: OAuth プロバイダーでログイン<br/>(Google/GitHub等)

    CA-->>F: CF-Access-JWT-Assertion<br/>(JWT Token)

    F->>F: トークンをCookieに保存
    F->>F: ユーザー情報抽出<br/>(JWTから userId)
    F->>U: ダッシュボード画面表示

    Note over U,D1: Step 2: API呼び出し (認証あり)
    U->>F: 対戦履歴一覧表示
    F->>CW: GET /api/battle-logs<br/>CF-Access-JWT-Assertion: {token}

    CW->>CA: トークン検証
    CA-->>CW: ユーザー情報返却
    CW->>CW: userId抽出<br/>(トークンのclaimから)

    alt トークン無効の場合
        CW-->>F: 401 Unauthorized
        F->>CA: 再認証リダイレクト
    end

    CW->>D1: SELECT * FROM battle_logs<br/>WHERE user_id = ?
    D1-->>CW: ユーザー固有データ返却
    CW-->>F: 200 OK<br/>{ success: true, data: [...] }
    F->>U: 一覧表示

    Note over U,D1: Step 3: ログアウト
    U->>F: 「ログアウト」ボタンクリック
    F->>F: Cookie からトークン削除
    F->>CA: ログアウトリクエスト
    CA-->>F: ログアウト完了
    F->>U: ログイン画面表示
```

---

## エラーハンドリングフロー 🔵 *EDGE-001, EDGE-002より*

```mermaid
flowchart TD
    A[Frontend: API リクエスト] -->|try| B[Cloudflare Workers]
    B -->|try| C[D1 Database アクセス]

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

    E --> F[Cloudflare Workers]
    F --> G[D1 Database]
    G --> H[データ取得]
    H --> I[Frontend: State 更新]
    I --> J[TTL設定: 5分]
    J --> K[データ表示]

    D --> K

    L[ユーザーがデータ変更<br/>(登録・削除)] --> M[キャッシュ無効化]
    M --> E

    N[フォーム入力] --> O[Zustand Persist]
    O --> P[LocalStorage保存]
    P --> Q[ブラウザ更新後も復元]
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

- **2025-12-06**: シーズン機能・グラフィカルダッシュボード追加
  - battle_logsテーブルにseasonカラム追加
  - 統計ダッシュボードフローを最新シーズン自動選択対応に更新
  - グラフィカルダッシュボードコンポーネント（WinRateGauge、TurnComparisonChart、OpponentClassPieChart）を追加
  - シーズンセレクターによるフィルタリングフローを追加
  - 対戦相手クラス別統計・先攻後攻別統計フローを追加
- **2025-12-05**: Cloudflare版に全面更新
  - Azure (Functions, Blob Storage) → Cloudflare (Workers, D1) に移行
  - Zustand persist middleware によるフォーム入力永続化フローを追加
  - 日付形式正規化（YYYY-MM-DD → YYYY/MM/DD）フローを追加
  - BattleLogWithDeckNames型によるデッキ名表示フローを追加
  - Phase 2認証をAzure AD B2CからCloudflare Accessに変更
- **2025-10-23**: 初版作成（tsumiki:kairo-design により自動生成）
  - Phase 1（基本機能）のデータフロー定義
  - Phase 2（認証機能）のデータフロー定義
  - エラーハンドリング・キャッシュ戦略・データライフサイクルを追加

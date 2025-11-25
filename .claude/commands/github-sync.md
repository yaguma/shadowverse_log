---
description: >-
  GitHub Issue/Project連携を実行するSubAgent。Issueの作成、更新、コメント追加、ステータス更新などをgh
  cliを使用して実行します。
---
# github-sync

## 目的

GitHub Issue/Project連携を実行するSubAgent。`gh cli`を使用してGitHubのIssueとProjectを更新します。

## 前提条件

- `gh cli`がインストールされ、認証済みである（`gh auth status`で確認）
- GitHubリポジトリが存在する
- GitHub Project（カンバン）が設定されている

## 入力パラメータ

- **action** (必須): 実行するアクション
  - `create_issue`: Issueを作成し、Projectに追加
  - `add_comment`: Issueにコメントを追加
  - `add_label`: Issueにラベルを追加
  - `update_status`: Projectのステータスを更新
  - `close_issue`: Issueをクローズし、ProjectステータスをDoneに更新
  - `create_pr`: ブランチ作成、コミット＆Push、プルリク作成、ステータスをIn Reviewに更新
  - `check_dependencies`: 依存タスクの完了状況を確認し、次のタスクをReadyに更新
- **issue_number** (オプション): GitHub Issue番号（例: `123`）
- **task_id** (オプション): タスクID（例: `TASK-0001`）
- **task_name** (オプション): タスク名
- **task_body** (オプション): Issue本文
- **labels** (オプション): ラベル（カンマ区切り、例: `task,tdd,phase1`）
- **milestone** (オプション): マイルストーン名
- **comment** (オプション): コメント内容
- **status** (オプション): Projectステータス（`Ready`, `In Progress`, `In Review`, `Done`）
- **dependencies** (オプション): 依存タスクIDのリスト（カンマ区切り、例: `TASK-0001,TASK-0002`）

## 実行内容

1. **追加ルールの読み込み**
   - `docs/rule` ディレクトリが存在する場合は読み込み
   - `docs/rule/github` ディレクトリが存在する場合は読み込み
   - `docs/rule/github/sync` ディレクトリが存在する場合は読み込み
   - 各ディレクトリ内のすべてのファイルを読み込み、追加ルールとして適用

2. **GitHub認証確認**
   - `gh auth status`を実行して認証状態を確認
   - 認証されていない場合はエラーを表示

3. **アクション別の処理**

   ### create_issue: Issue作成とProject追加

   - Issueを作成
     - タイトル: `[TASK-{4桁番号}] {タスク名}`
     - 本文: task_bodyまたはタスク情報から生成
     - ラベル: labelsまたはデフォルトラベル
     - マイルストーン: milestone（指定がある場合）
   - Issue IDを取得
   - IssueのRelationshipsを設定（依存タスクとの`depends on`関係）
   - Project IDを取得
   - ProjectにIssueを追加
   - ステータスを`Ready`に設定（依存関係はRelationshipsで管理されるため、常にReady）
   - Issue番号を返す

   ### add_comment: Issueにコメント追加

   - issue_numberが指定されていることを確認
   - `gh issue comment`コマンドでコメントを追加
   - 成功/失敗を返す

   ### add_label: Issueにラベル追加

   - issue_numberが指定されていることを確認
   - `gh issue edit`コマンドでラベルを追加
   - 成功/失敗を返す

   ### update_status: Projectステータス更新

   - issue_numberが指定されていることを確認
   - Project IDを取得
   - ステータスフィールドIDを取得
   - GraphQL APIでステータスを更新
   - 成功/失敗を返す

   ### close_issue: IssueクローズとProject更新

   - issue_numberが指定されていることを確認
   - Issueにコメントを追加（検証結果など）
   - `implementation-complete`ラベルを追加
   - Issueをクローズ
   - Projectステータスを`Done`に更新
   - 成功/失敗を返す

   ### create_pr: ブランチ作成、コミット＆Push、プルリク作成、ステータス更新

   - issue_numberが指定されていることを確認
   - task_idまたはissue_numberからブランチ名を生成（例: `task/TASK-0001` または `task/issue-123`）
   - 現在のブランチを確認（mainまたはmasterであることを確認）
   - 新しいブランチを作成してチェックアウト
   - 変更されたファイルをステージング
   - コミットメッセージを生成（検証結果のコメントを含む）
   - コミットを実行
   - ブランチをPush
   - プルリクエストを作成
     - タイトル: `[TASK-{4桁番号}] {タスク名}` または Issueタイトルを使用
     - 本文: 検証結果のコメントを含む
     - Issueとリンク（`Closes #123`または`Fixes #123`）
   - Issueにコメントを追加（検証結果など）
   - `implementation-complete`ラベルを追加
   - Projectステータスを`In Review`に更新
   - プルリクエスト番号を返す

   ### check_dependencies: 依存タスク確認と更新（非推奨）

   - **注意**: 依存関係はGitHub IssueのRelationships機能で自動管理されるため、このアクションは非推奨です
   - issue_numberが指定されていることを確認
   - このタスクに依存している他のタスクを検索
   - 各依存タスクについて、依存タスクが全て完了しているか確認
   - 依存タスクが全て完了している場合、次のタスクを`Ready`に更新
   - コメントを追加
   - 成功/失敗を返す

## 実行例

### Issue作成

```bash
@task general-purpose /github-sync \
  --action create_issue \
  --task_id TASK-0001 \
  --task_name "タスク名" \
  --task_body "タスク詳細..." \
  --labels "task,tdd,phase1" \
  --dependencies "TASK-0000"
```

### コメント追加

```bash
@task general-purpose /github-sync \
  --action add_comment \
  --issue_number 123 \
  --comment "✅ tdd-requirements完了\n- 実行時間: 30分"
```

### ステータス更新

```bash
@task general-purpose /github-sync \
  --action update_status \
  --issue_number 123 \
  --status "In Progress"
```

### Issueクローズ

```bash
@task general-purpose /github-sync \
  --action close_issue \
  --issue_number 123 \
  --comment "✅ 実装検証完了\n- テスト: 25/25 (100%)\n- カバレッジ: 95%"
```

### プルリクエスト作成

```bash
@task general-purpose /github-sync \
  --action create_pr \
  --issue_number 123 \
  --task_id TASK-0001 \
  --comment "✅ 実装検証完了\n- テスト: 25/25 (100%)\n- カバレッジ: 95%"
```

### 依存タスク確認

```bash
@task general-purpose /github-sync \
  --action check_dependencies \
  --issue_number 123
```

## エラーハンドリング

- GitHub認証エラー: エラーメッセージを表示し、処理を中断
- Issue番号未指定: エラーメッセージを表示し、処理を中断
- gh cliコマンド失敗: エラーメッセージを表示し、処理を中断
- Project ID取得失敗: エラーメッセージを表示し、処理を中断

## 戻り値

- 成功時: 実行結果（Issue番号、ステータス更新結果など）
- 失敗時: エラーメッセージ

## 詳細仕様

詳細は `docs/rule/github-integration-workflow.md` を参照してください。

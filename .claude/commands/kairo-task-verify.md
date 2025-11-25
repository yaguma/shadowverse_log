---
description: 作成されたタスクファイルの内容を確認し、出力フォーマット例に沿った情報が抜けていたら追加します。
---
# kairo-task-verify

## 目的

作成されたタスクファイルの内容を確認し、出力フォーマット例に沿った情報が抜けていたら追加する。

## 前提条件

- `docs/tasks/{要件名}-tasks.md` が存在する
- kairo-tasksコマンドによってタスクファイルが作成済みである

## 入力パラメータ

- **task_id** (オプション): 検証するタスクID（例: `TASK-0001`）
- **issue_number** (オプション): GitHub Issue番号（例: `123`）
  - Issue番号が指定された場合、そのIssueを使用
  - Issue番号が指定されていない場合、タスクファイルから取得を試みる
  - どちらも取得できない場合はエラーを表示

## 実行内容

**【信頼性レベル指示】**:
各項目について、元の資料（EARS要件定義書・設計文書含む）との照合状況を以下の信号でコメントしてください：

- 🔵 **青信号**: EARS要件定義書・設計文書を参考にしてほぼ推測していない場合
- 🟡 **黄信号**: EARS要件定義書・設計文書から妥当な推測の場合
- 🔴 **赤信号**: EARS要件定義書・設計文書にない推測の場合

1. **追加ルールの読み込み**
   - `docs/rule` ディレクトリが存在する場合は読み込み
   - `docs/rule/kairo` ディレクトリが存在する場合は読み込み  
   - `docs/rule/kairo/task-verify` ディレクトリが存在する場合は読み込み
   - 各ディレクトリ内のすべてのファイルを読み込み、追加ルールとして適用

2. **技術スタック定義の読み込み**
   - `docs/tech-stack.md` が存在する場合は読み込み
   - 存在しない場合は `CLAUDE.md` から技術スタックセクションを読み込み  
   - どちらも存在しない場合は `.claude/commands/tech-stack.md` のデフォルト定義を使用

3. **タスクファイルの確認とIssue番号の取得**
   - ユーザが指定したタスクID（task_id）を確認
   - ユーザが指定したIssue番号（issue_number）を確認
   - Issue番号の取得優先順位:
     1. ユーザが指定したIssue番号（最優先）
     2. タスクファイルから取得（`<!-- GitHub Issue: #123 -->`の形式）
     3. タスクIDからIssueを検索（`gh issue list --search "TASK-0001"`）
   - @agent-symbol-searcher でタスクファイルを検索し、見つかったファイルをReadツールで読み込み
   - `docs/tasks/{要件名}-tasks.md` をReadツールで読み込み
   - 取得したIssue番号を記録（後続のGitHub連携で使用）

4. **出力フォーマット例との比較**
   - @agent-symbol-searcher で関連するタスクフォーマットを検索し、見つかったファイルをReadツールで読み込み
   - kairo-tasksコマンドファイルをReadツールで読み込み、出力フォーマット例を確認
   - 作成されたタスクファイルに不足している情報を特定

5. **不足情報の追加**
   以下の項目が含まれているか確認し、不足していれば追加：
   - 概要セクション（全タスク数、推定作業時間、クリティカルパス）
   - 各タスクのチェックボックス
   - タスクタイプ（TDD/DIRECT）の明記
   - 要件リンク
   - 依存タスク
   - 実装詳細
   - テスト要件
   - UI/UX要件（フロントエンドタスクの場合）
   - エラーハンドリング要件
   - 完了条件
   - 実行順序（Mermaidガントチャート）
   - サブタスクテンプレート情報

6. **ファイルの更新**
   - 不足している情報を追加してファイルを更新

7. **GitHub Issue/Project連携**
   - 取得したIssue番号を使用（ステップ3で取得したIssue番号）
   - Issue番号が取得できない場合は警告を表示し、GitHub連携をスキップ
   - 検証結果をコメントとして追加: `@task general-purpose /github-sync --action add_comment --issue_number {issue_number} --comment "✅ タスク検証完了\n- 要件定義: 確認済み\n- 依存関係: 確認済み"`
   - 検証完了時は`verified`ラベルを追加: `@task general-purpose /github-sync --action add_label --issue_number {issue_number} --labels "verified"`
   - Projectステータスは`Ready`のまま（依存関係はRelationshipsで管理されるため、変更不要）
   - 詳細は `docs/rule/github-integration-workflow.md` を参照

## 実行後の確認

- 更新したファイルのパスを表示
- 追加した情報の概要を表示
- タスクファイルが完全になったことを確認
- GitHub Issue/Projectが適切に更新されたことを確認

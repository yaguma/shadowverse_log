# フロントエンドデプロイ手順書

## 目次

1. [概要](#概要)
2. [デプロイ環境](#デプロイ環境)
3. [自動デプロイ（推奨）](#自動デプロイ推奨)
4. [手動デプロイ（GitHub Actions）](#手動デプロイgithub-actions)
5. [手動デプロイ（ローカル）](#手動デプロイローカル)
6. [デプロイ後の確認](#デプロイ後の確認)
7. [トラブルシューティング](#トラブルシューティング)

---

## 概要

このドキュメントでは、Shadowverse Battle Logアプリケーションのフロントエンドをデプロイする方法を説明します。

### デプロイ先

- **サービス**: Azure Static Web Apps
- **本番URL**: https://blue-hill-0ff7f5d00.5.azurestaticapps.net/
- **管理ポータル**: [Azure Portal](https://portal.azure.com/)

### デプロイ方法

1. **自動デプロイ（推奨）**: mainブランチへのpush時に自動実行
2. **手動デプロイ（GitHub Actions）**: GitHub Actionsから手動実行
3. **手動デプロイ（ローカル）**: ローカル環境からCLI経由でデプロイ

---

## デプロイ環境

### 本番環境

- **環境名**: Production
- **URL**: https://blue-hill-0ff7f5d00.5.azurestaticapps.net/
- **ブランチ**: `main`
- **自動デプロイ**: 有効

### ステージング環境

- **環境名**: Staging
- **URL**: Pull Requestごとに自動生成
- **ブランチ**: Pull Request作成時
- **自動デプロイ**: 有効

---

## 自動デプロイ（推奨）

mainブランチへのpushまたはマージ時に自動的にデプロイされます。

### 前提条件

- mainブランチへのpush権限
- GitHub Actionsが有効

### 手順

1. **コードをmainブランチにマージ**

   ```bash
   git checkout main
   git pull origin main
   git merge feature/your-feature
   git push origin main
   ```

2. **GitHub Actionsの実行確認**

   - [GitHub Actionsページ](https://github.com/your-repo/actions)にアクセス
   - "Azure Static Web Apps CI/CD" ワークフローを確認
   - ステータスが緑色（成功）になることを確認

3. **デプロイ完了を確認**

   - 本番URLにアクセス: https://blue-hill-0ff7f5d00.5.azurestaticapps.net/
   - 変更が反映されていることを確認

---

## 手動デプロイ（GitHub Actions）

GitHub Actionsから手動でデプロイを実行できます。

### 前提条件

- GitHubリポジトリへのアクセス権限
- mainブランチまたはデプロイ対象ブランチのコード

### 手順

1. **GitHub Actionsページにアクセス**

   - リポジトリページを開く
   - 「Actions」タブをクリック
   - 左サイドバーから「Azure Static Web Apps CI/CD」を選択

2. **手動実行を開始**

   - 「Run workflow」ボタンをクリック
   - 以下の項目を選択:
     - **Use workflow from**: デプロイするブランチを選択（通常は `main`）
     - **デプロイ環境**: `production` または `staging` を選択

3. **実行確認**

   ```
   ✅ ワークフロー実行画面

   ┌─────────────────────────────────────────┐
   │ Run workflow                            │
   ├─────────────────────────────────────────┤
   │ Use workflow from: main            ▼    │
   │ デプロイ環境: production           ▼    │
   │                                         │
   │ [ Run workflow ]                        │
   └─────────────────────────────────────────┘
   ```

4. **デプロイ進行状況を確認**

   - ワークフローの実行が開始されます
   - 各ステップの進行状況を確認できます:
     - ✅ Checkout code
     - ✅ Display deployment information
     - ✅ Build And Deploy

5. **完了通知**

   - デプロイが成功すると、ワークフローが緑色のチェックマークで完了
   - ログに以下の情報が表示されます:
     ```
     🚀 手動デプロイが開始されました
     デプロイ環境: production
     トリガー: your-username
     ブランチ: main
     コミット: abc123...
     ```

6. **デプロイ完了を確認**

   - 本番URLにアクセスして変更を確認

---

## 手動デプロイ（ローカル）

ローカル環境から直接Azure Static Web Appsにデプロイできます。

### 前提条件

- Node.js 18以上
- npm 9以上
- Azure Static Web Apps APIトークン

### 環境変数の設定

1. **環境変数ファイルを作成**

   ```bash
   cd frontend
   cp .env.deployment.example .env.deployment
   ```

2. **環境変数を編集**

   `.env.deployment`ファイルを開き、以下の値を設定:

   ```bash
   # Azure Static Web Apps API Token
   AZURE_STATIC_WEB_APPS_API_TOKEN=your-token-here

   # Backend API URL
   VITE_FUNCTIONS_API_URL=https://your-backend-url.azurewebsites.net/api

   # Backend API Key
   VITE_FUNCTIONS_API_KEY=your-api-key-here
   ```

3. **トークンの取得方法**

   - [Azure Portal](https://portal.azure.com/)にログイン
   - Azure Static Web Appsリソースを開く
   - 「設定」→「デプロイトークンの管理」
   - トークンをコピーして `.env.deployment` に貼り付け

### デプロイ実行

#### 方法1: デプロイスクリプトを使用（推奨）

```bash
cd frontend
./deploy-manual.sh
```

スクリプトは以下を自動実行します:
1. ✅ 環境チェック（Node.js, npm, Azure CLI）
2. ✅ 依存関係のインストール
3. ✅ TypeScript型チェック
4. ✅ リント実行
5. ✅ テスト実行
6. ✅ 本番ビルド
7. ✅ デプロイ実行

#### 方法2: 手動で実行

```bash
cd frontend

# 1. 依存関係のインストール
npm install

# 2. 型チェック
npm run type-check

# 3. リント
npm run lint

# 4. テスト
npm test -- --run

# 5. ビルド
npm run build

# 6. デプロイ
npm install -g @azure/static-web-apps-cli
swa deploy ./dist \
  --deployment-token "$AZURE_STATIC_WEB_APPS_API_TOKEN" \
  --env production
```

### デプロイ完了

デプロイが成功すると、以下のメッセージが表示されます:

```
============================================
  フロントエンドのデプロイが完了しました！
============================================

デプロイされたURL:
https://blue-hill-0ff7f5d00.5.azurestaticapps.net/

デプロイ状況の確認:
https://portal.azure.com/
```

---

## デプロイ後の確認

### 1. 基本動作確認

以下のページにアクセスして正常に表示されることを確認:

- [ ] トップページ: `/`
- [ ] 対戦履歴一覧: `/battle-logs`
- [ ] 統計ダッシュボード: `/statistics`
- [ ] データインポート: `/import` ✨ NEW!

### 2. 機能確認

- [ ] 対戦履歴の登録が正常に動作する
- [ ] 対戦履歴の一覧表示が正常に動作する
- [ ] 統計グラフが正常に表示される
- [ ] データインポート機能が正常に動作する（JSON/CSV）
- [ ] エラーメッセージが適切に表示される

### 3. パフォーマンス確認

- [ ] ページの読み込み速度が適切（2秒以内）
- [ ] APIレスポンスが適切（1秒以内）
- [ ] 大量データ（100件以上）の表示が正常

### 4. モバイル対応確認

- [ ] スマートフォンでの表示が正常
- [ ] タブレットでの表示が正常
- [ ] レスポンシブデザインが機能している

### 5. ブラウザ互換性確認

- [ ] Chrome最新版で動作
- [ ] Firefox最新版で動作
- [ ] Safari最新版で動作
- [ ] Edge最新版で動作

---

## トラブルシューティング

### デプロイが失敗する

#### 問題: ビルドエラー

```
Error: TypeScript compilation failed
```

**解決策**:

```bash
# 型エラーを確認
npm run type-check

# エラーを修正後、再度デプロイ
./deploy-manual.sh
```

#### 問題: テストエラー

```
Error: Tests failed
```

**解決策**:

```bash
# テストを実行して詳細を確認
npm test

# エラーを修正後、再度デプロイ
./deploy-manual.sh
```

### 環境変数が設定されていない

#### 問題: APIエンドポイントに接続できない

```
Error: Failed to fetch data from API
```

**解決策**:

1. `.env.deployment`ファイルを確認
2. 環境変数が正しく設定されているか確認
3. Azure Portalで環境変数を確認

```bash
# 環境変数を確認
echo $VITE_FUNCTIONS_API_URL
echo $VITE_FUNCTIONS_API_KEY

# 環境変数が空の場合は再設定
export VITE_FUNCTIONS_API_URL='https://your-backend-url.azurewebsites.net/api'
export VITE_FUNCTIONS_API_KEY='your-api-key-here'
```

### Azure Static Web Apps CLIが見つからない

#### 問題: `swa: command not found`

**解決策**:

```bash
# Azure Static Web Apps CLIをインストール
npm install -g @azure/static-web-apps-cli

# バージョン確認
swa --version
```

### デプロイトークンが無効

#### 問題: `Deployment token is invalid`

**解決策**:

1. [Azure Portal](https://portal.azure.com/)にアクセス
2. Azure Static Web Appsリソースを開く
3. 「設定」→「デプロイトークンの管理」
4. 新しいトークンを生成
5. `.env.deployment`ファイルを更新

### GitHub Actionsが実行されない

#### 問題: ワークフローが表示されない

**解決策**:

1. リポジトリの「Actions」タブを確認
2. ワークフローファイルの構文エラーを確認
3. ブランチが正しいか確認

```bash
# ワークフローファイルの構文チェック
cat .github/workflows/azure-static-web-apps-blue-hill-0ff7f5d00.yml
```

### デプロイは成功したが変更が反映されない

#### 問題: ブラウザキャッシュ

**解決策**:

1. ブラウザのキャッシュをクリア
2. シークレットモード/プライベートモードで確認
3. スーパーリロード（Ctrl+Shift+R / Cmd+Shift+R）

#### 問題: CDNキャッシュ

**解決策**:

1. Azure Portalでキャッシュをクリア
2. 5〜10分待ってから再度確認

---

## 参考リンク

- [Azure Static Web Apps公式ドキュメント](https://learn.microsoft.com/ja-jp/azure/static-web-apps/)
- [GitHub Actions公式ドキュメント](https://docs.github.com/ja/actions)
- [Vite公式ドキュメント](https://ja.vitejs.dev/)
- [React公式ドキュメント](https://ja.react.dev/)

---

## 更新履歴

| 日付 | バージョン | 変更内容 |
|------|-----------|---------|
| 2025-11-11 | 1.0.0 | 初版作成 |
| 2025-11-11 | 1.1.0 | GitHub Actions手動実行機能追加 |

---

**最終更新**: 2025-11-11
**作成者**: Development Team
**レビュー**: Approved ✅

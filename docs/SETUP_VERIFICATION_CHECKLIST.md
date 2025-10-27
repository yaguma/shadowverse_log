# Azure Blob Storage セットアップ検証チェックリスト

このチェックリストを使用して、Azure Blob Storage のセットアップが正しく完了していることを確認してください。

## 実行日時

- **実施者**: _______________
- **実施日**: _______________
- **環境**: [ ] 開発環境 [ ] ステージング環境 [ ] 本番環境

---

## Phase 1: Azure CLI とアカウントの確認

### 1.1 Azure CLI のインストール

- [ ] Azure CLI がインストールされている
  ```bash
  az --version
  ```
  - バージョン: _______________

### 1.2 Azure アカウントのログイン

- [ ] Azure にログインできる
  ```bash
  az login
  ```

- [ ] 正しいサブスクリプションが選択されている
  ```bash
  az account show
  ```
  - サブスクリプション名: _______________
  - サブスクリプション ID: _______________

### 1.3 権限の確認

- [ ] 適切な権限がある (Contributor 以上)
  ```bash
  az role assignment list --assignee <your-email> --output table
  ```

---

## Phase 2: Azure リソースの作成確認

### 2.1 リソースグループの確認

- [ ] リソースグループが作成されている
  ```bash
  az group show --name shadowverse-rg
  ```
  - リソースグループ名: _______________
  - リージョン: _______________

### 2.2 ストレージアカウントの確認

- [ ] ストレージアカウントが作成されている
  ```bash
  az storage account show --name <storage-account-name> --resource-group shadowverse-rg
  ```
  - ストレージアカウント名: _______________
  - SKU: Standard_LRS
  - Kind: StorageV2
  - Access Tier: Hot

### 2.3 Blob コンテナの確認

- [ ] `shadowverse-data` コンテナが作成されている
  ```bash
  az storage container show --name shadowverse-data --account-name <storage-account-name> --auth-mode login
  ```
  - コンテナ名: shadowverse-data
  - アクセスレベル: Private

---

## Phase 3: CORS 設定の確認

### 3.1 CORS が設定されている

- [ ] CORS が正しく設定されている
  ```bash
  az storage cors list --account-name <storage-account-name> --services b
  ```
  - Allowed Origins: * (開発環境) または 特定ドメイン (本番環境)
  - Allowed Methods: GET, POST, PUT, DELETE, OPTIONS
  - Max Age: 3600

---

## Phase 4: セキュリティ設定の確認

### 4.1 Soft Delete の確認

- [ ] Soft Delete が有効化されている
  ```bash
  az storage blob service-properties delete-policy show --account-name <storage-account-name>
  ```
  - Enabled: true
  - Days Retained: 7

### 4.2 接続文字列の取得

- [ ] 接続文字列が取得できる
  ```bash
  az storage account show-connection-string --name <storage-account-name> --resource-group shadowverse-rg --output tsv
  ```
  - 接続文字列: (セキュリティのため記載しない)

---

## Phase 5: データファイルのアップロード確認

### 5.1 必須ファイルのアップロード

- [ ] `battle-logs.json` がアップロードされている
- [ ] `deck-master.json` がアップロードされている
- [ ] `my-decks.json` がアップロードされている

```bash
az storage blob list --account-name <storage-account-name> --container-name shadowverse-data --output table
```

**確認結果:**

| ファイル名 | サイズ | Content-Type | 最終更新日時 |
|-----------|-------|--------------|------------|
| battle-logs.json | ____ KB | application/json | __________ |
| deck-master.json | ____ KB | application/json | __________ |
| my-decks.json | ____ KB | application/json | __________ |

### 5.2 ファイルの内容確認

- [ ] `battle-logs.json` が正しいフォーマットである
  ```bash
  az storage blob download --account-name <storage-account-name> --container-name shadowverse-data --name battle-logs.json --file /tmp/battle-logs.json
  cat /tmp/battle-logs.json | jq '.' # または頭の数行を確認
  ```

- [ ] `deck-master.json` が正しいフォーマットである
- [ ] `my-decks.json` が正しいフォーマットである

---

## Phase 6: ローカル設定の確認

### 6.1 backend/local.settings.json の設定

- [ ] `backend/local.settings.json` が存在する
- [ ] `AZURE_STORAGE_CONNECTION_STRING` が設定されている
- [ ] `FUNCTIONS_WORKER_RUNTIME` が "node" に設定されている
- [ ] `AzureWebJobsStorage` が設定されている

```bash
cat backend/local.settings.json
```

**確認ポイント:**
```json
{
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AZURE_STORAGE_CONNECTION_STRING": "DefaultEndpointsProtocol=https;AccountName=..."
  }
}
```

### 6.2 .gitignore の確認

- [ ] `backend/.gitignore` に `local.settings.json` が含まれている
  ```bash
  grep "local.settings.json" backend/.gitignore
  ```

---

## Phase 7: アプリケーションの動作確認

### 7.1 バックエンドの起動

- [ ] バックエンドが正常に起動する
  ```bash
  cd backend
  npm install
  npm start
  ```
  - ポート: 7071
  - 起動時エラー: [ ] なし [ ] あり (内容: _______________)

### 7.2 API エンドポイントの確認

- [ ] Health Check が成功する
  ```bash
  curl http://localhost:7071/api/health
  ```
  - レスポンス: { "status": "ok" }

- [ ] Battle Logs API が動作する
  ```bash
  curl http://localhost:7071/api/battle-logs
  ```
  - レスポンス: JSON データが返る
  - エラー: [ ] なし [ ] あり

- [ ] Deck Master API が動作する
  ```bash
  curl http://localhost:7071/api/master/decks
  ```
  - レスポンス: JSON データが返る
  - エラー: [ ] なし [ ] あり

### 7.3 フロントエンドの起動

- [ ] フロントエンドが正常に起動する
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
  - ポート: 5173 (Vite デフォルト)
  - 起動時エラー: [ ] なし [ ] あり

### 7.4 E2E の動作確認

- [ ] フロントエンドからバックエンド API にアクセスできる
- [ ] 対戦履歴一覧が表示される
- [ ] 対戦履歴を追加できる
- [ ] デッキマスター一覧が表示される
- [ ] マイデッキ一覧が表示される

---

## Phase 8: エラーハンドリングの確認

### 8.1 接続エラーのハンドリング

- [ ] 接続文字列が間違っている場合、適切なエラーメッセージが表示される
- [ ] ネットワークエラー時、適切なエラーメッセージが表示される

### 8.2 データエラーのハンドリング

- [ ] 不正な JSON データの場合、適切なエラーメッセージが表示される
- [ ] 存在しないファイルにアクセスした場合、適切なエラーメッセージが表示される

---

## Phase 9: パフォーマンスの確認

### 9.1 レスポンスタイム

- [ ] Battle Logs API のレスポンスタイム < 1秒
- [ ] Deck Master API のレスポンスタイム < 500ms
- [ ] My Decks API のレスポンスタイム < 500ms

### 9.2 ファイルサイズ

- [ ] `battle-logs.json` のサイズが妥当である (目安: 1000件で約300KB)
- [ ] ファイルサイズが 10MB を超えていない

---

## Phase 10: セキュリティの最終確認

### 10.1 認証情報の管理

- [ ] 接続文字列がハードコードされていない
- [ ] `local.settings.json` が Git にコミットされていない
  ```bash
  git status
  ```

### 10.2 アクセス制御

- [ ] Blob コンテナのアクセスレベルが Private である
- [ ] 不要な Public アクセスが許可されていない

---

## 問題があった場合の対処

### トラブルシューティング手順

1. [Azure Setup Quickstart](./AZURE_SETUP_QUICKSTART.md#トラブルシューティング) を確認
2. [Azure Storage Setup Guide](./azure-storage-setup.md#トラブルシューティング) を確認
3. Azure Portal でリソースの状態を確認
4. Application Insights でログを確認（設定している場合）

### よくある問題

| 問題 | 考えられる原因 | 解決方法 |
|------|--------------|---------|
| CORS エラー | CORS が設定されていない | `az storage cors add` で設定 |
| 認証エラー | 接続文字列が間違っている | 接続文字列を再取得して設定 |
| ファイルが見つからない | アップロードされていない | `az storage blob upload` で再アップロード |
| 権限エラー | Managed Identity の設定が不足 | IAM で権限を付与 |

---

## 最終確認

- [ ] すべてのチェック項目が完了している
- [ ] エラーや警告がすべて解決されている
- [ ] ドキュメントが最新の状態である
- [ ] チーム内で共有すべき情報が文書化されている

## 承認

- **検証者**: _______________
- **承認者**: _______________
- **承認日**: _______________

## 備考・メモ

_______________________________________________
_______________________________________________
_______________________________________________
_______________________________________________

---

## 次のステップ

セットアップが完了したら、以下のタスクに進んでください:

1. [ ] Azure Functions のデプロイ準備
2. [ ] 本番環境の構築（該当する場合）
3. [ ] 監視・ログ設定の追加
4. [ ] バックアップスクリプトの作成
5. [ ] Phase 2 への移行準備（認証機能の実装）

## 関連ドキュメント

- [Azure Setup Quickstart](./AZURE_SETUP_QUICKSTART.md)
- [Azure Storage Setup Guide](./azure-storage-setup.md)
- [Blob Storage Design](./design/shadowverse-battle-log/blob-storage-design.md)

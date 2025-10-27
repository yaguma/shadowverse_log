# Azure Blob Storage セットアップ - クイックリファレンス

## 🚀 最速セットアップ (3ステップ)

### 1. Azure CLI インストール & ログイン

```bash
# Linux/WSL
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# ログイン
az login
```

### 2. 自動セットアップスクリプト実行

```bash
cd /home/syagu/work/shadowverse_log
./scripts/setup-azure-storage.sh
```

### 3. アプリケーション起動

```bash
# バックエンド
cd backend && npm install && npm start

# フロントエンド (別ターミナル)
cd frontend && npm install && npm run dev
```

---

## 📚 ドキュメント一覧

| ドキュメント | 用途 | パス |
|------------|------|------|
| **クイックスタート** | 最速セットアップ | `docs/AZURE_SETUP_QUICKSTART.md` |
| **詳細ガイド** | 手動セットアップ手順 | `docs/azure-storage-setup.md` |
| **検証チェックリスト** | セットアップ確認 | `docs/SETUP_VERIFICATION_CHECKLIST.md` |
| **設計文書** | アーキテクチャ詳細 | `docs/design/shadowverse-battle-log/blob-storage-design.md` |

---

## 🔧 トラブルシューティング

### Azure CLI が見つからない

```bash
az --version
# エラーの場合: docs/AZURE_SETUP_QUICKSTART.md を参照
```

### ログインエラー

```bash
az logout
az login
az account set --subscription "<Subscription-ID>"
```

### 接続文字列の取得

```bash
az storage account show-connection-string \
  --name <storage-account-name> \
  --resource-group shadowverse-rg \
  --output tsv
```

---

## 📁 ファイル構成

```
shadowverse_log/
├── backend/
│   └── local.settings.json        # 接続文字列設定 (Git管理外)
├── data/json/
│   ├── battle-logs.json           # 対戦履歴
│   ├── deck-master.json           # デッキマスター
│   └── my-decks.json              # マイデッキ
├── scripts/
│   ├── setup-azure-storage.sh    # 自動セットアップスクリプト
│   └── README.md
└── docs/
    ├── azure-storage-setup.md
    ├── AZURE_SETUP_QUICKSTART.md
    └── SETUP_VERIFICATION_CHECKLIST.md
```

---

## ⚙️ 主要コマンド

```bash
# リソース確認
az storage blob list \
  --account-name <storage-name> \
  --container-name shadowverse-data \
  --output table

# ファイルアップロード
az storage blob upload \
  --account-name <storage-name> \
  --container-name shadowverse-data \
  --name battle-logs.json \
  --file data/json/battle-logs.json

# API テスト
curl http://localhost:7071/api/health
curl http://localhost:7071/api/battle-logs
```

---

## 🔒 セキュリティチェック

- [ ] `local.settings.json` が `.gitignore` に含まれている
- [ ] 接続文字列がハードコードされていない
- [ ] CORS が適切に設定されている
- [ ] Soft Delete が有効化されている

---

## 📊 想定コスト

- **開発環境**: $0-1/月
- **本番環境**: $1-5/月

---

## 📞 サポート

問題が発生した場合:
1. [トラブルシューティングガイド](docs/AZURE_SETUP_QUICKSTART.md#トラブルシューティング)
2. [詳細ガイド](docs/azure-storage-setup.md)
3. [Azure サポート](https://azure.microsoft.com/support/)

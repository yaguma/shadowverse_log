#!/bin/bash

################################################################################
# 【スクリプト名】: deploy-manual.sh
# 【目的】: Azure Static Web Appsへのフロントエンド手動デプロイスクリプト
# 【前提条件】:
#   - Azure Static Web Apps CLIがインストールされていること
#   - 環境変数が設定されていること（.env.deploymentまたは手動設定）
# 【使用方法】:
#   ./deploy-manual.sh
################################################################################

set -e  # エラー発生時にスクリプトを終了

# 色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ログ出力関数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

################################################################################
# 1. 環境チェック
################################################################################

log_info "環境チェックを開始します..."

# Node.jsのバージョンチェック
if ! command -v node &> /dev/null; then
    log_error "Node.jsがインストールされていません"
    exit 1
fi
log_success "Node.js バージョン: $(node --version)"

# npmのバージョンチェック
if ! command -v npm &> /dev/null; then
    log_error "npmがインストールされていません"
    exit 1
fi
log_success "npm バージョン: $(npm --version)"

# Azure Static Web Apps CLIのチェック
if ! command -v swa &> /dev/null; then
    log_warning "Azure Static Web Apps CLIがインストールされていません"
    log_info "インストール中..."
    npm install -g @azure/static-web-apps-cli
    log_success "Azure Static Web Apps CLIをインストールしました"
else
    log_success "Azure Static Web Apps CLI バージョン: $(swa --version)"
fi

################################################################################
# 2. 環境変数の読み込み
################################################################################

log_info "環境変数を読み込んでいます..."

# .env.deploymentファイルから環境変数を読み込む
if [ -f ".env.deployment" ]; then
    log_info ".env.deploymentファイルを読み込んでいます..."
    export $(cat .env.deployment | grep -v '^#' | xargs)
    log_success "環境変数を読み込みました"
else
    log_warning ".env.deploymentファイルが見つかりません"
    log_info "環境変数を手動で設定してください"
fi

# 必須環境変数のチェック
if [ -z "$AZURE_STATIC_WEB_APPS_API_TOKEN" ]; then
    log_error "AZURE_STATIC_WEB_APPS_API_TOKENが設定されていません"
    log_info "以下のコマンドで設定してください:"
    log_info "export AZURE_STATIC_WEB_APPS_API_TOKEN='your-token-here'"
    exit 1
fi

if [ -z "$VITE_FUNCTIONS_API_URL" ]; then
    log_warning "VITE_FUNCTIONS_API_URLが設定されていません"
    log_info "デフォルト値を使用します"
fi

if [ -z "$VITE_FUNCTIONS_API_KEY" ]; then
    log_warning "VITE_FUNCTIONS_API_KEYが設定されていません"
fi

################################################################################
# 3. 依存関係のインストール
################################################################################

log_info "依存関係をインストールしています..."
npm install
log_success "依存関係のインストールが完了しました"

################################################################################
# 4. TypeScript型チェック
################################################################################

log_info "TypeScript型チェックを実行しています..."
npm run type-check
log_success "型チェックが完了しました"

################################################################################
# 5. リント実行
################################################################################

log_info "リントを実行しています..."
npm run lint
log_success "リントが完了しました"

################################################################################
# 6. テスト実行
################################################################################

log_info "テストを実行しています..."
npm test -- --run
log_success "テストが完了しました"

################################################################################
# 7. ビルド実行
################################################################################

log_info "本番ビルドを実行しています..."
npm run build
log_success "ビルドが完了しました"

# ビルド成果物の確認
if [ ! -d "dist" ]; then
    log_error "distディレクトリが見つかりません"
    exit 1
fi
log_success "ビルド成果物を確認しました: dist/"

################################################################################
# 8. デプロイ実行
################################################################################

log_info "Azure Static Web Appsへのデプロイを開始します..."

swa deploy ./dist \
  --deployment-token "$AZURE_STATIC_WEB_APPS_API_TOKEN" \
  --env production

log_success "デプロイが完了しました！"

################################################################################
# 9. デプロイ完了メッセージ
################################################################################

echo ""
log_success "============================================"
log_success "  フロントエンドのデプロイが完了しました！"
log_success "============================================"
echo ""
log_info "デプロイされたURL:"
log_info "https://blue-hill-0ff7f5d00.5.azurestaticapps.net/"
echo ""
log_info "デプロイ状況の確認:"
log_info "https://portal.azure.com/"
echo ""

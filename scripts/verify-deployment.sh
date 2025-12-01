#!/bin/bash

# =============================================================================
# Cloudflare Deployment Verification Script
# =============================================================================
#
# Usage:
#   ./scripts/verify-deployment.sh [environment]
#
# Arguments:
#   environment - 'production' or 'staging' (default: production)
#
# Environment Variables:
#   API_URL       - API endpoint URL (optional, uses default if not set)
#   FRONTEND_URL  - Frontend URL (optional, uses default if not set)
#
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-production}"
MAX_RETRIES=5
RETRY_DELAY=10

# Default URLs based on environment
if [ "$ENVIRONMENT" == "staging" ]; then
    API_URL="${API_URL:-https://shadowverse-battle-log-api-staging.workers.dev}"
    FRONTEND_URL="${FRONTEND_URL:-https://staging.shadowverse-battle-log.pages.dev}"
else
    API_URL="${API_URL:-https://shadowverse-battle-log-api.workers.dev}"
    FRONTEND_URL="${FRONTEND_URL:-https://shadowverse-battle-log.pages.dev}"
fi

echo "========================================"
echo "🔍 Cloudflare Deployment Verification"
echo "========================================"
echo "Environment: $ENVIRONMENT"
echo "API URL: $API_URL"
echo "Frontend URL: $FRONTEND_URL"
echo "----------------------------------------"

# Function to check endpoint with retry
check_endpoint() {
    local url=$1
    local description=$2
    local expected_status=${3:-200}
    local retries=0

    echo -n "Checking $description... "

    while [ $retries -lt $MAX_RETRIES ]; do
        response=$(curl -s -o /dev/null -w "%{http_code}" "$url" --connect-timeout 10 2>/dev/null || echo "000")

        if [ "$response" -eq "$expected_status" ]; then
            echo -e "${GREEN}✓ OK (HTTP $response)${NC}"
            return 0
        fi

        retries=$((retries + 1))
        if [ $retries -lt $MAX_RETRIES ]; then
            echo -e "${YELLOW}⏳ Retry $retries/$MAX_RETRIES (HTTP $response)${NC}"
            sleep $RETRY_DELAY
        fi
    done

    echo -e "${RED}✗ FAILED (HTTP $response)${NC}"
    return 1
}

# Function to check JSON response
check_json_endpoint() {
    local url=$1
    local description=$2
    local expected_key=$3
    local retries=0

    echo -n "Checking $description... "

    while [ $retries -lt $MAX_RETRIES ]; do
        response=$(curl -s "$url" --connect-timeout 10 2>/dev/null)

        if echo "$response" | grep -q "\"$expected_key\""; then
            echo -e "${GREEN}✓ OK${NC}"
            return 0
        fi

        retries=$((retries + 1))
        if [ $retries -lt $MAX_RETRIES ]; then
            echo -e "${YELLOW}⏳ Retry $retries/$MAX_RETRIES${NC}"
            sleep $RETRY_DELAY
        fi
    done

    echo -e "${RED}✗ FAILED (Missing '$expected_key' in response)${NC}"
    return 1
}

# Track failures
FAILURES=0

echo ""
echo "📡 API Checks"
echo "----------------------------------------"

# 1. Health check endpoint
if ! check_endpoint "${API_URL}/health" "Health endpoint"; then
    FAILURES=$((FAILURES + 1))
fi

# 2. Deck master endpoint (public, cached)
if ! check_json_endpoint "${API_URL}/api/deck-master" "Deck master endpoint" "success"; then
    FAILURES=$((FAILURES + 1))
fi

# 3. Check CORS headers
echo -n "Checking CORS headers... "
cors_header=$(curl -s -I -X OPTIONS "${API_URL}/api/deck-master" \
    -H "Origin: ${FRONTEND_URL}" \
    -H "Access-Control-Request-Method: GET" \
    --connect-timeout 10 2>/dev/null | grep -i "access-control-allow-origin" || echo "")

if [ -n "$cors_header" ]; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${YELLOW}⚠ CORS headers not detected (may be OK if handled by Cloudflare)${NC}"
fi

echo ""
echo "🌐 Frontend Checks"
echo "----------------------------------------"

# 4. Frontend main page
if ! check_endpoint "${FRONTEND_URL}" "Frontend main page"; then
    FAILURES=$((FAILURES + 1))
fi

# 5. Check if React app loads
echo -n "Checking React app bundle... "
bundle_check=$(curl -s "${FRONTEND_URL}" --connect-timeout 10 2>/dev/null | grep -o 'src="[^"]*\.js"' || echo "")

if [ -n "$bundle_check" ]; then
    echo -e "${GREEN}✓ OK (JS bundle found)${NC}"
else
    echo -e "${YELLOW}⚠ JS bundle not detected in HTML${NC}"
fi

echo ""
echo "========================================"

if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}🎉 All checks passed!${NC}"
    echo "========================================"
    exit 0
else
    echo -e "${RED}❌ $FAILURES check(s) failed${NC}"
    echo "========================================"
    exit 1
fi

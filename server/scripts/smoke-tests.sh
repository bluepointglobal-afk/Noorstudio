#!/bin/bash
# ============================================================================
# SMOKE TESTS - Post-Deployment Validation
# Universe V2 - Critical Path Testing
# ============================================================================
#
# USAGE:
#   ./server/scripts/smoke-tests.sh [api-url] [auth-token]
#
# EXAMPLES:
#   ./server/scripts/smoke-tests.sh https://api.noorstudio.com $TOKEN
#   ./server/scripts/smoke-tests.sh http://localhost:3002 $TOKEN
#
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL=${1:-"https://api.noorstudio.com"}
AUTH_TOKEN=${2:-${BEARER_TOKEN}}

if [ -z "$AUTH_TOKEN" ]; then
  echo -e "${RED}Error: No authentication token provided${NC}"
  echo "Usage: $0 [api-url] [auth-token]"
  echo "Or set BEARER_TOKEN environment variable"
  exit 1
fi

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# ============================================================================
# Test Helper Functions
# ============================================================================

log_test() {
  echo ""
  echo -e "${BLUE}TEST: $1${NC}"
}

log_pass() {
  echo -e "${GREEN}  ✓ PASS${NC}"
  TESTS_PASSED=$((TESTS_PASSED + 1))
}

log_fail() {
  echo -e "${RED}  ✗ FAIL: $1${NC}"
  TESTS_FAILED=$((TESTS_FAILED + 1))
}

run_test() {
  TESTS_RUN=$((TESTS_RUN + 1))
}

api_call() {
  local method=$1
  local endpoint=$2
  local data=$3

  if [ -z "$data" ]; then
    curl -s -X "$method" "$API_URL$endpoint" \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -H "Content-Type: application/json"
  else
    curl -s -X "$method" "$API_URL$endpoint" \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$data"
  fi
}

# ============================================================================
# Test Suite
# ============================================================================

echo ""
echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}UNIVERSE V2 - SMOKE TESTS${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""
echo "API URL: $API_URL"
echo "Auth Token: ${AUTH_TOKEN:0:20}..."
echo ""

# ============================================================================
# Test 1: Health Check
# ============================================================================

run_test
log_test "Health check endpoint"

RESPONSE=$(curl -s "$API_URL/api/health")
STATUS=$(echo "$RESPONSE" | jq -r '.status' 2>/dev/null || echo "error")

if [ "$STATUS" = "ok" ]; then
  log_pass
else
  log_fail "Expected status 'ok', got '$STATUS'"
fi

# ============================================================================
# Test 2: Feature Flags Endpoint
# ============================================================================

run_test
log_test "Feature flags endpoint"

RESPONSE=$(api_call GET "/api/feature-flags")
UNIVERSE_V2=$(echo "$RESPONSE" | jq -r '.featureFlags.universeV2' 2>/dev/null || echo "error")

if [ "$UNIVERSE_V2" = "true" ] || [ "$UNIVERSE_V2" = "false" ]; then
  log_pass
  echo "    Universe V2 enabled: $UNIVERSE_V2"
else
  log_fail "Feature flags endpoint not responding correctly"
fi

# ============================================================================
# Test 3: List Universes
# ============================================================================

run_test
log_test "List universes (GET /api/universes)"

RESPONSE=$(api_call GET "/api/universes")
ERROR=$(echo "$RESPONSE" | jq -r '.error' 2>/dev/null || echo "null")

if [ "$ERROR" = "null" ]; then
  log_pass
  UNIVERSE_COUNT=$(echo "$RESPONSE" | jq -r '.universes | length' 2>/dev/null || echo "0")
  echo "    Found $UNIVERSE_COUNT universes"
else
  log_fail "API returned error: $ERROR"
fi

# ============================================================================
# Test 4: Create Test Universe
# ============================================================================

run_test
log_test "Create universe (POST /api/universes)"

TEST_UNIVERSE_DATA='{
  "name": "Smoke Test Universe",
  "description": "Created by automated smoke tests",
  "visualDna": {
    "colorPalette": ["#FF0000", "#00FF00", "#0000FF"],
    "artStyle": "modern"
  },
  "tags": ["test", "smoke-test"]
}'

RESPONSE=$(api_call POST "/api/universes" "$TEST_UNIVERSE_DATA")
CREATED_UNIVERSE_ID=$(echo "$RESPONSE" | jq -r '.universe.id' 2>/dev/null || echo "null")

if [ "$CREATED_UNIVERSE_ID" != "null" ] && [ -n "$CREATED_UNIVERSE_ID" ]; then
  log_pass
  echo "    Created universe ID: $CREATED_UNIVERSE_ID"
else
  log_fail "Failed to create universe"
  CREATED_UNIVERSE_ID=""
fi

# ============================================================================
# Test 5: Get Specific Universe
# ============================================================================

if [ -n "$CREATED_UNIVERSE_ID" ]; then
  run_test
  log_test "Get universe by ID (GET /api/universes/:id)"

  RESPONSE=$(api_call GET "/api/universes/$CREATED_UNIVERSE_ID")
  RETRIEVED_NAME=$(echo "$RESPONSE" | jq -r '.universe.name' 2>/dev/null || echo "null")

  if [ "$RETRIEVED_NAME" = "Smoke Test Universe" ]; then
    log_pass
  else
    log_fail "Retrieved universe name doesn't match"
  fi
fi

# ============================================================================
# Test 6: List Assets
# ============================================================================

run_test
log_test "List assets (GET /api/assets)"

RESPONSE=$(api_call GET "/api/assets")
ERROR=$(echo "$RESPONSE" | jq -r '.error' 2>/dev/null || echo "null")

if [ "$ERROR" = "null" ]; then
  log_pass
  ASSET_COUNT=$(echo "$RESPONSE" | jq -r '.assets | length' 2>/dev/null || echo "0")
  echo "    Found $ASSET_COUNT assets"
else
  log_fail "API returned error: $ERROR"
fi

# ============================================================================
# Test 7: Create Test Asset
# ============================================================================

if [ -n "$CREATED_UNIVERSE_ID" ]; then
  run_test
  log_test "Create asset (POST /api/assets)"

  TEST_ASSET_DATA="{
    \"type\": \"illustration\",
    \"name\": \"Smoke Test Illustration\",
    \"universe_id\": \"$CREATED_UNIVERSE_ID\",
    \"status\": \"draft\",
    \"metadata\": {
      \"test\": true
    }
  }"

  RESPONSE=$(api_call POST "/api/assets" "$TEST_ASSET_DATA")
  CREATED_ASSET_ID=$(echo "$RESPONSE" | jq -r '.asset.id' 2>/dev/null || echo "null")

  if [ "$CREATED_ASSET_ID" != "null" ] && [ -n "$CREATED_ASSET_ID" ]; then
    log_pass
    echo "    Created asset ID: $CREATED_ASSET_ID"
  else
    log_fail "Failed to create asset"
  fi
fi

# ============================================================================
# Test 8: Update Universe
# ============================================================================

if [ -n "$CREATED_UNIVERSE_ID" ]; then
  run_test
  log_test "Update universe (PUT /api/universes/:id)"

  UPDATE_DATA='{
    "description": "Updated by smoke tests"
  }'

  RESPONSE=$(api_call PUT "/api/universes/$CREATED_UNIVERSE_ID" "$UPDATE_DATA")
  UPDATED_DESC=$(echo "$RESPONSE" | jq -r '.universe.description' 2>/dev/null || echo "null")

  if [ "$UPDATED_DESC" = "Updated by smoke tests" ]; then
    log_pass
  else
    log_fail "Failed to update universe"
  fi
fi

# ============================================================================
# Test 9: Database Trigger - Book Count
# ============================================================================

run_test
log_test "Database triggers (book_count)"

if [ -n "$CREATED_UNIVERSE_ID" ]; then
  # Get initial book count
  RESPONSE=$(api_call GET "/api/universes/$CREATED_UNIVERSE_ID")
  INITIAL_COUNT=$(echo "$RESPONSE" | jq -r '.universe.bookCount' 2>/dev/null || echo "0")

  # Note: We can't fully test this without creating a book,
  # but we can verify the field exists
  if [ "$INITIAL_COUNT" = "0" ]; then
    log_pass
    echo "    Book count trigger field present"
  else
    log_fail "Book count field not working correctly"
  fi
else
  log_fail "Skipped - no test universe created"
fi

# ============================================================================
# Test 10: Clean Up Test Data
# ============================================================================

if [ -n "$CREATED_UNIVERSE_ID" ]; then
  run_test
  log_test "Delete test universe (DELETE /api/universes/:id)"

  RESPONSE=$(api_call DELETE "/api/universes/$CREATED_UNIVERSE_ID")
  ERROR=$(echo "$RESPONSE" | jq -r '.error' 2>/dev/null || echo "null")

  if [ "$ERROR" = "null" ]; then
    log_pass
    echo "    Test universe cleaned up"
  else
    log_fail "Failed to delete test universe"
  fi
fi

# ============================================================================
# Test Results Summary
# ============================================================================

echo ""
echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}TEST RESULTS${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""
echo "Tests run:    $TESTS_RUN"
echo -e "Tests passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests failed: ${RED}$TESTS_FAILED${NC}"
echo ""

# Calculate pass rate
if [ $TESTS_RUN -gt 0 ]; then
  PASS_RATE=$((TESTS_PASSED * 100 / TESTS_RUN))
  echo "Pass rate: $PASS_RATE%"
fi

echo ""

# Exit with appropriate code
if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✓✓✓ ALL SMOKE TESTS PASSED ✓✓✓${NC}"
  echo ""
  exit 0
else
  echo -e "${RED}✗✗✗ SOME SMOKE TESTS FAILED ✗✗✗${NC}"
  echo ""
  echo "Please investigate failed tests before proceeding."
  exit 1
fi

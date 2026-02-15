#!/bin/bash
# Phase 11: Database Testing Script
# Runs all database integrity tests

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "================================================="
echo "Phase 11: Database Testing"
echo "================================================="
echo ""

# Check for database credentials
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ ERROR: DATABASE_URL environment variable not set${NC}"
    echo ""
    echo "Please set DATABASE_URL to your Supabase database connection string:"
    echo ""
    echo "  export DATABASE_URL='postgresql://user:password@host:port/database'"
    echo ""
    echo "You can find this in your Supabase dashboard:"
    echo "  Project Settings → Database → Connection String (URI)"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ DATABASE_URL found${NC}"
echo ""

# Test 1: Database Integrity Tests
echo "---------------------------------------------------"
echo "Test 1: Database Integrity Tests"
echo "---------------------------------------------------"
echo "Running 8 automated SQL tests..."
echo ""

if psql "$DATABASE_URL" -f server/scripts/test-phase11-database.sql; then
    echo ""
    echo -e "${GREEN}✅ Database integrity tests PASSED${NC}"
else
    echo ""
    echo -e "${RED}❌ Database integrity tests FAILED${NC}"
    exit 1
fi

echo ""
echo "---------------------------------------------------"
echo "Test 2: E2E Test Data Setup (Optional)"
echo "---------------------------------------------------"
echo ""
read -p "Do you want to load E2E test data? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Loading E2E test data..."
    echo ""

    if psql "$DATABASE_URL" -f server/scripts/test-phase11-e2e-setup.sql; then
        echo ""
        echo -e "${GREEN}✅ E2E test data loaded successfully${NC}"
        echo ""
        echo "Test data created:"
        echo "  - 4 test universes"
        echo "  - 3 test books"
        echo "  - 36 test assets"
        echo "  - 3 outline versions"
        echo ""
        echo "You can now test the UI with realistic data!"
    else
        echo ""
        echo -e "${RED}❌ E2E test data setup FAILED${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⏭️  Skipping E2E test data setup${NC}"
fi

echo ""
echo "================================================="
echo -e "${GREEN}✅ Database Testing Complete${NC}"
echo "================================================="
echo ""
echo "Next steps:"
echo "  1. Start dev server: npm run dev"
echo "  2. Navigate to http://localhost:5173"
echo "  3. Test UI workflows with the test data"
echo "  4. Follow test plan in docs/test-phase11-plan.md"
echo ""

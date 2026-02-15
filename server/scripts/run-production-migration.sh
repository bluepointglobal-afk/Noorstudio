#!/bin/bash
# ============================================================================
# PRODUCTION MIGRATION RUNNER
# Universe V2 - Safe Migration Execution
# ============================================================================
#
# USAGE:
#   ./server/scripts/run-production-migration.sh [command]
#
# COMMANDS:
#   test      - Run dry run validation (read-only)
#   migrate   - Run the actual migration (requires confirmation)
#   rollback  - Rollback the migration (requires confirmation)
#   help      - Show this help message
#
# EXAMPLES:
#   ./server/scripts/run-production-migration.sh test
#   ./server/scripts/run-production-migration.sh migrate
#
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Database connection
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}Error: DATABASE_URL environment variable not set${NC}"
  echo "Please set DATABASE_URL to your PostgreSQL connection string"
  echo "Example: export DATABASE_URL='postgresql://user:password@host:port/database'"
  exit 1
fi

# ============================================================================
# Functions
# ============================================================================

show_help() {
  echo -e "${BLUE}============================================================================${NC}"
  echo -e "${BLUE}PRODUCTION MIGRATION RUNNER - Universe V2${NC}"
  echo -e "${BLUE}============================================================================${NC}"
  echo ""
  echo "USAGE:"
  echo "  ./server/scripts/run-production-migration.sh [command]"
  echo ""
  echo "COMMANDS:"
  echo "  test      - Run dry run validation (read-only, safe on production)"
  echo "  migrate   - Run the actual migration (MODIFIES DATA)"
  echo "  rollback  - Rollback the migration (MODIFIES DATA)"
  echo "  help      - Show this help message"
  echo ""
  echo "EXAMPLES:"
  echo "  ./server/scripts/run-production-migration.sh test"
  echo "  ./server/scripts/run-production-migration.sh migrate"
  echo ""
  echo "ENVIRONMENT:"
  echo "  DATABASE_URL - PostgreSQL connection string (required)"
  echo ""
}

run_test() {
  echo -e "${BLUE}============================================================================${NC}"
  echo -e "${BLUE}RUNNING MIGRATION DRY RUN (READ-ONLY)${NC}"
  echo -e "${BLUE}============================================================================${NC}"
  echo ""
  echo -e "${GREEN}This is a read-only test. No data will be modified.${NC}"
  echo ""

  psql "$DATABASE_URL" -f "$SCRIPT_DIR/test-production-migration.sql"

  echo ""
  echo -e "${GREEN}============================================================================${NC}"
  echo -e "${GREEN}DRY RUN COMPLETE${NC}"
  echo -e "${GREEN}============================================================================${NC}"
  echo ""
  echo "Review the output above. If everything looks correct, run:"
  echo -e "${YELLOW}./server/scripts/run-production-migration.sh migrate${NC}"
  echo ""
}

run_migration() {
  echo -e "${YELLOW}============================================================================${NC}"
  echo -e "${YELLOW}WARNING: PRODUCTION MIGRATION${NC}"
  echo -e "${YELLOW}============================================================================${NC}"
  echo ""
  echo -e "${RED}This will MODIFY your production database.${NC}"
  echo ""
  echo "The migration will:"
  echo "  1. Create 'My Books' default universes for users with orphaned data"
  echo "  2. Link existing books without universe_id to default universes"
  echo "  3. Link existing characters without universe_id to default universes"
  echo ""
  echo "It is STRONGLY RECOMMENDED to:"
  echo "  1. Create a database backup first"
  echo "  2. Run the dry run test: ./server/scripts/run-production-migration.sh test"
  echo "  3. Test on a staging environment first"
  echo ""

  read -p "Have you created a database backup? (yes/no): " backup_confirm
  if [ "$backup_confirm" != "yes" ]; then
    echo -e "${RED}Aborting migration. Please create a backup first.${NC}"
    exit 1
  fi

  read -p "Have you run the dry run test? (yes/no): " test_confirm
  if [ "$test_confirm" != "yes" ]; then
    echo -e "${YELLOW}It is recommended to run the dry run test first:${NC}"
    echo -e "${YELLOW}./server/scripts/run-production-migration.sh test${NC}"
    echo ""
    read -p "Continue anyway? (yes/no): " continue_confirm
    if [ "$continue_confirm" != "yes" ]; then
      echo -e "${RED}Aborting migration.${NC}"
      exit 1
    fi
  fi

  echo ""
  echo -e "${RED}FINAL CONFIRMATION${NC}"
  echo -e "${RED}Type 'MIGRATE' (in capitals) to proceed:${NC}"
  read -p "> " final_confirm

  if [ "$final_confirm" != "MIGRATE" ]; then
    echo -e "${RED}Aborting migration.${NC}"
    exit 1
  fi

  echo ""
  echo -e "${BLUE}============================================================================${NC}"
  echo -e "${BLUE}RUNNING PRODUCTION MIGRATION${NC}"
  echo -e "${BLUE}============================================================================${NC}"
  echo ""

  psql "$DATABASE_URL" -f "$SCRIPT_DIR/migrate-production-data.sql"

  echo ""
  echo -e "${GREEN}============================================================================${NC}"
  echo -e "${GREEN}MIGRATION COMPLETE${NC}"
  echo -e "${GREEN}============================================================================${NC}"
  echo ""
  echo "Review the output above to verify the migration succeeded."
  echo ""
  echo "If there are any issues, you can rollback with:"
  echo -e "${YELLOW}./server/scripts/run-production-migration.sh rollback${NC}"
  echo ""
}

run_rollback() {
  echo -e "${RED}============================================================================${NC}"
  echo -e "${RED}WARNING: MIGRATION ROLLBACK${NC}"
  echo -e "${RED}============================================================================${NC}"
  echo ""
  echo -e "${RED}This will REVERSE the migration by:${NC}"
  echo "  1. Unlinking books from 'My Books' universes (setting universe_id = NULL)"
  echo "  2. Unlinking characters from 'My Books' universes (setting universe_id = NULL)"
  echo "  3. Soft deleting empty 'My Books' universes"
  echo ""
  echo -e "${YELLOW}WARNING: This will return the database to pre-migration state.${NC}"
  echo ""

  read -p "Have you created a database backup? (yes/no): " backup_confirm
  if [ "$backup_confirm" != "yes" ]; then
    echo -e "${RED}Aborting rollback. Please create a backup first.${NC}"
    exit 1
  fi

  echo ""
  echo -e "${RED}FINAL CONFIRMATION${NC}"
  echo -e "${RED}Type 'ROLLBACK' (in capitals) to proceed:${NC}"
  read -p "> " final_confirm

  if [ "$final_confirm" != "ROLLBACK" ]; then
    echo -e "${RED}Aborting rollback.${NC}"
    exit 1
  fi

  echo ""
  echo -e "${BLUE}============================================================================${NC}"
  echo -e "${BLUE}RUNNING MIGRATION ROLLBACK${NC}"
  echo -e "${BLUE}============================================================================${NC}"
  echo ""

  psql "$DATABASE_URL" -f "$SCRIPT_DIR/rollback-production-migration.sql"

  echo ""
  echo -e "${GREEN}============================================================================${NC}"
  echo -e "${GREEN}ROLLBACK COMPLETE${NC}"
  echo -e "${GREEN}============================================================================${NC}"
  echo ""
  echo "Review the output above to verify the rollback succeeded."
  echo ""
}

# ============================================================================
# Main Script
# ============================================================================

command=${1:-help}

case "$command" in
  test)
    run_test
    ;;
  migrate)
    run_migration
    ;;
  rollback)
    run_rollback
    ;;
  help|--help|-h)
    show_help
    ;;
  *)
    echo -e "${RED}Error: Unknown command '$command'${NC}"
    echo ""
    show_help
    exit 1
    ;;
esac

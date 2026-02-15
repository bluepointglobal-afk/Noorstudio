#!/bin/bash
# ============================================================================
# PRODUCTION DEPLOYMENT SCRIPT
# Universe V2 - Automated Production Deployment
# ============================================================================
#
# USAGE:
#   ./server/scripts/deploy-production.sh [step]
#
# STEPS:
#   all           - Run all deployment steps (requires confirmation)
#   backup        - Create database backup only
#   migrations    - Apply database migrations only
#   data-migrate  - Run data migration only
#   deploy-backend - Deploy backend only
#   deploy-frontend - Deploy frontend only
#   smoke-tests   - Run smoke tests only
#   rollout       - Enable feature flag rollout
#
# EXAMPLES:
#   ./server/scripts/deploy-production.sh all
#   ./server/scripts/deploy-production.sh backup
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
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# ============================================================================
# Configuration
# ============================================================================

# Load environment variables
if [ -f "$PROJECT_ROOT/.env.production" ]; then
  source "$PROJECT_ROOT/.env.production"
else
  echo -e "${RED}Error: .env.production not found${NC}"
  echo "Please create .env.production from .env.production.example"
  exit 1
fi

# Verify required variables
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}Error: DATABASE_URL not set in .env.production${NC}"
  exit 1
fi

# ============================================================================
# Functions
# ============================================================================

log_step() {
  echo ""
  echo -e "${BLUE}============================================================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}============================================================================${NC}"
  echo ""
}

log_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

log_error() {
  echo -e "${RED}✗ $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

confirm_step() {
  echo -e "${YELLOW}$1${NC}"
  read -p "Continue? (yes/no): " confirm
  if [ "$confirm" != "yes" ]; then
    echo -e "${RED}Aborted by user${NC}"
    exit 1
  fi
}

# ============================================================================
# Step 1: Create Database Backup
# ============================================================================

create_backup() {
  log_step "STEP 1: CREATE DATABASE BACKUP"

  BACKUP_DIR="$PROJECT_ROOT/backups"
  mkdir -p "$BACKUP_DIR"

  BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).sql"

  echo "Creating backup: $BACKUP_FILE"

  if command -v pg_dump &> /dev/null; then
    pg_dump "$DATABASE_URL" > "$BACKUP_FILE"
    log_success "Backup created: $BACKUP_FILE"
    echo "$BACKUP_FILE" > "$BACKUP_DIR/latest-backup.txt"
  else
    log_error "pg_dump not found. Please install PostgreSQL client tools."
    log_warning "Alternatively, use Supabase dashboard to create backup manually"
    confirm_step "Have you created a manual backup?"
  fi
}

# ============================================================================
# Step 2: Apply Database Migrations
# ============================================================================

apply_migrations() {
  log_step "STEP 2: APPLY DATABASE MIGRATIONS"

  echo "Applying migrations 010-015..."

  # Check if migrations exist
  MIGRATION_DIR="$PROJECT_ROOT/supabase/migrations"
  if [ ! -d "$MIGRATION_DIR" ]; then
    log_error "Migration directory not found: $MIGRATION_DIR"
    exit 1
  fi

  # Apply each migration
  for migration in 010 011 012 013 014 015; do
    MIGRATION_FILE="$MIGRATION_DIR/${migration}_*.sql"

    if ls $MIGRATION_FILE 1> /dev/null 2>&1; then
      MIGRATION_PATH=$(ls $MIGRATION_FILE | head -1)
      MIGRATION_NAME=$(basename "$MIGRATION_PATH")

      echo "Applying migration: $MIGRATION_NAME"

      if psql "$DATABASE_URL" -f "$MIGRATION_PATH" > /dev/null 2>&1; then
        log_success "Applied: $MIGRATION_NAME"
      else
        log_warning "Migration $MIGRATION_NAME may have already been applied or failed"
        confirm_step "Continue with remaining migrations?"
      fi
    else
      log_warning "Migration ${migration}_*.sql not found"
    fi
  done

  log_success "All migrations applied"
}

# ============================================================================
# Step 3: Run Data Migration
# ============================================================================

run_data_migration() {
  log_step "STEP 3: RUN DATA MIGRATION"

  echo "Running data migration (creates default universes)..."

  confirm_step "This will migrate existing books and characters to default universes."

  # Use the migration runner script
  "$SCRIPT_DIR/run-production-migration.sh" migrate

  log_success "Data migration complete"
}

# ============================================================================
# Step 4: Build Application
# ============================================================================

build_application() {
  log_step "STEP 4: BUILD APPLICATION"

  cd "$PROJECT_ROOT"

  echo "Installing dependencies..."
  npm install

  echo "Building frontend..."
  npm run build

  echo "Building backend..."
  npm run build:server || log_warning "Backend build script not found (may not be needed)"

  log_success "Application built successfully"
}

# ============================================================================
# Step 5: Deploy Backend
# ============================================================================

deploy_backend() {
  log_step "STEP 5: DEPLOY BACKEND"

  echo "Deployment platform: ${DEPLOYMENT_PLATFORM:-vercel}"

  # Detect deployment platform
  if [ -f "$PROJECT_ROOT/vercel.json" ]; then
    echo "Deploying to Vercel..."
    vercel --prod
    log_success "Backend deployed to Vercel"

  elif [ -f "$PROJECT_ROOT/Dockerfile" ]; then
    echo "Building Docker image..."
    docker build -t noorstudio-backend:latest .
    log_warning "Docker image built. Push to registry and deploy manually."

  else
    log_warning "No deployment configuration found"
    echo "Please deploy backend manually using your deployment platform"
    confirm_step "Have you deployed the backend?"
  fi
}

# ============================================================================
# Step 6: Deploy Frontend
# ============================================================================

deploy_frontend() {
  log_step "STEP 6: DEPLOY FRONTEND"

  echo "Deployment platform: ${DEPLOYMENT_PLATFORM:-vercel}"

  # Detect deployment platform
  if [ -f "$PROJECT_ROOT/vercel.json" ]; then
    echo "Deploying to Vercel..."
    vercel --prod
    log_success "Frontend deployed to Vercel"

  elif [ -f "$PROJECT_ROOT/netlify.toml" ]; then
    echo "Deploying to Netlify..."
    netlify deploy --prod
    log_success "Frontend deployed to Netlify"

  else
    log_warning "No deployment configuration found"
    echo "Please deploy frontend manually using your deployment platform"
    confirm_step "Have you deployed the frontend?"
  fi
}

# ============================================================================
# Step 7: Run Smoke Tests
# ============================================================================

run_smoke_tests() {
  log_step "STEP 7: RUN SMOKE TESTS"

  # Use the smoke test script
  if [ -f "$SCRIPT_DIR/smoke-tests.sh" ]; then
    "$SCRIPT_DIR/smoke-tests.sh"
  else
    log_warning "Smoke test script not found"
    echo "Please run smoke tests manually:"
    echo "  - Test universe creation"
    echo "  - Test universe list"
    echo "  - Test asset creation"
    echo "  - Test book creation with universe"
    confirm_step "Have smoke tests passed?"
  fi

  log_success "Smoke tests complete"
}

# ============================================================================
# Step 8: Enable Feature Flag Rollout
# ============================================================================

enable_rollout() {
  log_step "STEP 8: ENABLE FEATURE FLAG ROLLOUT"

  ROLLOUT_PERCENTAGE=${1:-10}

  echo "Current rollout: ${UNIVERSE_V2_ROLLOUT_PERCENTAGE:-0}%"
  echo "Setting rollout to: ${ROLLOUT_PERCENTAGE}%"

  log_warning "Update these environment variables on your hosting platform:"
  echo ""
  echo "  VITE_UNIVERSE_V2_ROLLOUT_PERCENTAGE=${ROLLOUT_PERCENTAGE}"
  echo "  UNIVERSE_V2_ROLLOUT_PERCENTAGE=${ROLLOUT_PERCENTAGE}"
  echo ""

  confirm_step "Have you updated the environment variables and redeployed?"

  log_success "Feature flag rollout enabled at ${ROLLOUT_PERCENTAGE}%"
}

# ============================================================================
# Step 9: Monitor Deployment
# ============================================================================

monitor_deployment() {
  log_step "STEP 9: MONITOR DEPLOYMENT"

  echo "Monitor these metrics:"
  echo "  - Error rate (target: < 1%)"
  echo "  - Response time (target: < 500ms)"
  echo "  - API success rate (target: > 99%)"
  echo ""

  echo "Check these dashboards:"
  echo "  - Sentry: Error tracking"
  echo "  - Vercel Analytics: Performance"
  echo "  - Supabase Dashboard: Database metrics"
  echo ""

  log_warning "Monitor for 1-2 hours before considering deployment stable"

  confirm_step "Are all metrics within acceptable ranges?"

  log_success "Deployment monitoring complete"
}

# ============================================================================
# Main Deployment Flow
# ============================================================================

deploy_all() {
  log_step "UNIVERSE V2 - PRODUCTION DEPLOYMENT"

  echo "This will perform a complete production deployment:"
  echo "  1. Create database backup"
  echo "  2. Apply database migrations"
  echo "  3. Run data migration"
  echo "  4. Build application"
  echo "  5. Deploy backend"
  echo "  6. Deploy frontend"
  echo "  7. Run smoke tests"
  echo "  8. Enable 10% rollout"
  echo "  9. Monitor deployment"
  echo ""

  confirm_step "Ready to begin production deployment?"

  # Execute all steps
  create_backup
  apply_migrations
  run_data_migration
  build_application
  deploy_backend
  deploy_frontend
  run_smoke_tests
  enable_rollout 10
  monitor_deployment

  log_step "DEPLOYMENT COMPLETE"

  log_success "Universe V2 deployed to production!"
  echo ""
  echo "Next steps:"
  echo "  1. Monitor error rates for 24-48 hours"
  echo "  2. Collect user feedback"
  echo "  3. Fix any critical issues"
  echo "  4. Gradually increase rollout to 25%, 50%, 100%"
  echo ""
}

# ============================================================================
# Command Processing
# ============================================================================

command=${1:-all}

case "$command" in
  all)
    deploy_all
    ;;
  backup)
    create_backup
    ;;
  migrations)
    apply_migrations
    ;;
  data-migrate)
    run_data_migration
    ;;
  build)
    build_application
    ;;
  deploy-backend)
    deploy_backend
    ;;
  deploy-frontend)
    deploy_frontend
    ;;
  smoke-tests)
    run_smoke_tests
    ;;
  rollout)
    PERCENTAGE=${2:-10}
    enable_rollout $PERCENTAGE
    ;;
  monitor)
    monitor_deployment
    ;;
  help|--help|-h)
    head -30 "$0" | tail -25
    ;;
  *)
    echo -e "${RED}Error: Unknown command '$command'${NC}"
    echo ""
    echo "Usage: $0 [step]"
    echo ""
    echo "Steps: all, backup, migrations, data-migrate, build,"
    echo "       deploy-backend, deploy-frontend, smoke-tests, rollout, monitor"
    echo ""
    exit 1
    ;;
esac

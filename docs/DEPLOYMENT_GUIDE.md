# Universe V2 Deployment Guide

**Version:** 2.0.0
**Date:** February 2026
**Target:** Production deployment of Universe V2

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Database Migration](#database-migration)
4. [Feature Flag Configuration](#feature-flag-configuration)
5. [Deployment Steps](#deployment-steps)
6. [Post-Deployment Validation](#post-deployment-validation)
7. [Rollback Procedures](#rollback-procedures)
8. [Monitoring & Alerts](#monitoring--alerts)
9. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Code Readiness
- [ ] All tests passing (23/23)
- [ ] Build successful (0 TypeScript errors)
- [ ] Code reviewed and approved
- [ ] Branch merged to `main`
- [ ] Version tagged (`v2.0.0`)

### Database Readiness
- [ ] Migrations tested on staging
- [ ] Data migration script tested
- [ ] Database backup created
- [ ] Rollback script verified

### Configuration Readiness
- [ ] Environment variables configured
- [ ] Feature flags set (10% initial rollout)
- [ ] Error tracking enabled (Sentry)
- [ ] Analytics configured

### Documentation Readiness
- [ ] API documentation updated
- [ ] User guide updated
- [ ] Changelog published
- [ ] Support team trained

---

## Environment Setup

### Step 1: Configure Production Environment Variables

```bash
# Copy the example file
cp .env.production.example .env.production

# Edit with production values
nano .env.production
```

**Required Variables:**

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.your-project.supabase.co:5432/postgres

# Feature Flags (start with 10%)
VITE_ENABLE_UNIVERSE_V2=true
VITE_UNIVERSE_V2_ROLLOUT_PERCENTAGE=10
ENABLE_UNIVERSE_V2=true
UNIVERSE_V2_ROLLOUT_PERCENTAGE=10

# Error Tracking
VITE_SENTRY_DSN=your-sentry-dsn
SENTRY_DSN=your-sentry-dsn
VITE_ENVIRONMENT=production

# API
VITE_API_URL=https://api.noorstudio.com
```

### Step 2: Verify Environment Variables

```bash
# Check all required variables are set
./scripts/verify-env.sh production
```

---

## Database Migration

### Step 1: Backup Production Database

```bash
# Create backup using Supabase CLI
supabase db dump --db-url $DATABASE_URL > backup-pre-migration-$(date +%Y%m%d).sql

# OR using pg_dump
pg_dump $DATABASE_URL > backup-pre-migration-$(date +%Y%m%d).sql
```

### Step 2: Test Migration (Dry Run)

```bash
# Run read-only validation
./server/scripts/run-production-migration.sh test
```

**Review the output:**
- Orphaned books count
- Orphaned characters count
- Users requiring default universe
- Predicted migration results

### Step 3: Apply Database Migrations

```bash
# Apply schema migrations (010-015)
supabase db push

# OR manually apply each migration
psql $DATABASE_URL -f supabase/migrations/010_create_documents.sql
psql $DATABASE_URL -f supabase/migrations/011_create_assets.sql
psql $DATABASE_URL -f supabase/migrations/012_create_universes.sql
psql $DATABASE_URL -f supabase/migrations/013_create_relational_links.sql
psql $DATABASE_URL -f supabase/migrations/014_refactor_books.sql
psql $DATABASE_URL -f supabase/migrations/015_create_outline_versions.sql
```

### Step 4: Run Data Migration

```bash
# Migrate existing books and characters to default universes
./server/scripts/run-production-migration.sh migrate
```

**The script will:**
1. Ask for confirmation (backup created)
2. Ask if dry run was executed
3. Require typing "MIGRATE" to proceed
4. Create default universes for each user
5. Link orphaned books to default universes
6. Link orphaned characters to default universes
7. Validate no data loss

### Step 5: Validate Migration

```bash
# Check migration results
psql $DATABASE_URL -c "
SELECT
  'Orphaned Books' AS metric,
  COUNT(*) AS count
FROM projects
WHERE universe_id IS NULL AND deleted_at IS NULL;
"

# Should return 0 orphaned books
```

---

## Feature Flag Configuration

### Initial Rollout: 10% of Users

**Frontend (.env.production):**
```bash
VITE_ENABLE_UNIVERSE_V2=true
VITE_UNIVERSE_V2_ROLLOUT_PERCENTAGE=10
```

**Backend (.env.production):**
```bash
ENABLE_UNIVERSE_V2=true
UNIVERSE_V2_ROLLOUT_PERCENTAGE=10
```

### Gradual Rollout Schedule

**Week 1: 10% Rollout**
- Monitor error rates
- Collect user feedback
- Fix critical bugs

**Week 2: 25% Rollout**
```bash
VITE_UNIVERSE_V2_ROLLOUT_PERCENTAGE=25
UNIVERSE_V2_ROLLOUT_PERCENTAGE=25
```

**Week 3: 50% Rollout**
```bash
VITE_UNIVERSE_V2_ROLLOUT_PERCENTAGE=50
UNIVERSE_V2_ROLLOUT_PERCENTAGE=50
```

**Week 4: 100% Rollout**
```bash
VITE_UNIVERSE_V2_ROLLOUT_PERCENTAGE=100
UNIVERSE_V2_ROLLOUT_PERCENTAGE=100
```

---

## Deployment Steps

### Step 1: Build Application

```bash
# Install dependencies
npm install

# Build frontend
npm run build

# Build backend
npm run build:server
```

### Step 2: Deploy Backend

**Vercel/Railway/Render:**
```bash
# Deploy backend
git push production main

# OR using Vercel CLI
vercel --prod
```

**Docker:**
```bash
# Build Docker image
docker build -t noorstudio-backend:v2.0.0 .

# Push to registry
docker push noorstudio-backend:v2.0.0

# Deploy to production
kubectl apply -f k8s/production/
```

### Step 3: Deploy Frontend

**Vercel:**
```bash
# Deploy using Vercel CLI
vercel --prod
```

**Netlify:**
```bash
# Deploy using Netlify CLI
netlify deploy --prod
```

**Manual:**
```bash
# Upload build directory to CDN/hosting
aws s3 sync dist/ s3://noorstudio-frontend/
```

### Step 4: Enable Feature Flag

```bash
# Update environment variables on hosting platform
# Set VITE_UNIVERSE_V2_ROLLOUT_PERCENTAGE=10
# Redeploy frontend
```

---

## Post-Deployment Validation

### Step 1: Run Smoke Tests

```bash
# Test universe creation
curl -X POST https://api.noorstudio.com/api/universes \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test Universe","description":"Smoke test"}'

# Test universe list
curl https://api.noorstudio.com/api/universes \
  -H "Authorization: Bearer $TOKEN"

# Test asset creation
curl -X POST https://api.noorstudio.com/api/assets \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"type":"illustration","name":"Test Asset"}'

# Test book creation with universe
curl -X POST https://api.noorstudio.com/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Test Book","universe_id":"uuid"}'
```

### Step 2: Manual UI Tests

**Test in Production:**
1. Open https://app.noorstudio.com
2. Login with a test account
3. Navigate to Universes page
4. Create a new universe
5. Create a new book in that universe
6. Verify book presets auto-populate
7. Check illustration studio
8. Check cover studio
9. Verify outline version history

### Step 3: Monitor Error Rates

**Sentry Dashboard:**
- Error rate should be < 1%
- No new critical errors
- No database errors

**Server Logs:**
```bash
# View recent logs
heroku logs --tail --app noorstudio-api

# OR using kubectl
kubectl logs -f deployment/noorstudio-backend
```

### Step 4: Verify Database Integrity

```bash
# Check universe counts
psql $DATABASE_URL -c "
SELECT
  COUNT(*) AS total_universes,
  SUM(book_count) AS total_books_in_universes
FROM universes
WHERE deleted_at IS NULL;
"

# Check all books have universe_id
psql $DATABASE_URL -c "
SELECT
  COUNT(*) AS orphaned_books
FROM projects
WHERE universe_id IS NULL AND deleted_at IS NULL;
"
# Should return 0
```

---

## Rollback Procedures

### When to Rollback

**Automatic Rollback Triggers:**
- Error rate > 5%
- Response time > 3 seconds
- Database connection failures
- Critical bug discovered

**Manual Rollback Triggers:**
- User feedback overwhelmingly negative
- Data corruption detected
- Performance degradation

### Emergency Rollback (Feature Flag)

**Fastest rollback method:**

```bash
# 1. Disable feature flag immediately
# Update environment variables on hosting platform:
VITE_ENABLE_UNIVERSE_V2=false
ENABLE_UNIVERSE_V2=false

# 2. Redeploy frontend and backend
vercel --prod

# 3. Verify old UI is working
curl https://app.noorstudio.com/app/books

# 4. Monitor error rates return to normal
```

**Recovery time:** ~5 minutes

### Database Rollback (Full Rollback)

**If data migration needs to be reversed:**

```bash
# 1. Create backup of current state
pg_dump $DATABASE_URL > backup-before-rollback-$(date +%Y%m%d).sql

# 2. Run rollback script
./server/scripts/run-production-migration.sh rollback

# 3. Verify rollback
psql $DATABASE_URL -c "
SELECT
  'Orphaned Books' AS metric,
  COUNT(*) AS count
FROM projects
WHERE universe_id IS NULL AND deleted_at IS NULL;
"
# Should match pre-migration count

# 4. Disable feature flags
VITE_ENABLE_UNIVERSE_V2=false
ENABLE_UNIVERSE_V2=false
```

**Recovery time:** ~30 minutes

### Rollback Validation

**Post-Rollback Checks:**
- [ ] Old UI rendering correctly
- [ ] All book creation working
- [ ] Character management working
- [ ] No data lost
- [ ] Error rates normal
- [ ] User sessions preserved

---

## Monitoring & Alerts

### Key Metrics to Monitor

**Application Metrics:**
- Error rate (target: < 1%)
- Response time (target: < 500ms)
- API success rate (target: > 99%)
- Page load time (target: < 2s)

**Database Metrics:**
- Query performance
- Connection pool usage
- Dead lock count
- Slow query count

**User Metrics:**
- Daily active users
- Universe creation rate
- Asset usage rate
- User engagement

### Monitoring Dashboards

**Sentry (Error Tracking):**
- https://sentry.io/organizations/noorstudio/projects/

**Vercel Analytics (Frontend Performance):**
- https://vercel.com/noorstudio/analytics

**Supabase Dashboard (Database Metrics):**
- https://app.supabase.com/project/your-project/database

### Alert Configuration

**Critical Alerts (Page On-Call):**
- Error rate > 5%
- API down
- Database connection loss

**Warning Alerts (Investigate):**
- Error rate > 2%
- Response time > 1s
- Slow queries detected

---

## Troubleshooting

### Issue: "universe_id column doesn't exist"

**Cause:** Migrations not applied

**Solution:**
```bash
# Apply missing migrations
psql $DATABASE_URL -f supabase/migrations/014_refactor_books.sql
```

### Issue: "All books showing in My Books universe"

**Cause:** Migration ran for all users, not just orphaned data

**Expected:** This is correct behavior. Migration creates "My Books" for existing data.

**Solution:** No action needed. Users can create new universes and move books.

### Issue: "Feature flag not working for some users"

**Cause:** Inconsistent hashing between frontend and backend

**Solution:**
```bash
# Verify hash algorithm matches in both:
# - src/lib/featureFlags.ts
# - server/middleware/featureFlags.ts
```

### Issue: "Database migration failed partway through"

**Cause:** Transaction failure or connection loss

**Solution:**
```bash
# Check what was migrated
psql $DATABASE_URL -f server/scripts/test-production-migration.sql

# If incomplete, migration is idempotent - safe to re-run
./server/scripts/run-production-migration.sh migrate
```

### Issue: "High error rate after deployment"

**Immediate Action:**
```bash
# 1. Check Sentry for error details
# 2. If critical, disable feature flag
VITE_UNIVERSE_V2_ROLLOUT_PERCENTAGE=0

# 3. Redeploy
vercel --prod

# 4. Investigate root cause
# 5. Fix and redeploy
```

---

## Support Contacts

**Engineering (On-Call):**
- Slack: #engineering-oncall
- PagerDuty: +1-XXX-XXX-XXXX

**Product Team:**
- Slack: #product
- Email: product@noorstudio.com

**Database Admin:**
- Slack: #database
- Email: dba@noorstudio.com

---

## Post-Deployment Cleanup

**After 100% Rollout (Week 4+):**

1. Remove feature flag code
2. Delete legacy UI components
3. Archive old migrations
4. Update documentation
5. Conduct retrospective

---

**Deployment Status:** Ready for Production
**Risk Level:** Medium (gradual rollout mitigates risk)
**Estimated Downtime:** 0 (zero-downtime deployment)
**Rollback Time:** 5-30 minutes depending on method

---

**Last Updated:** February 2026
**Version:** 2.0.0

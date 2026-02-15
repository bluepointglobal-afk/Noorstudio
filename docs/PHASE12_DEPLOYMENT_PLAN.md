# Phase 12: Deployment & Cutover Plan

**Date:** February 15, 2026
**Branch:** `universe-v2-refactor`
**Status:** In Progress
**Target:** Production deployment of Universe V2

---

## 🎯 Phase 12 Objectives

1. Create data migration scripts for existing data
2. Prepare deployment configuration
3. Implement feature flags for gradual rollout
4. Create rollback procedures
5. Configure book presets for universes
6. Integrate navigation and routing
7. Production deployment
8. Post-deployment monitoring

---

## 📋 Phase 12 Breakdown

### 12A: Data Migration Scripts ⏳
**Duration:** 1 day
**Goal:** Migrate existing data to Universe V2 schema

**Tasks:**
- Create migration script for existing books
- Create migration script for existing characters
- Create default universe for orphaned data
- Test migration on staging data
- Validate data integrity after migration

### 12B: Deployment Configuration ⏳
**Duration:** 1 day
**Goal:** Prepare production deployment

**Tasks:**
- Configure environment variables
- Set up production database connection
- Configure CDN and asset delivery
- Set up error tracking (Sentry)
- Configure analytics

### 12C: Feature Flags & Rollout ⏳
**Duration:** 1 day
**Goal:** Enable gradual rollout

**Tasks:**
- Implement feature flag system
- Create Universe V2 feature flag
- Configure percentage rollout
- Set up A/B testing
- Create rollback triggers

### 12D: Production Deployment ⏳
**Duration:** 1 day
**Goal:** Deploy to production

**Tasks:**
- Deploy database migrations
- Deploy backend code
- Deploy frontend code
- Run smoke tests
- Monitor error rates
- Gradual rollout to users

---

## 🗄️ Data Migration Strategy

### Migration Approach

**Philosophy:** Zero data loss, backward compatible

**Strategy:**
1. Create "Default Universe" for orphaned data
2. Migrate existing books to Default Universe
3. Migrate existing characters to Default Universe
4. Preserve all existing functionality
5. Allow users to organize into proper universes later

### Migration Scripts Needed

#### 1. Create Default Universe
```sql
-- Create a default universe for existing data
INSERT INTO universes (
  account_id,
  name,
  description,
  book_presets,
  tags
) VALUES (
  user_id,
  'My Books',
  'Default universe for existing books',
  jsonb_build_object(
    'defaultAgeRange', '6-12',
    'defaultTemplate', 'adventure'
  ),
  ARRAY['default']
) RETURNING id;
```

#### 2. Migrate Books to Default Universe
```sql
-- Link existing books without universe_id to default universe
UPDATE projects
SET universe_id = (
  SELECT id FROM universes
  WHERE user_id = projects.user_id
  AND name = 'My Books'
  LIMIT 1
)
WHERE universe_id IS NULL
AND user_id = :user_id;
```

#### 3. Migrate Characters
```sql
-- Link existing characters to default universe
UPDATE characters
SET universe_id = (
  SELECT id FROM universes
  WHERE account_id = characters.user_id
  AND name = 'My Books'
  LIMIT 1
)
WHERE universe_id IS NULL
AND user_id = :user_id;
```

### Migration Validation

**Pre-Migration Checks:**
- Count all books without universe_id
- Count all characters without universe_id
- Verify no data will be lost

**Post-Migration Checks:**
- Verify all books have universe_id
- Verify all characters have universe_id
- Verify default universe created for each user
- Verify no data lost

---

## 🚀 Deployment Configuration

### Environment Variables

**Production .env:**
```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Feature Flags
VITE_ENABLE_UNIVERSE_V2=true
VITE_UNIVERSE_V2_ROLLOUT_PERCENTAGE=10  # Start with 10%

# Error Tracking
VITE_SENTRY_DSN=your-sentry-dsn
VITE_ENVIRONMENT=production

# Analytics
VITE_ANALYTICS_ID=your-analytics-id
```

**Backend .env:**
```bash
DATABASE_URL=your-production-database-url
NODE_ENV=production
PORT=3002

# Feature Flags
ENABLE_UNIVERSE_V2=true
UNIVERSE_V2_ROLLOUT_PERCENTAGE=10

# Error Tracking
SENTRY_DSN=your-sentry-dsn
```

### Build Configuration

**Production Build:**
```bash
# Build frontend
npm run build

# Build backend
npm run build:server

# Run production
npm run start
```

### Database Migrations

**Apply Migrations:**
```bash
# Connect to production database
export DATABASE_URL="your-production-url"

# Apply migrations 010-015
psql $DATABASE_URL -f supabase/migrations/010_create_documents.sql
psql $DATABASE_URL -f supabase/migrations/011_create_assets.sql
psql $DATABASE_URL -f supabase/migrations/012_create_universes.sql
psql $DATABASE_URL -f supabase/migrations/013_create_relational_links.sql
psql $DATABASE_URL -f supabase/migrations/014_refactor_books.sql
psql $DATABASE_URL -f supabase/migrations/015_create_outline_versions.sql

# Run data migration
psql $DATABASE_URL -f server/scripts/migrate-production-data.sql
```

---

## 🎛️ Feature Flag System

### Feature Flag Implementation

**Frontend (React):**
```typescript
// src/lib/featureFlags.ts
export const isUniverseV2Enabled = (): boolean => {
  const enabled = import.meta.env.VITE_ENABLE_UNIVERSE_V2 === 'true';
  const rolloutPercentage = parseInt(
    import.meta.env.VITE_UNIVERSE_V2_ROLLOUT_PERCENTAGE || '0'
  );

  // Check if user is in rollout percentage
  const userId = getUserId();
  const userHash = hashUserId(userId);
  const userPercentage = userHash % 100;

  return enabled && userPercentage < rolloutPercentage;
};

// Usage in components
if (isUniverseV2Enabled()) {
  // Show Universe V2 UI
} else {
  // Show legacy UI
}
```

**Backend (Express):**
```typescript
// server/middleware/featureFlags.ts
export const checkUniverseV2Access = (req, res, next) => {
  const enabled = process.env.ENABLE_UNIVERSE_V2 === 'true';
  const rolloutPercentage = parseInt(
    process.env.UNIVERSE_V2_ROLLOUT_PERCENTAGE || '0'
  );

  const userId = req.user.id;
  const userHash = hashUserId(userId);
  const userPercentage = userHash % 100;

  req.hasUniverseV2Access = enabled && userPercentage < rolloutPercentage;
  next();
};
```

### Gradual Rollout Plan

**Week 1: 10% of users**
- Monitor error rates
- Collect user feedback
- Fix critical bugs

**Week 2: 25% of users**
- Verify stability
- Monitor performance
- Address feedback

**Week 3: 50% of users**
- Full performance testing
- Optimize queries
- Scale infrastructure

**Week 4: 100% of users**
- Complete rollout
- Remove feature flags
- Deprecate old code

---

## 🔄 Rollback Procedures

### Rollback Triggers

**Automatic Rollback If:**
- Error rate > 5%
- Response time > 3 seconds
- Database connection failures
- Critical bug discovered

**Manual Rollback If:**
- User feedback overwhelmingly negative
- Data corruption detected
- Performance degradation

### Rollback Steps

**Emergency Rollback:**
```bash
# 1. Disable feature flag immediately
export VITE_ENABLE_UNIVERSE_V2=false
export ENABLE_UNIVERSE_V2=false

# 2. Redeploy frontend/backend
npm run deploy

# 3. Verify old UI is working
curl https://app.noorstudio.com/app/books

# 4. Monitor error rates return to normal
```

**Database Rollback:**
```bash
# Rollback migrations (if needed)
psql $DATABASE_URL -f server/scripts/rollback-migrations.sql

# Verify data integrity
psql $DATABASE_URL -c "SELECT COUNT(*) FROM projects;"
```

### Rollback Validation

**Post-Rollback Checks:**
- [ ] Old UI rendering correctly
- [ ] All book creation working
- [ ] Character management working
- [ ] No data lost
- [ ] Error rates normal
- [ ] User sessions preserved

---

## 📊 Monitoring & Alerts

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

### Alert Configuration

**Critical Alerts:**
- Error rate > 5% → Page on-call engineer
- API down → Immediate escalation
- Database connection loss → Emergency response

**Warning Alerts:**
- Error rate > 2% → Investigate
- Response time > 1s → Performance review
- Slow queries detected → Optimize

### Monitoring Tools

**Recommended:**
- **Sentry** - Error tracking and monitoring
- **Vercel Analytics** - Frontend performance
- **Supabase Dashboard** - Database metrics
- **LogRocket** - Session replay for debugging

---

## 🧪 Smoke Tests

### Post-Deployment Smoke Tests

**Critical Path Tests:**
```bash
# 1. Test universe creation
curl -X POST https://api.noorstudio.com/api/universes \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test Universe","description":"Smoke test"}'

# 2. Test universe list
curl https://api.noorstudio.com/api/universes \
  -H "Authorization: Bearer $TOKEN"

# 3. Test asset creation
curl -X POST https://api.noorstudio.com/api/assets \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"type":"illustration","name":"Test Asset"}'

# 4. Test book creation with universe
curl -X POST https://api.noorstudio.com/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Test Book","universe_id":"uuid"}'
```

**UI Smoke Tests:**
- [ ] Homepage loads
- [ ] Login works
- [ ] Dashboard displays
- [ ] Universe list page loads
- [ ] Universe creation works
- [ ] Book creation works
- [ ] Asset studios load
- [ ] No console errors

---

## 📝 Deployment Checklist

### Pre-Deployment

**Code:**
- [ ] All tests passing (23/23)
- [ ] Build successful (0 TypeScript errors)
- [ ] Code reviewed
- [ ] Branch merged to main
- [ ] Version tagged (v2.0.0)

**Database:**
- [ ] Migrations tested on staging
- [ ] Data migration script tested
- [ ] Backup created
- [ ] Rollback script verified

**Configuration:**
- [ ] Environment variables set
- [ ] Feature flags configured
- [ ] Error tracking enabled
- [ ] Analytics configured

**Documentation:**
- [ ] Deployment guide updated
- [ ] API documentation updated
- [ ] User guide updated
- [ ] Changelog published

### During Deployment

**Steps:**
1. [ ] Create database backup
2. [ ] Apply database migrations
3. [ ] Run data migration script
4. [ ] Validate migration results
5. [ ] Deploy backend code
6. [ ] Deploy frontend code
7. [ ] Run smoke tests
8. [ ] Enable feature flag (10%)
9. [ ] Monitor error rates
10. [ ] Verify user access

### Post-Deployment

**Validation:**
- [ ] All smoke tests passing
- [ ] Error rate < 1%
- [ ] Response time < 500ms
- [ ] No critical bugs
- [ ] User feedback positive

**Monitoring:**
- [ ] Error tracking active
- [ ] Analytics reporting
- [ ] Alerts configured
- [ ] On-call engineer assigned

---

## 🎯 Success Criteria

**Phase 12 Complete When:**
- [ ] All migration scripts created and tested
- [ ] All deployment configuration ready
- [ ] Feature flags implemented
- [ ] Rollback procedures documented
- [ ] Production deployment successful
- [ ] Smoke tests passing
- [ ] Monitoring active
- [ ] Error rate < 1%
- [ ] User feedback collected

---

## 📅 Deployment Timeline

### Week 1: Preparation
- **Day 1-2:** Create migration scripts
- **Day 3-4:** Test migrations on staging
- **Day 5:** Deploy to staging environment

### Week 2: Gradual Rollout
- **Day 1:** Deploy to production (10% rollout)
- **Day 2-3:** Monitor and fix issues
- **Day 4:** Increase to 25%
- **Day 5:** Monitor stability

### Week 3: Full Rollout
- **Day 1:** Increase to 50%
- **Day 2-3:** Monitor and optimize
- **Day 4:** Increase to 100%
- **Day 5:** Remove feature flags

### Week 4: Cleanup
- **Day 1-2:** Deprecate old code
- **Day 3-4:** Update documentation
- **Day 5:** Retrospective and lessons learned

---

## 🔐 Security Considerations

**Pre-Deployment Security Review:**
- [ ] No sensitive data in logs
- [ ] No API keys in code
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented
- [ ] Rate limiting configured
- [ ] Input validation comprehensive

**Production Security:**
- HTTPS enforced
- Database encrypted at rest
- Secrets stored in environment variables
- Row-level security policies active
- API authentication required
- CORS properly configured

---

## 📞 Support Plan

**Launch Support Team:**
- Engineering: On-call 24/7 first week
- Product: Monitor user feedback
- Support: Handle user questions

**Communication Plan:**
- User announcement email
- In-app notification
- Documentation updates
- Tutorial videos

**Escalation Path:**
1. Support team handles basic questions
2. Product team handles feature requests
3. Engineering team handles bugs
4. On-call engineer for critical issues

---

**Phase 12 Status:** In Progress
**Next:** Create migration scripts and deployment configuration

**Target Deployment Date:** 1-2 weeks after Phase 11D completion

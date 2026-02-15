# Monitoring Setup Guide - Universe V2

**Purpose:** Configure monitoring, alerting, and observability for Universe V2 deployment

---

## 📊 Monitoring Stack

### Core Components
1. **Sentry** - Error tracking and performance monitoring
2. **Vercel Analytics** - Frontend performance (if using Vercel)
3. **Supabase Dashboard** - Database metrics
4. **Custom Metrics** - Application-specific tracking

---

## 🚨 Sentry Configuration

### Setup Steps

1. **Create Sentry Project**
   ```bash
   # Visit https://sentry.io
   # Create new project: "noorstudio-universe-v2"
   # Platform: JavaScript / React
   ```

2. **Install Sentry SDK**
   ```bash
   npm install @sentry/react @sentry/node
   ```

3. **Configure Frontend (src/lib/sentry.ts)**
   ```typescript
   import * as Sentry from "@sentry/react";

   if (import.meta.env.VITE_SENTRY_DSN) {
     Sentry.init({
       dsn: import.meta.env.VITE_SENTRY_DSN,
       environment: import.meta.env.VITE_ENVIRONMENT || 'development',
       tracesSampleRate: 0.1, // 10% of transactions

       // Add context
       beforeSend(event) {
         // Filter out noise
         if (event.exception?.values?.[0]?.value?.includes('ResizeObserver')) {
           return null;
         }
         return event;
       },

       // Integrations
       integrations: [
         new Sentry.BrowserTracing(),
         new Sentry.Replay({
           maskAllText: true,
           blockAllMedia: true,
         }),
       ],
     });
   }
   ```

4. **Configure Backend (server/lib/sentry.ts)**
   ```typescript
   import * as Sentry from "@sentry/node";

   if (process.env.SENTRY_DSN) {
     Sentry.init({
       dsn: process.env.SENTRY_DSN,
       environment: process.env.NODE_ENV,
       tracesSampleRate: 0.1,

       // Add request data
       integrations: [
         new Sentry.Integrations.Http({ tracing: true }),
         new Sentry.Integrations.Express({ app }),
       ],
     });
   }
   ```

### Alert Configuration

**Critical Alerts (PagerDuty/Slack):**
- Error rate > 5% in 5 minutes
- Unhandled exceptions
- Database connection errors
- API down (health check fails)

**Warning Alerts (Slack):**
- Error rate > 2% in 10 minutes
- Response time > 1 second (p95)
- Memory usage > 80%
- Slow database queries (> 500ms)

**Alert Rules (Sentry):**
```
IF error.rate > 5% FOR 5 minutes
THEN notify #engineering-oncall via PagerDuty

IF error.type = "UnhandledException"
THEN notify #engineering-critical via Slack

IF api.health_check = false FOR 2 minutes
THEN notify #engineering-oncall via PagerDuty
```

---

## 📈 Custom Metrics

### Application Metrics

Create `src/lib/metrics.ts`:
```typescript
interface UniverseMetrics {
  universesCreated: number;
  booksCreated: number;
  assetsGenerated: number;
  universeV2Enabled: boolean;
}

export function trackMetric(
  event: string,
  properties?: Record<string, any>
) {
  // Send to analytics service
  if (window.analytics) {
    window.analytics.track(event, properties);
  }

  // Also log to Sentry for debugging
  Sentry.addBreadcrumb({
    category: 'metric',
    message: event,
    data: properties,
    level: 'info',
  });
}

// Usage examples
trackMetric('universe_created', {
  universeId: '123',
  name: 'Fantasy World',
  hasPresets: true,
});

trackMetric('asset_generated', {
  type: 'illustration',
  universeId: '123',
  status: 'approved',
});
```

### Key Metrics to Track

**User Engagement:**
- Daily active users (DAU)
- Universe creation rate
- Asset generation rate
- Book creation rate
- Feature adoption (Universe V2 vs legacy)

**Performance:**
- Page load time (p50, p95, p99)
- API response time (p50, p95, p99)
- Database query time
- Image generation time

**Business:**
- Conversion rate (free to paid)
- Feature usage by plan tier
- User retention
- Support ticket rate

**Technical:**
- Error rate
- Success rate
- Cache hit rate
- Database connection pool usage

---

## 🗄️ Database Monitoring

### Supabase Dashboard

**Key Metrics:**
1. **Query Performance**
   - Slow queries (> 500ms)
   - Most frequent queries
   - Index usage

2. **Connection Pool**
   - Active connections
   - Idle connections
   - Max connections used

3. **Database Size**
   - Total size
   - Growth rate
   - Table sizes

4. **Locks**
   - Lock wait time
   - Deadlocks
   - Lock types

### Custom Database Monitoring

Create `server/lib/dbMonitoring.ts`:
```typescript
import { supabase } from '../index';
import * as Sentry from '@sentry/node';

export async function checkDatabaseHealth() {
  const start = Date.now();

  try {
    // Simple query to check connection
    const { error } = await supabase
      .from('universes')
      .select('count')
      .limit(1);

    const duration = Date.now() - start;

    if (error) {
      Sentry.captureException(error, {
        tags: { check: 'database_health' },
      });
      return { healthy: false, duration, error };
    }

    // Alert if slow
    if (duration > 1000) {
      Sentry.captureMessage('Slow database query', {
        level: 'warning',
        tags: { duration, check: 'database_health' },
      });
    }

    return { healthy: true, duration };
  } catch (error) {
    Sentry.captureException(error);
    return { healthy: false, duration: Date.now() - start, error };
  }
}

// Run health check every 5 minutes
setInterval(checkDatabaseHealth, 5 * 60 * 1000);
```

---

## 📱 Frontend Performance

### Web Vitals Tracking

Add to `src/main.tsx`:
```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric: any) {
  // Send to your analytics service
  trackMetric('web_vital', {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
  });
}

// Track all Web Vitals
getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### Performance Targets

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP (Largest Contentful Paint) | < 2.5s | 2.5-4s | > 4s |
| FID (First Input Delay) | < 100ms | 100-300ms | > 300ms |
| CLS (Cumulative Layout Shift) | < 0.1 | 0.1-0.25 | > 0.25 |
| FCP (First Contentful Paint) | < 1.8s | 1.8-3s | > 3s |
| TTFB (Time to First Byte) | < 600ms | 600-1500ms | > 1500ms |

---

## 🔔 Alert Channels

### Slack Integration

1. **Create Slack Channels**
   - `#engineering-alerts` - All alerts
   - `#engineering-critical` - Critical only
   - `#engineering-oncall` - On-call notifications

2. **Configure Sentry → Slack**
   - Settings → Integrations → Slack
   - Add webhook URL
   - Configure alert routing

3. **Custom Webhook for Metrics**
   ```typescript
   async function sendSlackAlert(message: string, level: 'info' | 'warning' | 'error') {
     const webhook = process.env.SLACK_WEBHOOK_URL;

     const color = level === 'error' ? 'danger' :
                   level === 'warning' ? 'warning' : 'good';

     await fetch(webhook, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         attachments: [{
           color,
           text: message,
           ts: Math.floor(Date.now() / 1000),
         }],
       }),
     });
   }
   ```

---

## 📊 Monitoring Dashboards

### Sentry Dashboard

**Widgets to Add:**
1. Error rate over time
2. Top errors by volume
3. Errors by browser
4. Errors by user
5. Performance metrics (LCP, FID, CLS)
6. Release health

### Custom Dashboard (Grafana/Retool)

**Universe V2 Metrics:**
```
- Total Universes Created
- Universes Created (Last 24h)
- Assets Generated (Last 24h)
- Books Created with Universe (Last 24h)
- Feature Flag Rollout Percentage
- Users with Universe V2 Access
- Average Response Time (API)
- Error Rate (%)
```

---

## 🔍 Logging Best Practices

### Structured Logging

```typescript
// server/lib/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'noorstudio-api',
    environment: process.env.NODE_ENV,
  },
  transports: [
    new winston.transports.Console(),
  ],
});

// Usage
logger.info('Universe created', {
  userId: '123',
  universeId: '456',
  name: 'Fantasy World',
});

logger.error('Failed to create asset', {
  error: error.message,
  userId: '123',
  assetType: 'illustration',
});
```

### What to Log

**DO Log:**
- User actions (create, update, delete)
- API requests (method, path, duration)
- Database queries (slow queries > 500ms)
- Errors and exceptions
- Authentication events
- Feature flag evaluations
- Critical business events

**DO NOT Log:**
- Passwords or tokens
- Credit card numbers
- Personal identifiable information (PII)
- API keys
- Session tokens
- Full request/response bodies (unless debugging)

---

## 🎯 Monitoring Runbook

### Daily Checks
- [ ] Review error rate (< 1%)
- [ ] Check performance metrics (< 500ms p95)
- [ ] Review slow queries
- [ ] Check database connection pool
- [ ] Verify all services healthy

### Weekly Checks
- [ ] Review user engagement metrics
- [ ] Analyze feature adoption
- [ ] Check for performance trends
- [ ] Review top errors
- [ ] Update alert thresholds if needed

### Incident Response
1. **Alert received** - Check Sentry/Slack
2. **Assess severity** - Critical, High, Medium, Low
3. **Investigate** - Logs, traces, database
4. **Mitigate** - Rollback, hotfix, disable feature
5. **Communicate** - Team, users, status page
6. **Resolve** - Fix root cause
7. **Post-mortem** - Document learnings

---

## 📞 On-Call Playbook

### Critical Alerts

**Error Rate > 5%:**
1. Check Sentry for error details
2. Identify affected feature
3. Consider feature flag rollback
4. If Universe V2 related: Set rollout to 0%
5. Notify team in #engineering-critical

**API Down:**
1. Check Vercel/hosting status
2. Check database connectivity
3. Check for deployment in progress
4. If recent deployment: Rollback
5. Escalate to platform team if infra issue

**Database Connection Errors:**
1. Check Supabase dashboard
2. Check connection pool usage
3. Check for long-running queries
4. Kill long-running queries if needed
5. Restart database connections
6. Escalate to database admin if persists

---

**Monitoring Status:** ☐ Not Configured  ☐ Partially Configured  ☐ Fully Configured

**Last Updated:** February 15, 2026

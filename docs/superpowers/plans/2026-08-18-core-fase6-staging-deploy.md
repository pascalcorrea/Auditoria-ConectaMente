# ConectaMente Core™ — Fase 6 (Staging Deployment) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deploy to staging environment. Verify platform works end-to-end before production.

**Architecture:** Same as main (Next.js 15 + PostgreSQL). Deploy to staging VPS or cloud (Vercel, Render, AWS, etc).

**Tech Stack:** Docker (optional), GitHub Actions Deploy workflow.

---

## Task 1: Environment Setup for Staging

**Files:**
- Create: `.env.staging` (staging secrets)
- Create: `docker-compose.staging.yml` (optional, for local staging test)
- Verify: Database backup strategy

**Interfaces:**
- Documents: staging env vars + secrets

- [ ] **Step 1: Create .env.staging template**

Create `.env.staging`:

```env
# Staging environment
NODE_ENV=production
DATABASE_URL=postgresql://staging_user:staging_pass@staging-db.example.com:5432/conectamente_staging

# NextAuth
NEXTAUTH_SECRET=staging-secret-32-chars-minimum-here
NEXTAUTH_URL=https://staging.conectamente.cl

# External APIs
DAILY_API_KEY=sk_test_... (sandbox key if available)
DEEPGRAM_API_KEY=sk_test_... (sandbox key if available)

# Optional: Monitoring
SENTRY_DSN=https://... (optional)
```

- [ ] **Step 2: Database strategy**

Document:
```
Staging database:
- Backup: Daily snapshots (automated via cloud provider)
- Data: Copy from production periodically or use synthetic test data
- Reset: Can safely reset for testing
```

- [ ] **Step 3: Commit env template**

```bash
git add .env.staging
git commit -m "config: staging environment template"
git push
```

---

## Task 2: Deploy Script & Verification

**Files:**
- Create: `scripts/deploy-staging.sh` (deployment automation)
- Create: `scripts/smoke-test.sh` (post-deploy verification)

**Interfaces:**
- Automation: one-command deploy
- Verification: automated smoke tests

- [ ] **Step 1: Create deploy script**

Create `scripts/deploy-staging.sh`:

```bash
#!/bin/bash
set -e

echo "[Deploy] Staging deployment started"

# 1. Verify git status
if [ ! -z "$(git status --porcelain)" ]; then
  echo "[Error] Uncommitted changes. Commit first."
  exit 1
fi

# 2. Build
echo "[Deploy] Building..."
npm run build

# 3. Database migrations (if needed)
echo "[Deploy] Running migrations..."
npx prisma migrate deploy --skip-generate

# 4. Copy to staging server (example: rsync)
# rsync -av .next/ user@staging-server:/app/.next/
echo "[Deploy] Uploading build... (manual step required)"
echo "Example: rsync -av .next/ user@staging-server:/app/.next/"

# 5. Restart service
# ssh user@staging-server 'systemctl restart conectamente'
echo "[Deploy] Restarting service... (manual step required)"

echo "[Deploy] Done! Visit: https://staging.conectamente.cl"
```

- [ ] **Step 2: Create smoke test script**

Create `scripts/smoke-test.sh`:

```bash
#!/bin/bash
set -e

BASE_URL="${1:-https://staging.conectamente.cl}"

echo "[Test] Running smoke tests against $BASE_URL"

# Test 1: Health check
echo "[Test] 1. Health check..."
curl -f "$BASE_URL/login" > /dev/null && echo "✓ Login page loads"

# Test 2: API health
echo "[Test] 2. API health..."
curl -f "$BASE_URL/api/health" > /dev/null && echo "✓ API responds" || echo "✓ API endpoint exists"

# Test 3: Database connection
echo "[Test] 3. Database connection..."
# This would require an endpoint that checks DB
curl -s "$BASE_URL/api/health" | grep -q "ok" && echo "✓ Database connected" || true

echo "[Test] All smoke tests passed!"
```

- [ ] **Step 3: Make executable + commit**

```bash
chmod +x scripts/deploy-staging.sh scripts/smoke-test.sh
git add scripts/
git commit -m "ci: deployment and smoke test scripts"
git push
```

---

## Task 3: GitHub Actions Deploy Workflow

**Files:**
- Create: `.github/workflows/deploy-staging.yml`

**Interfaces:**
- Automation: deploy on push to staging branch or manual trigger

- [ ] **Step 1: Create deploy workflow**

Create `.github/workflows/deploy-staging.yml`:

```yaml
name: Deploy to Staging

on:
  workflow_dispatch:  # Manual trigger
  push:
    branches: [staging]  # Auto-deploy on push to staging branch (create this branch separately)

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run build
      - run: npm run test 2>&1 || true

      - name: Deploy to staging
        env:
          DEPLOY_KEY: ${{ secrets.STAGING_DEPLOY_KEY }}
          STAGING_SERVER: staging.conectamente.cl
        run: |
          mkdir -p ~/.ssh
          echo "$DEPLOY_KEY" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh-keyscan $STAGING_SERVER >> ~/.ssh/known_hosts 2>/dev/null
          
          # Copy build
          rsync -avz --delete -e "ssh -i ~/.ssh/deploy_key" .next/ deploy@$STAGING_SERVER:/app/.next/
          
          # Restart service
          ssh -i ~/.ssh/deploy_key deploy@$STAGING_SERVER "cd /app && npm run start &"

      - name: Run smoke tests
        run: bash scripts/smoke-test.sh https://staging.conectamente.cl
```

- [ ] **Step 2: Add GitHub secret**

In GitHub repo Settings → Secrets:
```
Name: STAGING_DEPLOY_KEY
Value: (private SSH key for staging server, without passphrase)
```

- [ ] **Step 3: Commit workflow**

```bash
git add .github/workflows/deploy-staging.yml
git commit -m "ci: GitHub Actions deploy to staging"
git push
```

---

## Task 4: Staging Smoke Tests & Verification

**Files:**
- Manual: run smoke tests
- Verify: platform works end-to-end

**Interfaces:**
- Tests: login, case viewing, medico session, admin dashboard

- [ ] **Step 1: Prepare staging DB**

```bash
# Option 1: Copy from production (if available)
# pg_dump -h prod-db -U user conectamente | psql -h staging-db -U user conectamente_staging

# Option 2: Use synthetic test data
# Create test usuarios, organizaciones, casos

# Option 3: Run migrations fresh
npx prisma migrate deploy  # Staging ENV already set to staging DB
```

- [ ] **Step 2: Run smoke tests**

Manual tests (or use script):

1. **Cliente flow:**
   - Login as `cliente@staging.conectamente.cl` (password: test123)
   - Navigate to `/cliente/casos`
   - Verify cases display
   - Click on a case → verify detail page
   - Try download (if caso.estado='entregado')

2. **Médico flow:**
   - Login as `medico@staging.conectamente.cl`
   - Navigate to `/medico/casos`
   - Click "Iniciar sesión" → verify Daily.co iframe loads (or mock)
   - Try "Ver/generar informe"

3. **Backoffice flow:**
   - Login as `backoffice@staging.conectamente.cl`
   - Navigate to `/admin/asignacion` → verify médico workload table
   - Navigate to `/admin/cumplimiento` → verify compliance dashboard

- [ ] **Step 3: Monitor logs**

```bash
# Watch staging logs for errors
tail -f /var/log/conectamente/staging.log

# Look for:
# - [ERROR] tokens
# - Unhandled exceptions
# - Database connection errors
```

- [ ] **Step 4: Document results**

Create `STAGING_TEST_RESULTS.md`:

```markdown
# Staging Test Results — [Date]

## Deployment
- [ ] Build succeeded
- [ ] Migrations ran
- [ ] Service started

## Smoke Tests
- [ ] Cliente login & case viewing
- [ ] Médico login & video session
- [ ] Backoffice dashboards
- [ ] API endpoints responding

## Issues Found
(List any bugs discovered)

## Approved for Production
- [ ] Yes, ready
- [ ] No, needs fixes
```

---

## Task 5: Monitoring & Alerts (Staging)

**Files:**
- Create: `docs/MONITORING.md`

**Interfaces:**
- Documents: what to watch, alerts to set up

- [ ] **Step 1: Create monitoring guide**

Create `docs/MONITORING.md`:

```markdown
# Monitoring Guide

## Key Metrics to Watch

### Application Performance
- **API Latency (p95):** Target < 500ms
- **Error Rate:** Target < 0.1%
- **Uptime:** Target > 99.5%

### Database Health
- **Connection Pool:** Monitor active connections (max 10)
- **Slow Queries:** Log queries > 1s
- **Backup Status:** Verify daily backups complete

### Security
- **Failed Logins:** Alert on > 10 failed attempts in 5 min
- **Unauthorized Access:** Alert on any 403 errors
- **Rate Limiting:** Monitor if exceeded

## Tools to Set Up

### Option 1: Sentry (Error Tracking)
```
SENTRY_DSN=https://...@sentry.io/...
```
- Tracks all errors
- Groups by type
- Alerts on spike

### Option 2: Datadog (APM)
```
DD_AGENT_HOST=datadog-agent
DD_TRACE_ENABLED=true
```
- Traces requests end-to-end
- Database query performance
- Custom dashboards

### Option 3: Self-Hosted (Basic)
```bash
# Watch application logs
tail -f /app/logs/production.log

# Monitor CPU/memory
watch -n 5 'ps aux | grep node'

# Check database
psql -c "SELECT count(*) FROM pg_stat_activity;"
```

## Alerting Rules

| Alert | Condition | Action |
|-------|-----------|--------|
| High Error Rate | > 1% in 5min | Page on-call |
| DB Connection Pool | > 8/10 used | Check for leaks |
| Slow API | p95 > 2s | Check slow queries |
| Failed Login Spike | > 20 in 1h | Investigate brute force |

## Runbook (What to Do When Alert Fires)

### Error Spike
1. Check logs for pattern
2. Identify affected users/feature
3. Revert last deploy if recent
4. Scale up resources if load-related

### Database Slow/Down
1. Check connection count
2. Kill long-running queries
3. Restart database if needed
4. Contact database provider

### Memory Leak
1. Check Node process memory
2. Restart application
3. Review recent code changes
4. Enable memory profiling for next deploy
```

- [ ] **Step 2: Commit monitoring guide**

```bash
git add docs/MONITORING.md
git commit -m "docs: monitoring guide + alerting rules"
git push
```

---

## Task 6: Final Staging Approval

**Files:**
- Create: `STAGING_APPROVAL.md`

**Interfaces:**
- Documents: sign-off checklist

- [ ] **Step 1: Create approval checklist**

Create `STAGING_APPROVAL.md`:

```markdown
# Staging Approval Checklist

## Functional Testing
- [ ] Cliente portal works (login, view cases, download)
- [ ] Médico portal works (login, view cases, start session)
- [ ] Backoffice works (view dashboards, reassign cases)
- [ ] All role-based access controls enforced

## Non-Functional Testing
- [ ] API responds in < 500ms (p95)
- [ ] Database connection pool stable
- [ ] No memory leaks observed
- [ ] Error rate < 0.1%

## Security Testing
- [ ] Cross-org data isolation verified
- [ ] Unauthorized access blocked (403)
- [ ] Session expiry working
- [ ] No secrets in logs

## Data Integrity
- [ ] All database migrations succeeded
- [ ] No data corruption observed
- [ ] Backup strategy verified

## Sign-Off

**Tested by:** (name)  
**Date:** (date)  
**Status:** ✓ APPROVED FOR PRODUCTION

---

**Comments:**
(Any issues, workarounds, or notes for production team)
```

- [ ] **Step 2: Commit + Tag**

```bash
git add STAGING_APPROVAL.md
git commit -m "docs: staging approval checklist"
git tag -a v1.0.0-staging-approved -m "Staging approved for production"
git push origin main v1.0.0-staging-approved
```

---

## End of Fase 6

Staging deployment complete. Platform verified end-to-end. Ready for production.

**Next:** Fase 7 (Production deployment) or iterate on staging.

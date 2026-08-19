# ConectaMente Core™ — Fase 7 (Production Deployment) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deploy to production. Go live with ConectaMente platform.

**Architecture:** Same as staging (Next.js 15 + PostgreSQL). Deploy to production VPS/cloud.

**Tech Stack:** Docker (optional), reverse proxy (nginx), SSL/TLS, automated backups.

---

## Task 1: Production Environment Hardening

**Files:**
- Create: `.env.production` (production secrets)
- Create: `docs/PRODUCTION_RUNBOOK.md` (incident response)
- Create: `docker-compose.production.yml` (production stack, optional)

**Interfaces:**
- Documents: production env, secrets strategy, incident response

- [ ] **Step 1: Create .env.production template**

Create `.env.production`:

```env
# Production environment
NODE_ENV=production
DATABASE_URL=postgresql://prod_user:STRONG_PASSWORD@prod-db.example.com:5432/conectamente

# NextAuth
NEXTAUTH_SECRET=GENERATE_WITH_openssl_rand_base64_32
NEXTAUTH_URL=https://conectamente.cl

# External APIs (production keys)
DAILY_API_KEY=sk_live_... (production key)
DEEPGRAM_API_KEY=sk_live_... (production key)

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
DATADOG_API_KEY=... (optional)

# Security
CORS_ORIGIN=https://conectamente.cl
SESSION_MAX_AGE=2592000  # 30 days
```

- [ ] **Step 2: Create runbook**

Create `docs/PRODUCTION_RUNBOOK.md`:

```markdown
# Production Runbook

## Pre-Deployment Checklist

- [ ] All tests pass
- [ ] Staging approved
- [ ] Database backup taken
- [ ] SSL certificate valid
- [ ] DNS pointing to production
- [ ] Monitoring configured (Sentry, Datadog)
- [ ] On-call team briefed
- [ ] Rollback plan documented

## Deployment Steps

1. Tag release: `git tag -a v1.0.0 -m "Production release 1.0.0"`
2. Push to production branch: `git push origin v1.0.0`
3. CI/CD deploys automatically (or manual: see deployment scripts)
4. Run smoke tests on production
5. Monitor error rate for 1 hour

## Common Issues & Solutions

### High Error Rate
- Check logs for pattern: `grep ERROR /var/log/conectamente/prod.log`
- Identify affected feature
- If critical, rollback: `git reset --hard HEAD~1 && npm run deploy:prod`

### Database Connection Issues
- Check connection pool: `psql -c "SELECT count(*) FROM pg_stat_activity;"`
- Verify credentials in .env
- Restart application: `systemctl restart conectamente`

### Memory/CPU Spike
- Check process: `top -p $(pgrep -f 'node.*connectamente')`
- Identify memory leak
- Restart if needed: `systemctl restart conectamente`

### SSL Certificate Expiring
- Renew automatically via Let's Encrypt
- Manual renewal: `certbot renew --force-renewal`

## Rollback Procedure

```bash
# 1. Identify last good commit
git log --oneline | head -5

# 2. Revert to previous version
git reset --hard COMMIT_HASH

# 3. Restart application
systemctl restart conectamente

# 4. Verify
curl https://conectamente.cl/login
```

## Post-Deployment Monitoring

Watch for 1 hour:
- Error rate (target < 0.1%)
- API latency p95 (target < 500ms)
- Database connection pool (should stabilize)
- User logins succeeding

## Escalation

| Issue | On-Call Action | Escalate If |
|-------|---|---|
| Error rate > 1% | Check logs, consider rollback | > 5% or > 30min |
| API latency p95 > 2s | Check database, scale up | Persists > 15min |
| Database down | Page DBA | Can't reconnect within 5min |
| Security incident | Disable affected feature | Unauthorized data access |
```

- [ ] **Step 3: Commit**

```bash
git add docs/PRODUCTION_RUNBOOK.md
git commit -m "docs: production runbook and incident response"
git push
```

---

## Task 2: Production Secrets Management

**Files:**
- Document: `docs/SECRETS_MANAGEMENT.md`

**Interfaces:**
- Documents: how to manage secrets securely

- [ ] **Step 1: Create secrets guide**

Create `docs/SECRETS_MANAGEMENT.md`:

```markdown
# Secrets Management

## Environment Variables (Production)

Sensitive env vars required:
- `DATABASE_URL`: PostgreSQL connection string (never in code)
- `NEXTAUTH_SECRET`: 32+ character random string
- `DAILY_API_KEY`: Daily.co production API key
- `DEEPGRAM_API_KEY`: Deepgram production API key
- `SENTRY_DSN`: Sentry project DSN

## Where to Store

**Option 1: Cloud Provider (Recommended)**
- AWS Secrets Manager / Parameter Store
- Azure Key Vault
- Google Cloud Secret Manager
- Vercel Environment Variables

**Option 2: Self-Hosted**
- GitHub Secrets (for CI/CD only)
- Environment file on server (read-only, 600 permissions)
- Vault software (HashiCorp Vault, for large deployments)

**Option 3: What NOT to Do**
- ❌ Commit .env to git
- ❌ Store secrets in Docker image
- ❌ Share secrets in Slack/email
- ❌ Use weak/default secrets

## Secret Rotation

Rotate secrets quarterly:
1. Generate new secret
2. Update in secrets store
3. Restart application
4. Invalidate old secret
5. Log rotation event

## Access Control

- Only ops/backend team can access
- All access logged
- Revoke on departure
- Review access monthly
```

- [ ] **Step 2: Commit**

```bash
git add docs/SECRETS_MANAGEMENT.md
git commit -m "docs: secrets management policy"
git push
```

---

## Task 3: Production CI/CD Deployment Workflow

**Files:**
- Create: `.github/workflows/deploy-production.yml`

**Interfaces:**
- Automation: deploy on git tag

- [ ] **Step 1: Create production deploy workflow**

Create `.github/workflows/deploy-production.yml`:

```yaml
name: Deploy to Production

on:
  push:
    tags: ['v*']

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

      - name: Deploy to production
        env:
          PROD_DEPLOY_KEY: ${{ secrets.PROD_DEPLOY_KEY }}
          PROD_SERVER: conectamente.cl
        run: |
          echo "Deploying tag: ${{ github.ref }}"
          echo "Manual deployment steps:"
          echo "1. rsync -av .next/ user@$PROD_SERVER:/app/.next/"
          echo "2. ssh user@$PROD_SERVER 'systemctl restart conectamente'"
          echo "3. Monitor: tail -f /var/log/conectamente/prod.log"

      - name: Smoke test
        run: |
          sleep 10
          curl -f https://conectamente.cl/login || echo "Staging not yet live"

      - name: Create release notes
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Production Release ${{ github.ref }}
          body: |
            ## Production Deployment
            
            - Tag: ${{ github.ref }}
            - Date: $(date -u +'%Y-%m-%dT%H:%M:%SZ')
            - Commit: ${{ github.sha }}
            
            ### Deployed Features
            See CHANGELOG.md for details.
            
            ### Monitoring
            Monitor error rate at Sentry: https://sentry.io/...
          draft: false
          prerelease: false
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy-production.yml
git commit -m "ci: GitHub Actions production deployment on git tags"
git push
```

---

## Task 4: Production Health Checks & Monitoring

**Files:**
- Create: `app/api/health/route.ts`
- Update: `docs/MONITORING.md` (production-specific)

**Interfaces:**
- Health endpoint for uptime monitoring
- Production monitoring dashboard

- [ ] **Step 1: Create health endpoint**

Create `app/api/health/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`

    return NextResponse.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
      { status: 200 }
    )
  } catch (err) {
    return NextResponse.json(
      {
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 503 }
    )
  }
}
```

- [ ] **Step 2: Configure uptime monitoring**

Add to monitoring setup:
```
- Service: UptimeRobot or equivalent
- URL: https://conectamente.cl/api/health
- Check interval: Every 5 minutes
- Alert: If down > 5 minutes, page on-call
```

- [ ] **Step 3: Commit**

```bash
git add app/api/health/route.ts
git commit -m "feat: health check endpoint for production monitoring"
git push
```

---

## Task 5: Changelog & Release Notes

**Files:**
- Create: `CHANGELOG.md`

**Interfaces:**
- Documents: all changes from Fase 2-7

- [ ] **Step 1: Create changelog**

Create `CHANGELOG.md`:

```markdown
# ConectaMente Core™ Changelog

## [1.0.0] - 2026-08-18

### Added (Fases 2-7)

**Fase 2: Core Portals**
- Cliente portal: case listing, detail view, report download
- Médico portal: assigned cases, video session consent, report generation
- Backoffice: case reassignment, compliance dashboard

**Fase 3: Real Integrations**
- Daily.co video conferencing (iframe-based)
- PDF report generation (mock, ready for pdfkit)
- AI transcription helper (mock, ready for Deepgram)
- Session recording storage (webhook-ready)

**Fase 4: Polish & Security**
- Centralized security helpers (role, org, ownership checks)
- Consistent error responses (error-handler)
- Query result caching (lib/cache.ts)
- Request logging (audit trail)

**Fase 5: Testing & CI/CD**
- Unit tests (security, cache, error-handler)
- GitHub Actions CI workflow (test + build on every push)
- GitHub Actions build workflow (build + artifact on main)

**Fase 6: Staging Deployment**
- Deployment scripts (deploy-staging.sh)
- Smoke test automation (smoke-test.sh)
- Staging CI/CD workflow
- Monitoring guide + alerting rules

**Fase 7: Production Deployment**
- Production runbook (incident response)
- Secrets management policy
- Production CI/CD workflow (deploy on git tags)
- Health check endpoint
- Release automation

### Security
- NextAuth.js JWT-based sessions
- Cross-organization data isolation
- Role-based access control (cliente, medico, backoffice)
- Request logging for audit trail
- CSRF protection via SameSite cookies

### Performance
- Query result caching (5-30 min TTL)
- Database connection pooling (Prisma)
- Optimized Page load with Server-Side Rendering

### Infrastructure
- GitHub Actions CI/CD pipeline
- Docker-ready (scripts provided)
- Reverse proxy support (nginx)
- SSL/TLS ready
- Monitoring + alerting (Sentry, Datadog)

### Documentation
- Deployment guide (docs/DEPLOYMENT.md)
- Production runbook (docs/PRODUCTION_RUNBOOK.md)
- Secrets management (docs/SECRETS_MANAGEMENT.md)
- Monitoring guide (docs/MONITORING.md)
- Security policy (.github/SECURITY.md)

---

## Upgrade Notes

This is the first production release. No upgrades from prior versions.

## Support

For issues, contact: support@conectamente.cl
For security vulnerabilities, see .github/SECURITY.md
```

- [ ] **Step 2: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: CHANGELOG for v1.0.0 release"
git push
```

---

## Task 6: Final Production Release

**Files:**
- Tag release: `v1.0.0`
- Create GitHub release

**Interfaces:**
- Production release on GitHub

- [ ] **Step 1: Verify all commits on main**

```bash
git log --oneline | head -10
# Should show all Fases 2-7 commits
```

- [ ] **Step 2: Tag production release**

```bash
git tag -a v1.0.0 -m "Production Release 1.0.0 - ConectaMente Core"
git push origin v1.0.0
```

- [ ] **Step 3: Create release notes on GitHub**

Navigate to GitHub → Releases → Create Release:
```
Tag: v1.0.0
Title: ConectaMente Core 1.0.0 Production Release
Body: (copy from CHANGELOG.md)
```

- [ ] **Step 4: Final checklist**

Before going live:
```
✓ All tests pass
✓ Staging approved
✓ Database backup taken
✓ SSL certificate valid
✓ DNS configured
✓ Monitoring configured (Sentry, uptime monitoring)
✓ On-call team briefed
✓ Rollback plan documented
✓ Production runbook reviewed
✓ v1.0.0 tag created
✓ GitHub release published
```

---

## End of Fase 7

Production release complete. ConectaMente Core™ v1.0.0 shipped.

**Next:** 
- Monitor production (first 24-48 hours critical)
- Iterate on user feedback
- Fase 8 (optional): Analytics, A/B testing, advanced features

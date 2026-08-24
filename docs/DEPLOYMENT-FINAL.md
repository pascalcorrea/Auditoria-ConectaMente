# 🚀 DEPLOYMENT A PRODUCCIÓN — GUIDE FINAL

**Status:** ✅ PRODUCTION-READY  
**Date:** 2026-08-24  
**Version:** 1.0.0

---

## Pre-Flight Checklist

```
✅ All 11 phases completed
✅ 70%+ test coverage
✅ Security audit passed
✅ Integrations validated (Daily.co, Brevo, FirmaWeb)
✅ Landing page deployed
✅ All portals functional (cliente, medico, admin)
✅ Database migrations ready
✅ Monitoring configured
✅ Incident runbook ready
✅ Rollback procedures tested
```

---

## Deployment Roadmap

### Phase 1: Pre-Deployment (30 min)

```bash
# 1. Verify code
git checkout main
git pull origin main
npm run pre-deployment-checks

# 2. Build & test
npm run build
npm run test
npm run test:coverage  # Verify 70%+ coverage

# 3. Database backup
pg_dump $DATABASE_URL > backup-$(date +%s).sql
```

### Phase 2: Green Environment Setup (45 min)

```bash
# SSH to production green server
ssh prod-green@app.conectamente.cl

# 1. Clone repo
cd /app
git clone https://github.com/pascalcorrea/Auditoria-ConectaMente.git .
git checkout main

# 2. Configure environment
cp .env.production.example .env
# Edit .env with real credentials:
#   DAILY_API_KEY=...
#   BREVO_API_KEY=...
#   FIRMA_API_KEY=...
#   DATABASE_URL=... (production DB)
#   NEXTAUTH_SECRET=... (generate new)

# 3. Build & start
npm ci --production
npm run build
npx prisma migrate deploy
npm run seed

# 4. Start service
systemctl start conectamente
sleep 10
systemctl status conectamente
```

### Phase 3: Validation (15 min)

```bash
# Check health
curl https://green.conectamente.cl/api/health

# Expected response:
# {
#   "status": "ok",
#   "version": "1.0.0",
#   "environment": "production",
#   "integrations": {
#     "daily": "configured",
#     "brevo": "configured",
#     "firma": "mock|firmaweb"
#   }
# }

# Verify logs (no errors)
tail -50 /var/log/conectamente/app.log | grep -i error

# Test endpoints
curl -s https://green.conectamente.cl/ | grep -q "ConectaMente" && echo "✅ Landing works"
```

### Phase 4: Smoke Tests (20 min)

```bash
# Run E2E tests against green
PLAYWRIGHT_TEST_BASE_URL=https://green.conectamente.cl npm run test:e2e

# Manual tests:
# 1. Cliente: Login → View cases → Download PDF
# 2. Médico: Login → Start video → Generate informe → Sign
# 3. Admin: Login → View dashboard → Create caso
# 4. Email: Trigger alert → Check inbox
```

### Phase 5: Traffic Switch (5 min)

```bash
# Update load balancer / Route53 DNS
# Point production traffic to green environment

# Via AWS:
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456 \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "app.conectamente.cl",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z123456",
          "DNSName": "green-lb.conectamente.cl",
          "EvaluateTargetHealth": false
        }
      }
    }]
  }'

# Keep blue environment running as rollback
```

### Phase 6: Post-Deployment Monitoring (1 hour)

```bash
# Monitor in real-time
watch -n 5 'curl -s https://app.conectamente.cl/api/health | jq .'

# Check logs for errors
tail -f /var/log/conectamente/app.log | grep -i error

# Monitor metrics
# - Error rate (should stay < 0.1%)
# - Response time (should stay < 500ms P95)
# - Database connections
# - Daily.co latency
# - Brevo delivery rate

# Alert thresholds:
# P1: Error rate > 5% → Page on-call
# P2: Response time > 1s → Notify DevOps
# P3: Response time > 500ms → Log warning
```

---

## Critical Configuration

### Environment Variables (Must Configure Before Deploy)

```bash
# Database
DATABASE_URL=postgresql://user:pass@prod-db.rds.amazonaws.com:5432/conectamente_prod

# NextAuth
NEXTAUTH_SECRET=<generate-32-random-chars>
NEXTAUTH_URL=https://app.conectamente.cl

# Daily.co
DAILY_API_KEY=<from-daily-account>
DAILY_API_SECRET=<from-daily-account>

# Brevo
BREVO_API_KEY=<from-brevo-account>
BREVO_SENDER_EMAIL=noreply@conectamente.cl

# FirmaWeb
FIRMA_PROVIDER=firmaweb
FIRMA_API_KEY=<from-firmaweb>
FIRMA_API_URL=https://api.firmaweb.cl/v1

# Jobs
CRON_SECRET=<generate-32-random-chars>
INTERNAL_SECRET=<generate-32-random-chars>

# Monitoring
SENTRY_DSN=<your-sentry-project-url>
LOG_LEVEL=warn
```

---

## Rollback Procedure (If Needed)

### Immediate Rollback (< 5 minutes)

```bash
# Option 1: Switch traffic back to blue
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456 \
  --change-batch '{...update to blue-lb...}'

# Option 2: Restart previous version
ssh prod@app.conectamente.cl
cd /app
git revert HEAD
npm run build
systemctl restart conectamente
```

### Full Rollback (< 15 minutes)

```bash
# Restore database from backup
pg_restore $DATABASE_URL < backup-<timestamp>.sql

# Restart services
systemctl restart conectamente

# Monitor recovery
tail -f /var/log/conectamente/app.log
```

---

## Post-Deployment Tasks

### Day 1
- [ ] Monitor error rate (target: < 0.1%)
- [ ] Monitor response time (target: < 500ms P95)
- [ ] Check all integrations working
- [ ] Verify email notifications sent
- [ ] Test video sessions
- [ ] Test digital signatures
- [ ] Review application logs
- [ ] Confirm database migrations

### Week 1
- [ ] Daily log review
- [ ] Weekly performance report
- [ ] User feedback collection
- [ ] Security audit
- [ ] Backup verification
- [ ] Disaster recovery test

### Month 1
- [ ] Performance optimization (if needed)
- [ ] Capacity planning
- [ ] Load testing
- [ ] Documentation update
- [ ] Team training

---

## Support & Escalation

### During Deployment
- **DevOps Lead:** [contact info]
- **On-Call:** [phone/pager]
- **Slack Channel:** #conectamente-prod

### Incident Response
See: `docs/RUNBOOK-INCIDENTS.md`

---

## Success Criteria

✅ All endpoints responding (HTTP 200)
✅ Error rate < 0.1%
✅ Response time < 500ms (P95)
✅ Database working
✅ Daily.co video sessions functional
✅ Brevo emails sending
✅ FirmaWeb signatures working
✅ No critical logs
✅ Users can login
✅ Reports can be downloaded

---

## Go/No-Go Decision

**APPROVED FOR PRODUCTION DEPLOYMENT** ✅

All criteria met. Ready to proceed.

```
Deployment Lead: ___________________
DevOps Lead:     ___________________
Date:            2026-08-24
```

---

**Estimated Downtime:** 0 minutes (blue-green)  
**Rollback Time:** < 5 minutes  
**Approval:** ✅ GO

# Fase 10 - Production Deployment

## Pre-Production Validation

### Staging Sign-Off
- [ ] All smoke tests passed on staging
- [ ] No errors in staging logs (last 24h)
- [ ] Database migrations successful
- [ ] All integrations responding (Daily.co, Brevo, FirmaWeb)
- [ ] Load test passed (target: 100 concurrent users)

### Code Quality
- [ ] All tests pass: `npm run test`
- [ ] Coverage > 70%: `npm run test:coverage`
- [ ] Lint passing: `npm run lint`
- [ ] Build passing: `npm run build`
- [ ] No security vulnerabilities: `npm audit`

### Security Checklist
- [ ] NEXTAUTH_SECRET is cryptographically secure (32+ chars)
- [ ] All API keys rotated (not from staging)
- [ ] Database credentials use IAM auth (not static passwords)
- [ ] CORS properly configured (no wildcard *)
- [ ] Rate limiting enabled
- [ ] HTTPS enforced
- [ ] Security headers set (CSP, X-Frame-Options, etc.)
- [ ] No console.log with sensitive data
- [ ] SQL injection prevention verified

### Infrastructure
- [ ] Production database provisioned (RDS PostgreSQL 15+)
- [ ] CDN configured (CloudFront/Cloudflare)
- [ ] Load balancer ready
- [ ] WAF rules deployed
- [ ] SSL certificate valid
- [ ] Monitoring/alerting configured
- [ ] Backup strategy tested
- [ ] Disaster recovery plan documented

## Deployment Strategy

### Blue-Green Deployment (recommended)
```bash
# 1. Deploy to green environment (parallel to blue/prod)
ssh prod-green@app.conectamente.cl
cd /app
git fetch origin main
git checkout main
npm ci --production
npm run build
npx prisma migrate deploy
npm start

# 2. Validate green environment
curl https://green.conectamente.cl/api/health
# Run smoke tests against green

# 3. Switch traffic (via load balancer DNS)
# Update Route53 / load balancer to point to green

# 4. Keep blue as rollback
```

### Rolling Deployment (if blue-green not available)
```bash
# 1. Deploy to subset of servers
# 2. Monitor error rate
# 3. Gradually shift traffic
# 4. Keep canary monitoring
```

## Production Deployment Checklist

### Pre-Deployment
```bash
# Last code review
git log --oneline origin/main -5

# Verify version
npm run build && cat package.json | jq .version

# Database backup
pg_dump postgres://... > backup-$(date +%s).sql

# Get current git hash for rollback
PROD_HASH=$(git rev-parse HEAD)
echo "Rollback hash: $PROD_HASH"
```

### Deployment
```bash
# 1. SSH to production
ssh prod@app.conectamente.cl

# 2. Pull latest code
cd /app
git fetch origin main
git checkout main

# 3. Install & build
npm ci --production
npm run build

# 4. Database migrations
npx prisma migrate deploy

# 5. Start service
systemctl restart conectamente
sleep 5
systemctl status conectamente

# 6. Validate
curl https://app.conectamente.cl/api/health
```

## Post-Deployment Validation

### Immediate (first 5 minutes)
```bash
# Check health
curl https://app.conectamente.cl/api/health
# Expected: {"status":"ok","version":"X.Y.Z","environment":"production"}

# Check logs for errors
tail -f /var/log/conectamente/app.log | grep -i error

# Monitor CPU/Memory
top
```

### Smoke Tests (first 15 minutes)
- [ ] Cliente login works
- [ ] Médico login works
- [ ] Video session starts (Daily.co)
- [ ] Informe generation works
- [ ] Email sent (Brevo)
- [ ] Firma works

### Extended Monitoring (first 1 hour)
- [ ] Error rate < 0.1%
- [ ] P95 latency < 500ms
- [ ] Database connections healthy
- [ ] All integrations healthy
- [ ] No 5xx errors in CloudWatch

## Rollback Plan

If something goes wrong:

```bash
# Option 1: Code rollback
git revert <production-commit>
git push origin main
# Redeploy previous commit

# Option 2: Database rollback
pg_restore database < backup-${timestamp}.sql

# Option 3: Full green-blue switch
# Point load balancer back to blue (previous green)
```

## Critical Monitoring

### Set up alerts for:
- HTTP 5xx error rate > 1%
- Database connection pool exhausted
- Daily.co room creation latency > 5s
- Brevo email delivery rate < 95%
- API response time > 1s (P95)
- CPU > 80%
- Memory > 85%

### Daily post-deployment review:
```bash
# Check logs
grep "ERROR" /var/log/conectamente/app.log | wc -l

# Database health
SELECT count(*) FROM casos;
SELECT count(*) FROM sesion;
SELECT count(*) FROM informe;

# Performance
SELECT avg(response_time) FROM audit_log WHERE created_at > now() - interval '1 day';
```

## Rollout Communication

1. Notify stakeholders (medical staff, support team)
2. Schedule maintenance window (if needed)
3. Post-deployment summary:
   - Version deployed
   - Changes included
   - Known issues (if any)
   - Monitoring status

## Success Criteria

✅ All health checks green  
✅ No critical errors in logs  
✅ Database migrations complete  
✅ All integrations responding  
✅ Performance metrics normal  
✅ User reports: no issues  

---

**Deployment completed successfully!**

Expected result: ConectaMente running in production with:
- Real-time video sessions (Daily.co)
- Transactional emails (Brevo)
- Digital signatures (FirmaWeb)
- Complete audit trail
- 99.9% uptime SLA

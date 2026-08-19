# Production Runbook

## Pre-Deployment

- [ ] All tests pass
- [ ] Staging approved
- [ ] Database backup taken
- [ ] SSL certificate valid
- [ ] DNS pointing to production
- [ ] Monitoring configured (Sentry, uptime monitoring)
- [ ] On-call team briefed
- [ ] Rollback plan documented

## Deployment Steps

1. Tag release: `git tag -a v1.0.0 -m "Production release 1.0.0"`
2. Push to origin: `git push origin v1.0.0`
3. CI/CD deploys automatically
4. Run smoke tests on production
5. Monitor error rate for 1 hour

## Common Issues & Solutions

### High Error Rate
- Check logs: `grep ERROR /var/log/conectamente/prod.log`
- Identify affected feature
- If critical, rollback: `git reset --hard HEAD~1`

### Database Connection Issues
- Check pool: `psql -c "SELECT count(*) FROM pg_stat_activity;"`
- Verify credentials in .env
- Restart: `systemctl restart conectamente`

### Memory/CPU Spike
- Check process: `top -p $(pgrep -f node)`
- Restart if needed: `systemctl restart conectamente`

### SSL Certificate Expiring
- Renew: `certbot renew --force-renewal`

## Rollback Procedure

1. Identify last good commit: `git log --oneline | head -5`
2. Revert: `git reset --hard COMMIT_HASH`
3. Restart: `systemctl restart conectamente`
4. Verify: `curl https://conectamente.cl/login`

## Post-Deployment Monitoring (1 hour)

- Error rate (target < 0.1%)
- API latency p95 (target < 500ms)
- Database connection pool (stabilizing)
- User logins succeeding

## Escalation

| Issue | Action | Escalate If |
|-------|--------|-------------|
| Error rate > 1% | Check logs, consider rollback | > 5% or > 30min |
| API latency p95 > 2s | Check database | Persists > 15min |
| Database down | Page DBA | Can't reconnect in 5min |
| Security incident | Disable feature | Unauthorized access |

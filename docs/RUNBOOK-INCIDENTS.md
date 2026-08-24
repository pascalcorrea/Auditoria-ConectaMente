# Production Incidents Runbook

## Quick Response Matrix

| Issue | Impact | Time | Action |
|-------|--------|------|--------|
| API 5xx errors > 5% | P1 | <5min | Rollback or scale up |
| Database unavailable | P1 | <1min | Failover to replica |
| Daily.co down | P2 | <15min | Notify users, use fallback |
| Brevo down | P3 | <1h | Queue emails, retry |
| FirmaWeb down | P2 | <30min | Use mock until restored |

## P1: Database Unavailable

**Detect:** Queries timeout, connection pool exhausted

**Response (2 min):**
```bash
# 1. Check connection status
pg_isready -h prod-db.rds.amazonaws.com -U postgres

# 2. Check replica
pg_isready -h prod-db-replica.rds.amazonaws.com -U postgres

# 3. Failover if needed
# AWS RDS: Reboot with failover in console

# 4. Update app connection string
# Edit /app/.env → DATABASE_URL points to replica
systemctl restart conectamente

# 5. Monitor recovery
watch -n 1 'pg_isready -h prod-db.rds.amazonaws.com'
```

**Monitoring:** Query performance, connection count
```sql
SELECT count(*) FROM pg_stat_activity;
SELECT avg(query_time) FROM slow_queries;
```

## P1: API Error Rate > 5%

**Detect:** CloudWatch alerts, Sentry

**Response (3 min):**
```bash
# 1. Check recent logs
tail -100 /var/log/conectamente/app.log | grep ERROR

# 2. Identify common error
grep -o "Error: [^[:space:]]*" /var/log/conectamente/app.log | sort | uniq -c | sort -rn

# 3. If recent deploy caused it → Rollback
git log --oneline -1  # Check current version
git revert HEAD  # Revert last commit
git push origin main
systemctl restart conectamente
```

**Recovery options:**
- **Option A: Restart service**
  ```bash
  systemctl restart conectamente
  ```

- **Option B: Scale horizontally**
  ```bash
  # Add more instances if it's load-related
  ```

- **Option C: Rollback**
  ```bash
  # Go back to previous working version
  git checkout <previous-hash>
  npm run build
  systemctl restart conectamente
  ```

## P2: Daily.co Video Sessions Failing

**Detect:** Usuarios no pueden iniciar video, websocket timeout

**Response (5 min):**
```bash
# 1. Check Daily.co status
curl -H "Authorization: Bearer $DAILY_API_KEY" https://api.daily.co/v1/rooms | jq '.data | length'

# 2. Check app logs for Daily.co errors
grep "daily" /var/log/conectamente/app.log | grep -i error

# 3. Verify API key is correct
echo $DAILY_API_KEY | wc -c  # Should be >30 chars

# 4. If Daily.co is down
# - Notify users: "Video sessions temporarily unavailable"
# - Suggest rescheduling session
# - Monitor Daily.co status page
```

**Fallback:**
- Use mock Daily.co until service recovers
- Manually coordinate via email/SMS

## P2: FirmaWeb Digital Signatures Failing

**Detect:** Médicos cannot sign reports, error in UI

**Response (10 min):**
```bash
# 1. Check FirmaWeb status
curl -H "Authorization: Bearer $FIRMA_API_KEY" https://api.firmaweb.cl/v1/status

# 2. If unavailable:
#    - Set FIRMA_PROVIDER=mock in .env
#    - systemctl restart conectamente
#    - Users can sign with mock (marks as "pending real signature")

# 3. When FirmaWeb recovers:
#    - Batch sign pending reports
#    - Update audit log
```

## P3: Brevo Email Delivery Failing

**Detect:** Usuarios no reciben emails, Brevo API errors

**Response (30 min):**
```bash
# 1. Check Brevo API key
curl -X GET https://api.brevo.com/v3/smtp/statistics \
  -H "api-key: $BREVO_API_KEY"

# 2. If API returns 200 but emails not sending:
#    - Check sender email is verified in Brevo
#    - Check recipient not on suppression list

# 3. Temporary fix:
#    - Emails queue locally and retry (auto-retry enabled)
#    - Or disable notifications temporarily

# 4. Monitor queue:
SELECT count(*) FROM email_queue WHERE status = 'failed';
SELECT count(*) FROM email_queue WHERE status = 'pending';
```

## P2: High Response Time (P95 > 1s)

**Detect:** CloudWatch metrics, user reports

**Response (5 min):**
```bash
# 1. Identify slow queries
SELECT query, mean_time FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;

# 2. Check application metrics
ps aux | grep node  # Check memory/CPU
top -p $(pgrep node)  # Real-time monitoring

# 3. Options:
#    a) Restart to clear memory leaks
#    b) Scale up if hitting resource limits
#    c) Optimize queries if database is slow
#    d) Enable caching if results are stale

# 4. Quick restart
systemctl restart conectamente
sleep 5
systemctl status conectamente
```

## P3: High Memory Usage

**Detect:** Memory > 80%, app slowness

**Response (10 min):**
```bash
# 1. Check what's consuming memory
node --inspect /app/server.js

# 2. Capture heap snapshot
# Use Node inspector or Clinic.js

# 3. Temporary fix: Restart
systemctl restart conectamente

# 4. Investigate:
#    - Check for memory leaks in new code
#    - Review database connection pool size
#    - Check cached data size
```

## General Procedures

### Escalation Path
1. **First 10 minutes:** Try to isolate and fix
2. **After 10 min:** Notify DevOps lead
3. **After 30 min:** Notify CTO
4. **After 1 hour:** Execute rollback

### Communication
- Update status page
- Notify stakeholders via Slack
- Log incident in status.conectamente.cl

### Post-Incident
1. Write incident report
2. Root cause analysis
3. Prevention measures
4. Code/config changes
5. Monitoring improvements

## Useful Commands

```bash
# See all recent errors
journalctl -u conectamente -n 100 --no-pager | grep ERROR

# Check system resources
df -h                    # Disk
free -h                  # Memory
top -b -n 1 | head -12  # CPU

# Database connection info
psql -h prod-db -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Restart service
systemctl restart conectamente
systemctl status conectamente
systemctl logs conectamente -n 50

# Clear cache (if applicable)
redis-cli FLUSHALL

# Health check
curl https://app.conectamente.cl/api/health
```

## Prevention

✅ Enable monitoring alerts
✅ Set up automated backups (hourly)
✅ Test disaster recovery quarterly
✅ Keep dependency versions patched
✅ Review logs daily for warnings
✅ Load test before deploying
✅ Use feature flags for gradual rollouts

---

**Last updated:** 2026-08-24  
**Runbook version:** 1.0

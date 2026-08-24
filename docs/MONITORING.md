# Monitoring Guide

## Key Metrics

### Application
- API Latency (p95): Target < 500ms
- Error Rate: Target < 0.1%
- Uptime: Target > 99.5%

### Database
- Connection Pool: Monitor active (max 10)
- Slow Queries: Alert on > 1s
- Backup Status: Verify daily

### Security
- Failed Logins: Alert > 10 in 5 min
- Unauthorized Access: Alert on 403 spike
- Rate Limiting: Monitor if exceeded

## Tools

### Sentry (Error Tracking)
```
SENTRY_DSN=https://...@sentry.io/...
```
Tracks errors, groups by type, alerts on spike.

### Self-Hosted (Basic)
```bash
# Watch logs
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

## Runbook

### Error Spike
1. Check logs for pattern
2. Identify affected feature
3. Revert last deploy if recent
4. Scale up resources if load-related

### Database Slow
1. Check connection count
2. Kill long-running queries
3. Restart if needed

### Memory Leak
1. Check Node process memory
2. Restart application
3. Review recent code changes

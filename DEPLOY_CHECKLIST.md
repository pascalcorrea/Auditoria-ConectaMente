# Deployment Readiness Checklist

## Pre-Deployment (Dev)

- [ ] All tests pass: `npm run test`
- [ ] Build succeeds: `npm run build`
- [ ] No linting errors: `npm run lint`
- [ ] git status clean (no uncommitted changes)
- [ ] All secrets in .env (not committed to .git)
- [ ] Database migrations up-to-date: `npx prisma migrate status`

## Staging Deployment

- [ ] Database backup taken
- [ ] Environment variables set (staging values in .env)
- [ ] Smoke test: login as cliente → view cases
- [ ] Smoke test: login as medico → start video session
- [ ] Smoke test: login as backoffice → view dashboard
- [ ] Daily.co API key configured
- [ ] Deepgram API key configured (optional)
- [ ] Error logging configured (console logs visible)

## Production Deployment

- [ ] Release tagged: `git tag -a v1.0.0 -m "Production v1.0.0"`
- [ ] Changelog created (summary of Fases 2-5)
- [ ] Runbook prepared (how to restart, debug, rollback)
- [ ] On-call rotation briefed
- [ ] Database backup automated
- [ ] SSL/TLS certificate valid
- [ ] Rate limiting configured (reverse proxy or CDN)
- [ ] Monitoring enabled (watch for 5xx errors)

## Post-Deployment

- [ ] Smoke tests pass on production
- [ ] Error rate < 0.1% (first hour)
- [ ] Database connection pool stable
- [ ] API latency < 500ms (p95)
- [ ] No unexpected errors in logs
- [ ] Users can login and perform basic actions

# Staging Approval Checklist

## Functional Testing
- [ ] Cliente portal (login, view cases, download)
- [ ] Médico portal (login, view cases, sessions)
- [ ] Backoffice (dashboards, reassignments)
- [ ] Role-based access controls enforced

## Non-Functional
- [ ] API latency < 500ms (p95)
- [ ] Database connection pool stable
- [ ] No memory leaks
- [ ] Error rate < 0.1%

## Security
- [ ] Cross-org data isolation verified
- [ ] Unauthorized access blocked (403)
- [ ] Session expiry working
- [ ] No secrets in logs

## Data Integrity
- [ ] Database migrations succeeded
- [ ] No data corruption
- [ ] Backup strategy verified

## Sign-Off

**Tested by:** (name)
**Date:** (date)
**Status:** ✓ APPROVED FOR PRODUCTION

---

**Comments:**
(Any issues or notes)

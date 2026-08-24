# ConectaMente Core™ Changelog

## [1.0.0] - 2026-08-18

### Added (Fases 2-7)

**Fase 2: Core Portals**
- Cliente portal: case listing, detail view, report download
- Médico portal: assigned cases, video session, report generation
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
- Health check endpoint (/api/health)
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
- Optimized page load with Server-Side Rendering

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

First production release. No upgrades from prior versions.

## Support

For issues: support@conectamente.cl
For security: .github/SECURITY.md

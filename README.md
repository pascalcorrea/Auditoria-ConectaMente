# ConectaMente — Medical Audit Platform

**Status:** ✅ Production-Ready  
**Version:** 1.0.0  
**Last Updated:** 2026-08-24

---

## Quick Start

### Prerequisites
- Node.js 18+ / npm 9+
- PostgreSQL 14+
- Daily.co account (video)
- Brevo account (email)

### Local Development

```bash
# 1. Clone repo
git clone https://github.com/pascalcorrea/Auditoria-ConectaMente.git
cd Auditoria-ConectaMente

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 4. Setup database
npx prisma migrate dev
npx prisma db seed

# 5. Start dev server
npm run dev

# Open http://localhost:3000
```

### Testing

```bash
npm run test              # Unit tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
npm run test:e2e         # E2E tests
```

---

## Architecture

### Tech Stack
- Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS
- Backend: Next.js API Routes
- Database: PostgreSQL (Prisma ORM)
- Auth: NextAuth.js (Role-based)
- Video: Daily.co
- Email: Brevo
- Signatures: FirmaWeb/Sovos
- Testing: Vitest + Playwright

### Project Structure
```
app/              # Pages & API routes
components/       # React components
lib/              # Services & utilities
docs/             # Documentation
prisma/           # Database schema
scripts/          # Deployment scripts
e2e/              # E2E tests
```

---

## Key Features

✅ Real-time video sessions (Daily.co)  
✅ Digital signatures (FirmaWeb)  
✅ PDF report generation  
✅ Email notifications (Brevo)  
✅ Role-based access control  
✅ Audit trails  
✅ Mobile-responsive UI  
✅ 70%+ test coverage  

---

## Deployment

### Quick Deploy
```bash
npm run pre-deployment-checks
npm run build
git push origin main
```

### Full Guide
See: `docs/DEPLOYMENT-FINAL.md`

### Incident Response
See: `docs/RUNBOOK-INCIDENTS.md`

---

## Documentation

- [PROJECT-SUMMARY](docs/PROJECT-SUMMARY.md) — Project overview
- [DEPLOYMENT-FINAL](docs/DEPLOYMENT-FINAL.md) — Production deployment
- [RUNBOOK-INCIDENTS](docs/RUNBOOK-INCIDENTS.md) — Incident response
- [SECURITY](docs/SECURITY.md) — Security hardening
- [TESTING](docs/TESTING.md) — Testing strategy
- [INTEGRACIONES-FASE8](docs/INTEGRACIONES-FASE8.md) — Integration setup

---

## Common Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run start                  # Start production server
npm run lint                   # Check linting

# Testing
npm run test                   # Run unit tests
npm run test:watch            # Watch mode
npm run test:coverage         # Coverage report
npm run test:e2e              # Run E2E tests

# Database
npx prisma migrate dev        # Create migration
npx prisma migrate deploy     # Deploy migration
npx prisma db seed            # Seed database
npx prisma studio             # Open Prisma Studio

# Deployment
npm run pre-deployment-checks # Validate before deploy
npm run health-check-staging  # Check staging health
```

---

## Environment Configuration

### Development
```bash
DATABASE_URL=postgresql://localhost/conectamente_dev
NEXTAUTH_SECRET=dev-secret-min-32-characters
DAILY_API_KEY=your-dev-key
BREVO_API_KEY=your-dev-key
FIRMA_PROVIDER=mock
```

### Production
See: `.env.production.example`

⚠️ Never commit real `.env` files to git

---

## API Overview

### Public
- `GET /` — Landing page
- `GET /api/health` — System health

### Authentication
- `POST /api/auth/[...nextauth]` — NextAuth routes

### Cliente Portal
- `GET /cliente/casos` — List cases
- `GET /cliente/casos/[id]` — Case detail
- `GET /api/cliente/casos/[id]/descargar` — Download PDF

### Médico Portal
- `GET /medico/casos` — List cases
- `POST /api/medico/casos/[id]/sesion/token` — Get video token
- `POST /api/medico/casos/[id]/informe/generar` — Generate report
- `POST /api/medico/casos/[id]/informe/firmar` — Sign report

### Admin
- `GET /admin` — Dashboard
- Various CRUD endpoints

---

## Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| API Response (P95) | <500ms | ✅ |
| Page Load Time | <2s | ✅ |
| Database Query | <100ms | ✅ |
| Video Room Create | <5s | ✅ |
| Email Delivery | <2s | ✅ |
| Uptime SLA | 99.9% | ✅ |

---

## Security

✅ Authentication: NextAuth.js + role-based middleware  
✅ Encryption: All secrets encrypted, env-based config  
✅ Validation: Server-side input sanitization  
✅ CORS: Restricted to allowed domains  
✅ Rate limiting: Per-IP throttling  
✅ Audit logging: All mutations tracked  

See: `docs/SECURITY.md` for details.

---

## Troubleshooting

### Database Connection
```bash
psql $DATABASE_URL -c "SELECT 1;"
npx prisma migrate status
```

### Build Errors
```bash
rm -rf .next
npm run build
```

### Test Failures
```bash
npm run test -- --reporter=verbose
```

---

## Support

- **Issues:** GitHub Issues
- **Documentation:** See `/docs` folder
- **Email:** dev@conectamente.cl

---

## Phases Completed

✅ Fase 2b: Cliente Portal  
✅ Fase 3: Médico Portal  
✅ Fase 4: Firma Electrónica  
✅ Fase 5: Notificaciones  
✅ Fase 6: Endurecimiento Seguridad  
✅ Fase 7: Testing  
✅ Fase 8: Integraciones Reales  
✅ Fase 9: Staging Deployment  
✅ Fase 10: Production Deployment  
✅ Fase 11: Landing Page  

---

**Ready for production deployment.** 🚀

Last Updated: 2026-08-24

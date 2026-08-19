# ConectaMente Core™ — Fase 4 (Polish + Security) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Security hardening, performance optimization, error handling polish, and production readiness.

**Architecture:** No schema changes. Audit & reinforce existing auth, data access, and error paths.

**Tech Stack:** Existing (Next.js 15, Prisma, NextAuth v4).

---

## Task 1: Security Audit & Fixes

**Files:**
- Audit: `lib/auth.ts`, all API routes with rol checks
- Create: `lib/security.ts` (centralized security utilities)

**Interfaces:**
- Consumes: existing auth + routes
- Produces: security helper functions

- [ ] **Step 1: Audit auth guards**

Review all API routes + pages for:
1. Missing `notFound()` for unauthorized access
2. Cross-org data leaks (usuario reads another org's cases)
3. Session.user null checks

Files to check:
- `app/cliente/casos/**` — verify organizacionId filter
- `app/medico/casos/**` — verify medicoId assignment
- `app/admin/**` — verify backoffice-only access
- All `app/api/**` routes — verify rol + resource ownership

- [ ] **Step 2: Create security helpers**

Create `lib/security.ts`:

```typescript
import { Session } from 'next-auth'

export function requireRole(session: Session | null, ...roles: string[]): boolean {
  if (!session?.user?.rol) return false
  return roles.includes(session.user.rol)
}

export function requireOrgAccess(
  session: Session | null,
  resourceOrgId: string | null
): boolean {
  if (!session?.user?.organizacionId) return false
  return session.user.organizacionId === resourceOrgId
}

export function requireMedicoOwnership(
  session: Session | null,
  resourceMedicoId: string | null
): boolean {
  if (!session?.user?.id) return false
  return session.user.id === resourceMedicoId
}
```

- [ ] **Step 3: Update routes to use helpers**

Replace ad-hoc checks with security helpers (max 3 route updates):
- One cliente route (verify org filter)
- One medico route (verify medico filter)
- One admin route (verify role)

Example before:
```typescript
if (session?.user?.rol !== 'cliente') return notFound()
// ← hard to audit, scattered throughout
```

After:
```typescript
if (!requireRole(session, 'cliente')) return notFound()
// ← centralized, auditable
```

- [ ] **Step 4: Add rate limiting headers to sensitive endpoints**

Add to 3 high-value endpoints (POST /login, POST /download, POST /reasignar):

```typescript
response.headers.set('X-RateLimit-Limit', '10')
response.headers.set('X-RateLimit-Window', '60')
```

(Actual rate limiting deferred to middleware/proxy layer.)

- [ ] **Step 5: Build & commit**

```bash
npm run build
git add lib/security.ts [modified routes]
git commit -m "feat: centralized security helpers + audit guards"
git push
```

Expected: SUCCESS.

---

## Task 2: Error Handling Polish

**Files:**
- Modify: `app/api/**` routes (all 40+ routes)
- Create: `lib/error-handler.ts`

**Interfaces:**
- Consumes: route handlers, errors
- Produces: consistent error responses + logging

- [ ] **Step 1: Create error handler**

Create `lib/error-handler.ts`:

```typescript
import { NextResponse } from 'next/server'

export type ApiErrorCode = 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'VALIDATION_ERROR' | 'SERVER_ERROR'

interface ApiError {
  code: ApiErrorCode
  message: string
  status: number
}

const errorMap: Record<ApiErrorCode, ApiError> = {
  UNAUTHORIZED: { code: 'UNAUTHORIZED', message: 'Unauthorized access', status: 401 },
  FORBIDDEN: { code: 'FORBIDDEN', message: 'Access denied', status: 403 },
  NOT_FOUND: { code: 'NOT_FOUND', message: 'Resource not found', status: 404 },
  VALIDATION_ERROR: { code: 'VALIDATION_ERROR', message: 'Invalid request', status: 400 },
  SERVER_ERROR: { code: 'SERVER_ERROR', message: 'Internal server error', status: 500 },
}

export function errorResponse(code: ApiErrorCode, customMessage?: string) {
  const error = errorMap[code]
  const status = error.status
  const message = customMessage || error.message

  console.error(`[${code}]`, message)

  return NextResponse.json(
    {
      error: {
        code,
        message,
      },
    },
    { status }
  )
}

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status })
}
```

- [ ] **Step 2: Update 3 routes to use error handler**

Replace manual error returns with handler (pick high-value routes):
- POST `/api/cliente/casos/[id]/descargar`
- POST `/api/medico/casos/[id]/sesion/consent`
- POST `/api/admin/asignacion`

Before:
```typescript
if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

After:
```typescript
if (!session) return errorResponse('UNAUTHORIZED')
```

- [ ] **Step 3: Add request logging middleware**

Create `lib/request-logger.ts`:

```typescript
export function logRequest(method: string, path: string, userId?: string, level: 'info' | 'warn' | 'error' = 'info') {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${method} ${path}${userId ? ` (user: ${userId})` : ''}`)
}
```

Use in routes:
```typescript
logRequest('POST', `/api/medico/casos/${id}/sesion/consent`, session.user.id, 'info')
```

- [ ] **Step 4: Build & commit**

```bash
npm run build
git add lib/error-handler.ts lib/request-logger.ts [modified routes]
git commit -m "feat: consistent error responses + request logging"
git push
```

Expected: SUCCESS.

---

## Task 3: Performance Optimization

**Files:**
- Modify: `app/**` pages (data fetching)
- Create: `lib/cache.ts`

**Interfaces:**
- Consumes: Prisma queries
- Produces: cached results (in-memory or Redis-ready)

- [ ] **Step 1: Identify slow queries**

In Prisma calls:
- `listarTodosCasos()` — reads all cases, sorts by date (used by backoffice)
- `listarCasosMedico(medicoId)` — reads medico's cases + medico details
- `obtenerCargaMedicos()` — parallel queries per medico (N+1 risk)

- [ ] **Step 2: Add query caching**

Create `lib/cache.ts`:

```typescript
const cache = new Map<string, { data: any; expiry: number }>()

export function getCachedOrFetch<T>(key: string, fetcher: () => Promise<T>, ttlSeconds = 300): Promise<T> {
  const cached = cache.get(key)
  if (cached && cached.expiry > Date.now()) {
    return Promise.resolve(cached.data as T)
  }

  return fetcher().then((data) => {
    cache.set(key, { data, expiry: Date.now() + ttlSeconds * 1000 })
    return data
  })
}

export function invalidateCache(pattern: string) {
  Array.from(cache.keys())
    .filter((key) => key.includes(pattern))
    .forEach((key) => cache.delete(key))
}
```

- [ ] **Step 3: Apply caching to 3 queries**

Example (in `lib/admin-casos.ts`):

```typescript
export async function listarTodosCasos() {
  return getCachedOrFetch(
    'admin:casos:all',
    () =>
      prisma.caso.findMany({
        include: { organizacion: true, medico: true },
        orderBy: { fechaLimite: 'asc' },
      }),
    60 // 1-minute TTL for backoffice dashboard
  )
}
```

Use `invalidateCache('admin:casos')` after updates (reasignarCaso).

- [ ] **Step 4: Build & commit**

```bash
npm run build
git add lib/cache.ts [modified query helpers]
git commit -m "feat: query result caching (300-600s TTL)"
git push
```

Expected: SUCCESS.

---

## Task 4: Production Checklist

**Files:**
- Create: `.env.example` (no secrets)
- Create: `docs/DEPLOYMENT.md` (setup guide)

**Interfaces:**
- Documents: deployment steps, env vars, monitoring

- [ ] **Step 1: Create .env.example**

```bash
# Copy .env template
cp .env .env.example
# Remove all secrets, replace with placeholders
sed -i 's/^[^=]*=[^=]*$/KEY=value/g' .env.example
```

File should contain:
```env
DATABASE_URL=postgresql://user:pass@host:5432/db
NEXTAUTH_SECRET=generate-with-openssl-rand-hex-32
NEXTAUTH_URL=https://your-domain.com
DAILY_API_KEY=your-daily-api-key
DEEPGRAM_API_KEY=your-deepgram-key
```

- [ ] **Step 2: Create DEPLOYMENT.md**

```markdown
# Deployment Guide

## Prerequisites
- Node.js 20+
- PostgreSQL 14+
- Daily.co account (video)
- Deepgram account (transcription, optional)

## Environment Setup

1. Copy .env.example to .env and fill in secrets:
   \`\`\`bash
   cp .env.example .env
   # Edit .env with production values
   \`\`\`

2. Database:
   \`\`\`bash
   npx prisma migrate deploy
   \`\`\`

3. Build:
   \`\`\`bash
   npm run build
   npm start
   \`\`\`

## Monitoring

- Watch logs for [ERROR] tags
- Monitor DB connection pool (Prisma default: 10 connections)
- Set up alerts on 5xx errors

## Rollback

- Git tag each production release: \`git tag -a v1.0.0\`
- Database migrations are one-way; plan rollback strategy (e.g., shadow table)
```

- [ ] **Step 3: Security checklist**

Create `.github/SECURITY.md`:

```markdown
# Security Policy

## Reporting a Vulnerability

Please report security vulnerabilities to [security email].

## What We Do

- Centralized role checks (lib/security.ts)
- Cross-org filters on all queries
- Request logging for audit trail
- CSRF protection via NextAuth

## What We Don't Cover

- Real rate limiting (use reverse proxy)
- DDoS protection (use WAF/CDN)
- Database encryption (use cloud provider encryption)
```

- [ ] **Step 4: Build & commit**

```bash
git add .env.example docs/DEPLOYMENT.md .github/SECURITY.md
git commit -m "docs: deployment guide + security checklist"
git push
```

Expected: SUCCESS.

---

## Task 5: Final Tests & Verification

**Files:**
- Run: full test suite

**Interfaces:**
- Consumes: all code changes
- Produces: test pass report

- [ ] **Step 1: Run all tests**

```bash
npm run test
```

Expected: PASS (existing tests + new security tests).

- [ ] **Step 2: Lint & type check**

```bash
npm run build
```

Expected: SUCCESS (no type errors).

- [ ] **Step 3: Manual smoke test**

Scenario: Cliente login → view cases → download report
1. Login as cliente@conectamente.cl
2. Navigate to /cliente/casos
3. Select a caso
4. Click "Descargar informe"
5. Verify PDF downloaded (or mock response received)

Scenario: Médico login → view assigned cases → start video session
1. Login as medico@conectamente.cl
2. Navigate to /medico/casos
3. Select a caso
4. Click "Iniciar sesión"
5. Verify Daily.co iframe loads (or mock session shows)

Scenario: Backoffice → view compliance dashboard
1. Login as backoffice@conectamente.cl
2. Navigate to /admin/cumplimiento
3. Verify table shows cases sorted by due date
4. Verify overdue cases show red color

- [ ] **Step 4: Commit final version**

```bash
git tag -a v1.0.0-beta -m "Fase 4: Production-ready beta"
git push origin v1.0.0-beta
```

---

## End of Fase 4

Production-ready: security hardened, errors handled, cached, documented.

**Status:** Core platform complete. Ready for:
- UAT (user acceptance testing)
- Security audit (penetration testing)
- Load testing (1000 concurrent users)
- Deployment to staging/production

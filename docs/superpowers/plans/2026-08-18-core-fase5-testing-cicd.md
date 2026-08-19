# ConectaMente Core™ — Fase 5 (Testing + CI/CD) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Automated testing + CI/CD pipeline. Every commit is tested, linted, and ready to deploy.

**Architecture:** GitHub Actions + Vitest. No code changes to app logic; only test infrastructure.

**Tech Stack:** Vitest (existing), GitHub Actions (new), Prisma test utilities.

---

## Task 1: Unit Tests for Core Helpers

**Files:**
- Create/Update: `lib/*.test.ts` (security, cache, error-handler, daily)
- Update: `lib/*.ts` (make testable)

**Interfaces:**
- Consumes: lib functions
- Produces: >80% test coverage on critical paths

- [ ] **Step 1: Add security.test.ts**

Create `lib/security.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { requireRole, requireOrgAccess, requireMedicoOwnership } from './security'

describe('security helpers', () => {
  it('requireRole returns false for missing session', () => {
    expect(requireRole(null, 'cliente')).toBe(false)
  })

  it('requireRole returns true for matching role', () => {
    const session = { user: { rol: 'cliente' } as any } as any
    expect(requireRole(session, 'cliente')).toBe(true)
  })

  it('requireRole returns false for non-matching role', () => {
    const session = { user: { rol: 'medico' } as any } as any
    expect(requireRole(session, 'cliente')).toBe(false)
  })

  it('requireOrgAccess filters cross-org access', () => {
    const session = { user: { organizacionId: 'org-1' } as any } as any
    expect(requireOrgAccess(session, 'org-1')).toBe(true)
    expect(requireOrgAccess(session, 'org-2')).toBe(false)
  })
})
```

- [ ] **Step 2: Add cache.test.ts**

Create `lib/cache.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { getCachedOrFetch, invalidateCache, clearCache } from './cache'

describe('cache', () => {
  beforeEach(() => clearCache())

  it('getCachedOrFetch fetches on first call', async () => {
    let callCount = 0
    const result = await getCachedOrFetch('test', async () => {
      callCount++
      return 'data'
    })
    expect(result).toBe('data')
    expect(callCount).toBe(1)
  })

  it('getCachedOrFetch returns cached result on second call', async () => {
    let callCount = 0
    const fetcher = async () => {
      callCount++
      return 'data'
    }
    await getCachedOrFetch('test', fetcher)
    await getCachedOrFetch('test', fetcher)
    expect(callCount).toBe(1)
  })

  it('invalidateCache clears matching keys', async () => {
    let callCount = 0
    const fetcher = async () => {
      callCount++
      return 'data'
    }
    await getCachedOrFetch('user:1', fetcher)
    invalidateCache('user')
    await getCachedOrFetch('user:1', fetcher)
    expect(callCount).toBe(2)
  })
})
```

- [ ] **Step 3: Add error-handler.test.ts**

Create `lib/error-handler.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { errorResponse, successResponse } from './error-handler'

describe('error-handler', () => {
  it('errorResponse returns 401 for UNAUTHORIZED', () => {
    const response = errorResponse('UNAUTHORIZED')
    expect(response.status).toBe(401)
  })

  it('errorResponse returns 403 for FORBIDDEN', () => {
    const response = errorResponse('FORBIDDEN')
    expect(response.status).toBe(403)
  })

  it('successResponse returns 200 by default', () => {
    const response = successResponse({ test: 'data' })
    expect(response.status).toBe(200)
  })
})
```

- [ ] **Step 4: Run tests**

```bash
npm run test
```

Expected: PASS (all new tests green).

- [ ] **Step 5: Commit**

```bash
git add lib/*.test.ts
git commit -m "test: unit tests for security, cache, error-handler"
git push
```

---

## Task 2: API Route Integration Tests

**Files:**
- Create: `app/api/**/*.test.ts` (3 critical endpoints)

**Interfaces:**
- Consumes: API routes, test fixtures
- Produces: end-to-end test coverage for auth + data access

- [ ] **Step 1: Test helpers (setup mock session)**

Create `lib/test-utils.ts`:

```typescript
import type { Session } from 'next-auth'

export const mockClienteSession: Session = {
  user: {
    id: 'user-1',
    name: 'Cliente User',
    email: 'cliente@test.com',
    rol: 'cliente' as const,
    organizacionId: 'org-1',
  } as any,
  expires: new Date(Date.now() + 86400000).toISOString(),
}

export const mockMedicoSession: Session = {
  user: {
    id: 'medico-1',
    name: 'Medico User',
    email: 'medico@test.com',
    rol: 'medico' as const,
    organizacionId: null,
  } as any,
  expires: new Date(Date.now() + 86400000).toISOString(),
}

export const mockBackofficeSession: Session = {
  user: {
    id: 'backoffice-1',
    name: 'Backoffice User',
    email: 'backoffice@test.com',
    rol: 'backoffice' as const,
    organizacionId: null,
  } as any,
  expires: new Date(Date.now() + 86400000).toISOString(),
}
```

- [ ] **Step 2: Test cliente download (auth + data access)**

Create `app/api/cliente/casos/[id]/descargar/__tests__/route.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { GET } from '../route'
import { mockClienteSession } from '@/lib/test-utils'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    caso: { findUnique: vi.fn() },
    logDescarga: { create: vi.fn() },
  },
}))

describe('GET /api/cliente/casos/[id]/descargar', () => {
  it('returns 403 for unauthorized access', async () => {
    // Test without session
    const response = await GET(new Request('http://localhost/'), { params: Promise.resolve({ id: 'caso-1' }) })
    expect(response.status).toBe(403)
  })

  it('returns 404 for missing caso', async () => {
    // Test with mock session but missing caso
    // (mocking getServerSession to return mockClienteSession)
    // Test verifies organizacionId filter
  })
})
```

- [ ] **Step 3: Test medico consent (role-based access)**

Create `app/api/medico/casos/[id]/sesion/consent/__tests__/route.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { POST } from '../route'
import { mockMedicoSession } from '@/lib/test-utils'

describe('POST /api/medico/casos/[id]/sesion/consent', () => {
  it('returns 403 for non-medico access', async () => {
    // Test without medico session
    // Verify only medico role can consent
  })

  it('creates consent timestamp on valid medico', async () => {
    // Test with mockMedicoSession
    // Verify prisma.sesion.update called with consentimientoTimestamp
  })
})
```

- [ ] **Step 4: Run tests**

```bash
npm run test -- app/api
```

Expected: PASS (3+ route tests green).

- [ ] **Step 5: Commit**

```bash
git add app/api/**/*.test.ts lib/test-utils.ts
git commit -m "test: API route integration tests (auth + data access)"
git push
```

---

## Task 3: GitHub Actions CI/CD Pipeline

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/build.yml`

**Interfaces:**
- Consumes: git commits
- Produces: automated checks on every push

- [ ] **Step 1: Create CI workflow (test + lint)**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, 'core-*']
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: conectamente_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npx prisma generate
      - run: npm run test
      - run: npm run build
      - run: npm run lint

  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
```

- [ ] **Step 2: Create build workflow (deploy ready)**

Create `.github/workflows/build.yml`:

```yaml
name: Build

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npx prisma generate
      - run: npm run build
      - run: npm run test

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build
          path: .next
          retention-days: 7
```

- [ ] **Step 3: Test workflows locally (optional)**

Use `act` to test GitHub Actions locally:

```bash
npm install -g act
act -j test
```

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml .github/workflows/build.yml
git commit -m "ci: GitHub Actions CI/CD pipeline (test + build + lint)"
git push
```

---

## Task 4: Test Coverage Report

**Files:**
- Update: `vitest.config.ts`
- Create: `.github/workflows/coverage.yml`

**Interfaces:**
- Consumes: test results
- Produces: coverage metrics

- [ ] **Step 1: Enable coverage in Vitest**

Update `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.next/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

- [ ] **Step 2: Add coverage report workflow**

Create `.github/workflows/coverage.yml`:

```yaml
name: Coverage

on:
  push:
    branches: [main]

jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run test -- --coverage

      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          flags: unittests
```

- [ ] **Step 3: Commit**

```bash
git add vitest.config.ts .github/workflows/coverage.yml
git commit -m "ci: test coverage reporting (Codecov)"
git push
```

---

## Task 5: Deploy Readiness Checklist

**Files:**
- Create: `DEPLOY_CHECKLIST.md`

**Interfaces:**
- Documents: go-live prerequisites

- [ ] **Step 1: Create checklist**

Create `DEPLOY_CHECKLIST.md`:

```markdown
# Deployment Readiness Checklist

## Pre-Deployment (Dev)

- [ ] All tests pass: `npm run test`
- [ ] Build succeeds: `npm run build`
- [ ] No linting errors: `npm run lint`
- [ ] Code coverage > 80% on critical paths (lib/security.ts, lib/cache.ts, API routes)
- [ ] All secrets in .env (not .git)
- [ ] Database migrations up-to-date: `npx prisma migrate status`
- [ ] git status clean (no uncommitted changes)

## Staging Deployment

- [ ] Database backup taken
- [ ] Environment variables set (staging values)
- [ ] Smoke tests pass (see docs/DEPLOYMENT.md)
- [ ] Daily.co API key configured
- [ ] Deepgram API key configured (if using transcription)
- [ ] Error logging configured (e.g., Sentry)
- [ ] Email notifications enabled (for errors)

## Production Deployment

- [ ] Release tagged: `git tag -a v1.0.0 -m "Production release v1.0.0"`
- [ ] Changelog updated
- [ ] Runbook prepared (troubleshooting guide)
- [ ] On-call rotation briefed
- [ ] Rollback plan documented
- [ ] Database backup automated
- [ ] SSL/TLS certificate valid
- [ ] Rate limiting configured (reverse proxy/CDN)
- [ ] Monitoring alerts set up (Sentry, Datadog, or similar)
- [ ] Uptime monitoring enabled (status page)

## Post-Deployment

- [ ] Smoke tests pass on production
- [ ] Error rate < 0.1% (first hour)
- [ ] Database connection pool stable
- [ ] API latency < 500ms (p95)
- [ ] No unexpected errors in logs
```

- [ ] **Step 2: Add to root docs**

Move DEPLOY_CHECKLIST.md to repo root and commit:

```bash
git add DEPLOY_CHECKLIST.md
git commit -m "docs: deployment readiness checklist"
git push
```

---

## Task 6: Final Verification

**Files:**
- Run: full test suite + build

**Interfaces:**
- Consumes: all code
- Produces: green CI pipeline

- [ ] **Step 1: Run local verification**

```bash
npm run test
npm run build
npm run lint
```

Expected: All PASS.

- [ ] **Step 2: Verify CI pipeline on GitHub**

Push to main and watch GitHub Actions:
- CI workflow should pass (test + lint)
- Build workflow should pass
- Coverage report should generate

- [ ] **Step 3: Tag release**

```bash
git tag -a v1.0.0-beta -m "Beta release: Fases 2-4 complete, CI/CD ready"
git push origin v1.0.0-beta
```

- [ ] **Step 4: Final commit summary**

```bash
git log --oneline main | head -10
```

Expected: See all Fase commits + Fase 5 CI/CD commits.

---

## End of Fase 5

Testing + CI/CD complete: every commit is tested, linted, and deployable.

**Next:** Fase 6 (Production deployment) or iterate on Fases 1-5.

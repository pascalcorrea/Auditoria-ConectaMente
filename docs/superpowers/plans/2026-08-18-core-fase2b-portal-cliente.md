# ConectaMente Core™ — Fase 2b (Portal cliente) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the read-only client portal for ConectaMente Core — `/cliente/casos` (listing, filterable by estado, scoped to the user's own organización), `/cliente/casos/[id]` (detail + download link when available), a download endpoint that records every download in `LogDescarga`, and the auth extension both depend on.

**Architecture:** Same Next.js 15 + Prisma + PostgreSQL app from Fases 0-2a. Extends `lib/auth.ts`/`types/next-auth.d.ts` to propagate `Usuario.organizacionId` into the NextAuth session (a gap left over from Fase 0, which only propagated `rol`). No schema changes — `Caso`, `Informe`, `LogDescarga` already exist from Fase 1.

**Tech Stack:** Existing stack (Next.js 15, Prisma 5.22.0, NextAuth v4, Vitest) — no new dependencies.

## Global Constraints

- Full design rationale for every decision below is in `docs/superpowers/specs/2026-08-18-fase2b-portal-cliente-design.md` — read it before starting Task 1.
- **Every new server component page that queries Prisma MUST include `export const dynamic = 'force-dynamic'`.** Fase 2a's whole-branch review found that Next.js silently statically prerenders any page with no dynamic API (no `cookies()`/`headers()`/`getServerSession()`/`searchParams`), freezing its data at build time in production. Do not skip this on any of Task 4 or Task 5's pages.
- **Never let a Prisma `where` filter receive `undefined` or `null` for `organizacionId`.** Passing `undefined` to a Prisma filter field means "don't filter on this field" — silently returning every organización's casos instead of just the user's own. Every query in this plan explicitly checks `session?.user?.organizacionId` is a truthy string and calls `notFound()`/returns 403 *before* it is ever used in a query — never queries first and checks after.
- **Cross-organización access on pages returns 404 (`notFound()`), not 403.** Doc 03 §7: "un cliente jamás debe poder consultar casos de otra organización" — a 403 would confirm the resource exists; a 404 does not. This applies to `/cliente/casos/[id]` and the download endpoint's not-found/wrong-org/not-ready cases. Missing/invalid session on the download endpoint (no session at all, or wrong role) returns 403, since there's no specific resource whose existence could leak in that case.
- `/api/cliente/*` route handlers are **not** covered by `middleware.ts` (its matcher is `/cliente/:path*`, not `/api/cliente/:path*`) — same gap Fase 2a found and fixed for `/api/admin/*`. The download endpoint in Task 6 checks the session inline.
- Download is gated on `Caso.estado === 'entregado'` specifically, not merely `Informe.archivoFirmadoUrl` existing — see the design spec's rationale (the médico can sign before backoffice's internal review step completes; the client should not see it until that's done).
- Reuse existing UI primitives (`Button`, `Input`, `Select`, `Card` from `components/ui/`) — no new component libraries, no new dependencies.
- All new/modified fields and functions use camelCase, matching every prior phase's convention.
- Local dev database: native PostgreSQL, role `auditoria_dev`, database `auditoria_conectamente_dev`, host `127.0.0.1:5432`. Prisma CLI commands need `.env.local`'s vars exported into the shell first (`export $(grep -v '^#' .env.local | xargs)` in bash).
- This project's local dev database is shared across worktrees/sessions and never reset between runs — Fase 2a hit real test-isolation bugs from this (`lib/asignacion.test.ts` needed to deactivate/restore pre-existing seeded médicos around its assertions). Any new test that could be affected by pre-existing rows (e.g. counting or asserting exclusivity across a whole table) must use uniquely-named/uniquely-scoped fixtures and clean up after itself, the same way `lib/excel-import.test.ts` and `lib/asignacion.test.ts` already do — never assume a table starts empty.

---

## Task 1: Extend NextAuth session with organizacionId

**Files:**
- Modify: `lib/auth.ts`
- Modify: `types/next-auth.d.ts`
- Create: `lib/auth-session.test.ts`

**Interfaces:**
- Consumes: `Usuario.organizacionId` (Fase 1), existing `authOptions` structure (Fase 0).
- Produces: `session.user.organizacionId: string | null` — consumed by Tasks 3-6's RBAC checks.

- [ ] **Step 1: Write the failing test**

Create `lib/auth-session.test.ts`:

```typescript
import { authOptions } from './auth'

describe('authOptions callbacks propagate organizacionId', () => {
  it('jwt callback copies organizacionId from the user object onto the token', async () => {
    const jwtCallback = authOptions.callbacks!.jwt!
    const token = {} as Parameters<typeof jwtCallback>[0]['token']
    const user = {
      id: 'u1',
      name: 'Cliente Test',
      email: 'cliente@example.com',
      rol: 'cliente',
      organizacionId: 'org-1',
    }

    const result = await jwtCallback({ token, user } as Parameters<typeof jwtCallback>[0])

    expect(result.organizacionId).toBe('org-1')
  })

  it('jwt callback copies a null organizacionId for a medico/backoffice user', async () => {
    const jwtCallback = authOptions.callbacks!.jwt!
    const token = {} as Parameters<typeof jwtCallback>[0]['token']
    const user = {
      id: 'u2',
      name: 'Medico Test',
      email: 'medico@example.com',
      rol: 'medico',
      organizacionId: null,
    }

    const result = await jwtCallback({ token, user } as Parameters<typeof jwtCallback>[0])

    expect(result.organizacionId).toBeNull()
  })

  it('session callback exposes organizacionId from the token onto session.user', async () => {
    const sessionCallback = authOptions.callbacks!.session!
    const session = { user: {}, expires: '2099-01-01' } as Parameters<typeof sessionCallback>[0]['session']
    const token = { rol: 'cliente', organizacionId: 'org-1' } as Parameters<typeof sessionCallback>[0]['token']

    const result = await sessionCallback({ session, token } as Parameters<typeof sessionCallback>[0])

    expect(result.user.organizacionId).toBe('org-1')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- auth-session.test.ts`
Expected: FAIL — `result.organizacionId` is `undefined`, not `'org-1'`/`null` (the callback doesn't set it yet).

- [ ] **Step 3: Extend types/next-auth.d.ts**

Replace `types/next-auth.d.ts` in full:

```typescript
import type { Rol } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id?: string
      name?: string | null
      email?: string | null
      rol?: Rol
      organizacionId?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    rol?: Rol
    organizacionId?: string | null
  }
}
```

- [ ] **Step 4: Extend lib/auth.ts**

Replace `lib/auth.ts` in full:

```typescript
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { verifyCredentials } from './auth-credentials'
import type { Rol } from '@prisma/client'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'Credenciales',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const usuario = await verifyCredentials(credentials.email, credentials.password)
        if (!usuario) return null
        return {
          id: usuario.id,
          name: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          organizacionId: usuario.organizacionId,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as { rol: Rol; organizacionId: string | null }
        token.rol = u.rol
        token.organizacionId = u.organizacionId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.rol = token.rol
        session.user.organizacionId = token.organizacionId
      }
      return session
    },
  },
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm run test -- auth-session.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Run the full suite and build**

```bash
npm run test
npm run build
```

Expected: all tests pass, build succeeds.

- [ ] **Step 7: Commit**

```bash
git add lib/auth.ts types/next-auth.d.ts lib/auth-session.test.ts
git commit -m "feat: propagate Usuario.organizacionId into the NextAuth session"
git push
```

---

## Task 2: Seed example Caso + Informe data per organización

**Files:**
- Modify: `prisma/seed.ts`

**Interfaces:**
- Consumes: `prisma.caso`, `prisma.informe` (Fase 1), seeded `Organizacion`/`Usuario` rows (Fase 1).
- Produces: seeded rows only — no new exported functions or types for later tasks.

- [ ] **Step 1: Extend the seed script**

Add the following to `prisma/seed.ts`, after the two `cliente-*` `usuario.upsert` calls and before the closing `console.log` lines:

```typescript
  const medico1 = await prisma.usuario.findUniqueOrThrow({ where: { email: 'medico1@conectamente.cl' } })
  const medico2 = await prisma.usuario.findUniqueOrThrow({ where: { email: 'medico2@conectamente.cl' } })

  const casoIsapre = await prisma.caso.upsert({
    where: { id: 'seed-caso-isapre-entregado' },
    update: {},
    create: {
      id: 'seed-caso-isapre-entregado',
      organizacionId: isapre.id,
      medicoId: medico1.id,
      rutEvaluado: '12345678-5',
      nombreEvaluado: 'Evaluado Isapre Demo',
      estado: 'entregado',
      tipoLicencia: 'licencia comun',
      fechaEmisionLicencia: new Date('2026-07-01'),
      fechaIngreso: new Date('2026-07-05'),
      fechaLimite: new Date('2026-07-15'),
      prioridad: 'normal',
    },
  })

  await prisma.informe.upsert({
    where: { casoId: casoIsapre.id },
    update: {},
    create: {
      casoId: casoIsapre.id,
      archivoUrl: 'https://example.com/informe-demo-isapre-borrador.pdf',
      archivoFirmadoUrl: 'https://example.com/informe-demo-isapre-firmado.pdf',
      generadoPor: medico1.id,
      firmaProveedor: 'firmaweb',
      firmaTimestamp: new Date('2026-07-14'),
    },
  })

  const casoEmpresa = await prisma.caso.upsert({
    where: { id: 'seed-caso-empresa-entregado' },
    update: {},
    create: {
      id: 'seed-caso-empresa-entregado',
      organizacionId: empresa.id,
      medicoId: medico2.id,
      rutEvaluado: '40000000-K',
      nombreEvaluado: 'Evaluado Empresa Demo',
      estado: 'entregado',
      tipoLicencia: 'licencia comun',
      fechaEmisionLicencia: new Date('2026-07-01'),
      fechaIngreso: new Date('2026-07-05'),
      fechaLimite: new Date('2026-07-20'),
      prioridad: 'urgente',
    },
  })

  await prisma.informe.upsert({
    where: { casoId: casoEmpresa.id },
    update: {},
    create: {
      casoId: casoEmpresa.id,
      archivoUrl: 'https://example.com/informe-demo-empresa-borrador.pdf',
      archivoFirmadoUrl: 'https://example.com/informe-demo-empresa-firmado.pdf',
      generadoPor: medico2.id,
      firmaProveedor: 'sovos',
      firmaTimestamp: new Date('2026-07-19'),
    },
  })

  console.log('Seeded 1 caso entregado + informe por organización (isapre, empresa)')
```

`Caso` has no unique field besides `id` (same situation `Organizacion` was in during Fase 1) — fixed deterministic ids (`seed-caso-isapre-entregado`, `seed-caso-empresa-entregado`) keep the upsert idempotent across repeated runs, matching the established pattern.

- [ ] **Step 2: Run the seed script**

```bash
export $(grep -v '^#' .env.local | xargs)
npm run seed
```

Expected output includes: `Seeded 1 caso entregado + informe por organización (isapre, empresa)`, in addition to the existing seed lines from Fases 0-1.

- [ ] **Step 3: Verify the seeded data**

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const casos = await prisma.caso.findMany({ where: { estado: 'entregado' }, include: { organizacion: true, informe: true } });
  console.log(JSON.stringify(casos.map(c => ({ nombre: c.nombreEvaluado, org: c.organizacion.nombre, informe: !!c.informe, firmado: c.informe?.archivoFirmadoUrl })), null, 2));
  await prisma.\$disconnect();
})();
"
```

Expected: 2 rows — one for `Isapre Demo` with `informe: true` and a `firmado` URL, one for `Empresa Demo` likewise.

- [ ] **Step 4: Run the seed script again to confirm idempotency**

```bash
npm run seed
```

Expected: same output, no errors, no duplicate rows (re-run the Step 3 query and confirm still 2 rows).

- [ ] **Step 5: Run the full test suite**

Run: `npm run test`
Expected: PASS — unaffected by seed data.

- [ ] **Step 6: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat: seed example entregado Caso + Informe per organización"
git push
```

---

## Task 3: Query helper for client-scoped case listing

**Files:**
- Create: `lib/cliente-casos.ts`
- Create: `lib/cliente-casos.test.ts`

**Interfaces:**
- Consumes: `prisma.caso` (Fase 1), `EstadoCaso` enum (Fase 1).
- Produces: `listarCasosCliente(organizacionId: string, estado?: EstadoCaso): Promise<Caso[]>` — consumed by Task 4's listing page.

- [ ] **Step 1: Write the failing test**

Create `lib/cliente-casos.test.ts`:

```typescript
import { prisma } from './prisma'
import { listarCasosCliente } from './cliente-casos'

describe('listarCasosCliente', () => {
  const ids: { orgAId?: string; orgBId?: string; casoIds: string[] } = { casoIds: [] }

  beforeAll(async () => {
    const orgA = await prisma.organizacion.create({
      data: { nombre: `Test Org A ClienteCasos ${Date.now()}`, tipo: 'empresa', plazoSlaDias: 10 },
    })
    ids.orgAId = orgA.id

    const orgB = await prisma.organizacion.create({
      data: { nombre: `Test Org B ClienteCasos ${Date.now()}`, tipo: 'isapre', plazoSlaDias: 10 },
    })
    ids.orgBId = orgB.id

    async function crearCaso(organizacionId: string, estado: 'recibido' | 'entregado') {
      const caso = await prisma.caso.create({
        data: {
          organizacionId,
          estado,
          rutEvaluado: '12345678-5',
          nombreEvaluado: 'Evaluado Test',
          tipoLicencia: 'licencia comun',
          fechaEmisionLicencia: new Date(),
          fechaIngreso: new Date(),
          fechaLimite: new Date(),
          prioridad: 'normal',
        },
      })
      ids.casoIds.push(caso.id)
      return caso
    }

    await crearCaso(orgA.id, 'recibido')
    await crearCaso(orgA.id, 'entregado')
    await crearCaso(orgB.id, 'recibido')
  })

  afterAll(async () => {
    for (const casoId of ids.casoIds) await prisma.caso.delete({ where: { id: casoId } })
    if (ids.orgAId) await prisma.organizacion.delete({ where: { id: ids.orgAId } })
    if (ids.orgBId) await prisma.organizacion.delete({ where: { id: ids.orgBId } })
    await prisma.$disconnect()
  })

  it('only returns casos belonging to the given organización', async () => {
    const casos = await listarCasosCliente(ids.orgAId!)
    expect(casos).toHaveLength(2)
    expect(casos.every((c) => c.organizacionId === ids.orgAId)).toBe(true)
  })

  it('filters by estado when provided', async () => {
    const casos = await listarCasosCliente(ids.orgAId!, 'entregado')
    expect(casos).toHaveLength(1)
    expect(casos[0].estado).toBe('entregado')
  })

  it('returns an empty array for an organización with no casos', async () => {
    const organizacionVacia = await prisma.organizacion.create({
      data: { nombre: `Test Org Vacia ${Date.now()}`, tipo: 'empresa', plazoSlaDias: 10 },
    })

    const casos = await listarCasosCliente(organizacionVacia.id)
    expect(casos).toEqual([])

    await prisma.organizacion.delete({ where: { id: organizacionVacia.id } })
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- cliente-casos.test.ts`
Expected: FAIL — `Cannot find module './cliente-casos'`.

- [ ] **Step 3: Implement the query helper**

Create `lib/cliente-casos.ts`:

```typescript
import { prisma } from './prisma'
import type { Caso, EstadoCaso } from '@prisma/client'

export async function listarCasosCliente(organizacionId: string, estado?: EstadoCaso): Promise<Caso[]> {
  return prisma.caso.findMany({
    where: {
      organizacionId,
      ...(estado ? { estado } : {}),
    },
    orderBy: { fechaLimite: 'asc' },
  })
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- cliente-casos.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Run the full suite and build**

```bash
npm run test
npm run build
```

Expected: all tests pass, build succeeds.

- [ ] **Step 6: Commit**

```bash
git add lib/cliente-casos.ts lib/cliente-casos.test.ts
git commit -m "feat: add organización-scoped Caso query helper for the cliente portal"
git push
```

---

## Task 4: /cliente/casos listing page

**Files:**
- Create: `app/cliente/casos/page.tsx`

**Interfaces:**
- Consumes: `getServerSession`/`authOptions` (Fase 0, extended by Task 1), `listarCasosCliente` (Task 3), `Select`/`Button` (Fase 0).
- Produces: nothing consumed by later tasks in this plan.

- [ ] **Step 1: Implement the page**

Create `app/cliente/casos/page.tsx`:

```tsx
import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { listarCasosCliente } from '@/lib/cliente-casos'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import type { EstadoCaso } from '@prisma/client'

const ESTADOS: { value: EstadoCaso | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'recibido', label: 'Recibido' },
  { value: 'en_revision', label: 'En revisión' },
  { value: 'informe_en_validacion', label: 'Informe en validación' },
  { value: 'entregado', label: 'Entregado' },
]

export const dynamic = 'force-dynamic'

export default async function ClienteCasosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizacionId) notFound()

  const { estado } = await searchParams
  const estadoFiltro = ESTADOS.some((e) => e.value === estado && estado !== '')
    ? (estado as EstadoCaso)
    : undefined

  const casos = await listarCasosCliente(session.user.organizacionId, estadoFiltro)

  return (
    <div className="p-8">
      <h1 className="text-lg font-medium text-brand-text">Mis casos</h1>

      <form method="get" className="mt-4 flex max-w-xs items-end gap-4">
        <Select
          label="Estado"
          name="estado"
          defaultValue={estado ?? ''}
          options={ESTADOS.map((e) => ({ value: e.value, label: e.label }))}
        />
        <Button type="submit" variant="secondary">Filtrar</Button>
      </form>

      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-brand-textSecondary">
            <th className="pb-2">Evaluado</th>
            <th className="pb-2">Estado</th>
            <th className="pb-2">Prioridad</th>
            <th className="pb-2">Fecha límite</th>
          </tr>
        </thead>
        <tbody>
          {casos.map((caso) => (
            <tr key={caso.id} className="border-t border-brand-borderSoft">
              <td className="py-2">
                <a href={`/cliente/casos/${caso.id}`} className="text-brand-accent underline">
                  {caso.nombreEvaluado} ({caso.rutEvaluado})
                </a>
              </td>
              <td className="py-2">{caso.estado}</td>
              <td className="py-2">{caso.prioridad}</td>
              <td className="py-2">{caso.fechaLimite.toLocaleDateString('es-CL')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Run the full suite and build**

```bash
npm run test
npm run build
```

Expected: all tests pass (no new automated tests in this task — it's UI wiring over Task 3's already-tested query helper), build succeeds, `/cliente/casos` appears in the build's route list marked `ƒ` (Dynamic).

- [ ] **Step 3: Manual verification**

```bash
npm run seed
npm run dev
```

In a browser, logged in as `cliente-isapre@conectamente.cl` / `ChangeMe123!`:
1. Visit `/cliente/casos` — expect to see exactly the seeded `Evaluado Isapre Demo` row (from Task 2), estado `entregado`.
2. Filter by estado `Recibido` — expect the table to become empty (the seeded case is `entregado`, not `recibido`).
3. Filter back to `Todos` — expect the row to reappear.

Log out, log in as `cliente-empresa@conectamente.cl` / `ChangeMe123!`:
4. Visit `/cliente/casos` — expect to see only `Evaluado Empresa Demo`, never the isapre one (confirms organización isolation).

Stop the dev server after confirming.

- [ ] **Step 4: Commit**

```bash
git add app/cliente/casos/page.tsx
git commit -m "feat: /cliente/casos listing page (organización-scoped, filterable by estado)"
git push
```

---

## Task 5: /cliente/casos/[id] detail page

**Files:**
- Create: `app/cliente/casos/[id]/page.tsx`

**Interfaces:**
- Consumes: `getServerSession`/`authOptions` (Fase 0, extended by Task 1), `prisma.caso` (Fase 1), `Card` (Fase 0).
- Produces: links to `/api/cliente/casos/[id]/descargar`, implemented in Task 6.

- [ ] **Step 1: Implement the page**

Create `app/cliente/casos/[id]/page.tsx`:

```tsx
import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card } from '@/components/ui/Card'

export const dynamic = 'force-dynamic'

export default async function ClienteCasoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizacionId) notFound()

  const { id } = await params
  const caso = await prisma.caso.findUnique({
    where: { id },
    include: { organizacion: true, informe: true },
  })

  if (!caso || caso.organizacionId !== session.user.organizacionId) notFound()

  const puedeDescargar = caso.estado === 'entregado' && Boolean(caso.informe?.archivoFirmadoUrl)

  return (
    <div className="p-8">
      <h1 className="text-lg font-medium text-brand-text">
        {caso.nombreEvaluado} ({caso.rutEvaluado})
      </h1>
      <Card className="mt-4 max-w-md">
        <dl className="flex flex-col gap-3 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-brand-textSecondary">Organización</dt>
            <dd className="text-brand-text">{caso.organizacion.nombre}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-brand-textSecondary">Tipo de licencia</dt>
            <dd className="text-brand-text">{caso.tipoLicencia}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-brand-textSecondary">Estado</dt>
            <dd className="text-brand-text">{caso.estado}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-brand-textSecondary">Prioridad</dt>
            <dd className="text-brand-text">{caso.prioridad}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-brand-textSecondary">Fecha límite</dt>
            <dd className="text-brand-text">{caso.fechaLimite.toLocaleDateString('es-CL')}</dd>
          </div>
        </dl>

        {puedeDescargar ? (
          <a
            href={`/api/cliente/casos/${caso.id}/descargar`}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-accentHover"
          >
            Descargar informe
          </a>
        ) : (
          <p className="mt-4 text-sm text-brand-textSecondary">El informe aún no está disponible para descarga.</p>
        )}
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Run the full suite and build**

```bash
npm run test
npm run build
```

Expected: all tests pass, build succeeds, `/cliente/casos/[id]` appears in the build's route list.

- [ ] **Step 3: Manual verification**

```bash
npm run dev
```

In a browser, logged in as `cliente-isapre@conectamente.cl` / `ChangeMe123!`:
1. From `/cliente/casos`, click into the seeded `Evaluado Isapre Demo` case.
2. Expect to see all fields populated, and a "Descargar informe" link (the seeded case is `entregado` with an `archivoFirmadoUrl`).
3. Manually visit `/cliente/casos/<id-of-the-empresa-caso>` (copy the id from a direct DB query or from logging in as `cliente-empresa@conectamente.cl` first to see its URL) while still logged in as `cliente-isapre@conectamente.cl` — expect a 404 page (Next.js's default not-found page), confirming organización isolation on the detail route.

Stop the dev server after confirming.

- [ ] **Step 4: Commit**

```bash
git add "app/cliente/casos/[id]/page.tsx"
git commit -m "feat: /cliente/casos/[id] detail page with conditional download link"
git push
```

---

## Task 6: Download endpoint with LogDescarga audit trail

**Files:**
- Create: `app/api/cliente/casos/[id]/descargar/route.ts`
- Create: `app/api/cliente/casos/[id]/descargar/route.test.ts`

**Interfaces:**
- Consumes: `getServerSession`/`authOptions` (Task 1), `prisma.caso`/`prisma.informe`/`prisma.logDescarga` (Fase 1).
- Produces: nothing consumed by later tasks — this is the last task in this plan.

- [ ] **Step 1: Write the failing test**

Create `app/api/cliente/casos/[id]/descargar/route.test.ts`:

```typescript
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { GET } from './route'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))

const mockedGetServerSession = getServerSession as unknown as ReturnType<typeof vi.fn>

describe('GET /api/cliente/casos/[id]/descargar', () => {
  const ids: { organizacionId?: string; otraOrganizacionId?: string; medicoId?: string } = {}

  beforeAll(async () => {
    const organizacion = await prisma.organizacion.create({
      data: { nombre: `Test Org Descarga ${Date.now()}`, tipo: 'empresa', plazoSlaDias: 10 },
    })
    ids.organizacionId = organizacion.id

    const otraOrganizacion = await prisma.organizacion.create({
      data: { nombre: `Test Otra Org Descarga ${Date.now()}`, tipo: 'empresa', plazoSlaDias: 10 },
    })
    ids.otraOrganizacionId = otraOrganizacion.id

    const medico = await prisma.usuario.create({
      data: {
        nombre: 'Medico Test Descarga',
        email: `medico-descarga-${Date.now()}@example.com`,
        passwordHash: 'irrelevant-for-this-test',
        rol: 'medico',
      },
    })
    ids.medicoId = medico.id
  })

  afterAll(async () => {
    if (ids.organizacionId) await prisma.organizacion.delete({ where: { id: ids.organizacionId } })
    if (ids.otraOrganizacionId) await prisma.organizacion.delete({ where: { id: ids.otraOrganizacionId } })
    if (ids.medicoId) await prisma.usuario.delete({ where: { id: ids.medicoId } })
    await prisma.$disconnect()
  })

  async function crearCasoConInforme(organizacionId: string, estado: 'entregado' | 'recibido') {
    const caso = await prisma.caso.create({
      data: {
        organizacionId,
        medicoId: ids.medicoId,
        estado,
        rutEvaluado: '12345678-5',
        nombreEvaluado: 'Evaluado Descarga Test',
        tipoLicencia: 'licencia comun',
        fechaEmisionLicencia: new Date(),
        fechaIngreso: new Date(),
        fechaLimite: new Date(),
        prioridad: 'normal',
      },
    })

    await prisma.informe.create({
      data: {
        casoId: caso.id,
        archivoUrl: 'https://example.com/borrador.pdf',
        archivoFirmadoUrl: 'https://example.com/firmado.pdf',
        generadoPor: ids.medicoId!,
        firmaProveedor: 'firmaweb',
      },
    })

    return caso
  }

  async function limpiarCaso(casoId: string) {
    await prisma.logDescarga.deleteMany({ where: { informe: { casoId } } })
    await prisma.informe.deleteMany({ where: { casoId } })
    await prisma.caso.delete({ where: { id: casoId } })
  }

  it('redirects to archivoFirmadoUrl and creates a LogDescarga row for the owning organización, entregado caso', async () => {
    const caso = await crearCasoConInforme(ids.organizacionId!, 'entregado')

    mockedGetServerSession.mockResolvedValue({
      user: { id: 'cliente-test-id', rol: 'cliente', organizacionId: ids.organizacionId },
    })

    const request = new NextRequest(`http://localhost/api/cliente/casos/${caso.id}/descargar`)
    const response = await GET(request, { params: Promise.resolve({ id: caso.id }) })

    expect(response.status).toBeGreaterThanOrEqual(300)
    expect(response.status).toBeLessThan(400)
    expect(response.headers.get('location')).toBe('https://example.com/firmado.pdf')

    const informe = await prisma.informe.findUnique({ where: { casoId: caso.id } })
    const descargas = await prisma.logDescarga.findMany({ where: { informeId: informe!.id } })
    expect(descargas).toHaveLength(1)
    expect(descargas[0].usuarioId).toBe('cliente-test-id')

    await limpiarCaso(caso.id)
  })

  it('returns 404 for a caso belonging to a different organización', async () => {
    const caso = await crearCasoConInforme(ids.otraOrganizacionId!, 'entregado')

    mockedGetServerSession.mockResolvedValue({
      user: { id: 'cliente-test-id', rol: 'cliente', organizacionId: ids.organizacionId },
    })

    const request = new NextRequest(`http://localhost/api/cliente/casos/${caso.id}/descargar`)
    const response = await GET(request, { params: Promise.resolve({ id: caso.id }) })

    expect(response.status).toBe(404)

    await limpiarCaso(caso.id)
  })

  it('returns 404 without creating a LogDescarga when the caso is not entregado yet', async () => {
    const caso = await crearCasoConInforme(ids.organizacionId!, 'recibido')

    mockedGetServerSession.mockResolvedValue({
      user: { id: 'cliente-test-id', rol: 'cliente', organizacionId: ids.organizacionId },
    })

    const request = new NextRequest(`http://localhost/api/cliente/casos/${caso.id}/descargar`)
    const response = await GET(request, { params: Promise.resolve({ id: caso.id }) })

    expect(response.status).toBe(404)

    const informe = await prisma.informe.findUnique({ where: { casoId: caso.id } })
    const descargas = await prisma.logDescarga.findMany({ where: { informeId: informe!.id } })
    expect(descargas).toHaveLength(0)

    await limpiarCaso(caso.id)
  })

  it('returns 403 when there is no session', async () => {
    mockedGetServerSession.mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/cliente/casos/some-id/descargar')
    const response = await GET(request, { params: Promise.resolve({ id: 'some-id' }) })

    expect(response.status).toBe(403)
  })

  it('returns 403 for a valid session with the wrong rol', async () => {
    mockedGetServerSession.mockResolvedValue({
      user: { id: 'backoffice-test-id', rol: 'backoffice', organizacionId: null },
    })

    const request = new NextRequest('http://localhost/api/cliente/casos/some-id/descargar')
    const response = await GET(request, { params: Promise.resolve({ id: 'some-id' }) })

    expect(response.status).toBe(403)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- route.test.ts`
Expected: FAIL — `Cannot find module './route'`.

- [ ] **Step 3: Implement the download endpoint**

Create `app/api/cliente/casos/[id]/descargar/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'cliente' || !session.user.organizacionId || !session.user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { id } = await params
  const caso = await prisma.caso.findUnique({
    where: { id },
    include: { informe: true },
  })

  const informe = caso?.informe

  if (
    !caso ||
    caso.organizacionId !== session.user.organizacionId ||
    caso.estado !== 'entregado' ||
    !informe?.archivoFirmadoUrl
  ) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  await prisma.logDescarga.create({
    data: {
      informeId: informe.id,
      usuarioId: session.user.id,
    },
  })

  return NextResponse.redirect(informe.archivoFirmadoUrl)
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- route.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Run the full suite and build**

```bash
npm run test
npm run build
```

Expected: all tests pass, build succeeds, `/api/cliente/casos/[id]/descargar` appears in the build's route list.

- [ ] **Step 6: Manual verification**

```bash
npm run dev
```

In a browser, logged in as `cliente-isapre@conectamente.cl` / `ChangeMe123!`:
1. From the seeded case's detail page (`/cliente/casos/<id>`), click "Descargar informe".
2. Expect the browser to navigate to `https://example.com/informe-demo-isapre-firmado.pdf` (a placeholder URL — this will not actually resolve to a real file since no storage integration exists yet; confirming the redirect target is correct is the point of this check, not that the file downloads).
3. Query the database directly to confirm a new `LogDescarga` row was created:

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const descargas = await prisma.logDescarga.findMany({ include: { usuario: true, informe: { include: { caso: true } } } });
  console.log(JSON.stringify(descargas.map(d => ({ usuario: d.usuario.email, evaluado: d.informe.caso.nombreEvaluado, timestamp: d.timestamp })), null, 2));
  await prisma.\$disconnect();
})();
"
```

Expected: one row showing `cliente-isapre@conectamente.cl` downloading the `Evaluado Isapre Demo` informe.

Stop the dev server after confirming.

- [ ] **Step 7: Commit**

```bash
git add "app/api/cliente/casos/[id]/descargar"
git commit -m "feat: informe download endpoint with LogDescarga audit trail"
git push
```

---

## End of Fase 2b

At this point: cliente institucional users can log in, see only their own organización's casos (filterable by estado), view case detail, and download the informe once it's `entregado` — with every download recorded in `LogDescarga` per doc 03 §5.5/§7's audit requirement. This closes out Fase 2 entirely (both 2a and 2b). Per the master prompt's working rules, **stop here and report back** — what was built and what's pending — before starting Fase 3 (portal médico + video).

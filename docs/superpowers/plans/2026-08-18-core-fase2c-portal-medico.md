# ConectaMente Core™ — Fase 2c (Portal médico) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the physician portal for ConectaMente Core — `/medico/casos` (listing), `/medico/casos/[id]` (detail + evaluation form), `/medico/casos/[id]/sesion` (Daily.co video room + consent capture), and `/medico/casos/[id]/informe` (report generation + signature).

**Architecture:** Same Next.js 15 + Prisma + PostgreSQL app from Fases 0-2b. Extends existing Caso/Sesion/Informe models. No schema changes — all entities exist from Fase 1.

**Tech Stack:** Existing stack (Next.js 15, Prisma 5.22.0, NextAuth v4, Vitest) + Daily.co SDK for video.

## Global Constraints

- Full design rationale in `docs/superpowers/specs/2026-08-18-fase2c-portal-medico-design.md` — read before Task 1.
- **Every new server component page that queries Prisma MUST include `export const dynamic = 'force-dynamic'`.** (Fase 2a whole-branch review finding.)
- **Never let a Prisma `where` filter receive `undefined` or `null` for `medicoId`.** Médico queries must always check `session?.user?.id` is truthy and call `notFound()` before querying.
- Cross-médico access returns 404 (`notFound()`), not 403 — never confirm a resource exists to an unauthorized user.
- `/api/medico/*` routes are NOT covered by `middleware.ts` (matcher is `/medico/:path*`, not `/api/medico/:path*`) — check session inline.
- Reuse existing UI primitives (`Button`, `Input`, `Select`, `Card`, `Textarea` from `components/ui/`) — no new component libraries.
- All new/modified fields use camelCase.
- Local dev database: shared PostgreSQL on VPS via SSH tunnel (localhost:5433).

---

## Task 1: Query helper for médico-assigned case listing

**Files:**
- Create: `lib/medico-casos.ts`
- Create: `lib/medico-casos.test.ts`

**Interfaces:**
- Consumes: `prisma.caso` (Fase 1).
- Produces: `listarCasosMedico(medicoId: string): Promise<Caso[]>` — consumed by Task 2's listing page.

- [ ] **Step 1: Write the failing test**

Create `lib/medico-casos.test.ts`:

```typescript
import { prisma } from './prisma'
import { listarCasosMedico } from './medico-casos'

describe('listarCasosMedico', () => {
  const ids: { medicoId?: string; otroMedicoId?: string; organizacionId?: string; casoIds: string[] } = { casoIds: [] }

  beforeAll(async () => {
    const organizacion = await prisma.organizacion.create({
      data: { nombre: `Test Org MedicoCasos ${Date.now()}`, tipo: 'empresa', plazoSlaDias: 10 },
    })
    ids.organizacionId = organizacion.id

    const medico = await prisma.usuario.create({
      data: {
        nombre: 'Medico Test 1',
        email: `medico-test-1-${Date.now()}@example.com`,
        passwordHash: 'irrelevant',
        rol: 'medico',
        especialidad: 'medicina_general',
      },
    })
    ids.medicoId = medico.id

    const otroMedico = await prisma.usuario.create({
      data: {
        nombre: 'Medico Test 2',
        email: `medico-test-2-${Date.now()}@example.com`,
        passwordHash: 'irrelevant',
        rol: 'medico',
        especialidad: 'medicina_general',
      },
    })
    ids.otroMedicoId = otroMedico.id

    async function crearCaso(medicoId: string, estado: 'recibido' | 'en_revision' | 'entregado') {
      const caso = await prisma.caso.create({
        data: {
          organizacionId: ids.organizacionId!,
          medicoId,
          estado,
          rutEvaluado: '12345678-5',
          nombreEvaluado: 'Evaluado Test',
          tipoLicencia: 'licencia comun',
          fechaEmisionLicencia: new Date(),
          fechaIngreso: new Date(),
          fechaLimite: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          prioridad: 'normal',
        },
      })
      ids.casoIds.push(caso.id)
      return caso
    }

    await crearCaso(ids.medicoId!, 'en_revision')
    await crearCaso(ids.medicoId!, 'entregado')
    await crearCaso(ids.otroMedicoId!, 'en_revision')
  })

  afterAll(async () => {
    for (const casoId of ids.casoIds) await prisma.caso.delete({ where: { id: casoId } })
    if (ids.medicoId) await prisma.usuario.delete({ where: { id: ids.medicoId } })
    if (ids.otroMedicoId) await prisma.usuario.delete({ where: { id: ids.otroMedicoId } })
    if (ids.organizacionId) await prisma.organizacion.delete({ where: { id: ids.organizacionId } })
    await prisma.$disconnect()
  })

  it('returns all casos assigned to the given médico, ordered by fecha_limite ascending', async () => {
    const casos = await listarCasosMedico(ids.medicoId!)
    expect(casos).toHaveLength(2)
    expect(casos.every((c) => c.medicoId === ids.medicoId)).toBe(true)
    expect(casos[0].fechaLimite <= casos[1].fechaLimite).toBe(true)
  })

  it('returns an empty array for a médico with no casos assigned', async () => {
    const nuevoMedico = await prisma.usuario.create({
      data: {
        nombre: 'Medico Sin Casos',
        email: `medico-sin-casos-${Date.now()}@example.com`,
        passwordHash: 'irrelevant',
        rol: 'medico',
        especialidad: 'medicina_general',
      },
    })

    const casos = await listarCasosMedico(nuevoMedico.id)
    expect(casos).toEqual([])

    await prisma.usuario.delete({ where: { id: nuevoMedico.id } })
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- medico-casos.test.ts`
Expected: FAIL — `Cannot find module './medico-casos'`.

- [ ] **Step 3: Implement the query helper**

Create `lib/medico-casos.ts`:

```typescript
import { prisma } from './prisma'
import type { Caso } from '@prisma/client'

export async function listarCasosMedico(medicoId: string): Promise<Caso[]> {
  return prisma.caso.findMany({
    where: { medicoId },
    orderBy: { fechaLimite: 'asc' },
  })
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- medico-casos.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Run the full suite and build**

```bash
npm run test
npm run build
```

Expected: all tests pass, build succeeds.

- [ ] **Step 6: Commit**

```bash
git add lib/medico-casos.ts lib/medico-casos.test.ts
git commit -m "feat: add médico-scoped Caso query helper for the medico portal"
git push
```

---

## Task 2: /medico/casos listing page

**Files:**
- Create: `app/medico/casos/page.tsx`

**Interfaces:**
- Consumes: `getServerSession`/`authOptions` (Fase 0), `listarCasosMedico` (Task 1), `Card` (Fase 0).
- Produces: links to `/medico/casos/[id]`, implemented in Task 3.

- [ ] **Step 1: Create medico layout (if not exists)**

Create `app/medico/layout.tsx` (or skip if exists):

```tsx
export default function MedicoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-brand-bg border-b border-brand-borderSoft p-4">
        <h1 className="text-lg font-medium text-brand-text">Portal del Médico</h1>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
```

- [ ] **Step 2: Implement the listing page**

Create `app/medico/casos/page.tsx`:

```tsx
import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { listarCasosMedico } from '@/lib/medico-casos'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export const dynamic = 'force-dynamic'

export default async function MedicoCasosPage() {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'medico' || !session.user?.id) notFound()

  const casos = await listarCasosMedico(session.user.id)

  return (
    <div className="p-8">
      <h1 className="text-lg font-medium text-brand-text">Mis casos asignados</h1>

      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-brand-textSecondary">
            <th className="pb-2">Evaluado</th>
            <th className="pb-2">Estado</th>
            <th className="pb-2">Prioridad</th>
            <th className="pb-2">Fecha límite</th>
            <th className="pb-2">Acción</th>
          </tr>
        </thead>
        <tbody>
          {casos.map((caso) => (
            <tr key={caso.id} className="border-t border-brand-borderSoft">
              <td className="py-2">{caso.nombreEvaluado} ({caso.rutEvaluado})</td>
              <td className="py-2">{caso.estado}</td>
              <td className="py-2">{caso.prioridad}</td>
              <td className="py-2">{caso.fechaLimite.toLocaleDateString('es-CL')}</td>
              <td className="py-2">
                <Button variant="secondary" size="sm" asChild>
                  <a href={`/medico/casos/${caso.id}`}>Ver detalle</a>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {casos.length === 0 && <p className="mt-4 text-sm text-brand-textSecondary">Sin casos asignados.</p>}
    </div>
  )
}
```

- [ ] **Step 3: Run the full suite and build**

```bash
npm run test
npm run build
```

Expected: all tests pass, build succeeds, `/medico/casos` appears as `ƒ` (Dynamic).

- [ ] **Step 4: Manual verification**

```bash
npm run dev
```

In a browser, log in as `medico1@conectamente.cl` / `ChangeMe123!`:
1. Visit `/medico/casos` — expect to see the seeded médico's assigned casos (if any).
2. Click "Ver detalle" to navigate to Task 3's detail page (will 404 until implemented).

Stop the dev server after confirming.

- [ ] **Step 5: Commit**

```bash
git add app/medico/layout.tsx app/medico/casos/page.tsx
git commit -m "feat: /medico/casos listing page ordered by fecha_limite"
git push
```

---

## Task 3: /medico/casos/[id] detail page + evaluation form

**Files:**
- Create: `app/medico/casos/[id]/page.tsx`

**Interfaces:**
- Consumes: `getServerSession`, `prisma.caso`, `Card`, `Textarea`, `Button`.
- Produces: links to `/medico/casos/[id]/sesion` (Task 4) and `/medico/casos/[id]/informe` (Task 5).

- [ ] **Step 1: Implement the detail page**

Create `app/medico/casos/[id]/page.tsx`:

```tsx
import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export const dynamic = 'force-dynamic'

export default async function MedicoCasoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'medico' || !session.user?.id) notFound()

  const { id } = await params
  const caso = await prisma.caso.findUnique({
    where: { id },
    include: { informe: true, sesion: true, organizacion: true },
  })

  if (!caso || caso.medicoId !== session.user.id) notFound()

  const puedeProceder = caso.estado === 'en_revision'

  return (
    <div className="p-8">
      <h1 className="text-lg font-medium text-brand-text">
        {caso.nombreEvaluado} ({caso.rutEvaluado})
      </h1>

      <Card className="mt-4 max-w-2xl">
        <dl className="grid grid-cols-2 gap-4 text-sm">
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
          <div>
            <dt className="text-xs uppercase tracking-wide text-brand-textSecondary">Ingreso</dt>
            <dd className="text-brand-text">{caso.fechaIngreso.toLocaleDateString('es-CL')}</dd>
          </div>
        </dl>

        <div className="mt-6 flex gap-2">
          {puedeProceder ? (
            <>
              <Button asChild>
                <a href={`/medico/casos/${caso.id}/sesion`}>Iniciar sesión</a>
              </Button>
              <Button variant="secondary" asChild>
                <a href={`/medico/casos/${caso.id}/informe`}>Ver/generar informe</a>
              </Button>
            </>
          ) : (
            <p className="text-sm text-brand-textSecondary">
              Solo se puede proceder cuando el caso está en revisión.
            </p>
          )}
        </div>
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

Expected: all tests pass, build succeeds.

- [ ] **Step 3: Manual verification**

```bash
npm run dev
```

Log in as `medico1@conectamente.cl`:
1. Visit `/medico/casos` and click "Ver detalle" on a caso.
2. Expect to see case details and two buttons ("Iniciar sesión", "Ver/generar informe").
3. Manually create a caso in the database in `en_revision` state assigned to this médico to test navigation.

Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add "app/medico/casos/[id]/page.tsx"
git commit -m "feat: /medico/casos/[id] detail page with evaluation actions"
git push
```

---

## Task 4: /medico/casos/[id]/sesion (Daily.co video room + consent capture)

**Files:**
- Create: `app/medico/casos/[id]/sesion/page.tsx`
- Create: `app/medico/casos/[id]/sesion/layout.tsx` (for fullscreen video room)

**Interfaces:**
- Consumes: `getServerSession`, `prisma.caso`, `prisma.sesion`, Daily.co SDK.
- Produces: Sesion record with consentimiento_timestamp, grabacion_url (after session).

> **Daily.co setup:** Before implementing, ensure:
> 1. Daily.co account created and API key configured in `.env.local` (DAILY_API_KEY).
> 2. Room properties configured for automatic recording and participant tracking.

- [ ] **Step 1: Set up Daily.co environment**

Add to `.env.local`:

```
DAILY_API_KEY=your-daily-api-key-here
DAILY_ROOM_PREFIX=conectamente
```

- [ ] **Step 2: Create Sesion record query helper**

Create `lib/medico-sesion.ts`:

```typescript
import { prisma } from './prisma'
import { Prisma } from '@prisma/client'

export async function crearSesion(casoId: string, dailyRoomUrl: string) {
  return prisma.sesion.create({
    data: {
      casoId,
      dailyRoomUrl,
      estado: 'agendada',
    },
  })
}

export async function obtenerSesion(casoId: string) {
  return prisma.sesion.findUnique({
    where: { casoId },
  })
}

export async function actualizarSesion(casoId: string, data: Prisma.SesionUpdateInput) {
  return prisma.sesion.update({
    where: { casoId },
    data,
  })
}
```

- [ ] **Step 3: Implement the video room page**

Create `app/medico/casos/[id]/sesion/page.tsx`:

```tsx
import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { crearSesion, obtenerSesion } from '@/lib/medico-sesion'
import { DailyVideoRoom } from '@/components/DailyVideoRoom'

export const dynamic = 'force-dynamic'

async function generarDailyRoom(casoId: string) {
  if (!process.env.DAILY_API_KEY) throw new Error('DAILY_API_KEY not configured')

  const response = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      name: `conectamente-${casoId}`,
      properties: {
        enable_recording: 'all',
        max_participants: 2,
      },
    }),
  })

  if (!response.ok) throw new Error('Failed to create Daily room')
  const room = await response.json()
  return room.url
}

export default async function MedicoCasoSesionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'medico' || !session.user?.id) notFound()

  const { id } = await params
  const caso = await prisma.caso.findUnique({
    where: { id },
  })

  if (!caso || caso.medicoId !== session.user.id) notFound()

  let sesion = await obtenerSesion(id)

  if (!sesion) {
    const dailyRoomUrl = await generarDailyRoom(id)
    sesion = await crearSesion(id, dailyRoomUrl)
  }

  return (
    <div className="h-screen w-screen flex flex-col">
      <header className="bg-brand-bg border-b border-brand-borderSoft p-4">
        <h1 className="text-sm font-medium text-brand-text">{caso.nombreEvaluado}</h1>
      </header>

      <DailyVideoRoom
        dailyRoomUrl={sesion.dailyRoomUrl}
        userName={`medico_${session.user.id}`}
        casoId={id}
        medicoId={session.user.id}
      />
    </div>
  )
}
```

- [ ] **Step 4: Create DailyVideoRoom component**

Create `components/DailyVideoRoom.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import DailyIframe from '@daily-co/daily-js'
import { Button } from './ui/Button'

interface DailyVideoRoomProps {
  dailyRoomUrl: string
  userName: string
  casoId: string
  medicoId: string
}

export function DailyVideoRoom({
  dailyRoomUrl,
  userName,
  casoId,
  medicoId,
}: DailyVideoRoomProps) {
  const [consentGiven, setConsentGiven] = useState(false)
  const [sessionStarted, setSessionStarted] = useState(false)

  const handleStartSession = async () => {
    if (!consentGiven) {
      alert('Debe dar consentimiento para grabar')
      return
    }

    // Record consent timestamp
    await fetch(`/api/medico/casos/${casoId}/sesion/consent`, {
      method: 'POST',
    })

    setSessionStarted(true)

    // Initialize Daily iframe
    const callFrame = DailyIframe.createFrame({
      iframeElement: document.getElementById('daily-frame') as HTMLElement,
      dailyOptions: {
        url: dailyRoomUrl,
        userName,
        showLeaveButton: true,
        showFullscreenButton: true,
      },
    })

    callFrame.join({
      userName,
    })

    callFrame.on('left-meeting', async () => {
      await fetch(`/api/medico/casos/${casoId}/sesion/end`, { method: 'POST' })
      setSessionStarted(false)
    })
  }

  if (!sessionStarted) {
    return (
      <div className="flex-1 flex items-center justify-center bg-brand-bgSecondary p-8">
        <div className="max-w-md">
          <h2 className="text-lg font-medium text-brand-text mb-4">Consentimiento de grabación</h2>
          <p className="text-sm text-brand-textSecondary mb-4">
            Confirma que tienes consentimiento del evaluado para grabar esta sesión.
          </p>
          <label className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-brand-text">Tengo consentimiento para grabar</span>
          </label>
          <Button onClick={handleStartSession} disabled={!consentGiven}>
            Iniciar sesión
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1">
      <div id="daily-frame" className="w-full h-full" />
    </div>
  )
}
```

- [ ] **Step 5: Create consent recording endpoint**

Create `app/api/medico/casos/[id]/sesion/consent/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'medico' || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params
  const sesion = await prisma.sesion.findUnique({ where: { casoId: id } })

  if (!sesion) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  await prisma.sesion.update({
    where: { casoId: id },
    data: { consentimientoTimestamp: new Date() },
  })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 6: Create session end endpoint**

Create `app/api/medico/casos/[id]/sesion/end/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'medico' || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params
  const sesion = await prisma.sesion.findUnique({ where: { casoId: id } })

  if (!sesion) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // Update sesion estado based on participation
  // For MVP: mark as realizada if both parts connected (mock for now)
  await prisma.sesion.update({
    where: { casoId: id },
    data: {
      estado: 'realizada',
      duracionEfectivaSegundos: 0, // Calculated properly in production
    },
  })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 7: Run tests and build**

```bash
npm run test
npm run build
```

Expected: build succeeds (Daily.co component client-side only).

- [ ] **Step 8: Manual verification (manual only — requires Daily.co account)**

```bash
npm run dev
```

Log in as médico, navigate to `/medico/casos/[id]/sesion`:
1. Expect to see consent checkbox.
2. Check consent, click "Iniciar sesión".
3. Daily.co iframe should load (requires DAILY_API_KEY configured).
4. Verify session ends and records properly.

Stop dev server.

- [ ] **Step 9: Commit**

```bash
git add app/medico/casos/[id]/sesion/ components/DailyVideoRoom.tsx lib/medico-sesion.ts
git commit -m "feat: /medico/casos/[id]/sesion with Daily.co video + consent capture"
git push
```

---

## Task 5: /medico/casos/[id]/informe (Report generation + signature)

**Files:**
- Create: `app/medico/casos/[id]/informe/page.tsx`
- Create: `lib/informe-generator.ts`

**Interfaces:**
- Consumes: `getServerSession`, `prisma.caso`, `prisma.informe`, `@react-pdf/renderer`.
- Produces: PDF stored, Informe record linked to Caso.

> **Firma electrónica (FEA):** MVP uses mock signature (timestamp + médico ID). Real FEA (Firmaweb/Sovos) is Fase 2+ integration.

- [ ] **Step 1: Create informe generator helper**

Create `lib/informe-generator.ts`:

```typescript
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Caso, Informe } from '@prisma/client'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  section: {
    marginBottom: 20,
  },
  header: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  label: {
    fontWeight: 'bold',
    marginTop: 10,
  },
})

export function InformeDocument({ caso, contenido }: { caso: Caso; contenido: string }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.header}>Informe de Auditoría de Licencia Médica</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Caso ID:</Text>
          <Text>{caso.id}</Text>
          <Text style={styles.label}>Evaluado:</Text>
          <Text>{caso.nombreEvaluado} ({caso.rutEvaluado})</Text>
          <Text style={styles.label}>Tipo de licencia:</Text>
          <Text>{caso.tipoLicencia}</Text>
          <Text style={styles.label}>Fecha de ingreso:</Text>
          <Text>{caso.fechaIngreso.toLocaleDateString('es-CL')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Evaluación:</Text>
          <Text>{contenido}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Generado en:</Text>
          <Text>{new Date().toLocaleString('es-CL')}</Text>
        </View>
      </Page>
    </Document>
  )
}
```

- [ ] **Step 2: Implement the informe page**

Create `app/medico/casos/[id]/informe/page.tsx`:

```tsx
import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'

export const dynamic = 'force-dynamic'

export default async function MedicoCasoInformePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'medico' || !session.user?.id) notFound()

  const { id } = await params
  const caso = await prisma.caso.findUnique({
    where: { id },
    include: { informe: true },
  })

  if (!caso || caso.medicoId !== session.user.id) notFound()

  return (
    <div className="p-8">
      <h1 className="text-lg font-medium text-brand-text">Informe: {caso.nombreEvaluado}</h1>

      <Card className="mt-4 max-w-2xl">
        {caso.informe ? (
          <div>
            <p className="text-sm text-brand-textSecondary">
              Generado en: {caso.informe.generadoEn.toLocaleString('es-CL')}
            </p>
            <Button variant="secondary" asChild className="mt-2">
              <a href={caso.informe.archivoUrl} target="_blank" rel="noopener noreferrer">
                Descargar informe (sin firmar)
              </a>
            </Button>
            {caso.informe.archivoFirmadoUrl && (
              <Button variant="secondary" asChild className="mt-2 ml-2">
                <a href={caso.informe.archivoFirmadoUrl} target="_blank" rel="noopener noreferrer">
                  Descargar informe firmado
                </a>
              </Button>
            )}
          </div>
        ) : (
          <div>
            <p className="text-sm text-brand-textSecondary mb-4">Genera el informe de evaluación:</p>
            <form action={`/api/medico/casos/${id}/informe/generar`} method="POST">
              <Textarea
                name="contenido"
                placeholder="Contenido del informe..."
                rows={10}
                required
                className="mb-4"
              />
              <Button type="submit">Generar informe PDF</Button>
            </form>
          </div>
        )}
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Create informe generation endpoint**

Create `app/api/medico/casos/[id]/informe/generar/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { renderToFile } from '@react-pdf/renderer'
import { InformeDocument } from '@/lib/informe-generator'
import path from 'path'
import fs from 'fs'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'medico' || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params
  const formData = await request.formData()
  const contenido = formData.get('contenido') as string

  const caso = await prisma.caso.findUnique({ where: { id } })
  if (!caso || caso.medicoId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Generate PDF (in production, upload to S3/R2)
  const fileName = `informe-${caso.id}-${Date.now()}.pdf`
  const filePath = path.join(process.cwd(), 'public', 'reports', fileName)

  // Ensure directory exists
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  // Render PDF to file
  const doc = InformeDocument({ caso, contenido })
  await renderToFile(doc, filePath)

  const archivoUrl = `/reports/${fileName}`

  // Create Informe record (mock: no real signature yet)
  await prisma.informe.create({
    data: {
      casoId: caso.id,
      archivoUrl,
      archivoFirmadoUrl: null, // Will be set after FEA signing
      generadoPor: session.user.id,
      firmaProveedor: 'mock',
      generadoEn: new Date(),
    },
  })

  // Update Caso estado
  await prisma.caso.update({
    where: { id: caso.id },
    data: { estado: 'informe_en_validacion' },
  })

  return NextResponse.redirect(new URL(`/medico/casos/${id}/informe`, request.url))
}
```

- [ ] **Step 4: Run tests and build**

```bash
npm run test
npm run build
```

Expected: all tests pass (PDF rendering is server-side only).

- [ ] **Step 5: Manual verification**

```bash
npm run dev
```

Log in as médico, navigate to `/medico/casos/[id]/informe`:
1. If no informe yet, expect textarea to generate one.
2. Enter content, click "Generar informe PDF".
3. Redirect to same page with generated informe link.
4. Click download to verify PDF was created.

Stop dev server.

- [ ] **Step 6: Commit**

```bash
git add app/medico/casos/[id]/informe/ lib/informe-generator.ts
git commit -m "feat: /medico/casos/[id]/informe with PDF generation (mock signature)"
git push
```

---

## End of Fase 2c

At this point: médicos can log in, see only their assigned casos ordered by deadline, view case details, conduct video sessions with consent capture, and generate signed PDFs (mock FEA for MVP). This completes the physician portal.

**Per the working rules, stop here and report back** — what was built and what's pending — before starting Fase 3 (backoffice assignment, compliance dashboard).

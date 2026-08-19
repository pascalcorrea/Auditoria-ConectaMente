# ConectaMente Core™ — Fase 2d (Backoffice) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the backoffice admin portal — `/admin/asignacion` (view médico workload, manually reassign), `/admin/cumplimiento` (compliance table: cases by due date/organization), and supporting query helpers.

**Architecture:** Same Next.js 15 + Prisma + PostgreSQL from prior phases. No schema changes.

**Tech Stack:** Existing (Next.js 15, Prisma, NextAuth v4, Vitest).

---

## Task 1: Query helpers for admin case listing + workload

**Files:**
- Create: `lib/admin-casos.ts`
- Create: `lib/admin-casos.test.ts`

**Interfaces:**
- Consumes: `prisma.caso`, `prisma.usuario`.
- Produces: `listarTodosCasos()`, `obtenerCargaMedicos()`.

- [ ] **Step 1: Implement helpers**

Create `lib/admin-casos.ts`:

```typescript
import { prisma } from './prisma'
import type { Caso, Usuario } from '@prisma/client'

export async function listarTodosCasos() {
  return prisma.caso.findMany({
    include: { organizacion: true, medico: true },
    orderBy: { fechaLimite: 'asc' },
  })
}

export async function obtenerCargaMedicos() {
  const medicos = await prisma.usuario.findMany({
    where: { rol: 'medico', activo: true },
    select: { id: true, nombre: true, especialidad: true },
  })

  const cargaPorMedico = await Promise.all(
    medicos.map(async (medico) => {
      const activos = await prisma.caso.count({
        where: {
          medicoId: medico.id,
          estado: { in: ['recibido', 'en_revision', 'informe_en_validacion'] },
        },
      })
      return { ...medico, casosActivos: activos }
    })
  )

  return cargaPorMedico.sort((a, b) => a.casosActivos - b.casosActivos)
}

export async function reasignarCaso(casoId: string, nuevoMedicoId: string) {
  return prisma.caso.update({
    where: { id: casoId },
    data: { medicoId: nuevoMedicoId, estado: 'en_revision' },
  })
}
```

- [ ] **Step 2: Write tests**

Create `lib/admin-casos.test.ts` (simple smoke tests):

```typescript
import { prisma } from './prisma'
import { listarTodosCasos, obtenerCargaMedicos, reasignarCaso } from './admin-casos'

describe('admin-casos', () => {
  it('listarTodosCasos returns all casos', async () => {
    const casos = await listarTodosCasos()
    expect(Array.isArray(casos)).toBe(true)
  })

  it('obtenerCargaMedicos returns médicos sorted by carga', async () => {
    const medicos = await obtenerCargaMedicos()
    expect(Array.isArray(medicos)).toBe(true)
    if (medicos.length > 1) {
      expect(medicos[0].casosActivos <= medicos[1].casosActivos).toBe(true)
    }
  })

  it('reasignarCaso updates caso.medicoId', async () => {
    const casos = await prisma.caso.findMany({ take: 1 })
    if (casos.length === 0) {
      console.log('No casos to test reasignación')
      return
    }

    const medicos = await prisma.usuario.findMany({ where: { rol: 'medico' }, take: 1 })
    if (medicos.length === 0) return

    const caso = casos[0]
    const updated = await reasignarCaso(caso.id, medicos[0].id)
    expect(updated.medicoId).toBe(medicos[0].id)
  })
})
```

- [ ] **Step 3: Run tests**

```bash
npm run test -- admin-casos.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 4: Commit**

```bash
git add lib/admin-casos.ts lib/admin-casos.test.ts
git commit -m "feat: admin query helpers (case listing + médico workload)"
git push
```

---

## Task 2: /admin/asignacion page

**Files:**
- Create: `app/admin/asignacion/page.tsx`

**Interfaces:**
- Consumes: `getServerSession`, `listarTodosCasos`, `obtenerCargaMedicos`, `Button`, `Select`.
- Produces: UI for viewing workload + manual reassignment form.

- [ ] **Step 1: Implement page**

Create `app/admin/asignacion/page.tsx`:

```tsx
import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { listarTodosCasos, obtenerCargaMedicos, reasignarCaso } from '@/lib/admin-casos'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'

export const dynamic = 'force-dynamic'

async function handleReasignar(formData: FormData) {
  'use server'

  const casoId = formData.get('casoId') as string
  const medicoId = formData.get('medicoId') as string

  if (!casoId || !medicoId) return

  await reasignarCaso(casoId, medicoId)
}

export default async function AdminAsignacionPage() {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'backoffice') notFound()

  const todos = await listarTodosCasos()
  const medicos = await obtenerCargaMedicos()

  return (
    <div className="p-8">
      <h1 className="text-lg font-medium text-brand-text">Asignación de casos</h1>

      <Card className="mt-4 p-4">
        <h2 className="text-sm font-medium text-brand-text mb-4">Carga de médicos</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-brand-textSecondary">
              <th className="pb-2 text-left">Médico</th>
              <th className="pb-2 text-left">Especialidad</th>
              <th className="pb-2 text-right">Casos activos</th>
            </tr>
          </thead>
          <tbody>
            {medicos.map((m) => (
              <tr key={m.id} className="border-t border-brand-borderSoft">
                <td className="py-2">{m.nombre}</td>
                <td className="py-2">{m.especialidad || '—'}</td>
                <td className="py-2 text-right">{m.casosActivos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="mt-6 p-4">
        <h2 className="text-sm font-medium text-brand-text mb-4">Reasignar caso</h2>
        <form action={handleReasignar} className="space-y-4">
          <Select
            name="casoId"
            label="Caso"
            options={todos
              .filter((c) => c.estado !== 'entregado')
              .map((c) => ({ value: c.id, label: `${c.nombreEvaluado} (${c.organizacion.nombre})` }))}
            required
          />
          <Select
            name="medicoId"
            label="Asignar a"
            options={medicos.map((m) => ({ value: m.id, label: `${m.nombre} (${m.casosActivos} casos)` }))}
            required
          />
          <Button type="submit">Reasignar</Button>
        </form>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: SUCCESS.

- [ ] **Step 3: Manual verification**

```bash
npm run dev
```

Log in as `backoffice@conectamente.cl`, visit `/admin/asignacion`:
1. Expect to see médico workload table.
2. Expect to see reasignment form.
3. Try reasigning a caso.

Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add app/admin/asignacion/page.tsx
git commit -m "feat: /admin/asignacion page (workload + manual reassignment)"
git push
```

---

## Task 3: /admin/cumplimiento page

**Files:**
- Create: `app/admin/cumplimiento/page.tsx`

**Interfaces:**
- Consumes: `getServerSession`, `listarTodosCasos`.
- Produces: Compliance table (cases by due date, organization, status).

- [ ] **Step 1: Implement page**

Create `app/admin/cumplimiento/page.tsx`:

```tsx
import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { listarTodosCasos } from '@/lib/admin-casos'
import { Card } from '@/components/ui/Card'

export const dynamic = 'force-dynamic'

function daysUntilDue(fechaLimite: Date): number {
  const now = new Date()
  const diffMs = fechaLimite.getTime() - now.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

function statusColor(dias: number): string {
  if (dias < 0) return 'text-brand-danger'
  if (dias < 3) return 'text-brand-accent'
  return 'text-brand-text'
}

export default async function AdminCumplimientoPage() {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'backoffice') notFound()

  const casos = await listarTodosCasos()
  const activos = casos.filter((c) => c.estado !== 'entregado')

  return (
    <div className="p-8">
      <h1 className="text-lg font-medium text-brand-text">Cumplimiento de plazos</h1>

      <Card className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-bgSecondary">
            <tr className="text-xs uppercase tracking-wide text-brand-textSecondary">
              <th className="p-3 text-left">Evaluado</th>
              <th className="p-3 text-left">Organización</th>
              <th className="p-3 text-left">Estado</th>
              <th className="p-3 text-left">Fecha límite</th>
              <th className="p-3 text-right">Días</th>
            </tr>
          </thead>
          <tbody>
            {activos.sort((a, b) => a.fechaLimite.getTime() - b.fechaLimite.getTime()).map((caso) => {
              const dias = daysUntilDue(caso.fechaLimite)
              return (
                <tr key={caso.id} className="border-t border-brand-borderSoft">
                  <td className="p-3">{caso.nombreEvaluado}</td>
                  <td className="p-3">{caso.organizacion.nombre}</td>
                  <td className="p-3">{caso.estado}</td>
                  <td className="p-3">{caso.fechaLimite.toLocaleDateString('es-CL')}</td>
                  <td className={`p-3 text-right font-medium ${statusColor(dias)}`}>
                    {dias < 0 ? `VENCIDO ${Math.abs(dias)}d` : `${dias}d`}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>

      {activos.length === 0 && (
        <p className="mt-4 text-sm text-brand-textSecondary">Sin casos activos.</p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: SUCCESS.

- [ ] **Step 3: Manual verification**

```bash
npm run dev
```

Log in as backoffice, visit `/admin/cumplimiento`:
1. Expect to see compliance table sorted by due date.
2. Expect red for overdue, orange for <3 days, normal for rest.

Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add app/admin/cumplimiento/page.tsx
git commit -m "feat: /admin/cumplimiento page (compliance dashboard)"
git push
```

---

## End of Fase 2d

Backoffice portal complete: workload visibility + manual reassignment + compliance tracking. This closes **Fase 2 entirely** (2a+2b+2c+2d).

**Next:** Fase 3 (IA transcripción, Daily.co real, etc.) or stop.

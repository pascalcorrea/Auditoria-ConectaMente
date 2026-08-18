# ConectaMente Core™ — Fase 2a (Ingreso de casos) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build backoffice case-intake for ConectaMente Core — individual entry, bulk Excel import, and automatic médico assignment by lowest active caseload, plus a manual reassignment view — per doc 03 §5.1/§5.2.

**Architecture:** Same Next.js 15 + Prisma + PostgreSQL app from Fases 0-1. Extends `Caso` with 3 fields the existing schema is missing (evaluado identity), adds pure business-logic modules under `lib/`, and 4 new `/admin/*` routes (already RBAC-gated to `backoffice` by existing middleware — no auth changes needed).

**Tech Stack:** Existing stack (Next.js 15, Prisma 5.22.0, NextAuth v4, Vitest) plus `xlsx` (SheetJS) for Excel parsing — new dependency, first phase to need it.

## Global Constraints

- Full design rationale for every decision below is in `docs/superpowers/specs/2026-08-18-fase2a-ingreso-casos-design.md` — read it before starting Task 1.
- **No especialidad filter in assignment** — confirmed with the user: assign by lowest active caseload only, across all active médicos, regardless of `especialidad`. Do not build a tipoLicencia→especialidad mapping.
- **Both automatic and manual assignment** — confirmed with the user, resolving a contradiction between doc 02 (manual only) and doc 03 (automatic only). Every case creation path (individual + Excel) auto-assigns by lowest active caseload; `/admin/asignacion` additionally allows manual override at any time.
- **"Casos activos" for load-counting** = `estado` in `recibido`, `en_revision`, or `informe_en_validacion` — never `entregado`. Applies identically to the auto-assignment algorithm and the workload view.
- **Excel template is fixed**, not per-client configurable — doc 03 §5.1 explicitly excludes flexible column mapping from the MVP. Columns: RUT evaluado, nombre, organización, tipo de licencia, fecha de emisión de la licencia, prioridad.
- **Invalid rows are never inserted, not even partially** — bulk import creates only the rows with zero validation errors; this is re-validated server-side at confirm time, never trusted from client state.
- All new Prisma fields use camelCase, matching Fases 0-1's established convention (not doc 03's snake_case pseudocode).
- `/admin/*` routes are already role-gated to `backoffice` via `middleware.ts` + `lib/route-access.ts` (Fase 0) — no changes needed there. New `/api/admin/*` route handlers are **not** covered by that middleware (its matcher is `/admin/:path*`, not `/api/admin/:path*`) — each new API route must check the session role inline.
- No routes/logic for `Sesion`, `Informe`, video, or firma electrónica in this phase — Fase 3/4.
- Local dev database: native PostgreSQL, role `auditoria_dev`, database `auditoria_conectamente_dev`, host `127.0.0.1:5432`. Prisma CLI commands need `.env.local`'s vars exported into the shell first (`export $(grep -v '^#' .env.local | xargs)` in bash) — Prisma CLI doesn't auto-load `.env.local`, only Next.js's runtime does.

---

## Task 1: Extend Caso schema with evaluado fields and migrate

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_fase2a_caso_evaluado/migration.sql` (generated, not hand-written)
- Create: `lib/caso-evaluado.test.ts`

**Interfaces:**
- Consumes: existing `Caso` model from Fase 1.
- Produces: `Caso.rutEvaluado: string`, `Caso.nombreEvaluado: string`, `Caso.fechaEmisionLicencia: Date` — consumed by Task 2's assignment logic (indirectly, via `prisma.caso`) and Tasks 4-5's case-creation code.

- [ ] **Step 1: Write the failing test**

Create `lib/caso-evaluado.test.ts`:

```typescript
import { prisma } from './prisma'

describe('Caso evaluado fields (Fase 2a)', () => {
  let organizacionId: string
  let casoId: string

  beforeAll(async () => {
    const organizacion = await prisma.organizacion.create({
      data: { nombre: `Test Org Fase2a ${Date.now()}`, tipo: 'empresa', plazoSlaDias: 10 },
    })
    organizacionId = organizacion.id
  })

  afterAll(async () => {
    if (casoId) await prisma.caso.delete({ where: { id: casoId } })
    await prisma.organizacion.delete({ where: { id: organizacionId } })
    await prisma.$disconnect()
  })

  it('stores rutEvaluado, nombreEvaluado, and fechaEmisionLicencia on Caso', async () => {
    const caso = await prisma.caso.create({
      data: {
        organizacionId,
        rutEvaluado: '12345678-5',
        nombreEvaluado: 'Juan Pérez',
        tipoLicencia: 'licencia comun',
        fechaEmisionLicencia: new Date('2026-01-15'),
        fechaIngreso: new Date(),
        fechaLimite: new Date(),
        prioridad: 'normal',
      },
    })
    casoId = caso.id

    const found = await prisma.caso.findUnique({ where: { id: caso.id } })
    expect(found?.rutEvaluado).toBe('12345678-5')
    expect(found?.nombreEvaluado).toBe('Juan Pérez')
    expect(found?.fechaEmisionLicencia?.toISOString()).toBe(new Date('2026-01-15').toISOString())
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- caso-evaluado.test.ts`
Expected: FAIL — Prisma validation error, `rutEvaluado`/`nombreEvaluado`/`fechaEmisionLicencia` are unknown arguments (fields don't exist on the client yet).

- [ ] **Step 3: Extend the Caso model**

In `prisma/schema.prisma`, find `model Caso` and add three fields (insert after `medicoId String?` and before `estado`, or anywhere within the model — field order doesn't affect behavior, but keep it readable):

```prisma
model Caso {
  id                    String        @id @default(cuid())
  organizacionId        String
  medicoId              String?
  rutEvaluado           String
  nombreEvaluado        String
  estado                EstadoCaso    @default(recibido)
  tipoLicencia          String
  fechaEmisionLicencia  DateTime
  fechaIngreso          DateTime
  fechaLimite           DateTime
  prioridad             PrioridadCaso @default(normal)
  creadoEn              DateTime      @default(now())
  actualizadoEn         DateTime      @updatedAt

  organizacion Organizacion @relation(fields: [organizacionId], references: [id], onDelete: Restrict)
  medico       Usuario?     @relation("CasoMedico", fields: [medicoId], references: [id], onDelete: Restrict)
  sesion       Sesion?
  informe      Informe?

  @@index([fechaLimite])
  @@index([organizacionId])
  @@index([estado])
}
```

This is the complete `Caso` model (Fase 1's fields plus the three new ones) — replace the existing `model Caso { ... }` block entirely with this. Every other model/enum in `schema.prisma` is unchanged.

- [ ] **Step 4: Run the migration**

```bash
export $(grep -v '^#' .env.local | xargs)
npx prisma migrate dev --name fase2a_caso_evaluado
```

Expected output includes: `Your database is now in sync with your schema.`

Note: the local dev database from Fases 0-1 may already have `Caso` rows from earlier integration tests. If `migrate dev` reports it needs to reset the database because the new columns are non-nullable with no default on existing rows, confirm the reset (dev-only data, safe to lose) — do not use `migrate deploy` or hand-edit the migration to make the columns nullable, since production has no `Caso` rows yet either (Fase 1 never created any) and the schema should match the design spec exactly (`String`/`DateTime`, not nullable).

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm run test -- caso-evaluado.test.ts`
Expected: PASS (1 test).

- [ ] **Step 6: Run the full suite and build to confirm no regressions**

```bash
npm run test
npm run build
```

Expected: all test files pass, build compiles successfully. `lib/prisma-fase1-models.test.ts` has exactly 3 `prisma.caso.create({...})` calls (the happy-path multi-model test, the FK-violation-rejection test, and the `onDelete: Restrict` enforcement test) — all 3 currently omit the three new required fields and will now fail with a Prisma validation error ("Argument rutEvaluado is missing", etc.) unless fixed. Add these three lines to the `data: { ... }` object in each of the 3 calls:

```typescript
rutEvaluado: '12345678-5',
nombreEvaluado: 'Test Evaluado',
fechaEmisionLicencia: new Date(),
```

This is a placeholder-data fix only — none of these 3 tests assert anything about evaluado fields, so any valid RUT/non-empty string/valid date satisfies the new NOT NULL columns without changing what each test verifies.

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations lib/caso-evaluado.test.ts lib/prisma-fase1-models.test.ts
git commit -m "feat: add evaluado fields (rutEvaluado, nombreEvaluado, fechaEmisionLicencia) to Caso"
git push
```

---

## Task 2: Core business logic — RUT validation, fecha límite, asignación automática

**Files:**
- Create: `lib/rut.ts`, `lib/rut.test.ts`
- Create: `lib/fecha-limite.ts`, `lib/fecha-limite.test.ts`
- Create: `lib/asignacion.ts`, `lib/asignacion.test.ts`

**Interfaces:**
- Consumes: `prisma` singleton (Fase 0), `Usuario`/`Caso` models (Fases 0-1, extended by Task 1).
- Produces: `normalizeRut(rut: string): string`, `isValidRut(rut: string): boolean`, `calcularFechaLimite(fechaIngreso: Date, plazoSlaDias: number): Date`, `asignarMedico(): Promise<string | null>`, `ESTADOS_ACTIVOS: readonly ['recibido', 'en_revision', 'informe_en_validacion']` — all consumed by Tasks 4-6's case-creation and workload-counting code.

- [ ] **Step 1: Write failing tests for RUT validation**

Create `lib/rut.test.ts`:

```typescript
import { isValidRut, normalizeRut } from './rut'

describe('isValidRut', () => {
  it('accepts a valid RUT with dots and dash', () => {
    expect(isValidRut('12.345.678-5')).toBe(true)
  })

  it('accepts a valid RUT without dots', () => {
    expect(isValidRut('12345678-5')).toBe(true)
  })

  it('accepts a valid RUT with a K check digit, uppercase or lowercase', () => {
    expect(isValidRut('40.000.000-K')).toBe(true)
    expect(isValidRut('40000000-k')).toBe(true)
  })

  it('rejects a RUT with the wrong check digit', () => {
    expect(isValidRut('12.345.678-9')).toBe(false)
  })

  it('rejects a malformed RUT', () => {
    expect(isValidRut('not-a-rut')).toBe(false)
    expect(isValidRut('123')).toBe(false)
  })
})

describe('normalizeRut', () => {
  it('strips dots and formats as body-dv', () => {
    expect(normalizeRut('12.345.678-5')).toBe('12345678-5')
  })

  it('uppercases a lowercase k check digit', () => {
    expect(normalizeRut('40.000.000-k')).toBe('40000000-K')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test -- rut.test.ts`
Expected: FAIL — `Cannot find module './rut'`.

- [ ] **Step 3: Implement RUT validation**

Create `lib/rut.ts`:

```typescript
export function normalizeRut(rut: string): string {
  const clean = rut.replace(/[.\s]/g, '').toUpperCase()
  const body = clean.slice(0, -1)
  const dv = clean.slice(-1)
  return `${body}-${dv}`
}

export function isValidRut(rut: string): boolean {
  const clean = rut.replace(/[.\s-]/g, '').toUpperCase()
  if (!/^\d{7,8}[0-9K]$/.test(clean)) return false

  const body = clean.slice(0, -1)
  const dv = clean.slice(-1)

  let sum = 0
  let multiplier = 2
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }

  const remainder = 11 - (sum % 11)
  const expectedDv = remainder === 11 ? '0' : remainder === 10 ? 'K' : String(remainder)

  return dv === expectedDv
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test -- rut.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Write a failing test for fecha límite**

Create `lib/fecha-limite.test.ts`:

```typescript
import { calcularFechaLimite } from './fecha-limite'

describe('calcularFechaLimite', () => {
  it('adds plazoSlaDias days to fechaIngreso', () => {
    const fechaIngreso = new Date('2026-01-01T00:00:00.000Z')
    const resultado = calcularFechaLimite(fechaIngreso, 10)
    expect(resultado.toISOString()).toBe('2026-01-11T00:00:00.000Z')
  })

  it('handles a month rollover correctly', () => {
    const fechaIngreso = new Date('2026-01-25T00:00:00.000Z')
    const resultado = calcularFechaLimite(fechaIngreso, 10)
    expect(resultado.toISOString()).toBe('2026-02-04T00:00:00.000Z')
  })
})
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `npm run test -- fecha-limite.test.ts`
Expected: FAIL — `Cannot find module './fecha-limite'`.

- [ ] **Step 7: Implement fecha límite calculation**

Create `lib/fecha-limite.ts`:

```typescript
export function calcularFechaLimite(fechaIngreso: Date, plazoSlaDias: number): Date {
  const resultado = new Date(fechaIngreso)
  resultado.setDate(resultado.getDate() + plazoSlaDias)
  return resultado
}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `npm run test -- fecha-limite.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 9: Write a failing test for automatic assignment**

Create `lib/asignacion.test.ts`:

```typescript
import { prisma } from './prisma'
import { asignarMedico } from './asignacion'

describe('asignarMedico', () => {
  const ids: { organizacionId?: string; medicoIds: string[]; casoIds: string[] } = { medicoIds: [], casoIds: [] }

  afterEach(async () => {
    for (const casoId of ids.casoIds) await prisma.caso.delete({ where: { id: casoId } })
    ids.casoIds = []
    for (const medicoId of ids.medicoIds) await prisma.usuario.delete({ where: { id: medicoId } })
    ids.medicoIds = []
    if (ids.organizacionId) {
      await prisma.organizacion.delete({ where: { id: ids.organizacionId } })
      ids.organizacionId = undefined
    }
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  async function crearOrganizacion() {
    const organizacion = await prisma.organizacion.create({
      data: { nombre: `Test Org Asignacion ${Date.now()}`, tipo: 'empresa', plazoSlaDias: 10 },
    })
    ids.organizacionId = organizacion.id
    return organizacion
  }

  async function crearMedico(nombre: string, creadoEn?: Date) {
    const medico = await prisma.usuario.create({
      data: {
        nombre,
        email: `${nombre.toLowerCase().replace(/\s/g, '-')}-${Date.now()}@example.com`,
        passwordHash: 'irrelevant-for-this-test',
        rol: 'medico',
        activo: true,
        ...(creadoEn ? { creadoEn } : {}),
      },
    })
    ids.medicoIds.push(medico.id)
    return medico
  }

  async function crearCaso(organizacionId: string, medicoId: string | null, estado: 'recibido' | 'en_revision' | 'informe_en_validacion' | 'entregado') {
    const caso = await prisma.caso.create({
      data: {
        organizacionId,
        medicoId,
        estado,
        rutEvaluado: '11111111-1',
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

  it('assigns the médico with the fewest active casos', async () => {
    const organizacion = await crearOrganizacion()
    const medicoOcupado = await crearMedico('Medico Ocupado')
    const medicoLibre = await crearMedico('Medico Libre')

    await crearCaso(organizacion.id, medicoOcupado.id, 'recibido')
    await crearCaso(organizacion.id, medicoOcupado.id, 'en_revision')

    const medicoAsignado = await asignarMedico()
    expect(medicoAsignado).toBe(medicoLibre.id)
  })

  it('does not count entregado casos toward the active load', async () => {
    const organizacion = await crearOrganizacion()
    const medicoConEntregados = await crearMedico('Medico Con Entregados')
    const medicoSinCasos = await crearMedico('Medico Sin Casos')

    await crearCaso(organizacion.id, medicoConEntregados.id, 'entregado')
    await crearCaso(organizacion.id, medicoConEntregados.id, 'entregado')

    const medicoAsignado = await asignarMedico()
    expect([medicoConEntregados.id, medicoSinCasos.id]).toContain(medicoAsignado)
    // both have 0 active casos — tie-break below covers determinism
  })

  it('breaks ties by picking the médico created earliest', async () => {
    await crearOrganizacion()
    const medicoAntiguo = await crearMedico('Medico Antiguo', new Date('2020-01-01'))
    await crearMedico('Medico Nuevo', new Date('2025-01-01'))

    const medicoAsignado = await asignarMedico()
    expect(medicoAsignado).toBe(medicoAntiguo.id)
  })

  it('returns null when there are no active médicos', async () => {
    const medicoAsignado = await asignarMedico()
    expect(medicoAsignado).toBeNull()
  })
})
```

- [ ] **Step 10: Run the test to verify it fails**

Run: `npm run test -- asignacion.test.ts`
Expected: FAIL — `Cannot find module './asignacion'`.

- [ ] **Step 11: Implement automatic assignment**

Create `lib/asignacion.ts`:

```typescript
import { prisma } from './prisma'

export const ESTADOS_ACTIVOS = ['recibido', 'en_revision', 'informe_en_validacion'] as const

export async function asignarMedico(): Promise<string | null> {
  const medicos = await prisma.usuario.findMany({
    where: { rol: 'medico', activo: true },
    orderBy: { creadoEn: 'asc' },
  })

  if (medicos.length === 0) return null

  const cargas = await Promise.all(
    medicos.map(async (medico) => ({
      medicoId: medico.id,
      carga: await prisma.caso.count({
        where: { medicoId: medico.id, estado: { in: [...ESTADOS_ACTIVOS] } },
      }),
    }))
  )

  cargas.sort((a, b) => a.carga - b.carga)

  return cargas[0].medicoId
}
```

Note: `cargas.sort` is a stable sort (guaranteed by the JS spec since ES2019) over an array already ordered by `creadoEn: 'asc'` — sorting only by `carga` preserves creation-date order among ties, which is exactly the "oldest médico wins ties" rule from the design spec without any extra tie-breaking code.

- [ ] **Step 12: Run the test to verify it passes**

Run: `npm run test -- asignacion.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 13: Run the full suite and build**

```bash
npm run test
npm run build
```

Expected: all tests pass, build succeeds.

- [ ] **Step 14: Commit**

```bash
git add lib/rut.ts lib/rut.test.ts lib/fecha-limite.ts lib/fecha-limite.test.ts lib/asignacion.ts lib/asignacion.test.ts
git commit -m "feat: add RUT validation, fecha límite calculation, and automatic médico assignment"
git push
```

---

## Task 3: Excel bulk-import parsing and validation

**Files:**
- Create: `lib/excel-import.ts`, `lib/excel-import.test.ts`
- Modify: `package.json` (add `xlsx` dependency)

**Interfaces:**
- Consumes: `prisma.organizacion` (Fase 1), `isValidRut` (Task 2).
- Produces: `FilaImportacion` type, `parseCasosExcel(buffer: ArrayBuffer): Promise<FilaImportacion[]>` — consumed by Task 5's preview API route.

- [ ] **Step 1: Install xlsx**

```bash
npm install xlsx
```

- [ ] **Step 2: Write the failing test**

Create `lib/excel-import.test.ts`:

```typescript
import * as XLSX from 'xlsx'
import { prisma } from './prisma'
import { parseCasosExcel } from './excel-import'

function buildBuffer(rows: (string | number)[][]): ArrayBuffer {
  const sheet = XLSX.utils.aoa_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Casos')
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
}

describe('parseCasosExcel', () => {
  let organizacionId: string
  const nombreOrg = `Test Org Excel ${Date.now()}`

  beforeAll(async () => {
    const organizacion = await prisma.organizacion.create({
      data: { nombre: nombreOrg, tipo: 'empresa', plazoSlaDias: 10 },
    })
    organizacionId = organizacion.id
  })

  afterAll(async () => {
    await prisma.organizacion.delete({ where: { id: organizacionId } })
    await prisma.$disconnect()
  })

  it('parses a valid row with no errors', async () => {
    const buffer = buildBuffer([
      ['RUT evaluado', 'nombre', 'organización', 'tipo de licencia', 'fecha de emisión de la licencia', 'prioridad'],
      ['12.345.678-5', 'Juan Pérez', nombreOrg, 'licencia comun', '2026-01-15', 'normal'],
    ])

    const filas = await parseCasosExcel(buffer)

    expect(filas).toHaveLength(1)
    expect(filas[0].numeroFila).toBe(2)
    expect(filas[0].errores).toEqual([])
    expect(filas[0].datos.rut).toBe('12.345.678-5')
    expect(filas[0].datos.organizacion).toBe(nombreOrg)
  })

  it('flags an invalid RUT', async () => {
    const buffer = buildBuffer([
      ['RUT evaluado', 'nombre', 'organización', 'tipo de licencia', 'fecha de emisión de la licencia', 'prioridad'],
      ['12.345.678-9', 'Error RUT', nombreOrg, 'licencia comun', '2026-01-15', 'normal'],
    ])

    const filas = await parseCasosExcel(buffer)
    expect(filas[0].errores).toContain('RUT inválido')
  })

  it('flags an organización that does not exist', async () => {
    const buffer = buildBuffer([
      ['RUT evaluado', 'nombre', 'organización', 'tipo de licencia', 'fecha de emisión de la licencia', 'prioridad'],
      ['40.000.000-K', 'Sin Organizacion', 'Organizacion Que No Existe', 'licencia comun', '2026-01-15', 'urgente'],
    ])

    const filas = await parseCasosExcel(buffer)
    expect(filas[0].errores).toContain('Organización "Organizacion Que No Existe" no existe')
  })

  it('flags an invalid prioridad', async () => {
    const buffer = buildBuffer([
      ['RUT evaluado', 'nombre', 'organización', 'tipo de licencia', 'fecha de emisión de la licencia', 'prioridad'],
      ['40.000.000-K', 'Nombre Test', nombreOrg, 'licencia comun', '2026-01-15', 'urgentísimo'],
    ])

    const filas = await parseCasosExcel(buffer)
    expect(filas[0].errores).toContain('Prioridad debe ser "normal" o "urgente"')
  })

  it('reports multiple rows with correct 1-indexed row numbers accounting for the header', async () => {
    const buffer = buildBuffer([
      ['RUT evaluado', 'nombre', 'organización', 'tipo de licencia', 'fecha de emisión de la licencia', 'prioridad'],
      ['12.345.678-5', 'Fila Dos', nombreOrg, 'licencia comun', '2026-01-15', 'normal'],
      ['40.000.000-K', 'Fila Tres', nombreOrg, 'licencia comun', '2026-01-15', 'urgente'],
    ])

    const filas = await parseCasosExcel(buffer)
    expect(filas.map((f) => f.numeroFila)).toEqual([2, 3])
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm run test -- excel-import.test.ts`
Expected: FAIL — `Cannot find module './excel-import'`.

- [ ] **Step 4: Implement Excel parsing and validation**

Create `lib/excel-import.ts`:

```typescript
import * as XLSX from 'xlsx'
import { isValidRut } from './rut'
import { prisma } from './prisma'

export type FilaImportacion = {
  numeroFila: number
  datos: {
    rut: string
    nombre: string
    organizacion: string
    tipoLicencia: string
    fechaEmision: string
    prioridad: string
  }
  errores: string[]
}

const COLUMNAS: Record<string, keyof FilaImportacion['datos']> = {
  'rut evaluado': 'rut',
  rut: 'rut',
  nombre: 'nombre',
  organización: 'organizacion',
  organizacion: 'organizacion',
  'tipo de licencia': 'tipoLicencia',
  'fecha de emisión de la licencia': 'fechaEmision',
  'fecha de emision de la licencia': 'fechaEmision',
  prioridad: 'prioridad',
}

export async function parseCasosExcel(buffer: ArrayBuffer): Promise<FilaImportacion[]> {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })

  const organizaciones = await prisma.organizacion.findMany()
  const nombresOrganizaciones = new Set(organizaciones.map((o) => o.nombre))

  return rows.map((row, index) => {
    const datos: FilaImportacion['datos'] = {
      rut: '',
      nombre: '',
      organizacion: '',
      tipoLicencia: '',
      fechaEmision: '',
      prioridad: '',
    }

    for (const [header, value] of Object.entries(row)) {
      const key = COLUMNAS[header.trim().toLowerCase()]
      if (key) datos[key] = String(value).trim()
    }

    const errores: string[] = []

    if (!isValidRut(datos.rut)) errores.push('RUT inválido')
    if (!datos.nombre) errores.push('Nombre vacío')
    if (!nombresOrganizaciones.has(datos.organizacion)) errores.push(`Organización "${datos.organizacion}" no existe`)
    if (!datos.tipoLicencia) errores.push('Tipo de licencia vacío')
    if (!datos.fechaEmision || isNaN(Date.parse(datos.fechaEmision))) errores.push('Fecha de emisión inválida')
    if (datos.prioridad !== 'normal' && datos.prioridad !== 'urgente') errores.push('Prioridad debe ser "normal" o "urgente"')

    return { numeroFila: index + 2, datos, errores }
  })
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm run test -- excel-import.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Run the full suite and build**

```bash
npm run test
npm run build
```

Expected: all tests pass, build succeeds.

- [ ] **Step 7: Commit**

```bash
git add lib/excel-import.ts lib/excel-import.test.ts package.json package-lock.json
git commit -m "feat: add Excel bulk-import parsing and per-row validation"
git push
```

---

## Task 4: Individual case entry — /admin/casos listing and /admin/casos/nuevo

**Files:**
- Create: `app/admin/casos/page.tsx`
- Create: `app/admin/casos/nuevo/page.tsx`
- Create: `app/admin/casos/nuevo/NuevoCasoForm.tsx`, `app/admin/casos/nuevo/NuevoCasoForm.test.tsx`
- Create: `app/admin/casos/nuevo/actions.ts`

**Interfaces:**
- Consumes: `prisma` (Fase 0), `isValidRut`/`normalizeRut` (Task 2), `calcularFechaLimite` (Task 2), `asignarMedico` (Task 2), `Input`/`Select`/`Button`/`Card` (Fase 0).
- Produces: nothing consumed by later tasks in this plan — this is a leaf UI feature.

- [ ] **Step 1: Create the case listing page**

Create `app/admin/casos/page.tsx`:

```tsx
import { prisma } from '@/lib/prisma'

export default async function CasosPage() {
  const casos = await prisma.caso.findMany({
    include: { organizacion: true, medico: true },
    orderBy: { creadoEn: 'desc' },
  })

  return (
    <div className="p-8">
      <h1 className="text-lg font-medium text-brand-text">Casos</h1>
      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-brand-textSecondary">
            <th className="pb-2">Evaluado</th>
            <th className="pb-2">Organización</th>
            <th className="pb-2">Médico</th>
            <th className="pb-2">Estado</th>
            <th className="pb-2">Prioridad</th>
            <th className="pb-2">Fecha límite</th>
          </tr>
        </thead>
        <tbody>
          {casos.map((caso) => (
            <tr key={caso.id} className="border-t border-brand-borderSoft">
              <td className="py-2">
                {caso.nombreEvaluado} ({caso.rutEvaluado})
              </td>
              <td className="py-2">{caso.organizacion.nombre}</td>
              <td className="py-2">{caso.medico?.nombre ?? 'Sin asignar'}</td>
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

- [ ] **Step 2: Write the failing component test for the form**

Create `app/admin/casos/nuevo/NuevoCasoForm.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { NuevoCasoForm } from './NuevoCasoForm'

vi.mock('./actions', () => ({
  crearCasoIndividual: vi.fn(async () => ({ error: null })),
}))

describe('NuevoCasoForm', () => {
  const organizaciones = [{ id: 'org-1', nombre: 'Organización Demo' }]

  it('renders all required fields', () => {
    render(<NuevoCasoForm organizaciones={organizaciones} />)

    expect(screen.getByLabelText('RUT evaluado')).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre evaluado')).toBeInTheDocument()
    expect(screen.getByLabelText('Organización')).toBeInTheDocument()
    expect(screen.getByLabelText('Tipo de licencia')).toBeInTheDocument()
    expect(screen.getByLabelText('Fecha de emisión')).toBeInTheDocument()
    expect(screen.getByLabelText('Prioridad')).toBeInTheDocument()
  })

  it('renders the organización options passed as props', () => {
    render(<NuevoCasoForm organizaciones={organizaciones} />)
    expect(screen.getByRole('option', { name: 'Organización Demo' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm run test -- NuevoCasoForm.test.tsx`
Expected: FAIL — `Cannot find module './NuevoCasoForm'`.

- [ ] **Step 4: Implement the server action**

Create `app/admin/casos/nuevo/actions.ts`:

```typescript
'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { isValidRut, normalizeRut } from '@/lib/rut'
import { calcularFechaLimite } from '@/lib/fecha-limite'
import { asignarMedico } from '@/lib/asignacion'

export type CrearCasoState = { error: string | null }

export async function crearCasoIndividual(_prevState: CrearCasoState, formData: FormData): Promise<CrearCasoState> {
  const rut = String(formData.get('rut') ?? '')
  const nombreEvaluado = String(formData.get('nombreEvaluado') ?? '').trim()
  const organizacionId = String(formData.get('organizacionId') ?? '')
  const tipoLicencia = String(formData.get('tipoLicencia') ?? '').trim()
  const fechaEmisionLicenciaRaw = String(formData.get('fechaEmisionLicencia') ?? '')
  const prioridadRaw = String(formData.get('prioridad') ?? 'normal')

  if (!isValidRut(rut)) return { error: 'RUT inválido' }
  if (!nombreEvaluado) return { error: 'Nombre requerido' }
  if (!tipoLicencia) return { error: 'Tipo de licencia requerido' }
  if (isNaN(Date.parse(fechaEmisionLicenciaRaw))) return { error: 'Fecha de emisión inválida' }

  const organizacion = await prisma.organizacion.findUnique({ where: { id: organizacionId } })
  if (!organizacion) return { error: 'Organización inválida' }

  const fechaIngreso = new Date()
  const fechaLimite = calcularFechaLimite(fechaIngreso, organizacion.plazoSlaDias)
  const medicoId = await asignarMedico()
  const prioridad = prioridadRaw === 'urgente' ? 'urgente' : 'normal'

  await prisma.caso.create({
    data: {
      organizacionId,
      medicoId,
      rutEvaluado: normalizeRut(rut),
      nombreEvaluado,
      tipoLicencia,
      fechaEmisionLicencia: new Date(fechaEmisionLicenciaRaw),
      fechaIngreso,
      fechaLimite,
      prioridad,
    },
  })

  redirect('/admin/casos')
}
```

- [ ] **Step 5: Implement the form component**

Create `app/admin/casos/nuevo/NuevoCasoForm.tsx`:

```tsx
'use client'

import { useActionState } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { crearCasoIndividual, type CrearCasoState } from './actions'

type Organizacion = { id: string; nombre: string }

const initialState: CrearCasoState = { error: null }

export function NuevoCasoForm({ organizaciones }: { organizaciones: Organizacion[] }) {
  const [state, formAction, pending] = useActionState(crearCasoIndividual, initialState)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Input label="RUT evaluado" name="rut" required />
      <Input label="Nombre evaluado" name="nombreEvaluado" required />
      <Select
        label="Organización"
        name="organizacionId"
        required
        options={organizaciones.map((o) => ({ value: o.id, label: o.nombre }))}
      />
      <Input label="Tipo de licencia" name="tipoLicencia" required />
      <Input label="Fecha de emisión" name="fechaEmisionLicencia" type="date" required />
      <Select
        label="Prioridad"
        name="prioridad"
        options={[
          { value: 'normal', label: 'Normal' },
          { value: 'urgente', label: 'Urgente' },
        ]}
      />
      {state.error && <p className="text-sm text-brand-danger">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? 'Creando…' : 'Crear caso'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm run test -- NuevoCasoForm.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 7: Create the page**

Create `app/admin/casos/nuevo/page.tsx`:

```tsx
import { prisma } from '@/lib/prisma'
import { Card } from '@/components/ui/Card'
import { NuevoCasoForm } from './NuevoCasoForm'

export default async function NuevoCasoPage() {
  const organizaciones = await prisma.organizacion.findMany({
    select: { id: true, nombre: true },
    orderBy: { nombre: 'asc' },
  })

  return (
    <div className="p-8">
      <h1 className="text-lg font-medium text-brand-text">Nuevo caso</h1>
      <Card className="mt-4 max-w-md">
        <NuevoCasoForm organizaciones={organizaciones} />
      </Card>
    </div>
  )
}
```

- [ ] **Step 8: Run the full suite and build**

```bash
npm run test
npm run build
```

Expected: all tests pass, build succeeds — `/admin/casos` and `/admin/casos/nuevo` should appear in the build's route list.

- [ ] **Step 9: Manual verification**

```bash
npm run seed
npm run dev
```

In a browser, logged in as `backoffice@conectamente.cl` / `ChangeMe123!`:
1. Visit `/admin/casos/nuevo`, fill in a valid RUT (e.g. `12.345.678-5`), an organización from the seed data, and submit.
2. Expect redirect to `/admin/casos` showing the new row with the correct evaluado name/RUT, the seeded `medico1`/`medico2` as the assigned médico (whichever had fewer active casos), state `recibido`.
3. Try submitting `/admin/casos/nuevo` again with an invalid RUT (e.g. `11.111.111-2`) — expect the inline error "RUT inválido" and no redirect.

Stop the dev server after confirming.

- [ ] **Step 10: Commit**

```bash
git add app/admin/casos
git commit -m "feat: individual case entry (/admin/casos/nuevo) and case listing (/admin/casos)"
git push
```

---

## Task 5: Bulk Excel import — /admin/casos/importar

**Files:**
- Create: `app/api/admin/casos/importar/preview/route.ts`
- Create: `app/api/admin/casos/importar/confirmar/route.ts`
- Create: `app/admin/casos/importar/page.tsx`

**Interfaces:**
- Consumes: `parseCasosExcel`/`FilaImportacion` (Task 3), `isValidRut`/`normalizeRut`/`calcularFechaLimite`/`asignarMedico` (Task 2), `prisma` (Fase 0), `getServerSession`/`authOptions` (Fase 0).
- Produces: nothing consumed by later tasks in this plan.

- [ ] **Step 1: Create the preview API route**

Create `app/api/admin/casos/importar/preview/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { parseCasosExcel } from '@/lib/excel-import'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'backoffice') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })
  }

  const buffer = await file.arrayBuffer()
  const filas = await parseCasosExcel(buffer)

  return NextResponse.json({ filas })
}
```

- [ ] **Step 2: Create the confirm API route**

Create `app/api/admin/casos/importar/confirmar/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isValidRut, normalizeRut } from '@/lib/rut'
import { calcularFechaLimite } from '@/lib/fecha-limite'
import { asignarMedico } from '@/lib/asignacion'

type FilaConfirmar = {
  rut: string
  nombre: string
  organizacion: string
  tipoLicencia: string
  fechaEmision: string
  prioridad: string
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'backoffice') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await request.json()
  const filas: FilaConfirmar[] = Array.isArray(body?.filas) ? body.filas : []

  const organizaciones = await prisma.organizacion.findMany()
  const organizacionPorNombre = new Map(organizaciones.map((o) => [o.nombre, o]))

  let creados = 0

  for (const fila of filas) {
    if (!isValidRut(fila.rut)) continue
    if (!fila.nombre?.trim() || !fila.tipoLicencia?.trim()) continue
    if (fila.prioridad !== 'normal' && fila.prioridad !== 'urgente') continue
    if (!fila.fechaEmision || isNaN(Date.parse(fila.fechaEmision))) continue

    const organizacion = organizacionPorNombre.get(fila.organizacion)
    if (!organizacion) continue

    const fechaIngreso = new Date()
    const fechaLimite = calcularFechaLimite(fechaIngreso, organizacion.plazoSlaDias)
    const medicoId = await asignarMedico()

    await prisma.caso.create({
      data: {
        organizacionId: organizacion.id,
        medicoId,
        rutEvaluado: normalizeRut(fila.rut),
        nombreEvaluado: fila.nombre.trim(),
        tipoLicencia: fila.tipoLicencia.trim(),
        fechaEmisionLicencia: new Date(fila.fechaEmision),
        fechaIngreso,
        fechaLimite,
        prioridad: fila.prioridad,
      },
    })
    creados++
  }

  return NextResponse.json({ creados })
}
```

Note: this re-validates every row from scratch rather than trusting any "válida" flag the client might send — the client only ever sends rows it believes are valid, but this route is the actual authority on what gets inserted, matching the design spec's "no se insertan filas con error silenciosamente."

- [ ] **Step 3: Create the import page**

Create `app/admin/casos/importar/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

type FilaImportacion = {
  numeroFila: number
  datos: { rut: string; nombre: string; organizacion: string; tipoLicencia: string; fechaEmision: string; prioridad: string }
  errores: string[]
}

export default function ImportarCasosPage() {
  const router = useRouter()
  const [filas, setFilas] = useState<FilaImportacion[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/admin/casos/importar/preview', { method: 'POST', body: formData })
    setLoading(false)

    if (!res.ok) {
      setError('No se pudo leer el archivo')
      return
    }

    const data = await res.json()
    setFilas(data.filas)
  }

  async function handleConfirmar() {
    if (!filas) return
    const filasValidas = filas.filter((f) => f.errores.length === 0).map((f) => f.datos)

    setLoading(true)
    setError(null)

    const res = await fetch('/api/admin/casos/importar/confirmar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filas: filasValidas }),
    })
    setLoading(false)

    if (!res.ok) {
      setError('No se pudo confirmar la importación')
      return
    }

    router.push('/admin/casos')
  }

  const hayFilasValidas = filas?.some((f) => f.errores.length === 0) ?? false

  return (
    <div className="p-8">
      <h1 className="text-lg font-medium text-brand-text">Importar casos</h1>

      {!filas && (
        <Card className="mt-4 max-w-md">
          <label className="text-sm text-brand-text">
            Archivo Excel/CSV
            <input type="file" accept=".xlsx,.csv" onChange={handleFileChange} className="mt-2 block" />
          </label>
          {loading && <p className="mt-2 text-sm text-brand-textSecondary">Leyendo archivo…</p>}
          {error && <p className="mt-2 text-sm text-brand-danger">{error}</p>}
        </Card>
      )}

      {filas && (
        <div className="mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-brand-textSecondary">
                <th className="pb-2">Fila</th>
                <th className="pb-2">RUT</th>
                <th className="pb-2">Nombre</th>
                <th className="pb-2">Organización</th>
                <th className="pb-2">Errores</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((fila) => (
                <tr
                  key={fila.numeroFila}
                  className={`border-t border-brand-borderSoft ${fila.errores.length > 0 ? 'bg-red-50' : ''}`}
                >
                  <td className="py-2">{fila.numeroFila}</td>
                  <td className="py-2">{fila.datos.rut}</td>
                  <td className="py-2">{fila.datos.nombre}</td>
                  <td className="py-2">{fila.datos.organizacion}</td>
                  <td className="py-2 text-brand-danger">{fila.errores.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {error && <p className="mt-2 text-sm text-brand-danger">{error}</p>}
          <Button className="mt-4" onClick={handleConfirmar} disabled={!hayFilasValidas || loading}>
            {loading ? 'Confirmando…' : 'Confirmar importación'}
          </Button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run the full suite and build**

```bash
npm run test
npm run build
```

Expected: all tests pass (this task adds no new automated tests — the underlying logic is already covered by Task 3's `excel-import.test.ts`; this task is UI/route wiring around it), build succeeds, `/admin/casos/importar` appears in the route list.

- [ ] **Step 5: Manual verification**

```bash
npm run dev
```

In a browser, logged in as `backoffice@conectamente.cl` / `ChangeMe123!`, build a small `.xlsx` file with headers `RUT evaluado, nombre, organización, tipo de licencia, fecha de emisión de la licencia, prioridad` and 2 rows — one fully valid (using a real seeded organización name and a valid RUT like `12.345.678-5`), one with an invalid RUT:
1. Visit `/admin/casos/importar`, upload the file.
2. Expect the preview table to show both rows, the invalid one highlighted with "RUT inválido" in its Errores column, "Confirmar importación" enabled (since one row is valid).
3. Click confirm — expect redirect to `/admin/casos` showing exactly one new row (the valid one), not two.

Stop the dev server after confirming.

- [ ] **Step 6: Commit**

```bash
git add app/api/admin/casos/importar app/admin/casos/importar
git commit -m "feat: bulk Excel case import with per-row validation preview"
git push
```

---

## Task 6: Manual reassignment — /admin/asignacion

**Files:**
- Create: `app/admin/asignacion/page.tsx`
- Create: `app/admin/asignacion/ReasignarSelect.tsx`
- Create: `app/admin/asignacion/actions.ts`

**Interfaces:**
- Consumes: `prisma` (Fase 0), `ESTADOS_ACTIVOS` (Task 2).
- Produces: nothing consumed by later tasks in this plan.

- [ ] **Step 1: Implement the reassignment server action**

Create `app/admin/asignacion/actions.ts`:

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

export async function reasignarMedico(casoId: string, medicoId: string) {
  await prisma.caso.update({
    where: { id: casoId },
    data: { medicoId: medicoId === '' ? null : medicoId },
  })
  revalidatePath('/admin/asignacion')
}
```

- [ ] **Step 2: Implement the reassignment select component**

Create `app/admin/asignacion/ReasignarSelect.tsx`:

```tsx
'use client'

import { reasignarMedico } from './actions'

type Medico = { id: string; nombre: string }

export function ReasignarSelect({
  casoId,
  medicoIdActual,
  medicos,
}: {
  casoId: string
  medicoIdActual: string | null
  medicos: Medico[]
}) {
  return (
    <select
      aria-label="Médico asignado"
      defaultValue={medicoIdActual ?? ''}
      onChange={(e) => reasignarMedico(casoId, e.target.value)}
      className="rounded-lg border border-brand-border bg-brand-bg px-2 py-1 text-sm text-brand-text outline-none focus:border-brand-accent"
    >
      <option value="">Sin asignar</option>
      {medicos.map((m) => (
        <option key={m.id} value={m.id}>
          {m.nombre}
        </option>
      ))}
    </select>
  )
}
```

- [ ] **Step 3: Implement the page**

Create `app/admin/asignacion/page.tsx`:

```tsx
import { prisma } from '@/lib/prisma'
import { ESTADOS_ACTIVOS } from '@/lib/asignacion'
import { ReasignarSelect } from './ReasignarSelect'

export default async function AsignacionPage() {
  const medicos = await prisma.usuario.findMany({
    where: { rol: 'medico', activo: true },
    orderBy: { creadoEn: 'asc' },
  })

  const cargas = await Promise.all(
    medicos.map(async (medico) => ({
      id: medico.id,
      nombre: medico.nombre,
      carga: await prisma.caso.count({
        where: { medicoId: medico.id, estado: { in: [...ESTADOS_ACTIVOS] } },
      }),
    }))
  )

  const casos = await prisma.caso.findMany({
    where: { estado: { in: [...ESTADOS_ACTIVOS] } },
    include: { organizacion: true },
    orderBy: { fechaLimite: 'asc' },
  })

  return (
    <div className="p-8">
      <h1 className="text-lg font-medium text-brand-text">Asignación</h1>

      <h2 className="mt-6 text-sm font-medium text-brand-textSecondary">Carga por médico</h2>
      <ul className="mt-2 text-sm text-brand-text">
        {cargas.map((c) => (
          <li key={c.id}>
            {c.nombre}: {c.carga} caso{c.carga === 1 ? '' : 's'} activo{c.carga === 1 ? '' : 's'}
          </li>
        ))}
      </ul>

      <h2 className="mt-6 text-sm font-medium text-brand-textSecondary">Casos</h2>
      <table className="mt-2 w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-brand-textSecondary">
            <th className="pb-2">Evaluado</th>
            <th className="pb-2">Organización</th>
            <th className="pb-2">Médico</th>
          </tr>
        </thead>
        <tbody>
          {casos.map((caso) => (
            <tr key={caso.id} className="border-t border-brand-borderSoft">
              <td className="py-2">{caso.nombreEvaluado}</td>
              <td className="py-2">{caso.organizacion.nombre}</td>
              <td className="py-2">
                <ReasignarSelect
                  casoId={caso.id}
                  medicoIdActual={caso.medicoId}
                  medicos={medicos.map((m) => ({ id: m.id, nombre: m.nombre }))}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 4: Run the full suite and build**

```bash
npm run test
npm run build
```

Expected: all tests pass (no new automated tests in this task — it's a thin UI over already-tested `prisma` queries; the reassignment itself is a single-field update with no business logic to unit test beyond what Prisma itself guarantees), build succeeds, `/admin/asignacion` appears in the route list.

- [ ] **Step 5: Manual verification**

```bash
npm run dev
```

In a browser, logged in as `backoffice@conectamente.cl` / `ChangeMe123!`, with at least one `Caso` already created (from Task 4 or 5's manual verification):
1. Visit `/admin/asignacion`. Expect to see both seeded médicos with their active-caso counts, and a table listing every non-`entregado` caso with a médico selector.
2. Change a caso's médico selector to a different médico. Expect the page's "Carga por médico" counts to update after the change (server action + `revalidatePath` refreshes the page).
3. Confirm in `/admin/casos` that the caso's médico column now reflects the reassignment.

Stop the dev server after confirming.

- [ ] **Step 6: Commit**

```bash
git add app/admin/asignacion
git commit -m "feat: manual médico reassignment view (/admin/asignacion)"
git push
```

---

## End of Fase 2a

At this point: backoffice can create casos individually or via Excel bulk import, every caso auto-assigns to the médico with the lowest active caseload at creation time, and backoffice can view workload-by-médico and manually reassign any active caso. Per the master prompt's working rules, **stop here and report back** before starting the second half of Fase 2 (portal cliente de solo lectura).

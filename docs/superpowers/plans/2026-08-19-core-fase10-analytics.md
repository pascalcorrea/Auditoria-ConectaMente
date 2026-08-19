# Fase 10: Analytics Dashboard

**Goal:** Build a metrics dashboard for backoffice users to track case volume, physician workload, compliance status, and system health.

**Scope:** Admin analytics page with key metrics, charts, and filters. No external analytics service integration — data sourced from PostgreSQL.

**Timeline:** 1-2 hours

## Tasks

### 1. Create Analytics Data Helper Library

**File:** `lib/analytics.ts`

Steps:
- Export `getAnalyticsMetrics()` async function
  - Returns: `{ totalCasos, casosCompletados, casosEnProgreso, casosVencidos, tiempoPromedio, cargaMedicos }`
  - `totalCasos`: Count all casos
  - `casosCompletados`: Count casos with estado = 'completado'
  - `casosEnProgreso`: Count where estado = 'en_revision' or 'en_sesion'
  - `casosVencidos`: Count where fechaLimite < today and estado != 'completado'
  - `tiempoPromedio`: Avg days from fechaIngreso to (actualizadoEn or now) for completados
  - `cargaMedicos`: Array of `{ usuarioId, nombre, casosAsignados, casosCompletados }`
- Include Prisma queries (use `_count` aggregates where efficient)
- Use `includeFilter: { _count: { select: { casos: true } } }` pattern

**Verification:**
```bash
npm run build  # No TS errors
```

### 2. Build Analytics Page Component

**File:** `app/admin/analytics/page.tsx`

Steps:
- Create Server Component (async)
- Verify role: `session?.user?.rol !== 'backoffice'` → `notFound()`
- Fetch metrics: `const metrics = await getAnalyticsMetrics()`
- Layout:
  ```
  [Header: "Analytics Dashboard"]
  [Metrics Cards Grid - 5 columns]
    - Total casos
    - Completados
    - En progreso
    - Vencidos
    - Promedio días resolución
  [Physician Workload Table]
    - Nombre | Casos Asignados | Completados | % Completado
    - Sorted by casos asignados desc
  ```
- Use existing Card, Button components
- Style with Tailwind + brand colors
- Export: `export const dynamic = 'force-dynamic'`

**Verification:**
```bash
npm run build  # No errors
# Manual: Open /admin/analytics, check metrics display
```

### 3. Add Analytics Route to Admin Nav

**File:** `app/admin/layout.tsx`

Steps:
- Add link to analytics page in nav sidebar
- Path: `/admin/analytics`
- Label: "Analytics" or "Métricas"
- Preserve existing nav items (asignacion, casos, cumplimiento, usuarios, organizaciones)

**Verification:**
```bash
# Manual: Verify link appears in admin sidebar
```

### 4. Test Analytics Data Retrieval

**File:** `lib/analytics.test.ts`

Steps:
- Use Vitest + Prisma test fixtures
- Test `getAnalyticsMetrics()` returns structure with all fields
- Test counts are integers >= 0
- Test tiempoPromedio is number or null
- Test cargaMedicos array is populated

**Verification:**
```bash
npm run test -- lib/analytics.test.ts
# Should pass all tests
```

### 5. Verify Build & Tests

Steps:
- `npm run build` → Should complete with no errors
- `npm run test` → All tests pass

## Success Criteria

✓ Analytics page renders at `/admin/analytics`
✓ Displays 5 key metrics in card layout
✓ Shows physician workload table
✓ Only accessible to backoffice role
✓ Data updates on page load (force-dynamic)
✓ Build passes with no ESLint warnings
✓ Tests pass

## Notes

- Mock data is OK for MVP (real data from Prisma)
- No external charting library (use tables + simple colors)
- Metadata: export `dynamic = 'force-dynamic'` to skip caching
- If Prisma aggregates slow: add indexes on `estado`, `fechaLimite`

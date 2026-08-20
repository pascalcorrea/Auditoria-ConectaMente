# ConectaMente Peritajes Rebrand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand the already-built, already-tested institutional website from "ConectaMente Auditoría" (`auditoria.conectamente.cl`, service name "Auditoría de Licencias Médicas") to "ConectaMente Peritajes" (`peritajes.conectamente.cl`, service name "Peritajes de Segunda Opinión"), without changing the underlying business, architecture, or any of the 82 existing tests' intent — only their expected values, where the value itself is what's rebranding.

**Architecture:** No structural changes. Same Next.js 15 project at `E:\Dev\Web-ConectaMente-Auditoria`, same routes (one renamed: `/servicio-auditoria` → `/servicio-peritajes`), same components, same data-driven segment landing pattern. This is a controlled find-and-replace across brand strings, the domain constant, and one route path — each task ends with the full test suite green.

**Tech Stack:** Same as the existing project (Next.js 15, TypeScript, Tailwind, Vitest).

## Global Constraints

- **Domain:** `https://peritajes.conectamente.cl` replaces `https://auditoria.conectamente.cl` everywhere it appears (BASE_URL, metadataBase, robots sitemap link). Verified live via the domain's authoritative nameservers (`apollo`/`athena.dns-parking.com`) at plan-writing time — `peritajes.conectamente.cl` already resolves to the VPS (`31.97.167.199`); `auditoria.conectamente.cl` never did.
- **Brand name:** "ConectaMente Peritajes" replaces "ConectaMente Auditoría" everywhere it appears as a brand string (header, footer, page titles, email sender name).
- **Primary service name:** "Peritajes de Segunda Opinión" replaces "Auditoría de Licencias Médicas" as the service's display name in nav/cards/titles. Where the underlying service is described in body copy, "auditoría de licencias médicas" may still appear as a clarifying synonym — it is not being scrubbed from the vocabulary entirely, only demoted from primary/title usage.
- **Route:** `/servicio-auditoria` → `/servicio-peritajes`.
- **The "Peritajes Médico-Legales (Próximamente)" service card is removed**, not renamed — it is superseded by the (now renamed) primary service card, not a separate offering. The Home services block goes from 3 cards (`md:grid-cols-3`) to 2 cards (`md:grid-cols-2`).
- **Segment landing pain-point copy is NOT rewritten.** The 3 "reasons" per segment (isapres/COMPIN/empresas/seguros), `heroBody`, and `howItWorks` stay as-is except for isolated word-level "auditoría"→"peritaje" swaps where that exact word appears — do not rederive or restructure the pain-point analysis.
- **No repo/folder/package renaming.** The local directory (`E:\Dev\Web-ConectaMente-Auditoria`), the GitHub repo (`web-conectamente-auditoria`), `package.json`'s `name` field, and the PM2 process name in `ecosystem.config.js` (`web-conectamente-auditoria`) all stay as-is — renaming internal identifiers with no user-facing visibility is out of scope and adds risk for no benefit.
- **Every task ends with the full suite green:** `npm test` (all test files, not just the ones touched) and `npm run build` must both succeed before a task is considered done.

---

### Task 1: Domain constant, robots/sitemap domain, and brand text in Header/Footer/layout/email sender

**Files:**
- Modify: `app/sitemap.ts`
- Modify: `app/robots.ts`
- Modify: `app/robots.test.ts`
- Modify: `app/layout.tsx`
- Modify: `components/layout/Header.tsx`
- Modify: `components/layout/Footer.tsx`
- Modify: `lib/brevo.ts`

**Interfaces:**
- No new exports or signatures change. This task only changes string literal values (URLs and brand text) inside files whose exports (`sitemap`, `robots`, `Header`, `Footer`, `sendContactNotification`) are unchanged.
- Does NOT touch the `/servicio-auditoria` route path or any href pointing to it — that is Task 2's job. Header's "Servicio" link and Footer's service-column link keep their current `/servicio-auditoria` href in this task; only the surrounding brand text changes.

- [ ] **Step 1: Update the failing robots test to expect the new domain**

Modify `app/robots.test.ts` — replace the sitemap URL assertion:

```ts
import { describe, it, expect } from 'vitest'
import robots from './robots'

describe('robots', () => {
  it('allows all crawlers and points to the sitemap', () => {
    const result = robots()
    expect(result.rules).toEqual({ userAgent: '*', allow: '/' })
    expect(result.sitemap).toBe('https://peritajes.conectamente.cl/sitemap.xml')
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run app/robots.test.ts`
Expected: FAIL — `robots.ts` still returns the old domain.

- [ ] **Step 3: Update `app/robots.ts` to the new domain**

```ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: 'https://peritajes.conectamente.cl/sitemap.xml',
  }
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run app/robots.test.ts`
Expected: PASS.

- [ ] **Step 5: Update `app/sitemap.ts`'s `BASE_URL`**

Modify `app/sitemap.ts` — change only the `BASE_URL` constant (leave the `/servicio-auditoria` route string in `staticRoutes` untouched — that's Task 2):

```ts
import type { MetadataRoute } from 'next'
import { segments, segmentSlugs } from '@/lib/segments-data'

const BASE_URL = 'https://peritajes.conectamente.cl'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    '/',
    '/servicio-auditoria',
    '/nosotros',
    '/tecnologia',
    '/proveedor',
    '/contacto',
  ]
  const segmentRoutes = segmentSlugs
    .filter((slug) => !segments[slug].pendingReview)
    .map((slug) => `/segmentos/${slug}`)

  return [...staticRoutes, ...segmentRoutes].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
  }))
}
```

`app/sitemap.test.ts` currently asserts `https://auditoria.conectamente.cl` — update every occurrence of that domain string to `https://peritajes.conectamente.cl` (the route paths in the assertions — `/`, `/segmentos/isapres`, `/segmentos/compin`, `/segmentos/empresas`, and the negative check for `/segmentos/seguros` — stay exactly as they are; only the domain prefix changes):

```ts
import { describe, it, expect } from 'vitest'
import sitemap from './sitemap'

describe('sitemap', () => {
  it('includes all 6 static routes plus the 3 non-pending-review segment routes, as absolute URLs', () => {
    const entries = sitemap()
    expect(entries).toHaveLength(9)
    for (const entry of entries) {
      expect(entry.url.startsWith('https://peritajes.conectamente.cl')).toBe(true)
    }
    const urls = entries.map((e) => e.url)
    expect(urls).toContain('https://peritajes.conectamente.cl/')
    expect(urls).toContain('https://peritajes.conectamente.cl/segmentos/isapres')
    expect(urls).toContain('https://peritajes.conectamente.cl/segmentos/compin')
    expect(urls).toContain('https://peritajes.conectamente.cl/segmentos/empresas')
  })

  it('excludes segments still marked pendingReview, like seguros', () => {
    const entries = sitemap()
    const urls = entries.map((e) => e.url)
    expect(urls).not.toContain('https://peritajes.conectamente.cl/segmentos/seguros')
  })
})
```

- [ ] **Step 6: Run it to verify it passes**

Run: `npx vitest run app/sitemap.test.ts`
Expected: PASS.

- [ ] **Step 7: Update `app/layout.tsx`'s metadata**

Modify `app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'ConectaMente Peritajes — Peritajes de segunda opinión sobre licencias médicas',
    template: '%s',
  },
  description:
    'Peritajes de segunda opinión sobre licencias médicas, con trazabilidad y cumplimiento normativo, a la escala que su organización necesita.',
  metadataBase: new URL('https://peritajes.conectamente.cl'),
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-page font-sans text-ink antialiased">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
```

- [ ] **Step 8: Update the brand text in `components/layout/Header.tsx`**

Modify only the brand `<Link>` text (line 21-23) — leave the "Servicio" link's `href="/servicio-auditoria"` exactly as it is, that changes in Task 2:

```tsx
        <Link href="/" className="text-lg font-semibold text-ink">
          ConectaMente <span className="text-primary">Peritajes</span>
        </Link>
```

- [ ] **Step 9: Update the brand text in `components/layout/Footer.tsx`**

Modify three spots — the brand heading, the tagline paragraph, and the copyright line — leaving the `columns` array's `/servicio-auditoria` href and `'Auditoría de Licencias'` label untouched (Task 2):

```tsx
          <div>
            <span className="text-lg font-semibold text-ink">
              ConectaMente <span className="text-primary">Peritajes</span>
            </span>
            <p className="mt-2 text-sm text-inkSecondary">
              Peritajes médico-legales de segunda opinión con trazabilidad de extremo a extremo.
            </p>
          </div>
```

and:

```tsx
          <span>Copyright © {new Date().getFullYear()} ConectaMente Peritajes</span>
```

- [ ] **Step 10: Update the email sender name in `lib/brevo.ts`**

Modify the `sender` field (no test asserts on this value, so no test change is needed):

```ts
      sender: { name: 'Sitio ConectaMente Peritajes', email: 'no-responder@conectamente.cl' },
```

- [ ] **Step 11: Run the full suite and build**

Run: `npm test`
Expected: PASS (82/82 — no test count change in this task, only value changes).

Run: `npm run build`
Expected: SUCCESS.

- [ ] **Step 12: Commit**

```bash
git add app/sitemap.ts app/sitemap.test.ts app/robots.ts app/robots.test.ts app/layout.tsx components/layout/Header.tsx components/layout/Footer.tsx lib/brevo.ts
git commit -m "rebrand: peritajes.conectamente.cl domain and ConectaMente Peritajes brand text"
```

---

### Task 2: Rename `/servicio-auditoria` to `/servicio-peritajes` and rebrand the Home page

**Files:**
- Move + Modify: `app/servicio-auditoria/page.tsx` → `app/servicio-peritajes/page.tsx`
- Move + Modify: `app/servicio-auditoria/page.test.tsx` → `app/servicio-peritajes/page.test.tsx`
- Modify: `app/sitemap.ts` (the route path, not the domain — Task 1 already did the domain)
- Modify: `components/layout/Header.tsx` (the Servicio link href)
- Modify: `components/layout/Header.test.tsx`
- Modify: `components/layout/Footer.tsx` (the service column's link href + label)
- Modify: `app/page.tsx` (Home)
- Modify: `app/page.test.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: the page's default export is renamed from `ServicioAuditoriaPage` to `ServicioPeritajesPage` — this is a local rename only (default export, not imported by name elsewhere in the app; Next.js resolves the route by file path, not export name), so no other file needs to know the new function name except the moved test file.

- [ ] **Step 1: Move the service page's test file and update it to expect the new route/heading**

Create `app/servicio-peritajes/page.test.tsx` with this content (then delete `app/servicio-auditoria/page.test.tsx`):

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ServicioPeritajesPage from './page'

describe('ServicioPeritajesPage', () => {
  it('renders the page heading', () => {
    render(<ServicioPeritajesPage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Peritajes de Segunda Opinión'
    )
  })

  it('renders the two delivery modalities', () => {
    render(<ServicioPeritajesPage />)
    expect(screen.getByText('Caso a caso')).toBeInTheDocument()
    expect(screen.getByText('Lote masivo (Excel)')).toBeInTheDocument()
  })

  it('renders all 5 delivery timeline steps in order', () => {
    render(<ServicioPeritajesPage />)
    const steps = screen.getAllByText(/^(Ingreso|Asignación|Evaluación|Informe firmado \(FEA\)|Entrega con trazabilidad)$/)
    expect(steps.map((el) => el.textContent)).toEqual([
      'Ingreso',
      'Asignación',
      'Evaluación',
      'Informe firmado (FEA)',
      'Entrega con trazabilidad',
    ])
  })

  it('links to all four segment landings', () => {
    render(<ServicioPeritajesPage />)
    expect(screen.getByRole('link', { name: 'Isapres' })).toHaveAttribute(
      'href',
      '/segmentos/isapres'
    )
    expect(screen.getByRole('link', { name: 'Seguros' })).toHaveAttribute(
      'href',
      '/segmentos/seguros'
    )
  })
})
```

Run: `rm app/servicio-auditoria/page.test.tsx` (or delete via your editor)

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run app/servicio-peritajes/page.test.tsx`
Expected: FAIL — `app/servicio-peritajes/page.tsx` doesn't exist yet.

- [ ] **Step 3: Create the renamed page with updated title/H1, then delete the old folder**

Create `app/servicio-peritajes/page.tsx` (identical to the old file except the metadata title, function name, H1, and intro paragraph):

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { Stethoscope, ScrollText, Search } from 'lucide-react'
import { DashboardPlaceholder } from '@/components/marketing/DashboardPlaceholder'

export const metadata: Metadata = {
  title: 'Peritajes de Segunda Opinión — ConectaMente Peritajes',
  description:
    'Peritajes de segunda opinión sobre licencias médicas emitidas — también conocidos como auditoría de licencias — caso a caso o en lote masivo.',
}

const evalua = [
  {
    icon: Stethoscope,
    title: 'Coherencia diagnóstico-reposo',
    body: 'Verificamos que el reposo indicado sea consistente con el diagnóstico clínico.',
  },
  {
    icon: ScrollText,
    title: 'Cumplimiento normativo',
    body: 'Revisión conforme a la Ley 21.746 y las circulares vigentes de MINSAL.',
  },
  {
    icon: Search,
    title: 'Detección de patrones anómalos',
    body: 'Identificación de irregularidades y patrones de uso atípico.',
  },
]

const timeline = ['Ingreso', 'Asignación', 'Evaluación', 'Informe firmado (FEA)', 'Entrega con trazabilidad']

const segmentos = [
  { href: '/segmentos/isapres', label: 'Isapres' },
  { href: '/segmentos/compin', label: 'COMPIN' },
  { href: '/segmentos/empresas', label: 'Empresas' },
  { href: '/segmentos/seguros', label: 'Seguros' },
]

export default function ServicioPeritajesPage() {
  return (
    <>
      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h1 className="text-4xl font-bold text-ink">Peritajes de Segunda Opinión</h1>
        <p className="mt-4 text-lg text-inkSecondary">
          Revisión clínica, regulatoria y documental de licencias emitidas — también conocida
          como auditoría de licencias — para instituciones que necesitan una segunda evaluación
          defendible.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-6 md:grid-cols-3">
          {evalua.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border border-border bg-white p-6">
              <Icon size={24} className="text-primary" />
              <h3 className="mt-3 font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-sm text-inkSecondary">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto grid max-w-4xl gap-6 px-6 md:grid-cols-2">
          <div className="rounded-xl border border-border p-6">
            <h3 className="font-semibold text-ink">Caso a caso</h3>
            <p className="mt-2 text-sm text-inkSecondary">
              Ingreso individual, seguimiento dedicado por caso.
            </p>
          </div>
          <div className="rounded-xl border border-border p-6">
            <h3 className="font-semibold text-ink">Lote masivo (Excel)</h3>
            <p className="mt-2 text-sm text-inkSecondary">
              Carga masiva vía Excel/CSV para volúmenes altos, con asignación automática.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-center text-2xl font-bold text-ink">Cómo se entrega</h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-5">
          {timeline.map((step, i) => (
            <li key={step} className="rounded-xl border border-border bg-white p-4 text-center text-sm">
              <span className="block text-xs font-semibold text-primary">Paso {i + 1}</span>
              <span className="mt-1 block text-inkSecondary">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-2xl font-bold text-ink">
              Estado de cada caso, visible en todo momento.
            </h2>
            <p className="mt-4 text-inkSecondary">
              El diferenciador tecnológico de ConectaMente: dashboard de estado en tiempo real
              para el cliente.
            </p>
          </div>
          <DashboardPlaceholder label="Mockup: estado del caso — pendiente" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-2xl font-bold text-ink">
          ¿Su organización pertenece a uno de estos segmentos?
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {segmentos.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="rounded-xl border border-border bg-white p-6 text-center font-semibold text-ink hover:border-primary hover:text-primary"
            >
              {s.label}
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
```

Run: `rm -r app/servicio-auditoria` (or delete the folder via your editor — both `page.tsx` and the folder itself must be gone)

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run app/servicio-peritajes/page.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Update the route path in `app/sitemap.ts`**

Modify `app/sitemap.ts`'s `staticRoutes` array — change `'/servicio-auditoria'` to `'/servicio-peritajes'`:

```ts
  const staticRoutes = [
    '/',
    '/servicio-peritajes',
    '/nosotros',
    '/tecnologia',
    '/proveedor',
    '/contacto',
  ]
```

(No test change needed — `app/sitemap.test.ts` doesn't assert on this specific route's presence, only on the domain and the segment routes, both already covered in Task 1.)

- [ ] **Step 6: Update the failing Header test to expect the new href**

Modify `app/../components/layout/Header.test.tsx`'s first test — change the "Servicio" link's expected href:

```tsx
  it('renders the main nav links', () => {
    render(<Header />)
    expect(screen.getByRole('link', { name: 'Servicio' })).toHaveAttribute(
      'href',
      '/servicio-peritajes'
    )
    expect(screen.getByRole('link', { name: 'Tecnología' })).toHaveAttribute('href', '/tecnologia')
    expect(screen.getByRole('link', { name: 'Nosotros' })).toHaveAttribute('href', '/nosotros')
    expect(screen.getByRole('link', { name: 'Contacto' })).toHaveAttribute('href', '/contacto')
  })
```

- [ ] **Step 7: Run it to verify it fails, then update `Header.tsx`**

Run: `npx vitest run components/layout/Header.test.tsx`
Expected: FAIL on the first test (href still `/servicio-auditoria`).

Modify `components/layout/Header.tsx`'s "Servicio" link:

```tsx
          <Link href="/servicio-peritajes" className="hover:text-primary">
            Servicio
          </Link>
```

Run: `npx vitest run components/layout/Header.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 8: Update `Footer.tsx`'s service link href and label**

Modify `components/layout/Footer.tsx`'s `columns` array, first entry's first link:

```ts
      { href: '/servicio-peritajes', label: 'Peritajes de Segunda Opinión' },
```

(No test change needed — `Footer.test.tsx` doesn't assert on this specific link's href or label.)

- [ ] **Step 9: Update the failing Home page test to expect the rebranded content**

Modify `app/page.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import HomePage from './page'

describe('HomePage', () => {
  it('renders the hero heading', () => {
    render(<HomePage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Peritajes de segunda opinión'
    )
  })

  it('renders the two service lines, with Interconsultoría marked as upcoming', () => {
    render(<HomePage />)
    expect(screen.getByText('Peritajes de Segunda Opinión')).toBeInTheDocument()
    expect(screen.getByText('Interconsultoría Institucional')).toBeInTheDocument()
    expect(screen.getAllByText('Próximamente')).toHaveLength(1)
  })

  it('links to the service page from the first service card', () => {
    render(<HomePage />)
    expect(screen.getByRole('link', { name: 'Conocer el servicio →' })).toHaveAttribute(
      'href',
      '/servicio-peritajes'
    )
  })

  it('renders the capacity metrics', () => {
    render(<HomePage />)
    expect(screen.getByText('Nacional')).toBeInTheDocument()
    expect(screen.getByText('Telemática')).toBeInTheDocument()
  })
})
```

- [ ] **Step 10: Run it to verify it fails**

Run: `npx vitest run app/page.test.tsx`
Expected: FAIL — hero text, card count/labels, and link href all still reflect the old content.

- [ ] **Step 11: Update `app/page.tsx` (Home) — hero, service cards (2 not 3), tech H2, final CTA H2**

Replace `app/page.tsx`:

```tsx
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { DashboardPlaceholder } from '@/components/marketing/DashboardPlaceholder'

const capacidades = [
  'Estado de cada caso en tiempo real, sin tener que preguntar.',
  'Alertas automáticas si un plazo está en riesgo — antes de que se cumpla.',
  'Registro auditable de cada sesión y cada descarga de informe.',
  'Firma electrónica avanzada en cada informe, firmado personalmente por el profesional a cargo.',
]

export default function HomePage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold text-ink md:text-5xl">
          Peritajes de segunda opinión sobre licencias médicas, con la trazabilidad que su
          organización necesita.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-inkSecondary">
          Revisamos licencias médicas con rigor clínico y evidencia defendible — también
          conocido como auditoría de licencias médicas — con visibilidad en tiempo real de cada
          caso, desde el ingreso hasta la entrega del informe firmado.
        </p>
        <div className="mt-8 flex justify-center">
          <Button href="/contacto">Conversemos sobre su organización →</Button>
        </div>
      </section>

      <section className="border-y border-border bg-primarySubtle py-6 text-center text-sm font-medium text-primaryDark">
        Equipo 100% acreditado ante la Superintendencia de Salud (Registro Nacional de
        Prestadores Individuales).
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-2">
          <Card title="Peritajes de Segunda Opinión">
            Revisión clínica, regulatoria y documental de licencias emitidas, caso a caso o en
            lote.
            <div className="mt-4">
              <Link
                href="/servicio-peritajes"
                className="text-sm font-semibold text-primary hover:text-primaryDark"
              >
                Conocer el servicio →
              </Link>
            </div>
          </Card>
          <Card title="Interconsultoría Institucional" badge="Próximamente">
            Asesoría técnica a organismos fiscalizadores.
          </Card>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-2 md:items-center">
          <DashboardPlaceholder />
          <div>
            <h2 className="text-2xl font-bold text-ink md:text-3xl">
              El único peritaje médico-legal en Chile con trazabilidad visible.
            </h2>
            <p className="mt-4 text-inkSecondary">
              No le pedimos que confíe a ciegas en que su caso avanza. Véalo usted mismo.
            </p>
            <ul className="mt-6 space-y-3">
              {capacidades.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-inkSecondary">
                  <ShieldCheck size={18} className="mt-0.5 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
          <StatCard label="Cobertura" value="Nacional" />
          <StatCard label="Modalidad" value="Telemática" />
          <StatCard label="Plazos" value="Definidos por contrato" />
          <StatCard label="Trazabilidad" value="De extremo a extremo" />
        </div>
      </section>

      <section className="border-t border-border bg-primary py-16 text-center text-white">
        <h2 className="mx-auto max-w-2xl text-2xl font-bold md:text-3xl">
          ¿Su organización necesita un peritaje médico-legal con capacidad real de volumen?
        </h2>
        <div className="mt-8 flex justify-center">
          <Button href="/contacto" variant="inverse">
            Conversemos →
          </Button>
        </div>
      </section>
    </>
  )
}
```

- [ ] **Step 12: Run it to verify it passes**

Run: `npx vitest run app/page.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 13: Run the full suite and build**

Run: `npm test`
Expected: PASS (82/82 — same total count: this task removes 0 tests and adds 0 tests, only renames files and changes values).

Run: `npm run build`
Expected: SUCCESS — confirm the build output no longer lists `/servicio-auditoria` and now lists `/servicio-peritajes`.

- [ ] **Step 14: Commit**

```bash
git add -A app/servicio-auditoria app/servicio-peritajes app/sitemap.ts components/layout/Header.tsx components/layout/Header.test.tsx components/layout/Footer.tsx app/page.tsx app/page.test.tsx
git commit -m "rebrand: rename /servicio-auditoria to /servicio-peritajes, rebrand Home page"
```

---

### Task 3: Remaining pages, segment landing metadata, and README

**Files:**
- Modify: `lib/segments-data.ts`
- Modify: `lib/segments-data.test.ts`
- Modify: `app/nosotros/page.tsx`
- Modify: `app/proveedor/page.tsx`
- Modify: `app/contacto/page.tsx` (metadata title only — the `ConsultaTipo` default-value test is Task 4)
- Modify: `app/tecnologia/page.tsx`
- Modify: `README.md`

**Interfaces:**
- No exports change. `SegmentContent`'s shape (Task 7 of the original plan) is untouched — only field VALUES for `metaTitle`, and for `isapres`/`seguros` also `heroTitle`/`metaDescription`/`ctaTitle`, change.

- [ ] **Step 1: Update the failing segments-data test to expect the new Isapres hero title**

Modify `lib/segments-data.test.ts` — the third test currently checks the exact doc-05 Isapres copy; update it to check the rebranded value and rename the test description to stop claiming it's the doc-05 original (doc 05 is now historical/superseded by this rebrand):

```ts
  it('uses the rebranded Isapres hero title (peritaje, not auditoría)', () => {
    expect(segments.isapres.heroTitle).toBe(
      'Peritaje médico-legal de segunda opinión para su contraloría, con la capacidad que un caso complejo necesita.'
    )
  })
```

(Leave the other 4 tests in this file — segment count, 3-reasons/hero/CTA shape check, `pendingReview` gating, `isSegmentSlug` validation — exactly as they are; none of them assert on the specific strings being changed in this task.)

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run lib/segments-data.test.ts`
Expected: FAIL on the renamed test — `segments.isapres.heroTitle` is still the old "Auditoría médico-legal..." string.

- [ ] **Step 3: Update `lib/segments-data.ts`'s brand/service-name strings**

Modify these exact fields in `lib/segments-data.ts` (leave every other field — `heroBody`, all `reasons`, `howItWorks`, `ctaBody`, `label`, `slug`, `pendingReview` — untouched in every segment; the words "auditoría"/"auditoría de licencias" do not appear in any of those untouched fields, confirmed by grep before writing this plan):

`isapres.metaTitle`:
```ts
    metaTitle: 'Peritajes de Segunda Opinión para Isapres — ConectaMente Peritajes',
```

`isapres.heroTitle`:
```ts
    heroTitle:
      'Peritaje médico-legal de segunda opinión para su contraloría, con la capacidad que un caso complejo necesita.',
```

`compin.metaTitle`:
```ts
    metaTitle: 'Peritajes de Segunda Opinión para COMPIN — ConectaMente Peritajes',
```

`empresas.metaTitle`:
```ts
    metaTitle: 'Peritajes de Segunda Opinión para Empresas — ConectaMente Peritajes',
```

`seguros.metaTitle`:
```ts
    metaTitle: 'Peritajes de Segunda Opinión para Aseguradoras — ConectaMente Peritajes',
```

`seguros.metaDescription`:
```ts
    metaDescription:
      'Peritaje médico-legal de segunda opinión con evidencia clínica defendible y trazabilidad de extremo a extremo.',
```

`seguros.heroTitle`:
```ts
    heroTitle:
      'Peritaje médico-legal de segunda opinión, con la evidencia que un contexto de riesgo requiere.',
```

`seguros.ctaTitle`:
```ts
    ctaTitle: '¿Quiere conversar sobre un proceso de peritaje para su aseguradora?',
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run lib/segments-data.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Update `app/nosotros/page.tsx`**

Modify the `metadata` export:

```tsx
export const metadata: Metadata = {
  title: 'Nosotros — ConectaMente Peritajes',
  description:
    'Equipo 100% acreditado ante la Superintendencia de Salud, especializado en peritajes médico-legales de segunda opinión sobre licencias.',
}
```

Modify the body-copy paragraph (around line 20) — replace "ConectaMente Auditoría" with "ConectaMente Peritajes" and "una segunda revisión de licencias médicas" with a phrase naming the service directly:

```tsx
        <p>
          ConectaMente Peritajes nace para responder a una necesidad concreta de isapres, COMPIN,
          empresas y aseguradoras: peritajes de segunda opinión sobre licencias médicas, con
          rigor clínico, respaldo regulatorio y visibilidad del proceso de principio a fin.
        </p>
```

Modify the final CTA heading (around line 53) — same wording change as Task 2's Home CTA, for consistency across the site:

```tsx
        <h2 className="mx-auto max-w-2xl text-2xl font-bold">
          ¿Su organización necesita un peritaje médico-legal con capacidad real de volumen?
        </h2>
```

(`app/nosotros/page.test.tsx` asserts on the H1 "Nosotros", the aggregate accreditation sentence, and the `#politica-de-datos` anchor content — none of those strings are touched by this step, so no test change is needed here.)

- [ ] **Step 6: Update `app/proveedor/page.tsx`**

Modify the `metadata` export's `title` only:

```tsx
export const metadata: Metadata = {
  title: 'Ficha de Proveedor — ConectaMente Peritajes',
  description:
    'Ficha descargable con RUT, certificaciones y especialidades cubiertas, para procesos de compras públicas.',
}
```

- [ ] **Step 7: Update `app/contacto/page.tsx`'s metadata title**

Modify only the `metadata.title` (the `ConsultaTipo` default-value assertion in this file's test is handled in Task 4, not here):

```tsx
export const metadata: Metadata = {
  title: 'Contacto — ConectaMente Peritajes',
  description: 'Conversemos sobre su organización. Respondemos en menos de 24 horas hábiles.',
}
```

- [ ] **Step 8: Update `app/tecnologia/page.tsx`'s body copy**

Modify the hero paragraph (around line 28) — swap the single generic use of "auditoría" for "peritaje" so the page's own body copy doesn't contradict the rest of the rebranded site:

```tsx
        <p className="mt-4 text-lg text-inkSecondary">
          La plataforma que sostiene cada peritaje — no una promesa, algo que usted puede ver
          funcionando.
        </p>
```

(`app/tecnologia/page.test.tsx` asserts on the H1 "ConectaMente Core", the 3 capability strings, and the comparison-table headings — none reference this hero paragraph, so no test change is needed.)

- [ ] **Step 9: Update `README.md`**

Modify the title and the domain references throughout (title, opening paragraph, and every mention of `auditoria.conectamente.cl` in the "Setup manual del VPS" section):

```markdown
# ConectaMente Peritajes — Sitio Web Institucional

Sitio web institucional B2B/B2G para ConectaMente Peritajes, en `peritajes.conectamente.cl`.
Proyecto separado de ConectaMente Core (`app.conectamente.cl`) — sin código, base de datos
ni autenticación compartida.
```

And in the "Setup manual del VPS" numbered list, item 1 and item 3:

```markdown
1. Confirmar que `peritajes.conectamente.cl` tiene un registro A apuntando a la IP del VPS
   (ya verificado como resuelto al momento de este rebrand — reconfirmar si ha pasado tiempo).
2. Crear el directorio del proyecto en el VPS y clonar el repo ahí.
3. Agregar un server block de Nginx para `peritajes.conectamente.cl` proxy-pasando al puerto
   `3200` (el mismo patrón que ya usa el server block de Core hacia el puerto `3100`, solo con
   otro `server_name` y otro `proxy_pass`).
4. Emitir el certificado SSL para el nuevo subdominio (`certbot --nginx -d peritajes.conectamente.cl`).
5. Agregar los secrets del repo listados arriba en GitHub.
6. Hacer push a `main` para disparar el primer deploy.
```

- [ ] **Step 10: Run the full suite and build**

Run: `npm test`
Expected: PASS (82/82).

Run: `npm run build`
Expected: SUCCESS.

- [ ] **Step 11: Commit**

```bash
git add lib/segments-data.ts lib/segments-data.test.ts app/nosotros/page.tsx app/proveedor/page.tsx app/contacto/page.tsx app/tecnologia/page.tsx README.md
git commit -m "rebrand: segment metadata, nosotros/proveedor/contacto/tecnologia copy, README"
```

---

### Task 4: Rename the `auditoria` consulta-tipo to `peritajes`

**Files:**
- Modify: `lib/contact-schema.ts`
- Modify: `lib/contact-schema.test.ts`
- Modify: `app/contacto/ContactForm.tsx`
- Modify: `app/contacto/ContactForm.test.tsx`
- Modify: `app/contacto/page.test.tsx`

**Interfaces:**
- `ConsultaTipo`'s member `'auditoria'` is renamed to `'peritajes'`. This is the only type-level (not just copy) change in the whole rebrand — the contact form's default "tipo de consulta" value, used both as the `ContactForm`'s fallback when no valid `?tipo=` query param is present and as the value the `/api/contacto` route (Task 12 of the original plan, unchanged by this task) accepts via `isConsultaTipo`. No other `ConsultaTipo` member (`isapres`/`compin`/`empresas`/`seguros`/`otro`) changes.

- [ ] **Step 1: Update the failing contact-schema test**

Modify `lib/contact-schema.test.ts` — the `isConsultaTipo` "accepts every known type" test currently loops over a list including `'auditoria'`; update that one entry:

```ts
describe('isConsultaTipo', () => {
  it('accepts every known type', () => {
    for (const tipo of ['peritajes', 'isapres', 'compin', 'empresas', 'seguros', 'otro']) {
      expect(isConsultaTipo(tipo)).toBe(true)
    }
  })

  it('rejects an unknown type', () => {
    expect(isConsultaTipo('inventado')).toBe(false)
  })
})
```

(The `validateContactForm` tests in this file use a `validInput` fixture with `tipo: 'isapres'`, not `'auditoria'` — confirmed by reading the file before writing this plan — so no other test in it needs a change.)

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run lib/contact-schema.test.ts`
Expected: FAIL — `isConsultaTipo('peritajes')` returns `false` because `'peritajes'` isn't yet a member of `CONSULTA_TIPOS`.

- [ ] **Step 3: Update `lib/contact-schema.ts`**

Modify the `ConsultaTipo` type and the `CONSULTA_TIPOS` array's first entry:

```ts
export type ConsultaTipo = 'peritajes' | 'isapres' | 'compin' | 'empresas' | 'seguros' | 'otro'

export const CONSULTA_TIPOS: { value: ConsultaTipo; label: string }[] = [
  { value: 'peritajes', label: 'Peritajes de Segunda Opinión' },
  { value: 'isapres', label: 'Isapres' },
  { value: 'compin', label: 'COMPIN' },
  { value: 'empresas', label: 'Empresas' },
  { value: 'seguros', label: 'Seguros' },
  { value: 'otro', label: 'Otro' },
]
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run lib/contact-schema.test.ts`
Expected: PASS.

- [ ] **Step 5: Update the failing ContactForm tests**

Modify `app/contacto/ContactForm.test.tsx` — the two tests referencing `'auditoria'`:

```tsx
  it('falls back to "peritajes" when initialTipo is missing or invalid', () => {
    render(<ContactForm initialTipo="no-existe" />)
    expect(screen.getByLabelText('Tipo de consulta')).toHaveValue('peritajes')
  })
```

(This replaces the existing test with that same intent — find it by its current title `falls back to "auditoria" when initialTipo is missing or invalid` and its body which currently reads `expect(screen.getByLabelText('Tipo de consulta')).toHaveValue('auditoria')`.)

- [ ] **Step 6: Run it to verify it fails**

Run: `npx vitest run app/contacto/ContactForm.test.tsx`
Expected: FAIL — `ContactForm`'s fallback is still the literal `'auditoria'`, which is no longer a valid `ConsultaTipo` after Step 3, so `isConsultaTipo` now also rejects the component's own hardcoded fallback if it isn't updated.

- [ ] **Step 7: Update `app/contacto/ContactForm.tsx`'s fallback**

Modify the `defaultTipo` line:

```tsx
  const defaultTipo: ConsultaTipo =
    initialTipo && isConsultaTipo(initialTipo) ? initialTipo : 'peritajes'
```

- [ ] **Step 8: Run it to verify it passes**

Run: `npx vitest run app/contacto/ContactForm.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 9: Update the failing Contacto page test**

Modify `app/contacto/page.test.tsx`'s second test:

```tsx
  it('defaults the form when there is no tipo query param', async () => {
    const ui = await ContactoPage({ searchParams: Promise.resolve({}) })
    render(ui)
    expect(screen.getByLabelText('Tipo de consulta')).toHaveValue('peritajes')
  })
```

- [ ] **Step 10: Run it to verify it passes**

Run: `npx vitest run app/contacto/page.test.tsx`
Expected: PASS (2 tests) — this test file's other test (passing `tipo: 'compin'` via searchParams) is unaffected, since `'compin'` was never renamed.

- [ ] **Step 11: Run the full suite and build**

Run: `npm test`
Expected: PASS (82/82).

Run: `npm run build`
Expected: SUCCESS.

- [ ] **Step 12: Commit**

```bash
git add lib/contact-schema.ts lib/contact-schema.test.ts app/contacto/ContactForm.tsx app/contacto/ContactForm.test.tsx app/contacto/page.test.tsx
git commit -m "rebrand: rename the default consulta-tipo from auditoria to peritajes"
```

---

## Self-Review Notes

- **Spec coverage:** every file the spec's "Archivos afectados" section names is covered by a task — domain/config (Task 1), the route rename + Home (Task 2), segment metadata + remaining pages + README (Task 3). The `ConsultaTipo` rename (Task 4) and the `/tecnologia` body-copy word swap (Task 3, Step 8) were not explicitly named in the spec's file list but are within its stated intent (terminology consistency) — both are flagged inline in their task as extensions discovered while auditing the codebase for every live "auditoría" occurrence before writing this plan, not scope creep beyond what the user approved (a terminology swap, applied completely rather than partially).
- **Placeholder scan:** no TBD/TODO; every step shows the exact resulting code or the exact before/after string.
- **Type consistency:** `ServicioPeritajesPage` (Task 2) is a default export, never imported by name elsewhere, so its rename cannot break any other file. `ConsultaTipo`'s `'peritajes'` member (Task 4) is checked against every consumer found via full-project search: `lib/contact-schema.ts` (definition), `app/contacto/ContactForm.tsx` (fallback), `app/api/contacto/route.ts` (uses `isConsultaTipo`, a function whose behavior — not literal values — it depends on, so it needs no change), and the three test files. `SegmentContent`'s `slug` field values (`isapres`/`compin`/`empresas`/`seguros`) are untouched by this whole plan, so `SegmentLanding.tsx`'s `/contacto?tipo=${content.slug}` CTA links are unaffected.
- **Verified against the live codebase, not assumed:** every "auditoría"/"Auditoría" occurrence in `app/`, `components/`, and `lib/` was located via `grep -rniE "auditor[ií]a"` before this plan was written (not from memory of the original plan) — the two instances the original design spec assumed wouldn't exist (`/tecnologia`'s hero paragraph, `/nosotros`'s CTA heading) were caught this way and folded into Task 3 rather than silently left inconsistent.

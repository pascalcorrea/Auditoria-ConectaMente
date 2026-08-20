# Sitio Web Institucional (auditoria.conectamente.cl) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the 9-page institutional marketing website for ConectaMente Auditoría (B2B/B2G credentials site for isapres, COMPIN, empresas, seguros) as a brand-new Next.js project, separate from the ConectaMente Core app.

**Architecture:** Next.js 15 App Router + TypeScript + Tailwind, mostly static/SSG pages, no database, no auth. Design tokens are ported (not copied wholesale) from the real `E:\Dev\ConectaMente-2` public site. Segment landing pages (`/segmentos/*`) are data-driven off a single dynamic route to avoid duplicating four nearly-identical page files. The one interactive piece is the `/contacto` form, which posts to a local API route that calls the Brevo transactional email API server-side.

**Tech Stack:** Next.js ^15.0.0, React ^19.0.0, TypeScript, Tailwind CSS ^3.4.0, lucide-react (icons), Vitest + Testing Library (already the pattern used by the sibling Core repo).

**Reference spec:** `docs/superpowers/specs/2026-08-20-sitio-web-institucional-design.md`

## Global Constraints

- **New project, new repo.** Local path `E:\Dev\Web-ConectaMente-Auditoria`, new GitHub repo, no shared code/DB/auth with this repo (Core). All commands in this plan assume the working directory is `E:\Dev\Web-ConectaMente-Auditoria` unless stated otherwise.
- **No database, no authentication.** Static content + one form-submission API route only.
- **No public pricing on any page** (explicit rule from doc `01_Web_Estructura_ConectaMente_Auditoria.md`).
- **Design tokens must match the real extracted values** — do not invent colors/fonts. Source of truth: `E:\Dev\ConectaMente-2\app\globals.css` (see spec's "Sistema de diseño" section for the full extracted value list).
- **All UI copy in Spanish (es-CL)**, matching the tone in docs `01`, `04`, `05` — institutional/capacity register, not the B2C warmth register of the clinical site.
- **Deploy target:** same VPS Hostinger as Core, independent PM2 process on port **3200**, independent Nginx vhost for `auditoria.conectamente.cl`, independent GitHub Actions workflow and repo secrets — nothing in this plan modifies Core's deploy pipeline, PM2 process, or port 3100.
- **Creating the GitHub repo and pushing to it is a shared/visible action** — confirm repo name and visibility (private recommended) with the user before running `gh repo create` or the first `git push`, per the project's standing risk policy.
- **Applying the Nginx vhost / DNS / SSL on the live VPS is out of scope for autonomous execution** — Task 15 produces the config files and documents the exact commands in the README; actually running them against the shared VPS needs explicit user confirmation in a follow-up step, not blind execution during this plan.

---

### Task 1: Project scaffolding, design tokens, and test harness

**Files:**
- Create: `E:\Dev\Web-ConectaMente-Auditoria\package.json`
- Create: `E:\Dev\Web-ConectaMente-Auditoria\tsconfig.json`
- Create: `E:\Dev\Web-ConectaMente-Auditoria\next.config.ts`
- Create: `E:\Dev\Web-ConectaMente-Auditoria\postcss.config.js`
- Create: `E:\Dev\Web-ConectaMente-Auditoria\.eslintrc.json`
- Create: `E:\Dev\Web-ConectaMente-Auditoria\.gitignore`
- Create: `E:\Dev\Web-ConectaMente-Auditoria\.env.example`
- Create: `E:\Dev\Web-ConectaMente-Auditoria\vitest.config.ts`
- Create: `E:\Dev\Web-ConectaMente-Auditoria\vitest.setup.ts`
- Create: `E:\Dev\Web-ConectaMente-Auditoria\lib\design-tokens.ts`
- Test: `E:\Dev\Web-ConectaMente-Auditoria\lib\design-tokens.test.ts`
- Create: `E:\Dev\Web-ConectaMente-Auditoria\tailwind.config.ts`
- Create: `E:\Dev\Web-ConectaMente-Auditoria\app\globals.css`
- Create: `E:\Dev\Web-ConectaMente-Auditoria\app\layout.tsx`
- Create: `E:\Dev\Web-ConectaMente-Auditoria\app\page.tsx` (temporary placeholder — fully replaced in Task 5)

**Interfaces:**
- Produces: `colors` (`Record<string, string>`) and `fontFamily` (`{ sans: string[] }`) exported from `lib/design-tokens.ts` — every later component/page uses Tailwind classes derived from these keys (`primary`, `primaryDark`, `primaryLight`, `primarySubtle`, `page`, `ink`, `inkSecondary`, `inkMuted`, `border`, `borderLight`).
- Produces: path alias `@/*` → project root (same convention as Core), used by every subsequent import.

- [ ] **Step 1: Create the project directory and write the failing design-tokens test**

Run: `mkdir -p "E:\Dev\Web-ConectaMente-Auditoria\lib"`

Create `E:\Dev\Web-ConectaMente-Auditoria\lib\design-tokens.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { colors, fontFamily } from './design-tokens'

describe('design-tokens', () => {
  it('matches the real palette extracted from ConectaMente-2/app/globals.css', () => {
    expect(colors.primary).toBe('#2C7F66')
    expect(colors.primaryDark).toBe('#1F5C4B')
    expect(colors.primaryLight).toBe('#EBF5F0')
    expect(colors.primarySubtle).toBe('#F5FAF7')
    expect(colors.page).toBe('#FAFBFC')
    expect(colors.ink).toBe('#1A1A2E')
    expect(colors.inkSecondary).toBe('#5F6B7A')
    expect(colors.inkMuted).toBe('#9CA3AF')
    expect(colors.border).toBe('#E5E7EB')
    expect(colors.borderLight).toBe('#F0F1F3')
  })

  it('uses the system font stack, not a webfont', () => {
    expect(fontFamily.sans[0]).toBe('-apple-system')
  })
})
```

This can't run yet — there's no test runner wired up and no `design-tokens.ts`. The rest of this task wires up the project so this test can execute and pass.

- [ ] **Step 2: Write `package.json`**

Create `E:\Dev\Web-ConectaMente-Auditoria\package.json`:

```json
{
  "name": "web-conectamente-auditoria",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run"
  },
  "dependencies": {
    "lucide-react": "^0.469.0",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^7.0.1",
    "@testing-library/react": "^16.3.2",
    "@testing-library/user-event": "^14.5.2",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^6.0.5",
    "autoprefixer": "^10.0.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^15.0.0",
    "jsdom": "^30.0.1",
    "postcss": "^8.0.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.0.0",
    "vitest": "^4.1.11"
  }
}
```

- [ ] **Step 3: Write the remaining config files**

Create `E:\Dev\Web-ConectaMente-Auditoria\tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Create `E:\Dev\Web-ConectaMente-Auditoria\next.config.ts`:

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {}

export default nextConfig
```

Create `E:\Dev\Web-ConectaMente-Auditoria\postcss.config.js`:

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

Create `E:\Dev\Web-ConectaMente-Auditoria\.eslintrc.json`:

```json
{
  "extends": ["next/core-web-vitals", "next/typescript"]
}
```

Create `E:\Dev\Web-ConectaMente-Auditoria\.gitignore`:

```
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.*
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/versions

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# env files (can opt-in for committing if needed)
.env
.env.*
!.env.example

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
```

Create `E:\Dev\Web-ConectaMente-Auditoria\.env.example`:

```
BREVO_API_KEY=
CONTACT_NOTIFICATION_EMAIL=
```

Create `E:\Dev\Web-ConectaMente-Auditoria\vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
```

Create `E:\Dev\Web-ConectaMente-Auditoria\vitest.setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 4: Install dependencies**

Run (from `E:\Dev\Web-ConectaMente-Auditoria`): `npm install`
Expected: installs without errors, creates `package-lock.json` and `node_modules/`.

- [ ] **Step 5: Write `lib/design-tokens.ts` and confirm the Step-1 test passes**

Create `E:\Dev\Web-ConectaMente-Auditoria\lib\design-tokens.ts`:

```ts
export const colors = {
  primary: '#2C7F66',
  primaryDark: '#1F5C4B',
  primaryLight: '#EBF5F0',
  primarySubtle: '#F5FAF7',
  page: '#FAFBFC',
  ink: '#1A1A2E',
  inkSecondary: '#5F6B7A',
  inkMuted: '#9CA3AF',
  border: '#E5E7EB',
  borderLight: '#F0F1F3',
} as const

export const fontFamily = {
  sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'sans-serif'],
}
```

Run: `npx vitest run lib/design-tokens.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Write `tailwind.config.ts` and `app/globals.css`**

Create `E:\Dev\Web-ConectaMente-Auditoria\tailwind.config.ts`:

```ts
import type { Config } from 'tailwindcss'
import { colors, fontFamily } from './lib/design-tokens'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: { colors, fontFamily },
  },
  plugins: [],
}

export default config
```

Create `E:\Dev\Web-ConectaMente-Auditoria\app\globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 7: Write the root layout and a temporary home page**

Create `E:\Dev\Web-ConectaMente-Auditoria\app\layout.tsx`:

```tsx
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'ConectaMente Auditoría — Auditoría médico-legal de licencias',
    template: '%s',
  },
  description:
    'Auditoría médico-legal de licencias con trazabilidad y cumplimiento normativo, a la escala que su organización necesita.',
  metadataBase: new URL('https://auditoria.conectamente.cl'),
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-page font-sans text-ink antialiased">{children}</body>
    </html>
  )
}
```

Create `E:\Dev\Web-ConectaMente-Auditoria\app\page.tsx` (temporary — Task 5 replaces this with the real home page):

```tsx
export default function HomePage() {
  return <main className="p-10">ConectaMente Auditoría — en construcción.</main>
}
```

- [ ] **Step 8: Verify the app builds and all tests pass**

Run: `npm run build`
Expected: build succeeds, no type errors.

Run: `npm test`
Expected: PASS (the 2 design-tokens tests).

- [ ] **Step 9: Initialize git, create the GitHub repo, and push**

**Confirm with the user first:** the exact repo name (suggested: `web-conectamente-auditoria`) and whether it should be private or public, before running `gh repo create` or pushing — this creates a new artifact visible outside this session.

```bash
cd "E:/Dev/Web-ConectaMente-Auditoria"
git init
git add -A
git commit -m "chore: scaffold Next.js project with design tokens and test harness"
gh repo create web-conectamente-auditoria --private --source=. --remote=origin
git push -u origin main
```

---

### Task 2: UI primitives — Button, Card, StatCard

**Files:**
- Create: `E:\Dev\Web-ConectaMente-Auditoria\components\ui\Button.tsx`
- Test: `E:\Dev\Web-ConectaMente-Auditoria\components\ui\Button.test.tsx`
- Create: `E:\Dev\Web-ConectaMente-Auditoria\components\ui\Card.tsx`
- Test: `E:\Dev\Web-ConectaMente-Auditoria\components\ui\Card.test.tsx`
- Create: `E:\Dev\Web-ConectaMente-Auditoria\components\ui\StatCard.tsx`
- Test: `E:\Dev\Web-ConectaMente-Auditoria\components\ui\StatCard.test.tsx`

**Interfaces:**
- Consumes: `@/lib/design-tokens` Tailwind classes (`bg-primary`, `text-primaryDark`, etc. from Task 1).
- Produces: `Button({ href, variant?: 'primary' | 'outline' | 'inverse', external?: boolean, children })`, `Card({ title, badge?, children })`, `StatCard({ label, value })` — used by every page task from Task 5 onward.

- [ ] **Step 1: Write the failing Button test**

Create `components/ui/Button.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders an internal link with the primary style by default', () => {
    render(<Button href="/contacto">Conversemos</Button>)
    const link = screen.getByRole('link', { name: 'Conversemos' })
    expect(link).toHaveAttribute('href', '/contacto')
    expect(link.className).toContain('bg-primary')
  })

  it('renders an external link when external is true', () => {
    render(
      <Button href="https://app.conectamente.cl" external>
        Portal
      </Button>
    )
    const link = screen.getByRole('link', { name: 'Portal' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('applies the outline style when variant is outline', () => {
    render(
      <Button href="/contacto" variant="outline">
        Ver más
      </Button>
    )
    expect(screen.getByRole('link', { name: 'Ver más' }).className).toContain('border')
  })

  it('applies the inverse style when variant is inverse', () => {
    render(
      <Button href="/contacto" variant="inverse">
        Conversemos
      </Button>
    )
    expect(screen.getByRole('link', { name: 'Conversemos' }).className).toContain('bg-white')
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run components/ui/Button.test.tsx`
Expected: FAIL — cannot find module `./Button`.

- [ ] **Step 3: Implement `Button`**

Create `components/ui/Button.tsx`:

```tsx
import Link from 'next/link'
import type { ReactNode } from 'react'

type ButtonVariant = 'primary' | 'outline' | 'inverse'

interface ButtonProps {
  href: string
  variant?: ButtonVariant
  external?: boolean
  children: ReactNode
}

const base =
  'inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primaryDark',
  outline: 'border border-border text-inkSecondary hover:border-primary hover:text-primary',
  inverse: 'bg-white text-primary hover:bg-primarySubtle',
}

export function Button({ href, variant = 'primary', external = false, children }: ButtonProps) {
  const className = `${base} ${variants[variant]}`

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    )
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run components/ui/Button.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Write the failing Card test**

Create `components/ui/Card.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card } from './Card'

describe('Card', () => {
  it('renders the title and children', () => {
    render(<Card title="Auditoría de Licencias">Contenido</Card>)
    expect(screen.getByText('Auditoría de Licencias')).toBeInTheDocument()
    expect(screen.getByText('Contenido')).toBeInTheDocument()
  })

  it('renders a badge when provided', () => {
    render(
      <Card title="Peritajes" badge="Próximamente">
        Contenido
      </Card>
    )
    expect(screen.getByText('Próximamente')).toBeInTheDocument()
  })

  it('omits the badge when not provided', () => {
    render(<Card title="Auditoría">Contenido</Card>)
    expect(screen.queryByText('Próximamente')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npx vitest run components/ui/Card.test.tsx`
Expected: FAIL — cannot find module `./Card`.

- [ ] **Step 7: Implement `Card`**

Create `components/ui/Card.tsx`:

```tsx
import type { ReactNode } from 'react'

interface CardProps {
  title: string
  badge?: string
  children: ReactNode
}

export function Card({ title, badge, children }: CardProps) {
  return (
    <div className="rounded-xl border border-border bg-white p-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
        {badge && (
          <span className="rounded-full bg-primaryLight px-3 py-1 text-xs font-medium text-primaryDark">
            {badge}
          </span>
        )}
      </div>
      <div className="text-sm text-inkSecondary">{children}</div>
    </div>
  )
}
```

- [ ] **Step 8: Run it to verify it passes**

Run: `npx vitest run components/ui/Card.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 9: Write the failing StatCard test**

Create `components/ui/StatCard.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatCard } from './StatCard'

describe('StatCard', () => {
  it('renders the label and value', () => {
    render(<StatCard label="Cobertura" value="Nacional" />)
    expect(screen.getByText('Cobertura')).toBeInTheDocument()
    expect(screen.getByText('Nacional')).toBeInTheDocument()
  })
})
```

- [ ] **Step 10: Run it to verify it fails**

Run: `npx vitest run components/ui/StatCard.test.tsx`
Expected: FAIL — cannot find module `./StatCard`.

- [ ] **Step 11: Implement `StatCard`**

Create `components/ui/StatCard.tsx`:

```tsx
interface StatCardProps {
  label: string
  value: string
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-white p-6 text-center">
      <div className="text-lg font-semibold text-primary">{value}</div>
      <div className="mt-1 text-sm text-inkSecondary">{label}</div>
    </div>
  )
}
```

- [ ] **Step 12: Run all three test files to verify they pass**

Run: `npx vitest run components/ui`
Expected: PASS (9 tests total).

- [ ] **Step 13: Commit**

```bash
git add components/ui
git commit -m "feat: add Button, Card, and StatCard UI primitives"
```

---

### Task 3: DashboardPlaceholder component

**Files:**
- Create: `E:\Dev\Web-ConectaMente-Auditoria\components\marketing\DashboardPlaceholder.tsx`
- Test: `E:\Dev\Web-ConectaMente-Auditoria\components\marketing\DashboardPlaceholder.test.tsx`

**Interfaces:**
- Produces: `DashboardPlaceholder({ label?: string })` — a placeholder box standing in for the ConectaMente Core dashboard screenshots the user is producing separately in Claude Design (per the spec's explicit decision to defer real screenshots). Used by the Home, Servicio-Auditoría, and Tecnología pages (Tasks 5, 6, 9).

- [ ] **Step 1: Write the failing test**

Create `components/marketing/DashboardPlaceholder.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DashboardPlaceholder } from './DashboardPlaceholder'

describe('DashboardPlaceholder', () => {
  it('renders the default label', () => {
    render(<DashboardPlaceholder />)
    expect(screen.getByText('Mockup del dashboard — pendiente')).toBeInTheDocument()
  })

  it('renders a custom label when provided', () => {
    render(<DashboardPlaceholder label="Mockup: panel de cumplimiento — pendiente" />)
    expect(screen.getByText('Mockup: panel de cumplimiento — pendiente')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run components/marketing/DashboardPlaceholder.test.tsx`
Expected: FAIL — cannot find module `./DashboardPlaceholder`.

- [ ] **Step 3: Implement `DashboardPlaceholder`**

Create `components/marketing/DashboardPlaceholder.tsx`:

```tsx
import { LayoutDashboard } from 'lucide-react'

interface DashboardPlaceholderProps {
  label?: string
}

export function DashboardPlaceholder({
  label = 'Mockup del dashboard — pendiente',
}: DashboardPlaceholderProps) {
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-primarySubtle text-inkMuted">
      <LayoutDashboard size={32} />
      <span className="text-sm font-medium">{label}</span>
    </div>
  )
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run components/marketing/DashboardPlaceholder.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add components/marketing/DashboardPlaceholder.tsx components/marketing/DashboardPlaceholder.test.tsx
git commit -m "feat: add DashboardPlaceholder for the deferred Core screenshots"
```

---

### Task 4: Header and Footer, wired into the root layout

**Files:**
- Create: `E:\Dev\Web-ConectaMente-Auditoria\components\layout\Header.tsx`
- Test: `E:\Dev\Web-ConectaMente-Auditoria\components\layout\Header.test.tsx`
- Create: `E:\Dev\Web-ConectaMente-Auditoria\components\layout\Footer.tsx`
- Test: `E:\Dev\Web-ConectaMente-Auditoria\components\layout\Footer.test.tsx`
- Modify: `E:\Dev\Web-ConectaMente-Auditoria\app\layout.tsx` (from Task 1 — add `<Header />` / `<Footer />` around `children`)

**Interfaces:**
- Consumes: `Button` from Task 2.
- Produces: `Header()`, `Footer()` — rendered once, globally, by `app/layout.tsx`. No props; every page just renders inside `<main>`.

- [ ] **Step 1: Write the failing Header test**

Create `components/layout/Header.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Header } from './Header'

describe('Header', () => {
  it('renders the main nav links', () => {
    render(<Header />)
    expect(screen.getByRole('link', { name: 'Servicio' })).toHaveAttribute(
      'href',
      '/servicio-auditoria'
    )
    expect(screen.getByRole('link', { name: 'Tecnología' })).toHaveAttribute('href', '/tecnologia')
    expect(screen.getByRole('link', { name: 'Nosotros' })).toHaveAttribute('href', '/nosotros')
    expect(screen.getByRole('link', { name: 'Contacto' })).toHaveAttribute('href', '/contacto')
  })

  it('links the Portal item to the Core app', () => {
    render(<Header />)
    expect(screen.getByRole('link', { name: /Portal/ })).toHaveAttribute(
      'href',
      'https://app.conectamente.cl'
    )
  })

  it('reveals the segment links on hover and hides them on mouse leave', () => {
    render(<Header />)
    expect(screen.queryByRole('link', { name: 'Isapres' })).not.toBeInTheDocument()

    const trigger = screen.getByText('Segmentos').closest('div')!
    fireEvent.mouseEnter(trigger)
    expect(screen.getByRole('link', { name: 'Isapres' })).toHaveAttribute(
      'href',
      '/segmentos/isapres'
    )

    fireEvent.mouseLeave(trigger)
    expect(screen.queryByRole('link', { name: 'Isapres' })).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run components/layout/Header.test.tsx`
Expected: FAIL — cannot find module `./Header`.

- [ ] **Step 3: Implement `Header`**

Create `components/layout/Header.tsx`:

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const segmentLinks = [
  { href: '/segmentos/isapres', label: 'Isapres' },
  { href: '/segmentos/compin', label: 'COMPIN' },
  { href: '/segmentos/empresas', label: 'Empresas' },
  { href: '/segmentos/seguros', label: 'Seguros' },
]

export function Header() {
  const [segmentsOpen, setSegmentsOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold text-ink">
          ConectaMente <span className="text-primary">Auditoría</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-inkSecondary md:flex">
          <Link href="/servicio-auditoria" className="hover:text-primary">
            Servicio
          </Link>

          <div
            className="relative"
            onMouseEnter={() => setSegmentsOpen(true)}
            onMouseLeave={() => setSegmentsOpen(false)}
          >
            <button type="button" className="flex items-center gap-1 hover:text-primary">
              Segmentos
              <ChevronDown size={14} />
            </button>
            {segmentsOpen && (
              <div className="absolute left-0 top-full w-48 rounded-lg border border-border bg-white py-2 shadow-lg">
                {segmentLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block px-4 py-2 hover:bg-primaryLight hover:text-primaryDark"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link href="/tecnologia" className="hover:text-primary">
            Tecnología
          </Link>
          <Link href="/nosotros" className="hover:text-primary">
            Nosotros
          </Link>
          <Link href="/contacto" className="hover:text-primary">
            Contacto
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <a
            href="https://app.conectamente.cl"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1 text-sm font-medium text-inkSecondary hover:text-primary md:flex"
          >
            Portal <ExternalLink size={14} />
          </a>
          <Button href="/contacto">Conversemos</Button>
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run components/layout/Header.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Write the failing Footer test**

Create `components/layout/Footer.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Footer } from './Footer'

describe('Footer', () => {
  it('links "Política de tratamiento de datos" to the Nosotros anchor', () => {
    render(<Footer />)
    expect(
      screen.getByRole('link', { name: 'Política de tratamiento de datos' })
    ).toHaveAttribute('href', '/nosotros#politica-de-datos')
  })

  it('renders the current year in the copyright line', () => {
    render(<Footer />)
    expect(screen.getByText(new RegExp(String(new Date().getFullYear())))).toBeInTheDocument()
  })

  it('renders a segment link for each of the four segments', () => {
    render(<Footer />)
    expect(screen.getByRole('link', { name: 'Isapres' })).toHaveAttribute(
      'href',
      '/segmentos/isapres'
    )
    expect(screen.getByRole('link', { name: 'COMPIN' })).toHaveAttribute(
      'href',
      '/segmentos/compin'
    )
  })
})
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npx vitest run components/layout/Footer.test.tsx`
Expected: FAIL — cannot find module `./Footer`.

- [ ] **Step 7: Implement `Footer`**

Create `components/layout/Footer.tsx`:

```tsx
import Link from 'next/link'

const columns = [
  {
    title: 'Servicio',
    links: [
      { href: '/servicio-auditoria', label: 'Auditoría de Licencias' },
      { href: '/tecnologia', label: 'Tecnología' },
      { href: '/proveedor', label: 'Ficha de proveedor' },
    ],
  },
  {
    title: 'Segmentos',
    links: [
      { href: '/segmentos/isapres', label: 'Isapres' },
      { href: '/segmentos/compin', label: 'COMPIN' },
      { href: '/segmentos/empresas', label: 'Empresas' },
      { href: '/segmentos/seguros', label: 'Seguros' },
    ],
  },
  {
    title: 'Empresa',
    links: [
      { href: '/nosotros', label: 'Nosotros' },
      { href: '/contacto', label: 'Contacto' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <span className="text-lg font-semibold text-ink">
              ConectaMente <span className="text-primary">Auditoría</span>
            </span>
            <p className="mt-2 text-sm text-inkSecondary">
              Auditoría médico-legal de licencias con trazabilidad de extremo a extremo.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <span className="text-sm font-semibold text-ink">{col.title}</span>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-inkSecondary hover:text-primary">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-borderLight pt-6 text-xs text-inkMuted md:flex-row md:items-center">
          <span>Copyright © {new Date().getFullYear()} ConectaMente Auditoría</span>
          <Link href="/nosotros#politica-de-datos" className="hover:text-primary">
            Política de tratamiento de datos
          </Link>
          <span>contacto@conectamente.cl</span>
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 8: Run it to verify it passes**

Run: `npx vitest run components/layout/Footer.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 9: Wire Header and Footer into the root layout**

Modify `app/layout.tsx` (from Task 1) — replace the body's contents:

```tsx
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'ConectaMente Auditoría — Auditoría médico-legal de licencias',
    template: '%s',
  },
  description:
    'Auditoría médico-legal de licencias con trazabilidad y cumplimiento normativo, a la escala que su organización necesita.',
  metadataBase: new URL('https://auditoria.conectamente.cl'),
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

- [ ] **Step 10: Verify the full build still succeeds**

Run: `npm run build`
Expected: build succeeds (the temporary `app/page.tsx` from Task 1 now renders inside the real Header/Footer).

- [ ] **Step 11: Commit**

```bash
git add components/layout app/layout.tsx
git commit -m "feat: add Header and Footer, wire into root layout"
```

---

### Task 5: Home page (`/`)

**Files:**
- Modify: `E:\Dev\Web-ConectaMente-Auditoria\app\page.tsx` (replaces the Task 1 placeholder)
- Test: `E:\Dev\Web-ConectaMente-Auditoria\app\page.test.tsx`

**Interfaces:**
- Consumes: `Button`, `Card`, `StatCard` (Task 2), `DashboardPlaceholder` (Task 3).

- [ ] **Step 1: Write the failing test**

Create `app/page.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import HomePage from './page'

describe('HomePage', () => {
  it('renders the hero heading', () => {
    render(<HomePage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Auditoría médico-legal de licencias'
    )
  })

  it('renders the three service lines, with Peritajes and Interconsultoría marked as upcoming', () => {
    render(<HomePage />)
    expect(screen.getByText('Auditoría de Licencias Médicas')).toBeInTheDocument()
    expect(screen.getByText('Peritajes Médico-Legales')).toBeInTheDocument()
    expect(screen.getByText('Interconsultoría Institucional')).toBeInTheDocument()
    expect(screen.getAllByText('Próximamente')).toHaveLength(2)
  })

  it('links to the service page from the first service card', () => {
    render(<HomePage />)
    expect(screen.getByRole('link', { name: 'Conocer el servicio →' })).toHaveAttribute(
      'href',
      '/servicio-auditoria'
    )
  })

  it('renders the capacity metrics', () => {
    render(<HomePage />)
    expect(screen.getByText('Nacional')).toBeInTheDocument()
    expect(screen.getByText('Telemática')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run app/page.test.tsx`
Expected: FAIL — the placeholder home page doesn't have an `h1` or any of this content.

- [ ] **Step 3: Implement the real home page**

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
          Auditoría médico-legal de licencias, con la trazabilidad que su organización necesita.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-inkSecondary">
          Revisamos licencias médicas con rigor clínico y evidencia defendible — con visibilidad
          en tiempo real de cada caso, desde el ingreso hasta la entrega del informe firmado.
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
        <div className="grid gap-6 md:grid-cols-3">
          <Card title="Auditoría de Licencias Médicas">
            Revisión clínica, regulatoria y documental de licencias emitidas, caso a caso o en
            lote.
            <div className="mt-4">
              <Link
                href="/servicio-auditoria"
                className="text-sm font-semibold text-primary hover:text-primaryDark"
              >
                Conocer el servicio →
              </Link>
            </div>
          </Card>
          <Card title="Peritajes Médico-Legales" badge="Próximamente">
            Evaluaciones de invalidez, secuelas y nexo causal laboral.
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
              La única auditoría médico-legal en Chile con trazabilidad visible.
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
          ¿Su organización necesita una auditoría médico-legal con capacidad real de volumen?
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

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run app/page.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/page.test.tsx
git commit -m "feat: build the real home page"
```

---

### Task 6: Servicio de Auditoría page (`/servicio-auditoria`)

**Files:**
- Create: `E:\Dev\Web-ConectaMente-Auditoria\app\servicio-auditoria\page.tsx`
- Test: `E:\Dev\Web-ConectaMente-Auditoria\app\servicio-auditoria\page.test.tsx`

**Interfaces:**
- Consumes: `DashboardPlaceholder` (Task 3).

- [ ] **Step 1: Write the failing test**

Create `app/servicio-auditoria/page.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ServicioAuditoriaPage from './page'

describe('ServicioAuditoriaPage', () => {
  it('renders the page heading', () => {
    render(<ServicioAuditoriaPage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Auditoría de Licencias Médicas'
    )
  })

  it('renders the two delivery modalities', () => {
    render(<ServicioAuditoriaPage />)
    expect(screen.getByText('Caso a caso')).toBeInTheDocument()
    expect(screen.getByText('Lote masivo (Excel)')).toBeInTheDocument()
  })

  it('renders all 5 delivery timeline steps in order', () => {
    render(<ServicioAuditoriaPage />)
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
    render(<ServicioAuditoriaPage />)
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

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run app/servicio-auditoria/page.test.tsx`
Expected: FAIL — `app/servicio-auditoria/page.tsx` doesn't exist yet.

- [ ] **Step 3: Implement the page**

Create `app/servicio-auditoria/page.tsx`:

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { Stethoscope, ScrollText, Search } from 'lucide-react'
import { DashboardPlaceholder } from '@/components/marketing/DashboardPlaceholder'

export const metadata: Metadata = {
  title: 'Auditoría de Licencias Médicas — ConectaMente Auditoría',
  description:
    'Revisión clínica, regulatoria y documental de licencias médicas emitidas, caso a caso o en lote masivo.',
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

export default function ServicioAuditoriaPage() {
  return (
    <>
      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h1 className="text-4xl font-bold text-ink">Auditoría de Licencias Médicas</h1>
        <p className="mt-4 text-lg text-inkSecondary">
          Revisión clínica, regulatoria y documental de licencias emitidas — para instituciones
          que necesitan una segunda evaluación defendible.
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

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run app/servicio-auditoria/page.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add app/servicio-auditoria
git commit -m "feat: build the servicio-auditoria page"
```

---

### Task 7: Segment data and the `/segmentos/[segmento]` dynamic route

**Files:**
- Create: `E:\Dev\Web-ConectaMente-Auditoria\lib\segments-data.ts`
- Test: `E:\Dev\Web-ConectaMente-Auditoria\lib\segments-data.test.ts`
- Create: `E:\Dev\Web-ConectaMente-Auditoria\components\marketing\SegmentLanding.tsx`
- Test: `E:\Dev\Web-ConectaMente-Auditoria\components\marketing\SegmentLanding.test.tsx`
- Create: `E:\Dev\Web-ConectaMente-Auditoria\app\segmentos\[segmento]\page.tsx`
- Test: `E:\Dev\Web-ConectaMente-Auditoria\app\segmentos\[segmento]\page.test.tsx`

**Interfaces:**
- Produces: `SegmentSlug` (`'isapres' | 'compin' | 'empresas' | 'seguros'`), `segments: Record<SegmentSlug, SegmentContent>`, `segmentSlugs: SegmentSlug[]`, `isSegmentSlug(value: string): value is SegmentSlug` — all exported from `lib/segments-data.ts`. `isSegmentSlug` and `segmentSlugs` are also consumed by Task 12 (sitemap) and Task 4/6 nav links already hardcode the four hrefs, so slugs here must stay `isapres | compin | empresas | seguros`.
- Consumes: `Button` (Task 2).

- [ ] **Step 1: Write the failing segments-data test**

Create `lib/segments-data.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { segments, segmentSlugs, isSegmentSlug } from './segments-data'

describe('segments-data', () => {
  it('has exactly the four segments from the four/COMPIN/empresas/seguros docs', () => {
    expect(segmentSlugs).toEqual(['isapres', 'compin', 'empresas', 'seguros'])
  })

  it('gives every segment three reasons, hero copy, and a CTA', () => {
    for (const slug of segmentSlugs) {
      const content = segments[slug]
      expect(content.reasons).toHaveLength(3)
      expect(content.heroTitle.length).toBeGreaterThan(0)
      expect(content.ctaBody.length).toBeGreaterThan(0)
    }
  })

  it('reuses the exact Isapres copy from doc 05', () => {
    expect(segments.isapres.heroTitle).toBe(
      'Auditoría médico-legal para su contraloría, con la capacidad que un caso complejo necesita.'
    )
  })

  it('marks only the Seguros landing as pending review', () => {
    expect(segments.seguros.pendingReview).toBe(true)
    expect(segments.isapres.pendingReview).toBeUndefined()
    expect(segments.compin.pendingReview).toBeUndefined()
    expect(segments.empresas.pendingReview).toBeUndefined()
  })

  it('isSegmentSlug validates correctly', () => {
    expect(isSegmentSlug('isapres')).toBe(true)
    expect(isSegmentSlug('no-existe')).toBe(false)
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run lib/segments-data.test.ts`
Expected: FAIL — cannot find module `./segments-data`.

- [ ] **Step 3: Implement `segments-data.ts`**

Create `lib/segments-data.ts`:

```ts
export type SegmentSlug = 'isapres' | 'compin' | 'empresas' | 'seguros'

export interface SegmentReason {
  title: string
  body: string
}

export interface SegmentContent {
  slug: SegmentSlug
  label: string
  metaTitle: string
  metaDescription: string
  heroTitle: string
  heroBody: string
  reasons: SegmentReason[]
  howItWorks: string
  ctaTitle: string
  ctaBody: string
  pendingReview?: boolean
}

export const segments: Record<SegmentSlug, SegmentContent> = {
  isapres: {
    slug: 'isapres',
    label: 'Isapres',
    metaTitle: 'Auditoría de Licencias para Isapres — ConectaMente Auditoría',
    metaDescription:
      'Complementamos a su equipo de contraloría médica en los casos de mayor complejidad, con evidencia clínica defendible.',
    heroTitle:
      'Auditoría médico-legal para su contraloría, con la capacidad que un caso complejo necesita.',
    heroBody:
      'Complementamos a su equipo de contraloría médica en los casos de mayor complejidad — con evidencia clínica diseñada para sostenerse ante COMPIN, SUSESO o una eventual disputa.',
    reasons: [
      {
        title: '1. Evidencia clínica defendible, no solo una opinión',
        body: 'En un contexto de fiscalización activa (Ley 21.746), un informe débil no es solo un riesgo clínico — es un riesgo legal para la institución. Nuestros informes están construidos para resistir escrutinio.',
      },
      {
        title: '2. Capacidad para absorber volumen en casos complejos',
        body: 'Su contraloría interna no tiene por qué asumir sola cada caso psiquiátrico o de alta complejidad. Sumamos capacidad sin que su equipo pierda control del proceso.',
      },
      {
        title: '3. Trazabilidad completa, no una caja negra',
        body: 'Vea el estado de cada caso derivado, en tiempo real, desde nuestra plataforma — no tiene que esperar un correo para saber en qué va.',
      },
    ],
    howItWorks:
      'Deriva el caso, nosotros asignamos automáticamente al profesional adecuado, coordinamos la evaluación por videollamada, y usted recibe el informe firmado electrónicamente — con visibilidad del proceso completo en todo momento.',
    ctaTitle: '¿Quiere sumarnos a su panel de proveedores habilitados?',
    ctaBody: 'Conversemos sobre su isapre →',
  },
  compin: {
    slug: 'compin',
    label: 'COMPIN',
    metaTitle: 'Auditoría de Licencias para COMPIN — ConectaMente Auditoría',
    metaDescription:
      'Cobertura multi-región vía modalidad telemática para procesos que hoy quedan desiertos por falta de oferta.',
    heroTitle: 'Cobertura para los procesos que hoy quedan desiertos por falta de oferta.',
    heroBody:
      'Sumamos capacidad evaluadora en las regiones donde su oferta de especialistas no alcanza — con modalidad telemática que no depende de que haya un profesional disponible en la comuna del evaluado.',
    reasons: [
      {
        title: '1. Cobertura nacional real, no solo en el papel',
        body: 'Modalidad telemática que llega donde la oferta presencial de especialistas no cubre, sin que el proceso quede desierto por falta de evaluador disponible.',
      },
      {
        title: '2. Evidencia clínica que sostiene la resolución',
        body: 'Informes construidos para respaldar la decisión que finalmente adopte la comisión, con el mismo rigor que exige un contexto de fiscalización activa.',
      },
      {
        title: '3. Trazabilidad completa del proceso',
        body: 'Visibilidad en tiempo real del estado de cada caso derivado, sin depender de correos de seguimiento.',
      },
    ],
    howItWorks:
      'Deriva el caso a nuestra plataforma, asignamos automáticamente al profesional habilitado para esa especialidad y región, coordinamos la evaluación por videollamada, y la comisión recibe el informe firmado electrónicamente con trazabilidad completa.',
    ctaTitle: '¿Necesita cobertura adicional para procesos que hoy quedan desiertos?',
    ctaBody: 'Conversemos sobre su comisión →',
  },
  empresas: {
    slug: 'empresas',
    label: 'Empresas',
    metaTitle: 'Auditoría de Licencias para Empresas — ConectaMente Auditoría',
    metaDescription:
      'Respaldo clínico antes de derivar un caso a COMPIN o su isapre, para no denunciar sin fundamento.',
    heroTitle: 'Respaldo clínico antes de derivar un caso, para no denunciar sin fundamento.',
    heroBody:
      'Su empresa no puede invalidar una licencia por sí misma — pero tampoco debería derivar un caso a COMPIN o a la isapre sin una opinión clínica que lo sostenga. Le damos esa evidencia antes de dar el paso.',
    reasons: [
      {
        title: '1. Evidencia antes de derivar, no después',
        body: 'Una segunda opinión clínica sólida antes de que su equipo de RRHH escale el caso, para no exponer a la empresa a una derivación sin fundamento.',
      },
      {
        title: '2. Un proceso que su equipo de RRHH puede seguir',
        body: 'Sin lenguaje técnico innecesario — un informe claro sobre si hay o no elementos que justifiquen derivar el caso.',
      },
      {
        title: '3. Trazabilidad del caso mientras se evalúa',
        body: 'Visibilidad del estado de cada caso ingresado, para que RRHH no tenga que preguntar en qué va.',
      },
    ],
    howItWorks:
      'Ingresa el caso a nuestra plataforma, un profesional lo evalúa, y su equipo recibe una opinión clínica clara sobre si existen elementos para derivar el caso a COMPIN o a la isapre correspondiente.',
    ctaTitle: '¿Tiene un caso que necesita respaldo clínico antes de derivar?',
    ctaBody: 'Conversemos sobre su empresa →',
  },
  seguros: {
    slug: 'seguros',
    label: 'Seguros',
    metaTitle: 'Auditoría de Licencias para Aseguradoras — ConectaMente Auditoría',
    metaDescription:
      'Auditoría médico-legal de licencias con evidencia clínica defendible y trazabilidad de extremo a extremo.',
    heroTitle:
      'Auditoría médico-legal de licencias, con la evidencia que un contexto de riesgo requiere.',
    heroBody:
      'Aportamos una segunda evaluación clínica y regulatoria de licencias médicas, con la misma trazabilidad de extremo a extremo que aplicamos a isapres y COMPIN.',
    reasons: [
      {
        title: '1. Evidencia clínica defendible',
        body: 'Informes construidos con rigor clínico y regulatorio, pensados para sostenerse ante una eventual revisión o disputa.',
      },
      {
        title: '2. Capacidad de volumen',
        body: 'Absorbemos casos de mayor complejidad sin que su equipo interno pierda control del proceso.',
      },
      {
        title: '3. Trazabilidad de extremo a extremo',
        body: 'Estado de cada caso visible en tiempo real, desde el ingreso hasta el informe firmado.',
      },
    ],
    howItWorks:
      'Deriva el caso, asignamos automáticamente al profesional adecuado, coordinamos la evaluación, y usted recibe el informe firmado electrónicamente con trazabilidad completa del proceso.',
    ctaTitle: '¿Quiere conversar sobre un proceso de auditoría para su aseguradora?',
    ctaBody: 'Conversemos sobre su organización →',
    pendingReview: true,
  },
}

export const segmentSlugs = Object.keys(segments) as SegmentSlug[]

export function isSegmentSlug(value: string): value is SegmentSlug {
  return Object.prototype.hasOwnProperty.call(segments, value)
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run lib/segments-data.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Write the failing SegmentLanding test**

Create `components/marketing/SegmentLanding.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SegmentLanding } from './SegmentLanding'
import { segments } from '@/lib/segments-data'

describe('SegmentLanding', () => {
  it('renders the hero title, body, and all three reasons', () => {
    render(<SegmentLanding content={segments.isapres} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(segments.isapres.heroTitle)
    expect(screen.getByText(segments.isapres.heroBody)).toBeInTheDocument()
    for (const reason of segments.isapres.reasons) {
      expect(screen.getByText(reason.title)).toBeInTheDocument()
    }
  })

  it('points the CTA button to /contacto pre-selected with the segment slug', () => {
    render(<SegmentLanding content={segments.compin} />)
    expect(screen.getByRole('link', { name: segments.compin.ctaBody })).toHaveAttribute(
      'href',
      '/contacto?tipo=compin'
    )
  })

  it('shows a pending-review notice only when content.pendingReview is true', () => {
    render(<SegmentLanding content={segments.seguros} />)
    expect(screen.getByText(/pendiente de validar/)).toBeInTheDocument()
  })

  it('omits the pending-review notice for validated segments', () => {
    render(<SegmentLanding content={segments.isapres} />)
    expect(screen.queryByText(/pendiente de validar/)).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npx vitest run components/marketing/SegmentLanding.test.tsx`
Expected: FAIL — cannot find module `./SegmentLanding`.

- [ ] **Step 7: Implement `SegmentLanding`**

Create `components/marketing/SegmentLanding.tsx`:

```tsx
import { Button } from '@/components/ui/Button'
import type { SegmentContent } from '@/lib/segments-data'

export function SegmentLanding({ content }: { content: SegmentContent }) {
  return (
    <>
      {content.pendingReview && (
        <div className="border-b border-primary/30 bg-primarySubtle px-6 py-2 text-center text-xs font-medium text-primaryDark">
          Contenido pendiente de validar — el dolor específico de este segmento aún no está
          confirmado.
        </div>
      )}

      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="text-4xl font-bold text-ink">{content.heroTitle}</h1>
        <p className="mt-4 text-lg text-inkSecondary">{content.heroBody}</p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-6 md:grid-cols-3">
          {content.reasons.map((reason) => (
            <div key={reason.title} className="rounded-xl border border-border bg-white p-6">
              <h3 className="font-semibold text-ink">{reason.title}</h3>
              <p className="mt-2 text-sm text-inkSecondary">{reason.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-2xl font-bold text-ink">Cómo funciona para su organización</h2>
          <p className="mt-4 text-inkSecondary">{content.howItWorks}</p>
        </div>
      </section>

      <section className="border-t border-border bg-primary py-16 text-center text-white">
        <h2 className="mx-auto max-w-2xl text-2xl font-bold">{content.ctaTitle}</h2>
        <div className="mt-8 flex justify-center">
          <Button href={`/contacto?tipo=${content.slug}`} variant="inverse">
            {content.ctaBody}
          </Button>
        </div>
      </section>
    </>
  )
}
```

- [ ] **Step 8: Run it to verify it passes**

Run: `npx vitest run components/marketing/SegmentLanding.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 9: Write the failing dynamic-route test**

Create `app/segmentos/[segmento]/page.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { segments } from '@/lib/segments-data'

vi.mock('next/navigation', () => ({ notFound: vi.fn() }))

describe('SegmentoPage', () => {
  it('generates static params for all four segments', async () => {
    const { generateStaticParams } = await import('./page')
    expect(generateStaticParams()).toEqual([
      { segmento: 'isapres' },
      { segmento: 'compin' },
      { segmento: 'empresas' },
      { segmento: 'seguros' },
    ])
  })

  it('renders the isapres hero title', async () => {
    const { default: SegmentoPage } = await import('./page')
    const ui = await SegmentoPage({ params: Promise.resolve({ segmento: 'isapres' }) })
    render(ui!)
    expect(screen.getByText(segments.isapres.heroTitle)).toBeInTheDocument()
  })

  it('calls notFound for an unknown segment', async () => {
    const { notFound } = await import('next/navigation')
    const { default: SegmentoPage } = await import('./page')
    await SegmentoPage({ params: Promise.resolve({ segmento: 'no-existe' }) })
    expect(notFound).toHaveBeenCalled()
  })
})
```

- [ ] **Step 10: Run it to verify it fails**

Run: `npx vitest run "app/segmentos/[segmento]/page.test.tsx"`
Expected: FAIL — `app/segmentos/[segmento]/page.tsx` doesn't exist yet.

- [ ] **Step 11: Implement the dynamic route**

Create `app/segmentos/[segmento]/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SegmentLanding } from '@/components/marketing/SegmentLanding'
import { segments, segmentSlugs, isSegmentSlug } from '@/lib/segments-data'

export function generateStaticParams() {
  return segmentSlugs.map((segmento) => ({ segmento }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ segmento: string }>
}): Promise<Metadata> {
  const { segmento } = await params
  if (!isSegmentSlug(segmento)) return {}
  const content = segments[segmento]
  return { title: content.metaTitle, description: content.metaDescription }
}

export default async function SegmentoPage({
  params,
}: {
  params: Promise<{ segmento: string }>
}) {
  const { segmento } = await params
  if (!isSegmentSlug(segmento)) {
    notFound()
    return null
  }
  return <SegmentLanding content={segments[segmento]} />
}
```

- [ ] **Step 12: Run it to verify it passes**

Run: `npx vitest run "app/segmentos/[segmento]/page.test.tsx"`
Expected: PASS (3 tests).

- [ ] **Step 13: Verify the full build still succeeds**

Run: `npm run build`
Expected: build succeeds and statically generates `/segmentos/isapres`, `/segmentos/compin`, `/segmentos/empresas`, `/segmentos/seguros`.

- [ ] **Step 14: Commit**

```bash
git add lib/segments-data.ts lib/segments-data.test.ts components/marketing/SegmentLanding.tsx components/marketing/SegmentLanding.test.tsx "app/segmentos"
git commit -m "feat: add the four segment landing pages via a data-driven dynamic route"
```

---

### Task 8: Nosotros page (`/nosotros`)

**Files:**
- Create: `E:\Dev\Web-ConectaMente-Auditoria\app\nosotros\page.tsx`
- Test: `E:\Dev\Web-ConectaMente-Auditoria\app\nosotros\page.test.tsx`

**Interfaces:**
- Consumes: `Button` (Task 2). Must expose an element with `id="politica-de-datos"` — Footer's link (Task 4) points at `/nosotros#politica-de-datos`.

- [ ] **Step 1: Write the failing test**

Create `app/nosotros/page.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import NosotrosPage from './page'

describe('NosotrosPage', () => {
  it('renders the page heading', () => {
    render(<NosotrosPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Nosotros' })).toBeInTheDocument()
  })

  it('renders the aggregate accreditation claim, not individual names', () => {
    render(<NosotrosPage />)
    expect(
      screen.getByText('Equipo 100% acreditado ante la Superintendencia de Salud')
    ).toBeInTheDocument()
  })

  it('has a #politica-de-datos anchor referencing both data-protection laws', () => {
    const { container } = render(<NosotrosPage />)
    const section = container.querySelector('#politica-de-datos')
    expect(section).not.toBeNull()
    expect(section?.textContent).toMatch(/Ley 19.628/)
    expect(section?.textContent).toMatch(/Ley 21.719/)
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run app/nosotros/page.test.tsx`
Expected: FAIL — `app/nosotros/page.tsx` doesn't exist yet.

- [ ] **Step 3: Implement the page**

Create `app/nosotros/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'Nosotros — ConectaMente Auditoría',
  description:
    'Equipo 100% acreditado ante la Superintendencia de Salud, especializado en auditoría médico-legal de licencias.',
}

export default function NosotrosPage() {
  return (
    <>
      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="text-4xl font-bold text-ink">Nosotros</h1>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-12 text-inkSecondary">
        <p>
          ConectaMente Auditoría nace para responder a una necesidad concreta de isapres, COMPIN,
          empresas y aseguradoras: una segunda revisión de licencias médicas con rigor clínico,
          respaldo regulatorio y visibilidad del proceso de principio a fin.
        </p>
        <p className="mt-4">
          Trabajamos con un equipo de profesionales acreditados, evaluando cada caso con el mismo
          estándar que exigiría una eventual disputa ante COMPIN o SUSESO.
        </p>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <ShieldCheck size={32} className="mx-auto text-primary" />
          <h2 className="mt-4 text-xl font-semibold text-ink">
            Equipo 100% acreditado ante la Superintendencia de Salud
          </h2>
          <p className="mt-2 text-sm text-inkSecondary">
            Registro Nacional de Prestadores Individuales (RNPI), ejercicio activo verificado.
          </p>
        </div>
      </section>

      <section id="politica-de-datos" className="mx-auto max-w-3xl px-6 py-12">
        <h2 className="text-xl font-semibold text-ink">Política de tratamiento de datos</h2>
        <p className="mt-3 text-sm text-inkSecondary">
          Tratamos los datos personales de cada evaluado conforme a la Ley 19.628 sobre
          Protección de la Vida Privada y la Ley 21.719 de Protección de Datos Personales — con
          acceso restringido por rol, minimización de datos y trazabilidad de cada acceso.
        </p>
      </section>

      <section className="border-t border-border bg-primary py-16 text-center text-white">
        <h2 className="mx-auto max-w-2xl text-2xl font-bold">
          ¿Su organización necesita una auditoría médico-legal con capacidad real de volumen?
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

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run app/nosotros/page.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add app/nosotros
git commit -m "feat: build the nosotros page with the data-policy anchor"
```

---

### Task 9: Tecnología page (`/tecnologia`)

**Files:**
- Create: `E:\Dev\Web-ConectaMente-Auditoria\app\tecnologia\page.tsx`
- Test: `E:\Dev\Web-ConectaMente-Auditoria\app\tecnologia\page.test.tsx`

**Interfaces:**
- Consumes: `Button` (Task 2), `DashboardPlaceholder` (Task 3).

- [ ] **Step 1: Write the failing test**

Create `app/tecnologia/page.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import TecnologiaPage from './page'

describe('TecnologiaPage', () => {
  it('renders the ConectaMente Core heading', () => {
    render(<TecnologiaPage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('ConectaMente Core')
  })

  it('renders all four listed capabilities', () => {
    render(<TecnologiaPage />)
    expect(screen.getByText('Trazabilidad en tiempo real de cada caso')).toBeInTheDocument()
    expect(screen.getByText('Alertas automáticas de cumplimiento de SLA')).toBeInTheDocument()
    expect(screen.getByText('Firma electrónica avanzada por informe')).toBeInTheDocument()
  })

  it('renders the implicit comparison table without naming a competitor', () => {
    const { container } = render(<TecnologiaPage />)
    expect(screen.getByText('Con ConectaMente Core')).toBeInTheDocument()
    expect(screen.getByText('Proceso tradicional')).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/TrustDoc/i)
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run app/tecnologia/page.test.tsx`
Expected: FAIL — `app/tecnologia/page.tsx` doesn't exist yet.

- [ ] **Step 3: Implement the page**

Create `app/tecnologia/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { Activity, Bell, ScrollText, PenLine } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DashboardPlaceholder } from '@/components/marketing/DashboardPlaceholder'

export const metadata: Metadata = {
  title: 'Tecnología — ConectaMente Core™',
  description:
    'Trazabilidad en tiempo real, alertas automáticas de SLA y firma electrónica avanzada en cada informe.',
}

const capacidades = [
  { icon: Activity, label: 'Trazabilidad en tiempo real de cada caso' },
  { icon: Bell, label: 'Alertas automáticas de cumplimiento de SLA' },
  {
    icon: ScrollText,
    label: 'Telemetría de cumplimiento de sesión (duración, conexión/desconexión)',
  },
  { icon: PenLine, label: 'Firma electrónica avanzada por informe' },
]

export default function TecnologiaPage() {
  return (
    <>
      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="text-4xl font-bold text-ink">ConectaMente Core™</h1>
        <p className="mt-4 text-lg text-inkSecondary">
          La plataforma que sostiene cada auditoría — no una promesa, algo que usted puede ver
          funcionando.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-6 md:grid-cols-2">
          <DashboardPlaceholder label="Mockup: estado de casos — pendiente" />
          <DashboardPlaceholder label="Mockup: panel de cumplimiento — pendiente" />
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto max-w-3xl px-6">
          <ul className="space-y-4">
            {capacidades.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-start gap-3 text-inkSecondary">
                <Icon size={20} className="mt-0.5 shrink-0 text-primary" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16">
        <h2 className="text-center text-2xl font-bold text-ink">
          Con ConectaMente Core, frente al proceso tradicional
        </h2>
        <div className="mt-8 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
          <div className="bg-primarySubtle p-6">
            <h3 className="font-semibold text-primaryDark">Con ConectaMente Core</h3>
            <ul className="mt-3 space-y-2 text-sm text-inkSecondary">
              <li>Estado del caso visible en tiempo real</li>
              <li>Alertas antes de que un plazo se incumpla</li>
              <li>Registro auditable de cada acceso y descarga</li>
              <li>Firma electrónica avanzada por informe</li>
            </ul>
          </div>
          <div className="bg-white p-6">
            <h3 className="font-semibold text-ink">Proceso tradicional</h3>
            <ul className="mt-3 space-y-2 text-sm text-inkSecondary">
              <li>Estado del caso solo por correo, bajo consulta</li>
              <li>Plazos que se descubren vencidos</li>
              <li>Sin registro auditable del proceso</li>
              <li>Firma manual, sin trazabilidad digital</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-primary py-16 text-center text-white">
        <h2 className="mx-auto max-w-2xl text-2xl font-bold">Vea la plataforma en acción</h2>
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

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run app/tecnologia/page.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add app/tecnologia
git commit -m "feat: build the tecnologia page"
```

---

### Task 10: Proveedor page (`/proveedor`)

**Files:**
- Create: `E:\Dev\Web-ConectaMente-Auditoria\app\proveedor\page.tsx`
- Test: `E:\Dev\Web-ConectaMente-Auditoria\app\proveedor\page.test.tsx`

**Interfaces:**
- None — self-contained page. The PDF file itself is out of scope (spec: user provides content later); the download control renders disabled.

- [ ] **Step 1: Write the failing test**

Create `app/proveedor/page.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProveedorPage from './page'

describe('ProveedorPage', () => {
  it('renders the page heading', () => {
    render(<ProveedorPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Ficha de Proveedor' })).toBeInTheDocument()
  })

  it('renders the key data on screen, not only inside the PDF', () => {
    render(<ProveedorPage />)
    expect(screen.getByText('Especialidades cubiertas')).toBeInTheDocument()
    expect(screen.getByText('Acreditación')).toBeInTheDocument()
  })

  it('disables the PDF download button until the file exists', () => {
    render(<ProveedorPage />)
    expect(screen.getByRole('button', { name: /Descargar ficha/ })).toBeDisabled()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run app/proveedor/page.test.tsx`
Expected: FAIL — `app/proveedor/page.tsx` doesn't exist yet.

- [ ] **Step 3: Implement the page**

Create `app/proveedor/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Ficha de Proveedor — ConectaMente Auditoría',
  description:
    'Ficha descargable con RUT, certificaciones y especialidades cubiertas, para procesos de compras públicas.',
}

const datosClave = [
  {
    label: 'Especialidades cubiertas',
    value: 'Psiquiatría y psicología, adulto e infanto-juvenil',
  },
  { label: 'Modalidad', value: 'Evaluación telemática con cobertura nacional' },
  {
    label: 'Acreditación',
    value: 'Equipo inscrito en el Registro Nacional de Prestadores Individuales (RNPI)',
  },
]

export default function ProveedorPage() {
  return (
    <>
      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="text-4xl font-bold text-ink">Ficha de Proveedor</h1>
        <p className="mt-4 text-inkSecondary">
          Documento de referencia para encargados de compras públicas o contraloría médica — RUT,
          certificaciones y especialidades cubiertas, sin necesidad de solicitarlo por correo.
        </p>
      </section>

      <section className="mx-auto max-w-2xl px-6 pb-12">
        <dl className="divide-y divide-border rounded-xl border border-border bg-white">
          {datosClave.map((item) => (
            <div key={item.label} className="grid gap-1 p-4 sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-semibold text-ink">{item.label}</dt>
              <dd className="text-sm text-inkSecondary sm:col-span-2">{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto max-w-2xl px-6 pb-16 text-center">
        <button
          type="button"
          disabled
          title="Ficha en preparación — disponible próximamente"
          className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-border px-6 py-2.5 text-sm font-semibold text-inkMuted"
        >
          <FileText size={16} />
          Descargar ficha (PDF) — próximamente
        </button>
      </section>
    </>
  )
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run app/proveedor/page.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add app/proveedor
git commit -m "feat: build the proveedor page with a disabled download until the PDF exists"
```

---

### Task 11: Contact form validation and Brevo client

**Files:**
- Create: `E:\Dev\Web-ConectaMente-Auditoria\lib\contact-schema.ts`
- Test: `E:\Dev\Web-ConectaMente-Auditoria\lib\contact-schema.test.ts`
- Create: `E:\Dev\Web-ConectaMente-Auditoria\lib\brevo.ts`
- Test: `E:\Dev\Web-ConectaMente-Auditoria\lib\brevo.test.ts`

**Interfaces:**
- Produces: `ConsultaTipo`, `CONSULTA_TIPOS`, `ContactFormInput`, `ContactFormErrors`, `validateContactForm(input): ContactFormErrors`, `isConsultaTipo(value): value is ConsultaTipo` from `lib/contact-schema.ts` — consumed by Task 12 (API route) and Task 14 (`ContactForm` client component).
- Produces: `sendContactNotification(input: ContactFormInput, fetchImpl?: typeof fetch): Promise<{ ok: boolean; status: number }>` from `lib/brevo.ts`, reading `process.env.BREVO_API_KEY` and `process.env.CONTACT_NOTIFICATION_EMAIL` — consumed by Task 12 (API route).

- [ ] **Step 1: Write the failing contact-schema test**

Create `lib/contact-schema.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { validateContactForm, isConsultaTipo } from './contact-schema'

const validInput = {
  nombre: 'Ana Pérez',
  email: 'ana@isapre.cl',
  organizacion: 'Isapre X',
  tipo: 'isapres' as const,
  mensaje: 'Necesitamos información sobre el servicio.',
}

describe('validateContactForm', () => {
  it('returns no errors for valid input', () => {
    expect(validateContactForm(validInput)).toEqual({})
  })

  it('flags a missing or blank name', () => {
    expect(validateContactForm({ ...validInput, nombre: '   ' })).toHaveProperty('nombre')
  })

  it('flags an invalid email', () => {
    expect(validateContactForm({ ...validInput, email: 'no-es-un-correo' })).toHaveProperty('email')
  })

  it('flags a missing organization', () => {
    expect(validateContactForm({ ...validInput, organizacion: '' })).toHaveProperty('organizacion')
  })

  it('flags an empty message', () => {
    expect(validateContactForm({ ...validInput, mensaje: '   ' })).toHaveProperty('mensaje')
  })
})

describe('isConsultaTipo', () => {
  it('accepts every known type', () => {
    for (const tipo of ['auditoria', 'isapres', 'compin', 'empresas', 'seguros', 'otro']) {
      expect(isConsultaTipo(tipo)).toBe(true)
    }
  })

  it('rejects an unknown type', () => {
    expect(isConsultaTipo('inventado')).toBe(false)
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run lib/contact-schema.test.ts`
Expected: FAIL — cannot find module `./contact-schema`.

- [ ] **Step 3: Implement `contact-schema.ts`**

Create `lib/contact-schema.ts`:

```ts
export type ConsultaTipo = 'auditoria' | 'isapres' | 'compin' | 'empresas' | 'seguros' | 'otro'

export const CONSULTA_TIPOS: { value: ConsultaTipo; label: string }[] = [
  { value: 'auditoria', label: 'Auditoría de Licencias' },
  { value: 'isapres', label: 'Isapres' },
  { value: 'compin', label: 'COMPIN' },
  { value: 'empresas', label: 'Empresas' },
  { value: 'seguros', label: 'Seguros' },
  { value: 'otro', label: 'Otro' },
]

export interface ContactFormInput {
  nombre: string
  email: string
  organizacion: string
  tipo: ConsultaTipo
  mensaje: string
}

export interface ContactFormErrors {
  nombre?: string
  email?: string
  organizacion?: string
  mensaje?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateContactForm(input: ContactFormInput): ContactFormErrors {
  const errors: ContactFormErrors = {}
  if (!input.nombre.trim()) errors.nombre = 'Ingrese su nombre.'
  if (!EMAIL_RE.test(input.email.trim())) errors.email = 'Ingrese un correo válido.'
  if (!input.organizacion.trim()) errors.organizacion = 'Ingrese el nombre de su organización.'
  if (!input.mensaje.trim()) errors.mensaje = 'Ingrese un mensaje.'
  return errors
}

export function isConsultaTipo(value: string): value is ConsultaTipo {
  return CONSULTA_TIPOS.some((t) => t.value === value)
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run lib/contact-schema.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Write the failing brevo test**

Create `lib/brevo.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { sendContactNotification } from './brevo'
import type { ContactFormInput } from './contact-schema'

const input: ContactFormInput = {
  nombre: 'Ana',
  email: 'ana@test.cl',
  organizacion: 'Isapre X',
  tipo: 'isapres',
  mensaje: 'Hola <script>alert(1)</script>',
}

describe('sendContactNotification', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env.BREVO_API_KEY = 'test-key'
    process.env.CONTACT_NOTIFICATION_EMAIL = 'ventas@conectamente.cl'
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('throws when BREVO_API_KEY is missing', async () => {
    delete process.env.BREVO_API_KEY
    await expect(sendContactNotification(input)).rejects.toThrow('BREVO_API_KEY')
  })

  it('throws when CONTACT_NOTIFICATION_EMAIL is missing', async () => {
    delete process.env.CONTACT_NOTIFICATION_EMAIL
    await expect(sendContactNotification(input)).rejects.toThrow('CONTACT_NOTIFICATION_EMAIL')
  })

  it('POSTs to the Brevo API with the api-key header and escapes HTML in the body', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 201 })
    const result = await sendContactNotification(input, fetchMock as unknown as typeof fetch)

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.brevo.com/v3/smtp/email',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'api-key': 'test-key' }),
      })
    )
    const [, requestInit] = fetchMock.mock.calls[0]
    const body = JSON.parse(requestInit.body as string)
    expect(body.htmlContent).toContain('&lt;script&gt;')
    expect(body.to).toEqual([{ email: 'ventas@conectamente.cl' }])
    expect(result).toEqual({ ok: true, status: 201 })
  })
})
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npx vitest run lib/brevo.test.ts`
Expected: FAIL — cannot find module `./brevo`.

- [ ] **Step 7: Implement `brevo.ts`**

Create `lib/brevo.ts`:

```ts
import type { ContactFormInput } from './contact-schema'

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email'

export interface SendContactNotificationResult {
  ok: boolean
  status: number
}

export async function sendContactNotification(
  input: ContactFormInput,
  fetchImpl: typeof fetch = fetch
): Promise<SendContactNotificationResult> {
  const apiKey = process.env.BREVO_API_KEY
  const toEmail = process.env.CONTACT_NOTIFICATION_EMAIL

  if (!apiKey) throw new Error('BREVO_API_KEY debe estar configurado.')
  if (!toEmail) throw new Error('CONTACT_NOTIFICATION_EMAIL debe estar configurado.')

  const response = await fetchImpl(BREVO_ENDPOINT, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Sitio ConectaMente Auditoría', email: 'no-responder@conectamente.cl' },
      to: [{ email: toEmail }],
      replyTo: { email: input.email, name: input.nombre },
      subject: `Nueva consulta (${input.tipo}) — ${input.organizacion}`,
      htmlContent: `
        <p><strong>Nombre:</strong> ${escapeHtml(input.nombre)}</p>
        <p><strong>Email:</strong> ${escapeHtml(input.email)}</p>
        <p><strong>Organización:</strong> ${escapeHtml(input.organizacion)}</p>
        <p><strong>Tipo de consulta:</strong> ${escapeHtml(input.tipo)}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${escapeHtml(input.mensaje).replace(/\n/g, '<br/>')}</p>
      `,
    }),
  })

  return { ok: response.ok, status: response.status }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
```

- [ ] **Step 8: Run it to verify it passes**

Run: `npx vitest run lib/brevo.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 9: Commit**

```bash
git add lib/contact-schema.ts lib/contact-schema.test.ts lib/brevo.ts lib/brevo.test.ts
git commit -m "feat: add contact form validation and the Brevo transactional email client"
```

---

### Task 12: Contact API route

**Files:**
- Create: `E:\Dev\Web-ConectaMente-Auditoria\app\api\contacto\route.ts`
- Test: `E:\Dev\Web-ConectaMente-Auditoria\app\api\contacto\route.test.ts`

**Interfaces:**
- Consumes: `validateContactForm`, `isConsultaTipo`, `ContactFormInput` (`lib/contact-schema.ts`, Task 11), `sendContactNotification` (`lib/brevo.ts`, Task 11).
- Produces: `POST(request: Request): Promise<Response>` at `/api/contacto` — consumed by Task 14's `ContactForm` client component via `fetch('/api/contacto', { method: 'POST', ... })`.

- [ ] **Step 1: Write the failing test**

Create `app/api/contacto/route.test.ts`:

```ts
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import * as brevo from '@/lib/brevo'

vi.mock('@/lib/brevo', () => ({ sendContactNotification: vi.fn() }))

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/contacto', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

const validBody = {
  nombre: 'Ana',
  email: 'ana@test.cl',
  organizacion: 'Isapre X',
  tipo: 'isapres',
  mensaje: 'Hola, necesitamos info.',
}

describe('POST /api/contacto', () => {
  beforeEach(() => {
    vi.mocked(brevo.sendContactNotification).mockReset()
  })

  it('returns 400 for an unknown tipo', async () => {
    const response = await POST(makeRequest({ ...validBody, tipo: 'no-existe' }))
    expect(response.status).toBe(400)
  })

  it('returns 400 when required fields are missing', async () => {
    const response = await POST(makeRequest({ ...validBody, nombre: '' }))
    expect(response.status).toBe(400)
  })

  it('sends the notification and returns 200 on valid input', async () => {
    vi.mocked(brevo.sendContactNotification).mockResolvedValue({ ok: true, status: 201 })
    const response = await POST(makeRequest(validBody))
    const json = await response.json()
    expect(response.status).toBe(200)
    expect(json).toEqual({ ok: true })
    expect(brevo.sendContactNotification).toHaveBeenCalledTimes(1)
  })

  it('returns 502 when Brevo rejects the send', async () => {
    vi.mocked(brevo.sendContactNotification).mockResolvedValue({ ok: false, status: 401 })
    const response = await POST(makeRequest(validBody))
    expect(response.status).toBe(502)
  })

  it('returns 500 when sendContactNotification throws', async () => {
    vi.mocked(brevo.sendContactNotification).mockRejectedValue(new Error('boom'))
    const response = await POST(makeRequest(validBody))
    expect(response.status).toBe(500)
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run app/api/contacto/route.test.ts`
Expected: FAIL — cannot find module `./route`.

- [ ] **Step 3: Implement the route**

Create `app/api/contacto/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { validateContactForm, isConsultaTipo, type ContactFormInput } from '@/lib/contact-schema'
import { sendContactNotification } from '@/lib/brevo'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)

  if (
    !body ||
    typeof body.nombre !== 'string' ||
    typeof body.email !== 'string' ||
    typeof body.organizacion !== 'string' ||
    typeof body.mensaje !== 'string' ||
    typeof body.tipo !== 'string' ||
    !isConsultaTipo(body.tipo)
  ) {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 })
  }

  const input: ContactFormInput = {
    nombre: body.nombre,
    email: body.email,
    organizacion: body.organizacion,
    tipo: body.tipo,
    mensaje: body.mensaje,
  }

  const fieldErrors = validateContactForm(input)
  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json(
      { error: 'Revise los campos del formulario.', fieldErrors },
      { status: 400 }
    )
  }

  try {
    const result = await sendContactNotification(input)
    if (!result.ok) {
      return NextResponse.json(
        { error: 'No pudimos enviar su mensaje. Intente nuevamente.' },
        { status: 502 }
      )
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: 'No pudimos enviar su mensaje. Intente nuevamente.' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run app/api/contacto/route.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add app/api/contacto
git commit -m "feat: add the /api/contacto route calling Brevo"
```

---

### Task 13: Contacto page and `ContactForm` client component

**Files:**
- Create: `E:\Dev\Web-ConectaMente-Auditoria\app\contacto\ContactForm.tsx`
- Test: `E:\Dev\Web-ConectaMente-Auditoria\app\contacto\ContactForm.test.tsx`
- Create: `E:\Dev\Web-ConectaMente-Auditoria\app\contacto\page.tsx`
- Test: `E:\Dev\Web-ConectaMente-Auditoria\app\contacto\page.test.tsx`

**Interfaces:**
- Consumes: `CONSULTA_TIPOS`, `validateContactForm`, `isConsultaTipo`, `ConsultaTipo`, `ContactFormErrors` (`lib/contact-schema.ts`, Task 11). Posts to `/api/contacto` (Task 12).
- Produces: `ContactForm({ initialTipo?: string })`, rendered by `app/contacto/page.tsx` with `initialTipo` sourced from the `?tipo=` query param — this is what makes the segment landings' CTA (`/contacto?tipo=isapres`, Task 7) pre-select the dropdown.

- [ ] **Step 1: Write the failing ContactForm test**

Create `app/contacto/ContactForm.test.tsx`:

```tsx
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContactForm } from './ContactForm'

describe('ContactForm', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('preselects the tipo dropdown from initialTipo', () => {
    render(<ContactForm initialTipo="isapres" />)
    expect(screen.getByLabelText('Tipo de consulta')).toHaveValue('isapres')
  })

  it('falls back to "auditoria" when initialTipo is missing or invalid', () => {
    render(<ContactForm initialTipo="no-existe" />)
    expect(screen.getByLabelText('Tipo de consulta')).toHaveValue('auditoria')
  })

  it('shows validation errors and does not call fetch when required fields are empty', () => {
    const fetchSpy = vi.spyOn(global, 'fetch')
    render(<ContactForm />)
    fireEvent.click(screen.getByRole('button', { name: 'Enviar mensaje' }))
    expect(screen.getByText('Ingrese su nombre.')).toBeInTheDocument()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('submits and shows a success message on valid input', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true } as Response)
    const user = userEvent.setup()
    render(<ContactForm />)

    await user.type(screen.getByLabelText('Nombre'), 'Ana Pérez')
    await user.type(screen.getByLabelText('Correo'), 'ana@isapre.cl')
    await user.type(screen.getByLabelText('Organización'), 'Isapre X')
    await user.type(screen.getByLabelText('Mensaje'), 'Necesitamos información.')
    await user.click(screen.getByRole('button', { name: 'Enviar mensaje' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Gracias')
  })

  it('shows an error message when the request fails', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({ ok: false } as Response)
    const user = userEvent.setup()
    render(<ContactForm />)

    await user.type(screen.getByLabelText('Nombre'), 'Ana Pérez')
    await user.type(screen.getByLabelText('Correo'), 'ana@isapre.cl')
    await user.type(screen.getByLabelText('Organización'), 'Isapre X')
    await user.type(screen.getByLabelText('Mensaje'), 'Necesitamos información.')
    await user.click(screen.getByRole('button', { name: 'Enviar mensaje' }))

    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run app/contacto/ContactForm.test.tsx`
Expected: FAIL — cannot find module `./ContactForm`.

- [ ] **Step 3: Implement `ContactForm`**

Create `app/contacto/ContactForm.tsx`:

```tsx
'use client'

import { useState, type FormEvent } from 'react'
import {
  CONSULTA_TIPOS,
  validateContactForm,
  isConsultaTipo,
  type ConsultaTipo,
  type ContactFormErrors,
} from '@/lib/contact-schema'

type Status = 'idle' | 'submitting' | 'success' | 'error'

export function ContactForm({ initialTipo }: { initialTipo?: string }) {
  const defaultTipo: ConsultaTipo =
    initialTipo && isConsultaTipo(initialTipo) ? initialTipo : 'auditoria'

  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [organizacion, setOrganizacion] = useState('')
  const [tipo, setTipo] = useState<ConsultaTipo>(defaultTipo)
  const [mensaje, setMensaje] = useState('')
  const [errors, setErrors] = useState<ContactFormErrors>({})
  const [status, setStatus] = useState<Status>('idle')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const input = { nombre, email, organizacion, tipo, mensaje }
    const fieldErrors = validateContactForm(input)
    setErrors(fieldErrors)
    if (Object.keys(fieldErrors).length > 0) return

    setStatus('submitting')
    try {
      const response = await fetch('/api/contacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      setStatus(response.ok ? 'success' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <p
        role="status"
        className="rounded-xl border border-primary/30 bg-primarySubtle p-6 text-center text-primaryDark"
      >
        Gracias — recibimos su mensaje. Respondemos en menos de 24 horas hábiles.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <label htmlFor="tipo" className="block text-sm font-medium text-ink">
          Tipo de consulta
        </label>
        <select
          id="tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as ConsultaTipo)}
          className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
        >
          {CONSULTA_TIPOS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="nombre" className="block text-sm font-medium text-ink">
          Nombre
        </label>
        <input
          id="nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
        />
        {errors.nombre && <p className="mt-1 text-xs text-red-600">{errors.nombre}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-ink">
          Correo
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
        />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="organizacion" className="block text-sm font-medium text-ink">
          Organización
        </label>
        <input
          id="organizacion"
          value={organizacion}
          onChange={(e) => setOrganizacion(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
        />
        {errors.organizacion && <p className="mt-1 text-xs text-red-600">{errors.organizacion}</p>}
      </div>

      <div>
        <label htmlFor="mensaje" className="block text-sm font-medium text-ink">
          Mensaje
        </label>
        <textarea
          id="mensaje"
          rows={4}
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
        />
        {errors.mensaje && <p className="mt-1 text-xs text-red-600">{errors.mensaje}</p>}
      </div>

      {status === 'error' && (
        <p role="alert" className="text-sm text-red-600">
          No pudimos enviar su mensaje. Intente nuevamente o escríbanos a
          contacto@conectamente.cl.
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primaryDark disabled:opacity-60"
      >
        {status === 'submitting' ? 'Enviando…' : 'Enviar mensaje'}
      </button>
    </form>
  )
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run app/contacto/ContactForm.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Write the failing Contacto page test**

Create `app/contacto/page.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ContactoPage from './page'

describe('ContactoPage', () => {
  it('renders the heading and passes the tipo query param through to the form', async () => {
    const ui = await ContactoPage({ searchParams: Promise.resolve({ tipo: 'compin' }) })
    render(ui)
    expect(screen.getByRole('heading', { name: 'Conversemos' })).toBeInTheDocument()
    expect(screen.getByLabelText('Tipo de consulta')).toHaveValue('compin')
  })

  it('defaults the form when there is no tipo query param', async () => {
    const ui = await ContactoPage({ searchParams: Promise.resolve({}) })
    render(ui)
    expect(screen.getByLabelText('Tipo de consulta')).toHaveValue('auditoria')
  })
})
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npx vitest run app/contacto/page.test.tsx`
Expected: FAIL — `app/contacto/page.tsx` doesn't exist yet.

- [ ] **Step 7: Implement the page**

Create `app/contacto/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { ContactForm } from './ContactForm'

export const metadata: Metadata = {
  title: 'Contacto — ConectaMente Auditoría',
  description: 'Conversemos sobre su organización. Respondemos en menos de 24 horas hábiles.',
}

export default async function ContactoPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>
}) {
  const { tipo } = await searchParams

  return (
    <section className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-center text-4xl font-bold text-ink">Conversemos</h1>
      <p className="mt-4 text-center text-inkSecondary">Respondemos en menos de 24 horas hábiles.</p>
      <div className="mt-10">
        <ContactForm initialTipo={tipo} />
      </div>
      <div className="mt-10 text-center text-sm text-inkSecondary">
        <p>contacto@conectamente.cl</p>
      </div>
    </section>
  )
}
```

- [ ] **Step 8: Run it to verify it passes**

Run: `npx vitest run app/contacto/page.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 9: Verify the full build and test suite pass**

Run: `npm run build && npm test`
Expected: build succeeds, all tests pass.

- [ ] **Step 10: Commit**

```bash
git add app/contacto
git commit -m "feat: build the contacto page and ContactForm, wired to /api/contacto"
```

---

### Task 14: Sitemap and robots.txt

**Files:**
- Create: `E:\Dev\Web-ConectaMente-Auditoria\app\sitemap.ts`
- Test: `E:\Dev\Web-ConectaMente-Auditoria\app\sitemap.test.ts`
- Create: `E:\Dev\Web-ConectaMente-Auditoria\app\robots.ts`
- Test: `E:\Dev\Web-ConectaMente-Auditoria\app\robots.test.ts`

**Interfaces:**
- Consumes: `segmentSlugs` (`lib/segments-data.ts`, Task 7).

- [ ] **Step 1: Write the failing sitemap test**

Create `app/sitemap.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import sitemap from './sitemap'

describe('sitemap', () => {
  it('includes all 6 static routes plus the 4 segment routes, as absolute URLs', () => {
    const entries = sitemap()
    expect(entries).toHaveLength(10)
    for (const entry of entries) {
      expect(entry.url.startsWith('https://auditoria.conectamente.cl')).toBe(true)
    }
    const urls = entries.map((e) => e.url)
    expect(urls).toContain('https://auditoria.conectamente.cl/')
    expect(urls).toContain('https://auditoria.conectamente.cl/segmentos/isapres')
    expect(urls).toContain('https://auditoria.conectamente.cl/segmentos/seguros')
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run app/sitemap.test.ts`
Expected: FAIL — cannot find module `./sitemap`.

- [ ] **Step 3: Implement `sitemap.ts` and `robots.ts`**

Create `app/sitemap.ts`:

```ts
import type { MetadataRoute } from 'next'
import { segmentSlugs } from '@/lib/segments-data'

const BASE_URL = 'https://auditoria.conectamente.cl'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    '/',
    '/servicio-auditoria',
    '/nosotros',
    '/tecnologia',
    '/proveedor',
    '/contacto',
  ]
  const segmentRoutes = segmentSlugs.map((slug) => `/segmentos/${slug}`)

  return [...staticRoutes, ...segmentRoutes].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
  }))
}
```

Create `app/robots.ts`:

```ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: 'https://auditoria.conectamente.cl/sitemap.xml',
  }
}
```

- [ ] **Step 4: Run the sitemap test to verify it passes**

Run: `npx vitest run app/sitemap.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Write and run the robots test**

Create `app/robots.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import robots from './robots'

describe('robots', () => {
  it('allows all crawlers and points to the sitemap', () => {
    const result = robots()
    expect(result.rules).toEqual({ userAgent: '*', allow: '/' })
    expect(result.sitemap).toBe('https://auditoria.conectamente.cl/sitemap.xml')
  })
})
```

Run: `npx vitest run app/robots.test.ts`
Expected: PASS (1 test).

- [ ] **Step 6: Verify the full build and test suite still pass**

Run: `npm run build && npm test`
Expected: build succeeds (including `/sitemap.xml` and `/robots.txt` routes), all tests pass.

- [ ] **Step 7: Commit**

```bash
git add app/sitemap.ts app/sitemap.test.ts app/robots.ts app/robots.test.ts
git commit -m "feat: add sitemap.xml and robots.txt"
```

---

### Task 15: Deploy infrastructure — PM2, GitHub Actions, and VPS setup docs

**Files:**
- Create: `E:\Dev\Web-ConectaMente-Auditoria\ecosystem.config.js`
- Create: `E:\Dev\Web-ConectaMente-Auditoria\.github\workflows\deploy.yml`
- Create: `E:\Dev\Web-ConectaMente-Auditoria\README.md`

**Interfaces:**
- None — this task produces deploy artifacts and documentation, not application code. Nothing else in the plan depends on it.

- [ ] **Step 1: Create the PM2 process config**

Create `ecosystem.config.js`:

```js
module.exports = {
  apps: [
    {
      name: 'web-conectamente-auditoria',
      script: 'node_modules/.bin/next',
      args: 'start -p 3200',
      cwd: __dirname,
      env: { NODE_ENV: 'production' },
    },
  ],
}
```

- [ ] **Step 2: Create the GitHub Actions deploy workflow**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Hostinger

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Inject env vars
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          port: 22
          script: |
            ENV_FILE="${{ secrets.PROJECT_DIR }}/.env"
            cat > "$ENV_FILE" <<EOF
            BREVO_API_KEY=${{ secrets.BREVO_API_KEY }}
            CONTACT_NOTIFICATION_EMAIL=${{ secrets.CONTACT_NOTIFICATION_EMAIL }}
            EOF

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          port: 22
          script: |
            cd ${{ secrets.PROJECT_DIR }} || exit 1
            git fetch origin main || exit 1
            git reset --hard origin/main || exit 1
            git clean -fd
            npm install --production=false || exit 1
            npm run build || exit 1
            pm2 startOrRestart ecosystem.config.js || exit 1
```

This mirrors the existing, already-working `Auditoria-ConectaMente/.github/workflows/deploy.yml` pattern (same SSH-based deploy shape), but targets its own `PROJECT_DIR`/PM2 process — it never touches Core's directory, process, or port.

- [ ] **Step 3: Write the README with manual VPS setup steps**

Create `README.md`:

```markdown
# ConectaMente Auditoría — Sitio Web Institucional

Sitio web institucional B2B/B2G para ConectaMente Auditoría, en `auditoria.conectamente.cl`.
Proyecto separado de ConectaMente Core (`app.conectamente.cl`) — sin código, base de datos
ni autenticación compartida.

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # completar BREVO_API_KEY y CONTACT_NOTIFICATION_EMAIL
npm run dev
```

## Variables de entorno

- `BREVO_API_KEY` — API key transaccional de Brevo, usada por `lib/brevo.ts` para enviar las
  consultas del formulario de `/contacto`.
- `CONTACT_NOTIFICATION_EMAIL` — correo interno que recibe cada consulta.

## Deploy

Push a `main` dispara `.github/workflows/deploy.yml` (SSH al VPS, build, `pm2 startOrRestart`).
Requiere estos secrets configurados en **este repo** (Settings → Secrets and variables →
Actions) — son independientes de los secrets del repo de Core, aunque apunten al mismo VPS:

- `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY` — mismos valores que usa el repo de Core (mismo VPS).
- `PROJECT_DIR` — directorio del sitio en el VPS (distinto al de Core).
- `BREVO_API_KEY`, `CONTACT_NOTIFICATION_EMAIL`.

### Setup manual del VPS (una sola vez, requiere confirmación antes de ejecutar)

Estos pasos tocan infraestructura compartida (el mismo VPS que sirve Core) — confirmar con el
usuario antes de ejecutarlos, no son parte de la ejecución automática de este plan:

1. Confirmar que `auditoria.conectamente.cl` tiene un registro A apuntando a la IP del VPS
   (no asumir — ver la nota de DNS en el spec sobre el precedente `core` vs `app`).
2. Crear el directorio del proyecto en el VPS y clonar el repo ahí.
3. Agregar un server block de Nginx para `auditoria.conectamente.cl` proxy-pasando al puerto
   `3200` (el mismo patrón que ya usa el server block de Core hacia el puerto `3100`, solo con
   otro `server_name` y otro `proxy_pass`).
4. Emitir el certificado SSL para el nuevo subdominio (`certbot --nginx -d auditoria.conectamente.cl`).
5. Agregar los secrets del repo listados arriba en GitHub.
6. Hacer push a `main` para disparar el primer deploy.
```

- [ ] **Step 4: Verify the build still succeeds with the new files present**

Run: `npm run build`
Expected: build succeeds (these are config/doc files, not app code, so this just confirms nothing was broken).

- [ ] **Step 5: Commit and push**

```bash
git add ecosystem.config.js .github/workflows/deploy.yml README.md
git commit -m "chore: add PM2 config, deploy workflow, and VPS setup docs"
git push
```

---

## Self-Review Notes

- **Spec coverage:** all 9 sitemap pages (Tasks 5–10, 13), header portal link (Task 4), Brevo-backed contact form with query-param segmentation (Tasks 11–13), placeholder dashboard blocks (Task 3, used in Tasks 5/6/9), disabled PDF button (Task 10), sitemap/robots (Task 14), and deploy infra on a new PM2 port/vhost (Task 15) are each covered by a task. The corrected (green, `globals.css`-sourced) design tokens from the spec are locked in by Task 1's test.
- **Type consistency checked:** `SegmentSlug`/`segments`/`segmentSlugs`/`isSegmentSlug` (Task 7) are used identically by Task 14's sitemap and Task 4's hardcoded nav hrefs. `ConsultaTipo`/`CONSULTA_TIPOS`/`isConsultaTipo`/`ContactFormInput`/`ContactFormErrors` (Task 11) are used identically by Task 12's route and Task 13's form. `SendContactNotificationResult` return shape (`{ ok, status }`) matches how Task 12 branches on `result.ok`.
- **No placeholders left as TODOs** — the two deliberately-deferred pieces (dashboard screenshots, proveedor PDF) render as real, tested, finished UI (`DashboardPlaceholder`, a disabled button with an explanatory `title`), not as code comments or stub functions.

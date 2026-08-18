# ConectaMente Core™ — Fase 0 (Setup) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up `core.conectamente.cl` end-to-end — a new, isolated Next.js + Prisma + PostgreSQL project with role-based auth and a design system ported from ConectaMente's admin panel — deployed and reachable over HTTPS on the existing Hostinger VPS.

**Architecture:** Next.js 15 (App Router) + TypeScript app in this repo (`E:\Dev\Auditoria-ConectaMente`, remote `github.com/pascalcorrea/Auditoria-ConectaMente`). Prisma + PostgreSQL for data (new, isolated database — no code, DB, or auth shared with the clinical system at `E:\Dev\ConectaMente-2`). NextAuth.js v4 (Credentials provider) for role-based login (`cliente` | `medico` | `backoffice`). Deployed via PM2 + Nginx + Certbot on the same physical VPS Hostinger already running conectamente.cl (`31.97.167.199`), as a second, fully separate Linux user/database/process — not a second VPS (see Decision D5 below).

**Tech Stack:** Next.js ^15.0.0, React ^19.0.0, TypeScript ^5.0.0, Tailwind CSS ^3.4.0, NextAuth.js ^4.24.0, Prisma (latest 5.x), PostgreSQL 16, bcryptjs, Vitest + @testing-library/react for tests, PM2, Nginx, Certbot.

## Global Constraints

- Stack is fixed per the master prompt and doc 03 §1 — Next.js+TypeScript, Prisma, NextAuth.js, PostgreSQL, VPS Hostinger, PM2, Nginx, Certbot. Do not substitute (e.g. no Clerk, no Vercel, no Docker in production) without explicit user confirmation.
- **No shared code, database, or auth** with the clinical system (`E:\Dev\ConectaMente-2` / conectamente.cl). This project gets its own Postgres database, its own Postgres role, its own Linux system user on the VPS, and its own deploy SSH keypair.
- Encryption in transit (HTTPS via Certbot) and role-based access control are non-negotiable from the first commit (doc 03 §7) — every protected route must be gated by role before it's considered done, even in Fase 0's minimal slice.
- Follow doc 03 §9's phase order. This plan covers **Fase 0 only** — do not build Fase 1+ functionality (full `Organizacion`/`Caso`/`Sesion`/`Informe` schema, `/cliente`, `/medico`, `/admin/casos` routes, Daily.co, Brevo, file storage, firma electrónica) even where it would be easy to add now.
- Design tokens are ported from ConectaMente-2's **admin** surface (`app/(admin)/admin/*`), not its public marketing site — Core is an internal operations tool like `/admin`, not a marketing page (Decision D1).
- Ley 21.719 (protección de datos personales): no evaluado/clinical data models exist yet in Fase 0, so no special handling is needed this phase — flag for Fase 1 when `Caso`/`Sesion` are built.

## Decisions made in this plan (no explicit answer in docs 00–03 — flagging per the master prompt's instruction to surface assumptions)

- **D1 — Design source:** use the admin palette/font (`#0CB87E` accent green, `DM Sans`, `#0D1626` text) from `ConectaMente-2/app/(admin)/admin/*`, not the public-site Tailwind palette (`#2D6B9E` blue, `Inter`) from `ConectaMente-2/tailwind.config.ts`. Core's three portals are an operational tool, closer in nature to `/admin` than to the marketing site.
- **D2 — Component scope:** Fase 0 ports only tokens + `Button`/`Input`/`Select`/`Card` primitives (what the login page needs). Sidebar/table/badge patterns seen in `admin.module.css` are deliberately **not** ported yet — they belong to whichever Fase 2/3 task first builds a page that needs them (YAGNI; avoids building UI with no consumer).
- **D3 — Usuario schema now vs. later:** Fase 0's `Usuario` model has only the fields auth needs (`id`, `nombre`, `email`, `passwordHash`, `rol`, `activo`, `creadoEn`). `organizacionId` and `especialidad` (doc 03 §2) are added in Fase 1 alongside `Organizacion`, since adding a nullable FK to a table that doesn't exist yet has no value in Fase 0.
- **D4 — Local dev database:** use Docker Compose for a local Postgres 16 container (`docker-compose.yml`, dev-only). This isn't in the "decided stack" list, but it's a local convenience with no production impact — production still runs Postgres directly on the VPS.
- **D5 — Same VPS, not a second one:** doc 03 §1 recommends (but doesn't require) a separate DB instance "aunque sea otro VPS pequeño." Given no fixed launch date and low expected volume (doc 03 §12), this plan reuses the existing VPS (`31.97.167.199`) with a fully separate Linux user, Postgres role/database, and PM2 process — not a second VPS. Revisit if/when volume or isolation requirements change.
- **D6 — Ports:** the existing conectamente.cl app is assumed to run on port 3000 (verify in Task 5). This project's Next.js process binds to **3100** to avoid collision.

---

## Task 1: Scaffold the Next.js project and connect it to GitHub

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `.eslintrc.json`, `.gitignore`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`
- Create: `.env.example`

**Interfaces:**
- Produces: a runnable `npm run dev` Next.js 15 App Router project at the repo root, pushed to `main` on `github.com/pascalcorrea/Auditoria-ConectaMente` (remote already configured — confirmed via `git remote -v`).

- [ ] **Step 1: Scaffold with create-next-app, matching ConectaMente-2's stack**

```bash
cd "E:/Dev/Auditoria-ConectaMente"
npx create-next-app@15 . --typescript --tailwind --eslint --app --src-dir=false --import-alias "@/*" --no-turbopack
```

When prompted about the non-empty directory (it contains `docs/` and `.git/`), confirm continuing.

- [ ] **Step 2: Pin dependency versions to match the reference project**

Edit `package.json` `dependencies`/`devDependencies` so these match `E:\Dev\ConectaMente-2\package.json`:

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "autoprefixer": "^10.0.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^15.0.0",
    "postcss": "^8.0.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.0.0"
  }
}
```

Run `npm install` after editing.

- [ ] **Step 3: Verify the scaffold builds and runs**

Run: `npm run build`
Expected: `Compiled successfully`, exit code 0.

Run: `npm run dev` (in background, then check)
Run: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000`
Expected: `200`. Stop the dev server after confirming.

- [ ] **Step 4: Write `.env.example` for Fase 0's variables only**

```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
```

- [ ] **Step 5: Confirm `.gitignore` excludes secrets and build artifacts**

Verify `.gitignore` (created by `create-next-app`) includes at minimum:

```
/node_modules
/.next/
.env
.env.local
.env*.local
```

- [ ] **Step 6: Initial commit and push**

```bash
git add -A
git commit -m "chore: scaffold Next.js 15 + TypeScript project"
git push -u origin main
```

- [ ] **Step 7: Verify push succeeded**

Run: `git log --oneline -1 origin/main`
Expected: shows the commit just pushed.

---

## Task 2: Port design tokens and base UI primitives from ConectaMente-2's admin

**Files:**
- Create: `lib/design-tokens.ts`
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`
- Create: `components/ui/Button.tsx`, `components/ui/Button.test.tsx`
- Create: `components/ui/Input.tsx`, `components/ui/Input.test.tsx`
- Create: `components/ui/Select.tsx`, `components/ui/Select.test.tsx`
- Create: `components/ui/Card.tsx`, `components/ui/Card.test.tsx`
- Test config: `vitest.config.ts`, `vitest.setup.ts`

**Interfaces:**
- Produces: `Button`, `Input`, `Select`, `Card` React components under `components/ui/`, and Tailwind tokens (`bg-brand-accent`, `text-brand-text`, etc.) consumed by Task 4's login page.

- [ ] **Step 1: Install test tooling**

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 2: Configure Vitest**

Create `vitest.config.ts`:

```typescript
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

Create `vitest.setup.ts`:

```typescript
import '@testing-library/jest-dom/vitest'
```

Add to `package.json` `scripts`: `"test": "vitest run"`.

- [ ] **Step 3: Define design tokens**

Values extracted from `E:\Dev\ConectaMente-2\app\(admin)\admin\admin.module.css` and `AdminSidebar.tsx` (Decision D1).

Create `lib/design-tokens.ts`:

```typescript
export const colors = {
  brand: {
    accent: '#0CB87E',
    accentHover: '#0A9A69',
    accentSoft: '#E4F9F2',
    text: '#0D1626',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    bg: '#F8FAFC',
    bgHover: '#F1F5F9',
    border: 'rgba(15, 23, 42, 0.10)',
    borderSoft: 'rgba(15, 23, 42, 0.07)',
    danger: '#EF4444',
  },
} as const

export const fontFamily = {
  sans: ['DM Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
} as const
```

- [ ] **Step 4: Wire tokens into Tailwind config**

Edit `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'
import { colors, fontFamily } from './lib/design-tokens'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors,
      fontFamily,
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 5: Base globals.css**

Edit `app/globals.css` — replace the `create-next-app` default body styles with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');

body {
  font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: theme('colors.brand.bg');
  color: theme('colors.brand.text');
}
```

- [ ] **Step 6: Write failing test for Button**

Create `components/ui/Button.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders its label', () => {
    render(<Button>Entrar</Button>)
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('applies the accent background for the primary variant by default', () => {
    render(<Button>Entrar</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-brand-accent')
  })

  it('applies a transparent/bordered style for the secondary variant', () => {
    render(<Button variant="secondary">Cancelar</Button>)
    const btn = screen.getByRole('button')
    expect(btn).not.toHaveClass('bg-brand-accent')
    expect(btn).toHaveClass('border')
  })

  it('disables the button when disabled is passed', () => {
    render(<Button disabled>Entrar</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

- [ ] **Step 7: Run test to verify it fails**

Run: `npm run test -- Button.test.tsx`
Expected: FAIL — `Cannot find module './Button'`

- [ ] **Step 8: Implement Button**

Create `components/ui/Button.tsx`:

```tsx
import { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-brand-accent text-white hover:bg-brand-accentHover shadow-sm',
  secondary: 'bg-white text-brand-textSecondary border border-brand-border hover:border-brand-accent hover:text-brand-accent',
  danger: 'bg-brand-danger text-white hover:brightness-90',
}

export function Button({ variant = 'primary', className = '', disabled, ...rest }: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-55 ${variantClasses[variant]} ${className}`}
      {...rest}
    />
  )
}
```

- [ ] **Step 9: Run test to verify it passes**

Run: `npm run test -- Button.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 10: Write failing test for Input**

Create `components/ui/Input.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { Input } from './Input'

describe('Input', () => {
  it('renders a label associated with the input', () => {
    render(<Input label="Email" name="email" />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('shows an error message when error is passed', () => {
    render(<Input label="Email" name="email" error="Email inválido" />)
    expect(screen.getByText('Email inválido')).toBeInTheDocument()
  })

  it('marks the input as invalid when error is passed', () => {
    render(<Input label="Email" name="email" error="Email inválido" />)
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
  })
})
```

- [ ] **Step 11: Run test to verify it fails**

Run: `npm run test -- Input.test.tsx`
Expected: FAIL — `Cannot find module './Input'`

- [ ] **Step 12: Implement Input**

Create `components/ui/Input.tsx`:

```tsx
import { InputHTMLAttributes, useId } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function Input({ label, error, id, className = '', ...rest }: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-xs font-medium uppercase tracking-wide text-brand-textSecondary">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? 'true' : undefined}
        className={`rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-sm text-brand-text outline-none transition focus:border-brand-accent focus:bg-white focus:ring-2 focus:ring-brand-accent/20 ${className}`}
        {...rest}
      />
      {error && <span className="text-xs text-brand-danger">{error}</span>}
    </div>
  )
}
```

- [ ] **Step 13: Run test to verify it passes**

Run: `npm run test -- Input.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 14: Write failing test for Select**

Create `components/ui/Select.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { Select } from './Select'

describe('Select', () => {
  const options = [
    { value: 'cliente', label: 'Cliente' },
    { value: 'medico', label: 'Médico' },
  ]

  it('renders a label associated with the select', () => {
    render(<Select label="Rol" name="rol" options={options} />)
    expect(screen.getByLabelText('Rol')).toBeInTheDocument()
  })

  it('renders every option passed', () => {
    render(<Select label="Rol" name="rol" options={options} />)
    expect(screen.getByRole('option', { name: 'Cliente' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Médico' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 15: Run test to verify it fails**

Run: `npm run test -- Select.test.tsx`
Expected: FAIL — `Cannot find module './Select'`

- [ ] **Step 16: Implement Select**

Create `components/ui/Select.tsx`:

```tsx
import { SelectHTMLAttributes, useId } from 'react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: SelectOption[]
}

export function Select({ label, options, id, className = '', ...rest }: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-xs font-medium uppercase tracking-wide text-brand-textSecondary">
        {label}
      </label>
      <select
        id={selectId}
        className={`rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-sm text-brand-text outline-none transition focus:border-brand-accent focus:bg-white focus:ring-2 focus:ring-brand-accent/20 ${className}`}
        {...rest}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
```

- [ ] **Step 17: Run test to verify it passes**

Run: `npm run test -- Select.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 18: Write failing test for Card**

Create `components/ui/Card.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { Card } from './Card'

describe('Card', () => {
  it('renders its children', () => {
    render(<Card>contenido</Card>)
    expect(screen.getByText('contenido')).toBeInTheDocument()
  })
})
```

- [ ] **Step 19: Run test to verify it fails**

Run: `npm run test -- Card.test.tsx`
Expected: FAIL — `Cannot find module './Card'`

- [ ] **Step 20: Implement Card**

Create `components/ui/Card.tsx`:

```tsx
import { HTMLAttributes } from 'react'

export function Card({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-xl border border-brand-borderSoft bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)] ${className}`}
      {...rest}
    />
  )
}
```

- [ ] **Step 21: Run all Task 2 tests together**

Run: `npm run test`
Expected: PASS — 4 test files, 10 tests total, 0 failures.

- [ ] **Step 22: Verify build still succeeds**

Run: `npm run build`
Expected: `Compiled successfully`.

- [ ] **Step 23: Commit**

```bash
git add lib/design-tokens.ts tailwind.config.ts app/globals.css components/ui vitest.config.ts vitest.setup.ts package.json package-lock.json
git commit -m "feat: port design tokens and base UI primitives from ConectaMente admin"
git push
```

---

## Task 3: Prisma + PostgreSQL wiring

**Files:**
- Create: `docker-compose.yml`
- Create: `prisma/schema.prisma`
- Create: `lib/prisma.ts`
- Create: `lib/prisma.test.ts`
- Modify: `.env.example`, `.gitignore`

**Interfaces:**
- Produces: `prisma` singleton client at `lib/prisma.ts` (`import { prisma } from '@/lib/prisma'`), `Usuario` Prisma model with fields `id, nombre, email, passwordHash, rol (Rol enum), activo, creadoEn` — consumed by Task 4's `verifyCredentials`.

- [ ] **Step 1: Local Postgres via Docker Compose (Decision D4)**

Create `docker-compose.yml`:

```yaml
services:
  db:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_USER: auditoria_dev
      POSTGRES_PASSWORD: auditoria_dev_local_only
      POSTGRES_DB: auditoria_conectamente_dev
    ports:
      - '5433:5432'
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

Note: host port `5433` deliberately avoids colliding with the VPS's existing Postgres port convention (`5434`, seen in `ConectaMente-2/PHASE_B_NEXT_STEPS.md`) — this is local-only, but keeping distinct ports avoids confusion when both are running.

- [ ] **Step 2: Start local Postgres and verify**

```bash
docker compose up -d
```

Run: `docker compose ps`
Expected: `db` service shows `running (healthy)` or `Up`.

- [ ] **Step 3: Set local DATABASE_URL**

Create `.env.local` (gitignored — do not commit):

```
DATABASE_URL=postgresql://auditoria_dev:auditoria_dev_local_only@localhost:5433/auditoria_conectamente_dev
NEXTAUTH_SECRET=dev-only-not-for-production-CHANGE-ME
NEXTAUTH_URL=http://localhost:3000
```

Update `.env.example` to match Task 1 Step 4 (unchanged — no new variables needed yet).

- [ ] **Step 4: Install Prisma**

```bash
npm install -D prisma
npm install @prisma/client bcryptjs
npm install -D @types/bcryptjs
npx prisma init --datasource-provider postgresql
```

This creates `prisma/schema.prisma` and `.env` — delete the auto-generated `.env` (we use `.env.local`, already created in Step 3) and confirm `prisma/schema.prisma` reads `env("DATABASE_URL")`.

- [ ] **Step 5: Define the Fase 0 schema (Decision D3)**

Replace `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Rol {
  cliente
  medico
  backoffice
}

model Usuario {
  id           String   @id @default(cuid())
  nombre       String
  email        String   @unique
  passwordHash String
  rol          Rol
  activo       Boolean  @default(true)
  creadoEn     DateTime @default(now())

  @@index([email])
}
```

- [ ] **Step 6: Run the first migration**

```bash
npx prisma migrate dev --name init
```

Expected output includes: `Your database is now in sync with your schema.` and generates `prisma/migrations/<timestamp>_init/migration.sql`.

- [ ] **Step 7: Verify the table exists**

```bash
docker compose exec db psql -U auditoria_dev -d auditoria_conectamente_dev -c "\dt"
```

Expected: lists `Usuario` (and `_prisma_migrations`).

- [ ] **Step 8: Create the Prisma client singleton**

Create `lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

- [ ] **Step 9: Write failing integration test for the Prisma connection**

Create `lib/prisma.test.ts`:

```typescript
import { prisma } from './prisma'

describe('prisma client', () => {
  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('connects to the database and can create + read a Usuario', async () => {
    const usuario = await prisma.usuario.create({
      data: {
        nombre: 'Test Backoffice',
        email: `test-${Date.now()}@example.com`,
        passwordHash: 'irrelevant-for-this-test',
        rol: 'backoffice',
      },
    })

    const found = await prisma.usuario.findUnique({ where: { id: usuario.id } })
    expect(found?.email).toBe(usuario.email)

    await prisma.usuario.delete({ where: { id: usuario.id } })
  })
})
```

- [ ] **Step 10: Run test to verify it fails**

First, temporarily stop the DB to confirm the test actually exercises a real connection:

Run: `docker compose stop db && npm run test -- lib/prisma.test.ts`
Expected: FAIL — connection error (`Can't reach database server`).

Run: `docker compose start db` to restore it.

- [ ] **Step 11: Run test to verify it passes**

Run: `npm run test -- lib/prisma.test.ts`
Expected: PASS (1 test).

- [ ] **Step 12: Ensure generated Prisma client and local env are gitignored**

Confirm `.gitignore` includes:

```
/node_modules
/.next/
.env
.env.local
.env*.local
```

(`node_modules/.prisma` is inside `/node_modules`, already covered.)

- [ ] **Step 13: Commit**

```bash
git add docker-compose.yml prisma lib/prisma.ts lib/prisma.test.ts package.json package-lock.json .env.example
git commit -m "feat: wire up Prisma + PostgreSQL with Usuario model"
git push
```

---

## Task 4: NextAuth v4 role-based authentication

**Files:**
- Create: `lib/route-access.ts`, `lib/route-access.test.ts`
- Create: `lib/auth-credentials.ts`, `lib/auth-credentials.test.ts`
- Create: `lib/auth.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`
- Create: `middleware.ts`
- Create: `app/login/page.tsx`, `app/login/LoginForm.tsx`
- Create: `app/admin/page.tsx` (smoke-test protected page)
- Create: `prisma/seed.ts`
- Modify: `package.json` (seed config), `.env.example`

**Interfaces:**
- Consumes: `prisma` from `lib/prisma.ts` (Task 3), `Button`/`Input` from `components/ui/*` (Task 2).
- Produces: `getRequiredRole(pathname: string): Rol | null` (`lib/route-access.ts`), `verifyCredentials(email: string, password: string): Promise<Usuario | null>` (`lib/auth-credentials.ts`), NextAuth session with `session.user.rol: Rol`.

- [ ] **Step 1: Install NextAuth and types**

```bash
npm install next-auth@^4.24.0
```

- [ ] **Step 2: Write failing test for route-access logic**

Create `lib/route-access.test.ts`:

```typescript
import { getRequiredRole } from './route-access'

describe('getRequiredRole', () => {
  it('returns null for public routes', () => {
    expect(getRequiredRole('/login')).toBeNull()
    expect(getRequiredRole('/')).toBeNull()
  })

  it('requires cliente for /cliente routes', () => {
    expect(getRequiredRole('/cliente')).toBe('cliente')
    expect(getRequiredRole('/cliente/casos/123')).toBe('cliente')
  })

  it('requires medico for /medico routes', () => {
    expect(getRequiredRole('/medico/casos')).toBe('medico')
  })

  it('requires backoffice for /admin routes', () => {
    expect(getRequiredRole('/admin')).toBe('backoffice')
    expect(getRequiredRole('/admin/usuarios')).toBe('backoffice')
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test -- route-access.test.ts`
Expected: FAIL — `Cannot find module './route-access'`

- [ ] **Step 4: Implement route-access**

Create `lib/route-access.ts`:

```typescript
import type { Rol } from '@prisma/client'

const ROLE_PREFIXES: Array<{ prefix: string; role: Rol }> = [
  { prefix: '/cliente', role: 'cliente' },
  { prefix: '/medico', role: 'medico' },
  { prefix: '/admin', role: 'backoffice' },
]

export function getRequiredRole(pathname: string): Rol | null {
  const match = ROLE_PREFIXES.find(({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  return match?.role ?? null
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- route-access.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 6: Write failing test for credential verification**

Create `lib/auth-credentials.test.ts`:

```typescript
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { verifyCredentials } from './auth-credentials'

describe('verifyCredentials', () => {
  const email = `auth-test-${Date.now()}@example.com`
  const plainPassword = 'correct-horse-battery-staple'

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash(plainPassword, 10)
    await prisma.usuario.create({
      data: { nombre: 'Auth Test', email, passwordHash, rol: 'backoffice' },
    })
  })

  afterAll(async () => {
    await prisma.usuario.deleteMany({ where: { email } })
    await prisma.$disconnect()
  })

  it('returns the usuario when the password is correct', async () => {
    const result = await verifyCredentials(email, plainPassword)
    expect(result?.email).toBe(email)
  })

  it('returns null when the password is wrong', async () => {
    const result = await verifyCredentials(email, 'wrong-password')
    expect(result).toBeNull()
  })

  it('returns null when the user does not exist', async () => {
    const result = await verifyCredentials('nobody@example.com', plainPassword)
    expect(result).toBeNull()
  })

  it('returns null when the usuario is inactive', async () => {
    await prisma.usuario.update({ where: { email }, data: { activo: false } })
    const result = await verifyCredentials(email, plainPassword)
    expect(result).toBeNull()
    await prisma.usuario.update({ where: { email }, data: { activo: true } })
  })
})
```

- [ ] **Step 7: Run test to verify it fails**

Run: `npm run test -- auth-credentials.test.ts`
Expected: FAIL — `Cannot find module './auth-credentials'`

- [ ] **Step 8: Implement verifyCredentials**

Create `lib/auth-credentials.ts`:

```typescript
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import type { Usuario } from '@prisma/client'

export async function verifyCredentials(email: string, password: string): Promise<Usuario | null> {
  const usuario = await prisma.usuario.findUnique({ where: { email } })
  if (!usuario || !usuario.activo) return null

  const passwordMatches = await bcrypt.compare(password, usuario.passwordHash)
  if (!passwordMatches) return null

  return usuario
}
```

- [ ] **Step 9: Run test to verify it passes**

Run: `npm run test -- auth-credentials.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 10: Configure NextAuth**

Create `lib/auth.ts`:

```typescript
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { verifyCredentials } from './auth-credentials'

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
        return { id: usuario.id, name: usuario.nombre, email: usuario.email, rol: usuario.rol }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.rol = (user as { rol: string }).rol
      return token
    },
    async session({ session, token }) {
      if (session.user) (session.user as { rol?: string }).rol = token.rol as string
      return session
    },
  },
}
```

Create `app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
```

- [ ] **Step 11: Extend the NextAuth session type**

Create `types/next-auth.d.ts`:

```typescript
import type { Rol } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id?: string
      name?: string | null
      email?: string | null
      rol?: Rol
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    rol?: Rol
  }
}
```

- [ ] **Step 12: Role-gating middleware**

Create `middleware.ts`:

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getRequiredRole } from '@/lib/route-access'

export async function middleware(request: NextRequest) {
  const requiredRole = getRequiredRole(request.nextUrl.pathname)
  if (!requiredRole) return NextResponse.next()

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (token.rol !== requiredRole) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/cliente/:path*', '/medico/:path*', '/admin/:path*'],
}
```

- [ ] **Step 13: Login page using the ported design system**

Create `app/login/LoginForm.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError('Email o contraseña incorrectos')
      return
    }

    router.push(searchParams.get('callbackUrl') ?? '/')
  }

  return (
    <Card className="w-full max-w-sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h1 className="text-lg font-medium text-brand-text">Acceso ConectaMente Core</h1>
        <Input
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Contraseña"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          error={error ?? undefined}
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Ingresando…' : 'Ingresar'}
        </Button>
      </form>
    </Card>
  )
}
```

Create `app/login/page.tsx`:

```tsx
import { Suspense } from 'react'
import { LoginForm } from './LoginForm'

export const metadata = { title: 'Acceso — ConectaMente Core' }

export default function LoginPage() {
  return (
    <div
      style={{ background: 'linear-gradient(135deg, #EDF0F5 0%, #E8EEF6 50%, #EAF2ED 100%)' }}
      className="flex min-h-screen items-center justify-center p-4"
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  )
}
```

- [ ] **Step 14: Session provider wrapper**

Create `app/providers.tsx`:

```tsx
'use client'

import { SessionProvider } from 'next-auth/react'
import type { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
```

Edit `app/layout.tsx` to wrap `{children}` with `<Providers>` (import from `./providers`).

- [ ] **Step 15: Smoke-test protected page**

Create `app/admin/page.tsx`:

```tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function AdminHome() {
  const session = await getServerSession(authOptions)
  return (
    <div className="p-8">
      <h1 className="text-lg font-medium text-brand-text">Backoffice</h1>
      <p className="text-sm text-brand-textSecondary">Sesión: {session?.user?.email} ({session?.user?.rol})</p>
    </div>
  )
}
```

- [ ] **Step 16: Seed script for a smoke-test backoffice user**

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('ChangeMe123!', 10)
  await prisma.usuario.upsert({
    where: { email: 'backoffice@conectamente.cl' },
    update: {},
    create: {
      nombre: 'Backoffice Demo',
      email: 'backoffice@conectamente.cl',
      passwordHash,
      rol: 'backoffice',
    },
  })
  console.log('Seeded backoffice@conectamente.cl / ChangeMe123!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

Add to `package.json`:

```json
{
  "prisma": { "seed": "tsx prisma/seed.ts" },
  "scripts": { "seed": "prisma db seed" }
}
```

```bash
npm install -D tsx
```

- [ ] **Step 17: Set a real NEXTAUTH_SECRET for local dev**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output into `.env.local`'s `NEXTAUTH_SECRET` (replacing the `dev-only-not-for-production-CHANGE-ME` placeholder from Task 3 Step 3).

- [ ] **Step 18: Run all tests**

Run: `npm run test`
Expected: PASS — all test files from Tasks 2–4 green (route-access: 4, auth-credentials: 4, prisma: 1, ui components: 10).

- [ ] **Step 19: Manual end-to-end verification in the browser**

```bash
npm run seed
npm run dev
```

In a browser:
1. Visit `http://localhost:3000/admin` → expect redirect to `/login?callbackUrl=%2Fadmin`.
2. Log in with `backoffice@conectamente.cl` / `ChangeMe123!` → expect redirect to `/admin`, showing "Sesión: backoffice@conectamente.cl (backoffice)".
3. Visit `http://localhost:3000/cliente` while logged in as backoffice → expect redirect to `/login` (wrong role).

Stop the dev server after confirming.

- [ ] **Step 20: Commit**

```bash
git add lib/route-access.ts lib/route-access.test.ts lib/auth-credentials.ts lib/auth-credentials.test.ts lib/auth.ts app/api/auth app/login app/admin app/providers.tsx app/layout.tsx middleware.ts types/next-auth.d.ts prisma/seed.ts package.json package-lock.json
git commit -m "feat: role-based auth with NextAuth v4 (cliente/medico/backoffice)"
git push
```

---

## Task 5: Provision the VPS and deploy

**Prerequisite checkpoint (manual, before starting this task):** SSH access to `31.97.167.199` as `root` must be confirmed working with a key (not the shared password — see the conversation note on rotating it). Either:
- the `~/.ssh/claude-session` key has been added to `root`'s `authorized_keys` on the VPS, or
- the operator runs the commands in this task directly and reports output back.

**Files:**
- Create: `.github/workflows/deploy.yml`
- Create: `ecosystem.config.js` (PM2)
- Create: `scripts/vps-provision.sh` (run once, on the VPS, as root)

**Interfaces:**
- Consumes: the built Next.js app from Tasks 1–4, `DATABASE_URL`/`NEXTAUTH_SECRET`/`NEXTAUTH_URL` env vars.
- Produces: `https://core.conectamente.cl` serving the login page over HTTPS, PM2 process `auditoria-conectamente` on port 3100.

- [ ] **Step 1: Discover current VPS state (run over SSH, do not assume)**

```bash
ssh root@31.97.167.199 "node -v; pm2 -v; nginx -v; systemctl is-active postgresql 2>&1; docker ps 2>&1 | grep -i postgres; ss -ltnp | grep -E ':(3000|3100)\b'; certbot --version"
```

Record the output. This determines:
- whether Node 20.x needs installing (skip Step 2 sub-steps if already ≥20),
- whether Postgres is native (`systemctl`) or Dockerized (`docker ps` shows a container) — this changes how Step 4's `CREATE ROLE`/`CREATE DATABASE` commands are invoked (direct `psql` vs `docker exec <container> psql`),
- confirms port 3000 is taken (existing app) so this project's 3100 (Decision D6) is free.

- [ ] **Step 2: Generate a dedicated deploy SSH keypair (local machine, no VPS access needed)**

```bash
ssh-keygen -t ed25519 -f ~/.ssh/auditoria_deploy -N "" -C "auditoria-conectamente-deploy"
```

This key is dedicated to this project's CI deploys — it is **not** the personal `claude-session` key, matching the isolation principle in Global Constraints.

- [ ] **Step 3: Create the dedicated system user and authorize the deploy key**

```bash
ssh root@31.97.167.199 "useradd -m -s /bin/bash auditoria && mkdir -p /home/auditoria/.ssh && chmod 700 /home/auditoria/.ssh"
cat ~/.ssh/auditoria_deploy.pub | ssh root@31.97.167.199 "cat >> /home/auditoria/.ssh/authorized_keys && chmod 600 /home/auditoria/.ssh/authorized_keys && chown -R auditoria:auditoria /home/auditoria/.ssh"
```

Verify:

```bash
ssh -i ~/.ssh/auditoria_deploy auditoria@31.97.167.199 "whoami"
```

Expected: `auditoria`

- [ ] **Step 4: Create the isolated Postgres role and database**

Generate a strong password without ever writing it to a file or this plan:

```bash
openssl rand -base64 24
```

Then, substituting `<GENERATED_PASSWORD>` with that value directly in the command (never saved anywhere else) — using the native-`psql` form if Step 1 showed native Postgres, or prefixing with `docker exec <container>` if Dockerized:

```bash
ssh root@31.97.167.199 "sudo -u postgres psql -c \"CREATE ROLE auditoria_app WITH LOGIN PASSWORD '<GENERATED_PASSWORD>';\" -c \"CREATE DATABASE auditoria_conectamente OWNER auditoria_app;\""
```

Keep that generated password in your password manager — it goes directly into the `DATABASE_URL` GitHub secret in Step 9, never into a file in this repo.

- [ ] **Step 5: Install/verify Node.js 20 LTS (skip if Step 1 already showed ≥20)**

```bash
ssh root@31.97.167.199 "curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs"
```

Verify: `ssh root@31.97.167.199 "node -v"` → expected `v20.x.x`

- [ ] **Step 6: Install PM2 globally (skip if already present)**

```bash
ssh root@31.97.167.199 "npm install -g pm2"
```

- [ ] **Step 7: Nginx server block for core.conectamente.cl**

```bash
ssh root@31.97.167.199 'cat > /etc/nginx/sites-available/core.conectamente.cl <<EOF
server {
    listen 80;
    server_name core.conectamente.cl;

    location / {
        proxy_pass http://127.0.0.1:3100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
ln -sf /etc/nginx/sites-available/core.conectamente.cl /etc/nginx/sites-enabled/core.conectamente.cl
nginx -t && systemctl reload nginx'
```

Expected: `nginx: configuration file /etc/nginx/nginx.conf test is successful`

- [ ] **Step 8: DNS — add the A record for core.conectamente.cl**

conectamente.cl's nameservers are `apollo.dns-parking.com` / `athena.dns-parking.com` (confirmed via `nslookup -type=NS conectamente.cl`), consistent with a Hostinger-managed DNS zone. Two ways to do this — use whichever is available when this task runs:

- **Via Hostinger hPanel:** Domains → `conectamente.cl` → DNS / Nameservers → Manage DNS records → Add record: type `A`, name `core`, points to `31.97.167.199`, TTL `300`.
- **Via the Hostinger DNS MCP server** (registered at user scope as `hostinger-dns` — needs a session restart to load, see conversation note): once its tools are available, use them to create the same `A` record programmatically.

Verify propagation before proceeding to Step 9:

```bash
dig core.conectamente.cl +short
```

Expected: `31.97.167.199` (may take a few minutes to propagate; retry if empty).

- [ ] **Step 9: Register GitHub Actions secrets**

```bash
cd "E:/Dev/Auditoria-ConectaMente"
gh secret set SSH_HOST --body "31.97.167.199"
gh secret set SSH_USER --body "auditoria"
gh secret set SSH_PRIVATE_KEY < ~/.ssh/auditoria_deploy
gh secret set PROJECT_DIR --body "/home/auditoria/auditoria-conectamente"
gh secret set DATABASE_URL --body "postgresql://auditoria_app:<GENERATED_PASSWORD>@127.0.0.1:5432/auditoria_conectamente"
gh secret set NEXTAUTH_SECRET --body "$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")"
gh secret set NEXTAUTH_URL --body "https://core.conectamente.cl"
```

(Adjust the `DATABASE_URL` port to `5433`/whatever Step 1 found if native Postgres isn't on the default 5432.)

Verify:

```bash
gh secret list
```

Expected: lists all 7 secrets.

- [ ] **Step 10: Clone the repo into place on the VPS**

```bash
ssh -i ~/.ssh/auditoria_deploy auditoria@31.97.167.199 "git clone https://github.com/pascalcorrea/Auditoria-ConectaMente.git /home/auditoria/auditoria-conectamente"
```

- [ ] **Step 11: PM2 ecosystem file**

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'auditoria-conectamente',
      script: 'node_modules/.bin/next',
      args: 'start -p 3100',
      cwd: __dirname,
      env: { NODE_ENV: 'production' },
    },
  ],
}
```

- [ ] **Step 12: GitHub Actions deploy workflow**

Create `.github/workflows/deploy.yml` (mirrors `ConectaMente-2/.github/workflows/deploy.yml`, adapted to this project's user/port/migration step):

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
            ENV_FILE="${{ secrets.PROJECT_DIR }}/.env.local"
            cat > "$ENV_FILE" <<EOF
            DATABASE_URL=${{ secrets.DATABASE_URL }}
            NEXTAUTH_SECRET=${{ secrets.NEXTAUTH_SECRET }}
            NEXTAUTH_URL=${{ secrets.NEXTAUTH_URL }}
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
            npx prisma migrate deploy || exit 1
            npm run build || exit 1
            pm2 startOrRestart ecosystem.config.js || exit 1
```

- [ ] **Step 13: First deploy**

```bash
git add ecosystem.config.js .github/workflows/deploy.yml
git commit -m "chore: VPS deploy workflow and PM2 config"
git push
```

Watch the run: `gh run watch`
Expected: workflow completes with conclusion `success`.

- [ ] **Step 14: Certbot — issue the SSL certificate**

Only after Step 8's DNS check confirms `core.conectamente.cl` resolves to `31.97.167.199`:

```bash
ssh root@31.97.167.199 "certbot --nginx -d core.conectamente.cl --non-interactive --agree-tos -m pascalcorrea.web@gmail.com --redirect"
```

Expected output includes: `Successfully received certificate` and `Congratulations!`.

- [ ] **Step 15: Seed the production database**

```bash
ssh -i ~/.ssh/auditoria_deploy auditoria@31.97.167.199 "cd /home/auditoria/auditoria-conectamente && npm run seed"
```

Expected: `Seeded backoffice@conectamente.cl / ChangeMe123!` — then immediately change this password manually via a one-off script or note it for rotation before real backoffice users are onboarded (this seed is for smoke-testing Fase 0 only).

- [ ] **Step 16: End-to-end verification**

```bash
curl -sI https://core.conectamente.cl/login
```

Expected: `HTTP/2 200`

In a browser: visit `https://core.conectamente.cl/admin`, confirm redirect to `/login`, log in with the seeded backoffice user, confirm redirect back to `/admin` showing the session email and role, over a valid HTTPS connection (padlock, no certificate warnings).

- [ ] **Step 17: Rotate the shared root password**

Since the root password was shared in this conversation, rotate it now that key-based access works for both `root` (if configured) and the dedicated `auditoria` deploy user:

```bash
ssh root@31.97.167.199 "passwd"
```

Run interactively (not via a scripted command with the password inline) so the new password is never captured in any log.

---

## Task 6: Database backup strategy

**Files:**
- Create: `scripts/backup-db.sh` (on the VPS)

**Interfaces:**
- Produces: nightly compressed dumps at `/home/auditoria/backups/auditoria_conectamente_YYYY-MM-DD.sql.gz`, retained 14 days.

- [ ] **Step 1: Write the backup script**

```bash
ssh -i ~/.ssh/auditoria_deploy auditoria@31.97.167.199 'cat > /home/auditoria/scripts/backup-db.sh <<'"'"'EOF'"'"'
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/home/auditoria/backups"
DATE=$(date +%F)
FILE="$BACKUP_DIR/auditoria_conectamente_$DATE.sql.gz"

mkdir -p "$BACKUP_DIR"
pg_dump -U auditoria_app -h 127.0.0.1 auditoria_conectamente | gzip > "$FILE"

find "$BACKUP_DIR" -name "auditoria_conectamente_*.sql.gz" -mtime +14 -delete

echo "Backup written to $FILE"
EOF
mkdir -p /home/auditoria/scripts
chmod +x /home/auditoria/scripts/backup-db.sh'
```

Note: `pg_dump` will prompt for a password unless a `~/.pgpass` entry exists. Set that up in the same step:

```bash
ssh -i ~/.ssh/auditoria_deploy auditoria@31.97.167.199 "echo '127.0.0.1:5432:auditoria_conectamente:auditoria_app:<GENERATED_PASSWORD>' > ~/.pgpass && chmod 600 ~/.pgpass"
```

(Use the same `<GENERATED_PASSWORD>` from Task 5 Step 4 — adjust the port if native Postgres isn't on 5432, per Task 5 Step 1's discovery.)

- [ ] **Step 2: Run the backup manually and verify**

```bash
ssh -i ~/.ssh/auditoria_deploy auditoria@31.97.167.199 "/home/auditoria/scripts/backup-db.sh"
```

Expected: `Backup written to /home/auditoria/backups/auditoria_conectamente_<today>.sql.gz`

Run: `ssh -i ~/.ssh/auditoria_deploy auditoria@31.97.167.199 "ls -la /home/auditoria/backups/"`
Expected: shows the `.sql.gz` file with non-zero size.

- [ ] **Step 3: Verify the dump actually restores**

```bash
ssh -i ~/.ssh/auditoria_deploy auditoria@31.97.167.199 "sudo -u postgres psql -c \"CREATE DATABASE restore_test OWNER auditoria_app;\" && gunzip -c /home/auditoria/backups/auditoria_conectamente_$(date +%F).sql.gz | psql -U auditoria_app -h 127.0.0.1 restore_test && sudo -u postgres psql -c \"DROP DATABASE restore_test;\""
```

Expected: the `psql` restore runs without errors (table creation + any seeded rows replay cleanly), and the scratch database is dropped afterward.

- [ ] **Step 4: Schedule the nightly cron job**

```bash
ssh -i ~/.ssh/auditoria_deploy auditoria@31.97.167.199 "(crontab -l 2>/dev/null; echo '0 3 * * * /home/auditoria/scripts/backup-db.sh >> /home/auditoria/backups/backup.log 2>&1') | crontab -"
```

Verify: `ssh -i ~/.ssh/auditoria_deploy auditoria@31.97.167.199 "crontab -l"`
Expected: shows the new line running at 3am daily.

- [ ] **Step 5: Document the off-box copy gap**

This script protects against database corruption but not VPS loss. Until Cloudflare R2 is provisioned (Fase 3/4, per doc 03 §10), periodically copy backups off the VPS manually:

```bash
scp -i ~/.ssh/auditoria_deploy auditoria@31.97.167.199:/home/auditoria/backups/auditoria_conectamente_$(date +%F).sql.gz .
```

Note this as a manual weekly task until automated off-box upload is added alongside R2 in a later phase — do not build R2 integration now (out of Fase 0 scope per Global Constraints).

---

## End of Fase 0

At this point: `https://core.conectamente.cl` is live, serving a role-gated login backed by an isolated Postgres database on the shared VPS, with automated deploys on push to `main` and nightly DB backups. Per the master prompt's working rules, **stop here and report back** — what was built, the decisions in this plan's "Decisions made" section, and what's pending — before starting Fase 1 (full data model: `Organizacion`, `Caso`, `Sesion`, `Informe`).

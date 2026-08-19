# ConectaMente Core™ — Fase 9 (Admin Features) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build admin interface for user and organization management. Enable ops team to manage platform without database access.

**Architecture:** New `/admin/usuarios` and `/admin/organizaciones` pages. Extend existing backoffice admin portal.

**Tech Stack:** Existing (Next.js 15, Prisma, PostgreSQL).

---

## Task 1: User Management Backend

**Files:**
- Create: `lib/admin-usuarios.ts` (CRUD helpers)
- Create: `lib/admin-usuarios.test.ts` (smoke tests)

**Interfaces:**
- Consumes: Prisma usuario model
- Produces: list, create, update, deactivate usuarios

- [ ] **Step 1: Create admin-usuarios.ts**

```typescript
import { prisma } from './prisma'
import type { Rol } from '@prisma/client'

export async function listarUsuarios(filtro?: { rol?: Rol; activo?: boolean }) {
  return prisma.usuario.findMany({
    where: {
      ...(filtro?.rol && { rol: filtro.rol }),
      ...(filtro?.activo !== undefined && { activo: filtro.activo }),
    },
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      activo: true,
      organizacionId: true,
    },
    orderBy: { nombre: 'asc' },
  })
}

export async function crearUsuario(data: {
  nombre: string
  email: string
  rol: Rol
  organizacionId?: string
}) {
  return prisma.usuario.create({
    data: {
      nombre: data.nombre,
      email: data.email,
      rol: data.rol,
      organizacionId: data.organizacionId,
      passwordHash: '', // set via invite link
      activo: false, // must accept invite
    },
  })
}

export async function actualizarUsuario(
  id: string,
  data: { nombre?: string; rol?: Rol; activo?: boolean }
) {
  return prisma.usuario.update({
    where: { id },
    data,
  })
}

export async function desactivarUsuario(id: string) {
  return prisma.usuario.update({
    where: { id },
    data: { activo: false },
  })
}
```

- [ ] **Step 2: Create smoke tests**

```typescript
import { describe, it, expect } from 'vitest'
import { listarUsuarios, crearUsuario } from './admin-usuarios'

describe('admin-usuarios', () => {
  it('listarUsuarios returns usuarios', async () => {
    const usuarios = await listarUsuarios()
    expect(Array.isArray(usuarios)).toBe(true)
  })

  it('crearUsuario creates usuario with rol', async () => {
    const usuario = await crearUsuario({
      nombre: 'Test User',
      email: 'test@test.com',
      rol: 'cliente',
    })
    expect(usuario.rol).toBe('cliente')
  })
})
```

- [ ] **Step 3: Commit**

```bash
git add lib/admin-usuarios.ts lib/admin-usuarios.test.ts
git commit -m "feat: admin usuario CRUD helpers + tests"
git push
```

---

## Task 2: Organization Management Backend

**Files:**
- Create: `lib/admin-organizaciones.ts` (CRUD helpers)

**Interfaces:**
- Consumes: Prisma organizacion model
- Produces: list, create, update organizaciones

- [ ] **Step 1: Create admin-organizaciones.ts**

```typescript
import { prisma } from './prisma'

export async function listarOrganizaciones() {
  return prisma.organizacion.findMany({
    include: {
      _count: {
        select: { usuarios: true, casos: true },
      },
    },
    orderBy: { nombre: 'asc' },
  })
}

export async function crearOrganizacion(data: {
  nombre: string
  rut: string
  contacto: string
}) {
  return prisma.organizacion.create({
    data,
  })
}

export async function actualizarOrganizacion(
  id: string,
  data: { nombre?: string; contacto?: string }
) {
  return prisma.organizacion.update({
    where: { id },
    data,
  })
}

export async function obtenerOrganizacionConUsuarios(id: string) {
  return prisma.organizacion.findUnique({
    where: { id },
    include: {
      usuarios: {
        select: { id: true, nombre: true, email: true, rol: true },
      },
    },
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/admin-organizaciones.ts
git commit -m "feat: admin organizacion CRUD helpers"
git push
```

---

## Task 3: User Management UI

**Files:**
- Create: `app/admin/usuarios/page.tsx` (list + create form)
- Create: `app/admin/usuarios/[id]/page.tsx` (detail + edit form)

**Interfaces:**
- Consumes: admin-usuarios helpers
- Produces: user management interface

- [ ] **Step 1: Create usuarios listing page**

Create `app/admin/usuarios/page.tsx`:

```typescript
import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { listarUsuarios } from '@/lib/admin-usuarios'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminUsuariosPage() {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'backoffice') notFound()

  const usuarios = await listarUsuarios()

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-lg font-medium text-brand-text">Usuarios</h1>
        <Link href="/admin/usuarios/nuevo">
          <Button>Agregar usuario</Button>
        </Link>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-bgSecondary">
            <tr className="text-xs uppercase tracking-wide text-brand-textSecondary">
              <th className="p-3 text-left">Nombre</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Rol</th>
              <th className="p-3 text-left">Estado</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-t border-brand-borderSoft">
                <td className="p-3">{u.nombre}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.rol}</td>
                <td className="p-3">{u.activo ? 'Activo' : 'Inactivo'}</td>
                <td className="p-3 text-center">
                  <Link href={`/admin/usuarios/${u.id}`}>
                    <Button variant="secondary" size="sm">
                      Editar
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Create usuario detail/edit page**

Create `app/admin/usuarios/[id]/page.tsx`:

```typescript
import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { actualizarUsuario } from '@/lib/admin-usuarios'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export const dynamic = 'force-dynamic'

async function handleUpdate(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  const nombre = formData.get('nombre') as string
  const activo = formData.get('activo') === 'true'

  await actualizarUsuario(id, { nombre, activo })
}

export default async function AdminUsuarioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'backoffice') notFound()

  const { id } = await params
  const usuario = await prisma.usuario.findUnique({ where: { id } })

  if (!usuario) notFound()

  return (
    <div className="p-8">
      <h1 className="text-lg font-medium text-brand-text mb-6">{usuario.nombre}</h1>

      <Card className="max-w-md p-6">
        <form action={handleUpdate} className="space-y-4">
          <input type="hidden" name="id" value={usuario.id} />

          <div>
            <label className="block text-sm font-medium text-brand-text mb-1">Nombre</label>
            <input
              type="text"
              name="nombre"
              defaultValue={usuario.nombre}
              className="w-full px-3 py-2 border border-brand-borderSoft rounded text-brand-text"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-text mb-1">Email</label>
            <input
              type="email"
              value={usuario.email}
              disabled
              className="w-full px-3 py-2 bg-brand-bgSecondary text-brand-textSecondary rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-text mb-1">Rol</label>
            <input
              type="text"
              value={usuario.rol}
              disabled
              className="w-full px-3 py-2 bg-brand-bgSecondary text-brand-textSecondary rounded"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="activo"
              value="true"
              defaultChecked={usuario.activo}
              className="w-4 h-4"
            />
            <label className="text-sm text-brand-text">Activo</label>
          </div>

          <Button type="submit">Guardar cambios</Button>
        </form>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/admin/usuarios/
git commit -m "feat: admin usuario management UI (list + edit)"
git push
```

---

## Task 4: Organization Management UI

**Files:**
- Create: `app/admin/organizaciones/page.tsx`

**Interfaces:**
- Consumes: admin-organizaciones helpers
- Produces: organization management interface

- [ ] **Step 1: Create organizaciones page**

Create `app/admin/organizaciones/page.tsx`:

```typescript
import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { listarOrganizaciones } from '@/lib/admin-organizaciones'
import { Card } from '@/components/ui/Card'

export const dynamic = 'force-dynamic'

export default async function AdminOrganizacionesPage() {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'backoffice') notFound()

  const organizaciones = await listarOrganizaciones()

  return (
    <div className="p-8">
      <h1 className="text-lg font-medium text-brand-text mb-6">Organizaciones</h1>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-bgSecondary">
            <tr className="text-xs uppercase tracking-wide text-brand-textSecondary">
              <th className="p-3 text-left">Nombre</th>
              <th className="p-3 text-left">RUT</th>
              <th className="p-3 text-right">Usuarios</th>
              <th className="p-3 text-right">Casos</th>
            </tr>
          </thead>
          <tbody>
            {organizaciones.map((o: any) => (
              <tr key={o.id} className="border-t border-brand-borderSoft">
                <td className="p-3">{o.nombre}</td>
                <td className="p-3">{o.rut}</td>
                <td className="p-3 text-right">{o._count.usuarios}</td>
                <td className="p-3 text-right">{o._count.casos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/admin/organizaciones/
git commit -m "feat: admin organizacion management UI"
git push
```

---

## Task 5: Admin Navigation Menu

**Files:**
- Modify: `app/admin/layout.tsx` (add user/org links)

**Interfaces:**
- Updates: admin sidebar navigation

- [ ] **Step 1: Update admin layout**

Add to admin nav:
```tsx
<nav className="space-y-1">
  <Link href="/admin/asignacion">Asignación</Link>
  <Link href="/admin/cumplimiento">Cumplimiento</Link>
  <Link href="/admin/usuarios">Usuarios</Link>
  <Link href="/admin/organizaciones">Organizaciones</Link>
</nav>
```

- [ ] **Step 2: Commit**

```bash
git add app/admin/layout.tsx
git commit -m "feat: admin nav menu (usuarios, organizaciones)"
git push
```

---

## Task 6: Final Verification + Tag

**Files:**
- Run: full test suite + build
- Tag: v1.0.2-admin

- [ ] **Step 1: Build + test**

```bash
npm run test
npm run build
```

- [ ] **Step 2: Tag + push**

```bash
git tag -a v1.0.2 -m "Fase 9: Admin features (user + org management)"
git push origin v1.0.2
```

---

## End of Fase 9

Admin management complete. Ops team can manage users/organizations without database access.

**Next:** Fase 10 (Analytics) or iterate on features.

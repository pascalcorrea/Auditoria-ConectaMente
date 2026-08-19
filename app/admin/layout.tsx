import type { ReactNode } from 'react'
import { Sidebar, type NavSection } from '@/components/layout/Sidebar'

const NAV: NavSection[] = [
  {
    section: 'Casos',
    items: [
      { href: '/admin/casos', label: 'Casos' },
      { href: '/admin/casos/nuevo', label: 'Nuevo caso' },
      { href: '/admin/casos/importar', label: 'Importar casos' },
    ],
  },
  {
    section: 'Equipo',
    items: [{ href: '/admin/asignacion', label: 'Asignación' }],
  },
  {
    section: 'Admin',
    items: [
      { href: '/admin/analytics', label: 'Analytics' },
      { href: '/admin/usuarios', label: 'Usuarios' },
      { href: '/admin/organizaciones', label: 'Organizaciones' },
    ],
  },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar nav={NAV} />
      <div className="flex flex-1 flex-col overflow-hidden bg-brand-bg">{children}</div>
    </div>
  )
}

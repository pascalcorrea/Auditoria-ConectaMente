import type { ReactNode } from 'react'
import { Sidebar, type NavSection } from '@/components/layout/Sidebar'

const NAV: NavSection[] = [
  {
    items: [{ href: '/cliente/casos', label: 'Mis casos' }],
  },
]

export default function ClienteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar nav={NAV} />
      <div className="flex flex-1 flex-col overflow-hidden bg-brand-bg">{children}</div>
    </div>
  )
}

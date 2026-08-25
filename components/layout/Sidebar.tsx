import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export type NavItem = { href: string; label: string }
export type NavSection = { section?: string; items: NavItem[] }

export function Sidebar({ nav }: { nav: NavSection[] }) {
  const pathname = usePathname()

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <div className="flex h-full w-[220px] shrink-0 flex-col border-r border-brand-border bg-white p-3.5">
      <div className="flex items-center gap-2.5 px-2 pb-5">
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-[10px] shadow-[0_0_0_1.5px_rgba(12,184,126,0.18),0_2px_8px_rgba(0,0,0,0.06)]">
          <Image src="/favicon.webp" alt="ConectaMente" width={36} height={36} className="block" />
        </div>
        <div>
          <div className="text-[13.5px] font-semibold leading-tight text-brand-text">ConectaMente</div>
          <div className="text-[11px] leading-tight text-brand-textMuted">Core</div>
        </div>
      </div>
      <div className="mb-4 h-px bg-brand-borderSoft" />
      <nav className="flex flex-1 flex-col gap-0.5">
        {nav.map((sec, i) => (
          <div key={sec.section ?? i} className="mb-2.5">
            {sec.section && (
              <div className="px-2.5 pb-1.5 pt-2 text-[9.5px] font-semibold uppercase tracking-wider text-brand-textMuted">
                {sec.section}
              </div>
            )}
            {sec.items.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] transition ${
                    active
                      ? 'bg-brand-accent/[0.09] font-semibold text-brand-accent shadow-[inset_3px_0_0_#0CB87E]'
                      : 'text-brand-textSecondary hover:bg-brand-accentSoft'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-sm ${active ? 'bg-brand-accent' : 'bg-brand-border'}`} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
    </div>
  )
}

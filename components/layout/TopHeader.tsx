import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
'use client'

import { signOut } from 'next-auth/react'

export function TopHeader({ title, badge }: { title: string; badge?: string }) {
  return (
    <div className="flex h-[58px] shrink-0 items-center justify-between border-b border-brand-border bg-white px-7 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="flex items-center gap-3.5">
        <div className="h-5 w-5 rounded-md bg-brand-accent" />
        <div className="h-5 w-px bg-brand-border" />
        <div className="text-base font-semibold text-brand-text">{title}</div>
      </div>
      <div className="flex items-center gap-3">
        {badge && (
          <div className="rounded-full bg-brand-accentSoft px-3 py-1 text-xs font-medium text-brand-accent">
            {badge}
          </div>
        )}
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="rounded-lg border border-brand-border bg-white px-4 py-1.5 text-sm font-medium text-brand-textSecondary transition hover:border-brand-danger hover:text-brand-danger"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

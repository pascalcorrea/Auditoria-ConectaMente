import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { DateRangeFilter } from '@/components/ui/DateRangeFilter'
import CasoEstadoCell from './CasoEstadoCell'
import SesionDrawer from './SesionDrawer'
import { PrioridadBadge } from '@/components/ui/StatusBadge'

interface CasosPageClientProps {
  casos: (Caso & { organizacion: Organizacion; medico: Usuario | null })[]
  casoDetalle: (Caso & { sesion: Sesion | null; organizacion: Organizacion; medico: Usuario | null; informe: Informe | null }) | null
  params: { desde?: string; hasta?: string; estado?: string; prioridad?: string; detalle?: string }
}

export default function CasosPageClient({ casos, casoDetalle, params }: CasosPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleDateChange = useCallback(
    (from: string, to: string) => {
      const newParams = new URLSearchParams(searchParams)

      if (from) {
        newParams.set('desde', from)
      } else {
        newParams.delete('desde')
      }

      if (to) {
        newParams.set('hasta', to)
      } else {
        newParams.delete('hasta')
      }

      router.push(`?${newParams.toString()}`)
    },
    [router, searchParams]
  )

  const handleRowClick = useCallback(
    (casoId: string) => {
      const newParams = new URLSearchParams(searchParams)
      newParams.set('detalle', casoId)
      router.push(`?${newParams.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <>
      {/* Filters Section */}
      <div className="mb-6 flex flex-col gap-4 rounded-xl border border-brand-borderSoft bg-white p-5">
        <div className="grid grid-cols-[1fr_1fr] gap-4">
          <DateRangeFilter
            from={params.desde || ''}
            to={params.hasta || ''}
            onChange={handleDateChange}
            label="Período (Plazo)"
          />
          {/* Prioridad filter could go here if needed */}
        </div>
      </div>

      {/* Casos Table */}
      <div className="overflow-hidden rounded-xl border border-brand-borderSoft bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)]">
        <div className="grid grid-cols-[1.8fr_1.6fr_1.6fr_1fr_1.2fr_1fr] bg-brand-bg px-5 py-2.5">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-brand-textSecondary">Evaluado</div>
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-brand-textSecondary">Organización</div>
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-brand-textSecondary">Médico asignado</div>
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-brand-textSecondary">Plazo</div>
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-brand-textSecondary">Estado</div>
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-brand-textSecondary">Prioridad</div>
        </div>
        {casos.length === 0 && (
          <div className="px-5 py-16 text-center text-sm text-brand-textMuted">Todavía no hay casos ingresados.</div>
        )}
        {casos.map((caso) => (
          <div
            key={caso.id}
            onClick={() => handleRowClick(caso.id)}
            className="grid grid-cols-[1.8fr_1.6fr_1.6fr_1fr_1.2fr_1fr] items-center border-t border-brand-borderSoft/70 px-5 py-3 cursor-pointer hover:bg-brand-bg transition"
          >
            <div className="text-sm text-brand-text">
              {caso.nombreEvaluado} ({caso.rutEvaluado})
            </div>
            <div className="text-sm text-brand-textSecondary">{caso.organizacion.nombre}</div>
            <div className="text-sm text-brand-textSecondary">{caso.medico?.nombre ?? 'Sin asignar'}</div>
            <div className="text-sm tabular-nums text-brand-textSecondary">{caso.fechaLimite.toLocaleDateString('es-CL')}</div>
            <div onClick={(e) => e.stopPropagation()}>
              <CasoEstadoCell casoId={caso.id} estadoActual={caso.estado} />
            </div>
            <div>
              <PrioridadBadge prioridad={caso.prioridad} />
            </div>
          </div>
        ))}
      </div>

      {/* Sesión Drawer */}
      {casoDetalle && (
        <SesionDrawer caso={casoDetalle} open={!!params.detalle} />
      )}
    </>
  )
}

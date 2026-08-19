import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { EstadoBadge, PrioridadBadge } from '@/components/ui/StatusBadge'
import { ESTADOS_ACTIVOS } from '@/lib/asignacion'

export const dynamic = 'force-dynamic'

export default async function CasosPage() {
  const casos = await prisma.caso.findMany({
    include: { organizacion: true, medico: true },
    orderBy: { creadoEn: 'desc' },
  })

  const activos = casos.filter((c) => (ESTADOS_ACTIVOS as readonly string[]).includes(c.estado)).length
  const urgentes = casos.filter((c) => c.prioridad === 'urgente' && (ESTADOS_ACTIVOS as readonly string[]).includes(c.estado)).length
  const sinAsignar = casos.filter((c) => !c.medicoId && (ESTADOS_ACTIVOS as readonly string[]).includes(c.estado)).length

  const kpis = [
    { label: 'Total', value: casos.length, color: 'text-brand-text' },
    { label: 'Activos', value: activos, color: 'text-brand-neutral' },
    { label: 'Urgentes', value: urgentes, color: 'text-brand-danger' },
    { label: 'Sin asignar', value: sinAsignar, color: 'text-brand-textSecondary' },
  ]

  return (
    <div className="flex-1 overflow-auto p-7">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex gap-4">
            {kpis.map((k) => (
              <div
                key={k.label}
                className="min-w-[130px] rounded-xl border border-brand-borderSoft bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)]"
              >
                <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-brand-textSecondary">{k.label}</div>
                <div className={`text-xl font-semibold ${k.color}`}>{k.value}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Link href="/admin/casos/nuevo">
              <span className="inline-flex items-center gap-2 rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-accentHover">
                Nuevo caso
              </span>
            </Link>
            <Link href="/admin/casos/importar">
              <span className="inline-flex items-center gap-2 rounded-lg border border-brand-border bg-white px-4 py-2 text-sm font-medium text-brand-textSecondary transition hover:border-brand-accent hover:text-brand-accent">
                Importar Excel
              </span>
            </Link>
          </div>
        </div>

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
              className="grid grid-cols-[1.8fr_1.6fr_1.6fr_1fr_1.2fr_1fr] items-center border-t border-brand-borderSoft/70 px-5 py-3"
            >
              <div className="text-sm text-brand-text">
                {caso.nombreEvaluado} ({caso.rutEvaluado})
              </div>
              <div className="text-sm text-brand-textSecondary">{caso.organizacion.nombre}</div>
              <div className="text-sm text-brand-textSecondary">{caso.medico?.nombre ?? 'Sin asignar'}</div>
              <div className="text-sm tabular-nums text-brand-textSecondary">{caso.fechaLimite.toLocaleDateString('es-CL')}</div>
              <div>
                <EstadoBadge estado={caso.estado} />
              </div>
              <div>
                <PrioridadBadge prioridad={caso.prioridad} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

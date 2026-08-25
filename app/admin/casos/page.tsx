import { prisma } from '@/lib/prisma'
import { listarCasosFiltrados } from '@/lib/admin-casos'
import Link from 'next/link'
import { ESTADOS_ACTIVOS } from '@/lib/asignacion'
import CasosPageClient from './CasosPageClient'

export const dynamic = 'force-dynamic'

export default async function CasosPage({
  searchParams,
}: {
  searchParams: Promise<{
    desde?: string
    hasta?: string
    estado?: string
    prioridad?: string
    detalle?: string
  }>
}) {
  const params = await searchParams

  // Fetch casos filtrados
  const casos = await listarCasosFiltrados({
    desde: params.desde,
    hasta: params.hasta,
    estado: params.estado,
    prioridad: params.prioridad,
  })

  // Fetch detailed caso if detalle param exists
  let casosDetalle = null
  if (params.detalle) {
    casosDetalle = await prisma.caso.findUnique({
      where: { id: params.detalle },
      include: { sesion: true, organizacion: true, medico: true, informe: true },
    })
  }

  const activos = casos.filter((c: any) => (ESTADOS_ACTIVOS as readonly string[]).includes(c.estado)).length
  const urgentes = casos.filter((c: any) => c.prioridad === 'urgente' && (ESTADOS_ACTIVOS as readonly string[]).includes(c.estado)).length
  const sinAsignar = casos.filter((c: any) => !c.medicoId && (ESTADOS_ACTIVOS as readonly string[]).includes(c.estado)).length

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

      <CasosPageClient casos={casos} casoDetalle={casosDetalle} params={params} />
    </div>
  )
}

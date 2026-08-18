import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { listarCasosCliente } from '@/lib/cliente-casos'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { EstadoBadge, PrioridadBadge } from '@/components/ui/StatusBadge'
import { TopHeader } from '@/components/layout/TopHeader'
import type { EstadoCaso } from '@prisma/client'

const ESTADOS: { value: EstadoCaso | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'recibido', label: 'Recibido' },
  { value: 'en_revision', label: 'En revisión' },
  { value: 'informe_en_validacion', label: 'Informe en validación' },
  { value: 'entregado', label: 'Entregado' },
]

export const dynamic = 'force-dynamic'

export default async function ClienteCasosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizacionId) notFound()

  const { estado } = await searchParams
  const estadoFiltro = ESTADOS.some((e) => e.value === estado && estado !== '')
    ? (estado as EstadoCaso)
    : undefined

  const [casos, organizacion] = await Promise.all([
    listarCasosCliente(session.user.organizacionId, estadoFiltro),
    prisma.organizacion.findUnique({ where: { id: session.user.organizacionId } }),
  ])

  return (
    <>
      <TopHeader title="Mis casos" badge={organizacion?.nombre} />
      <div className="flex-1 overflow-auto p-7">
        <form method="get" className="mb-5 flex max-w-xs items-end gap-3">
          <Select
            label="Estado"
            name="estado"
            defaultValue={estado ?? ''}
            options={ESTADOS.map((e) => ({ value: e.value, label: e.label }))}
          />
          <Button type="submit" variant="secondary">
            Filtrar
          </Button>
        </form>

        <div className="overflow-hidden rounded-xl border border-brand-borderSoft bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)]">
          <div className="grid grid-cols-[1.8fr_1.6fr_1.4fr_1fr_1fr_0.8fr] bg-brand-bg px-5 py-2.5">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-brand-textSecondary">Evaluado</div>
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-brand-textSecondary">Tipo de licencia</div>
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-brand-textSecondary">Fecha límite</div>
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-brand-textSecondary">Prioridad</div>
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-brand-textSecondary">Estado</div>
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-brand-textSecondary">Detalle</div>
          </div>
          {casos.length === 0 && (
            <div className="px-5 py-16 text-center text-sm text-brand-textMuted">Todavía no tienes casos{estado ? ' con este estado' : ''}.</div>
          )}
          {casos.map((caso) => (
            <div
              key={caso.id}
              className="grid grid-cols-[1.8fr_1.6fr_1.4fr_1fr_1fr_0.8fr] items-center border-t border-brand-borderSoft/70 px-5 py-3"
            >
              <div className="text-sm text-brand-text">
                {caso.nombreEvaluado} ({caso.rutEvaluado})
              </div>
              <div className="text-sm text-brand-textSecondary">{caso.tipoLicencia}</div>
              <div className="text-sm tabular-nums text-brand-textSecondary">{caso.fechaLimite.toLocaleDateString('es-CL')}</div>
              <div>
                <PrioridadBadge prioridad={caso.prioridad} />
              </div>
              <div>
                <EstadoBadge estado={caso.estado} />
              </div>
              <div>
                <Link href={`/cliente/casos/${caso.id}`} className="text-sm text-brand-accent hover:underline">
                  Ver detalle
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

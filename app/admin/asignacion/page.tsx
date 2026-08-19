import { prisma } from '@/lib/prisma'
import { ESTADOS_ACTIVOS } from '@/lib/asignacion'
import { ReasignarSelect } from './ReasignarSelect'
import { TopHeader } from '@/components/layout/TopHeader'

// See app/admin/casos/page.tsx for why this is needed — without it, Next
// prerenders workload counts and the caso table at build time and they
// never update, even after a reassignment.
export const dynamic = 'force-dynamic'

export default async function AsignacionPage() {
  const medicos = await prisma.usuario.findMany({
    where: { rol: 'medico', activo: true },
    orderBy: { creadoEn: 'asc' },
  })

  const cargas = await Promise.all(
    medicos.map(async (medico) => {
      const carga = await prisma.caso.count({
        where: { medicoId: medico.id, estado: { in: [...ESTADOS_ACTIVOS] } },
      })
      return { id: medico.id, nombre: medico.nombre, especialidad: medico.especialidad, carga }
    })
  )

  const cargaMaxima = Math.max(1, ...cargas.map((c) => c.carga))

  const casos = await prisma.caso.findMany({
    where: { estado: { in: [...ESTADOS_ACTIVOS] } },
    include: { organizacion: true },
    orderBy: { fechaLimite: 'asc' },
  })

  return (
    <>
      <TopHeader title="Asignación" />
      <div className="flex-1 overflow-auto p-8">
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-brand-textMuted">Carga por médico</div>
        <div className="mb-8 flex gap-4">
          {cargas.map((c) => (
            <div
              key={c.id}
              className="flex-1 rounded-xl border border-brand-borderSoft bg-white p-[18px] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)]"
            >
              <div className="mb-0.5 text-sm font-semibold text-brand-text">{c.nombre}</div>
              <div className="mb-3 text-xs text-brand-textSecondary">{c.especialidad ?? 'Sin especialidad'}</div>
              <div className="mb-1.5 flex justify-between text-xs text-brand-textSecondary">
                <span>
                  {c.carga} caso{c.carga === 1 ? '' : 's'} activo{c.carga === 1 ? '' : 's'}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-brand-bgHover">
                <div
                  className="h-full rounded-full bg-brand-accent"
                  style={{ width: `${(c.carga / cargaMaxima) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-brand-textMuted">
          Casos activos y reasignación
        </div>
        <div className="overflow-hidden rounded-xl border border-brand-borderSoft bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)]">
          <div className="grid grid-cols-[1.8fr_1.6fr_1fr_1.6fr] bg-brand-bg px-5 py-2.5">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-brand-textSecondary">Evaluado</div>
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-brand-textSecondary">Organización</div>
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-brand-textSecondary">Plazo</div>
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-brand-textSecondary">Asignar a</div>
          </div>
          {casos.length === 0 && (
            <div className="px-5 py-16 text-center text-sm text-brand-textMuted">No hay casos activos por asignar.</div>
          )}
          {casos.map((caso) => (
            <div key={caso.id} className="grid grid-cols-[1.8fr_1.6fr_1fr_1.6fr] items-center border-t border-brand-borderSoft/70 px-5 py-3">
              <div className="text-sm text-brand-text">{caso.nombreEvaluado}</div>
              <div className="text-sm text-brand-textSecondary">{caso.organizacion.nombre}</div>
              <div className="text-sm tabular-nums text-brand-textSecondary">{caso.fechaLimite.toLocaleDateString('es-CL')}</div>
              <div>
                <ReasignarSelect
                  casoId={caso.id}
                  medicoIdActual={caso.medicoId}
                  medicos={medicos.map((m) => ({ id: m.id, nombre: m.nombre }))}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

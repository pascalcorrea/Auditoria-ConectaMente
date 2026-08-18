import { prisma } from '@/lib/prisma'
import { ESTADOS_ACTIVOS } from '@/lib/asignacion'
import { ReasignarSelect } from './ReasignarSelect'

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
    medicos.map(async (medico) => ({
      id: medico.id,
      nombre: medico.nombre,
      carga: await prisma.caso.count({
        where: { medicoId: medico.id, estado: { in: [...ESTADOS_ACTIVOS] } },
      }),
    }))
  )

  const casos = await prisma.caso.findMany({
    where: { estado: { in: [...ESTADOS_ACTIVOS] } },
    include: { organizacion: true },
    orderBy: { fechaLimite: 'asc' },
  })

  return (
    <div className="p-8">
      <h1 className="text-lg font-medium text-brand-text">Asignación</h1>

      <h2 className="mt-6 text-sm font-medium text-brand-textSecondary">Carga por médico</h2>
      <ul className="mt-2 text-sm text-brand-text">
        {cargas.map((c) => (
          <li key={c.id}>
            {c.nombre}: {c.carga} caso{c.carga === 1 ? '' : 's'} activo{c.carga === 1 ? '' : 's'}
          </li>
        ))}
      </ul>

      <h2 className="mt-6 text-sm font-medium text-brand-textSecondary">Casos</h2>
      <table className="mt-2 w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-brand-textSecondary">
            <th className="pb-2">Evaluado</th>
            <th className="pb-2">Organización</th>
            <th className="pb-2">Médico</th>
          </tr>
        </thead>
        <tbody>
          {casos.map((caso) => (
            <tr key={caso.id} className="border-t border-brand-borderSoft">
              <td className="py-2">{caso.nombreEvaluado}</td>
              <td className="py-2">{caso.organizacion.nombre}</td>
              <td className="py-2">
                <ReasignarSelect
                  casoId={caso.id}
                  medicoIdActual={caso.medicoId}
                  medicos={medicos.map((m) => ({ id: m.id, nombre: m.nombre }))}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

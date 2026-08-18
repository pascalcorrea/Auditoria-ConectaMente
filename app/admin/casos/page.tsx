import { prisma } from '@/lib/prisma'

export default async function CasosPage() {
  const casos = await prisma.caso.findMany({
    include: { organizacion: true, medico: true },
    orderBy: { creadoEn: 'desc' },
  })

  return (
    <div className="p-8">
      <h1 className="text-lg font-medium text-brand-text">Casos</h1>
      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-brand-textSecondary">
            <th className="pb-2">Evaluado</th>
            <th className="pb-2">Organización</th>
            <th className="pb-2">Médico</th>
            <th className="pb-2">Estado</th>
            <th className="pb-2">Prioridad</th>
            <th className="pb-2">Fecha límite</th>
          </tr>
        </thead>
        <tbody>
          {casos.map((caso) => (
            <tr key={caso.id} className="border-t border-brand-borderSoft">
              <td className="py-2">
                {caso.nombreEvaluado} ({caso.rutEvaluado})
              </td>
              <td className="py-2">{caso.organizacion.nombre}</td>
              <td className="py-2">{caso.medico?.nombre ?? 'Sin asignar'}</td>
              <td className="py-2">{caso.estado}</td>
              <td className="py-2">{caso.prioridad}</td>
              <td className="py-2">{caso.fechaLimite.toLocaleDateString('es-CL')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

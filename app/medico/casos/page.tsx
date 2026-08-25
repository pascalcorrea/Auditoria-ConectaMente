import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { listarCasosMedico } from '@/lib/medico-casos'

export const dynamic = 'force-dynamic'

export default async function MedicoCasosPage() {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'medico' || !session.user?.id) notFound()

  const casos = await listarCasosMedico(session.user.id)

  return (
    <div className="p-8">
      <h1 className="text-lg font-medium text-brand-text">Mis casos asignados</h1>

      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-brand-textSecondary">
            <th className="pb-2">Evaluado</th>
            <th className="pb-2">Estado</th>
            <th className="pb-2">Prioridad</th>
            <th className="pb-2">Fecha límite</th>
            <th className="pb-2">Acción</th>
          </tr>
        </thead>
        <tbody>
          {casos.map((caso) => (
            <tr key={caso.id} className="border-t border-brand-borderSoft">
              <td className="py-2">{caso.nombreEvaluado} ({caso.rutEvaluado})</td>
              <td className="py-2">{caso.estado}</td>
              <td className="py-2">{caso.prioridad}</td>
              <td className="py-2">{caso.fechaLimite.toLocaleDateString('es-CL')}</td>
              <td className="py-2">
                <Link
                  href={`/medico/casos/${caso.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition bg-white text-brand-textSecondary border border-brand-border hover:border-brand-accent hover:text-brand-accent"
                >
                  Ver detalle
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {casos.length === 0 && <p className="mt-4 text-sm text-brand-textSecondary">Sin casos asignados.</p>}
    </div>
  )
}

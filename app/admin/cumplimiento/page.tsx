import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { listarTodosCasos } from '@/lib/admin-casos'
import { Card } from '@/components/ui/Card'

export const dynamic = 'force-dynamic'

function daysUntilDue(fechaLimite: Date): number {
  const now = new Date()
  const diffMs = fechaLimite.getTime() - now.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

function statusColor(dias: number): string {
  if (dias < 0) return 'text-brand-danger'
  if (dias < 3) return 'text-brand-accent'
  return 'text-brand-text'
}

export default async function AdminCumplimientoPage() {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'backoffice') notFound()

  const casos = await listarTodosCasos()
  const activos = casos.filter((c) => c.estado !== 'entregado')

  return (
    <div className="p-8">
      <h1 className="text-lg font-medium text-brand-text">Cumplimiento de plazos</h1>

      <Card className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-bgSecondary">
            <tr className="text-xs uppercase tracking-wide text-brand-textSecondary">
              <th className="p-3 text-left">Evaluado</th>
              <th className="p-3 text-left">Organización</th>
              <th className="p-3 text-left">Estado</th>
              <th className="p-3 text-left">Fecha límite</th>
              <th className="p-3 text-right">Días</th>
            </tr>
          </thead>
          <tbody>
            {activos.sort((a, b) => a.fechaLimite.getTime() - b.fechaLimite.getTime()).map((caso) => {
              const dias = daysUntilDue(caso.fechaLimite)
              return (
                <tr key={caso.id} className="border-t border-brand-borderSoft">
                  <td className="p-3">{caso.nombreEvaluado}</td>
                  <td className="p-3">{caso.organizacion.nombre}</td>
                  <td className="p-3">{caso.estado}</td>
                  <td className="p-3">{caso.fechaLimite.toLocaleDateString('es-CL')}</td>
                  <td className={`p-3 text-right font-medium ${statusColor(dias)}`}>
                    {dias < 0 ? `VENCIDO ${Math.abs(dias)}d` : `${dias}d`}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>

      {activos.length === 0 && (
        <p className="mt-4 text-sm text-brand-textSecondary">Sin casos activos.</p>
      )}
    </div>
  )
}

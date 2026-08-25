import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { getAnalyticsMetrics } from '@/lib/analytics'
import { Card } from '@/components/ui/Card'

export const dynamic = 'force-dynamic'

export default async function AdminAnalyticsPage() {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'backoffice') notFound()

  const metrics = await getAnalyticsMetrics()

  return (
    <div className="p-8">
      <h1 className="text-lg font-medium text-brand-text mb-8">Analytics Dashboard</h1>

      <div className="grid grid-cols-5 gap-4 mb-8">
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-brand-accent">{metrics.totalCasos}</div>
          <div className="text-xs uppercase tracking-wide text-brand-textSecondary mt-2">Total Casos</div>
        </Card>

        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-green-600">{metrics.casosCompletados}</div>
          <div className="text-xs uppercase tracking-wide text-brand-textSecondary mt-2">Completados</div>
        </Card>

        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-blue-600">{metrics.casosEnProgreso}</div>
          <div className="text-xs uppercase tracking-wide text-brand-textSecondary mt-2">En Progreso</div>
        </Card>

        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-red-600">{metrics.casosVencidos}</div>
          <div className="text-xs uppercase tracking-wide text-brand-textSecondary mt-2">Vencidos</div>
        </Card>

        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-brand-accent">
            {metrics.tiempoPromedio !== null ? `${metrics.tiempoPromedio}d` : '—'}
          </div>
          <div className="text-xs uppercase tracking-wide text-brand-textSecondary mt-2">Promedio Días</div>
        </Card>
      </div>

      <Card className="overflow-x-auto">
        <div className="p-6">
          <h2 className="text-sm font-medium text-brand-text mb-4">Carga de Médicos</h2>
          <table className="w-full text-sm">
            <thead className="bg-brand-bgSecondary">
              <tr className="text-xs uppercase tracking-wide text-brand-textSecondary">
                <th className="p-3 text-left">Nombre</th>
                <th className="p-3 text-right">Asignados</th>
                <th className="p-3 text-right">Completados</th>
                <th className="p-3 text-right">% Completado</th>
              </tr>
            </thead>
            <tbody>
              {metrics.cargaMedicos.map((medico: typeof metrics.cargaMedicos[0]) => (
                <tr key={medico.usuarioId} className="border-t border-brand-borderSoft">
                  <td className="p-3">{medico.nombre}</td>
                  <td className="p-3 text-right">{medico.casosAsignados}</td>
                  <td className="p-3 text-right">{medico.casosCompletados}</td>
                  <td className="p-3 text-right">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        medico.porcentajeCompletado >= 75
                          ? 'bg-green-100 text-green-700'
                          : medico.porcentajeCompletado >= 50
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {medico.porcentajeCompletado}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

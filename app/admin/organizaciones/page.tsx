import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { listarOrganizaciones } from '@/lib/admin-organizaciones'
import { Card } from '@/components/ui/Card'

export const dynamic = 'force-dynamic'

export default async function AdminOrganizacionesPage() {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'backoffice') notFound()

  const organizaciones = await listarOrganizaciones()

  return (
    <div className="p-8">
      <h1 className="text-lg font-medium text-brand-text mb-6">Organizaciones</h1>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-bgSecondary">
            <tr className="text-xs uppercase tracking-wide text-brand-textSecondary">
              <th className="p-3 text-left">Nombre</th>
              <th className="p-3 text-left">RUT</th>
              <th className="p-3 text-right">Usuarios</th>
              <th className="p-3 text-right">Casos</th>
            </tr>
          </thead>
          <tbody>
            {organizaciones.map((o: any) => (
              <tr key={o.id} className="border-t border-brand-borderSoft">
                <td className="p-3">{o.nombre}</td>
                <td className="p-3">{o.rut}</td>
                <td className="p-3 text-right">{o._count.usuarios}</td>
                <td className="p-3 text-right">{o._count.casos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

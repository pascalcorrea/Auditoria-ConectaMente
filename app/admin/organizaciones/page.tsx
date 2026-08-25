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
            {organizaciones.map((o: unknown) => {
              const org = o as { id: string; nombre: string; rut: string; _count: { usuarios: number; casos: number } }
              return (
              <tr key={org.id} className="border-t border-brand-borderSoft">
                <td className="p-3">{org.nombre}</td>
                <td className="p-3">{org.rut}</td>
                <td className="p-3 text-right">{org._count.usuarios}</td>
                <td className="p-3 text-right">{org._count.casos}</td>
              </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

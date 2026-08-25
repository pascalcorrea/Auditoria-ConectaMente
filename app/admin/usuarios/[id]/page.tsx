import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { WeeklyScheduleEditor } from '@/components/admin/WeeklyScheduleEditor'

export const dynamic = 'force-dynamic'

export default async function AdminUsuarioPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'backoffice') notFound()

  const { id } = await params
  const usuario = await prisma.usuario.findUnique({ where: { id } })
  if (!usuario) notFound()

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-lg font-medium text-brand-text mb-2">Usuario: {usuario.nombre}</h1>
        <p className="text-sm text-brand-textSecondary">{usuario.email}</p>
      </div>

      {usuario.rol === 'medico' && (
        <div className="space-y-6">
          <Card>
            <h2 className="text-base font-medium text-brand-text mb-4">Horario de atención</h2>
            <WeeklyScheduleEditor medico={usuario} />
          </Card>
        </div>
      )}

      {usuario.rol !== 'medico' && (
        <Card className="bg-brand-bgSecondary">
          <p className="text-sm text-brand-textSecondary">Este usuario no es médico. No tiene horario de atención configurado.</p>
        </Card>
      )}
    </div>
  )
}

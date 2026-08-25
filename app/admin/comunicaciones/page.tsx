import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ComunicacionesPageClient from './ComunicacionesPageClient'

export const dynamic = 'force-dynamic'

export default async function ComunicacionesPage() {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'backoffice') notFound()

  // Fetch inicial para poblar selects en el form
  const [usuarios, casos] = await Promise.all([
    prisma.usuario.findMany({
      where: { rol: { in: ['medico', 'cliente'] } },
      select: { id: true, nombre: true, email: true, rol: true },
      orderBy: { nombre: 'asc' },
    }),
    prisma.caso.findMany({
      where: { estado: { not: 'entregado' } },
      select: { id: true, nombreEvaluado: true, organizacion: { select: { nombre: true } } },
      orderBy: { creadoEn: 'desc' },
      take: 100,
    }),
  ])

  return (
    <div className="flex-1 overflow-auto p-7">
      <ComunicacionesPageClient usuarios={usuarios} casos={casos} />
    </div>
  )
}

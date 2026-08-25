import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'backoffice') {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const url = new URL(req.url)
  const casoId = url.searchParams.get('casoId')
  const usuarioId = url.searchParams.get('usuarioId')
  const canal = url.searchParams.get('canal')
  const page = parseInt(url.searchParams.get('page') || '0')
  const pageSize = 50

  const where: Record<string, unknown> = {}
  if (casoId) where.casoId = casoId
  if (usuarioId)
    where.OR = [{ destinatarioUsuarioId: usuarioId }, { enviadoPorId: usuarioId }]
  if (canal) where.canal = canal

  const [total, logs] = await Promise.all([
    prisma.logEnvio.count({ where }),
    prisma.logEnvio.findMany({
      where,
      include: {
        caso: { select: { nombreEvaluado: true } },
        destinatario: { select: { nombre: true } },
        enviadoPor: { select: { nombre: true } },
      },
      orderBy: { creadoEn: 'desc' },
      skip: page * pageSize,
      take: pageSize,
    }),
  ])

  return Response.json({
    logs,
    total,
    page,
    pageSize,
    pages: Math.ceil(total / pageSize),
  })
}

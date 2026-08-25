import { prisma } from '@/lib/prisma'
import type { Prisma } from '@/lib/types'

const TARIFA_ORGANIZACION_DEFAULT_CLP = 100000 // tarifa default

export async function listarFacturas(filtros?: {
  organizacionId?: string
  estado?: 'pendiente' | 'facturada' | 'pagada'
  page?: number
  pageSize?: number
}) {
  const { organizacionId, estado, page = 0, pageSize = 50 } = filtros || {}

  const where: Prisma.FacturaOrganizacionWhereInput = {}
  if (organizacionId) where.organizacionId = organizacionId
  if (estado) where.estado = estado

  const [total, facturas] = await Promise.all([
    prisma.facturaOrganizacion.count({ where }),
    prisma.facturaOrganizacion.findMany({
      where,
      include: { organizacion: { select: { nombre: true } } },
      orderBy: { creadoEn: 'desc' },
      skip: page * pageSize,
      take: pageSize,
    }),
  ])

  return { facturas, total, page, pageSize, pages: Math.ceil(total / pageSize) }
}

export async function generarFactura(params: {
  organizacionId: string
  periodoInicio: Date
  periodoFin: Date
}) {
  const { organizacionId, periodoInicio, periodoFin } = params

  // Contar casos entregados en el rango de esta organización
  const casosEntregados = await prisma.caso.findMany({
    where: {
      organizacionId,
      estado: 'entregado',
      // usar actualizadoEn como proxy de fecha de entrega
      actualizadoEn: {
        gte: periodoInicio,
        lte: periodoFin,
      },
    },
    select: { id: true },
  })

  const casosIncluidos = casosEntregados.length

  if (casosIncluidos === 0) {
    return { ok: false, error: 'No hay casos entregados en este período' }
  }

  // Obtener tarifa de la organización
  const org = await prisma.organizacion.findUnique({
    where: { id: organizacionId },
    select: { tarifaCasoClp: true },
  })

  const tarifaCaso = org?.tarifaCasoClp || TARIFA_ORGANIZACION_DEFAULT_CLP
  const montoClp = casosIncluidos * tarifaCaso

  // Crear factura con snapshot de datos
  const factura = await prisma.facturaOrganizacion.create({
    data: {
      organizacionId,
      periodoInicio,
      periodoFin,
      casosIncluidos,
      montoClp,
      estado: 'facturada',
    },
  })

  return { ok: true, factura }
}

export async function marcarFacturaEstado(
  facturaId: string,
  estado: 'pendiente' | 'facturada' | 'pagada'
) {
  return prisma.facturaOrganizacion.update({
    where: { id: facturaId },
    data: {
      estado,
      facturadoEn: estado === 'facturada' ? new Date() : undefined,
    },
  })
}

// KPI helpers
export async function obtenerKpisFacturas(mes?: number, anio?: number) {
  const ahora = new Date()
  const mesActual = mes ?? ahora.getMonth() + 1
  const anioActual = anio ?? ahora.getFullYear()

  const pendiente = await prisma.facturaOrganizacion.aggregate({
    where: { estado: 'pendiente' },
    _sum: { montoClp: true },
    _count: true,
  })

  const facturadas = await prisma.facturaOrganizacion.aggregate({
    where: {
      estado: 'facturada',
      facturadoEn: {
        gte: new Date(anioActual, mesActual - 1, 1),
        lt: new Date(anioActual, mesActual, 1),
      },
    },
    _sum: { montoClp: true },
  })

  return {
    pendienteClp: pendiente._sum.montoClp || 0,
    facturadasEstesMesClp: facturadas._sum.montoClp || 0,
    cantidadPendiente: pendiente._count,
  }
}

import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

const TARIFA_MEDICO_DEFAULT_CLP = 50000 // tarifa default si no está configurada

export async function listarPagosMedico(filtros?: {
  medicoId?: string
  estado?: 'pendiente' | 'pagado'
  page?: number
  pageSize?: number
}) {
  const { medicoId, estado, page = 0, pageSize = 50 } = filtros || {}

  const where: Prisma.PagoMedicoWhereInput = {}
  if (medicoId) where.medicoId = medicoId
  if (estado) where.estado = estado

  const [total, pagos] = await Promise.all([
    prisma.pagoMedico.count({ where }),
    prisma.pagoMedico.findMany({
      where,
      include: { medico: { select: { nombre: true } }, caso: { select: { nombreEvaluado: true } } },
      orderBy: { creadoEn: 'desc' },
      skip: page * pageSize,
      take: pageSize,
    }),
  ])

  return { pagos, total, page, pageSize, pages: Math.ceil(total / pageSize) }
}

export async function sincronizarPagosPendientes() {
  // Buscar casos entregados sin PagoMedico
  const casosEntregadosSinPago = await prisma.caso.findMany({
    where: {
      estado: 'entregado',
      medicoId: { not: null },
      pagoMedico: null,
    },
    include: { medico: { select: { tarifaCasoClp: true } } },
  })

  const pagosACrear = casosEntregadosSinPago.map((caso) => ({
    medicoId: caso.medicoId!,
    casoId: caso.id,
    montoClp: caso.medico!.tarifaCasoClp || TARIFA_MEDICO_DEFAULT_CLP,
  }))

  if (pagosACrear.length === 0) {
    return { creados: 0, mensaje: 'No hay casos nuevos para sincronizar' }
  }

  // Usar createMany para insertar eficientemente
  const result = await prisma.pagoMedico.createMany({
    data: pagosACrear,
    skipDuplicates: true,
  })

  return { creados: result.count, mensaje: `${result.count} pagos sincronizados` }
}

export async function marcarPagoRealizado(pagoId: string) {
  return prisma.pagoMedico.update({
    where: { id: pagoId },
    data: {
      estado: 'pagado',
      fechaPago: new Date(),
    },
  })
}

// KPI helpers
export async function obtenerKpisPagosMedico(mes?: number, anio?: number) {
  const ahora = new Date()
  const mesActual = mes ?? ahora.getMonth() + 1
  const anioActual = anio ?? ahora.getFullYear()

  const pendiente = await prisma.pagoMedico.aggregate({
    where: { estado: 'pendiente' },
    _sum: { montoClp: true },
  })

  const pagadoEsteMes = await prisma.pagoMedico.aggregate({
    where: {
      estado: 'pagado',
      fechaPago: {
        gte: new Date(anioActual, mesActual - 1, 1),
        lt: new Date(anioActual, mesActual, 1),
      },
    },
    _sum: { montoClp: true },
  })

  return {
    pendienteClp: pendiente._sum.montoClp || 0,
    pagadoEstesMesClp: pagadoEsteMes._sum.montoClp || 0,
  }
}

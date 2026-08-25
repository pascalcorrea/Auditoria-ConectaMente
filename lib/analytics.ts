import { prisma } from './prisma'

export type AnalyticsMetrics = {
  totalCasos: number
  casosCompletados: number
  casosEnProgreso: number
  casosVencidos: number
  tiempoPromedio: number | null
  cargaMedicos: Array<{
    usuarioId: string
    nombre: string
    casosAsignados: number
    casosCompletados: number
    porcentajeCompletado: number
  }>
}

export async function getAnalyticsMetrics(): Promise<AnalyticsMetrics> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [totalCasos, casosEntregados, casosEnProgreso, casosVencidos, cargaMedicos, casosEntregadosPorFechas] = await Promise.all([
    prisma.caso.count(),
    prisma.caso.count({ where: { estado: 'entregado' } }),
    prisma.caso.count({ where: { estado: { in: ['en_revision', 'informe_en_validacion'] } } }),
    prisma.caso.count({
      where: {
        AND: [{ fechaLimite: { lt: today } }, { estado: { not: 'entregado' } }],
      },
    }),
    prisma.usuario.findMany({
      where: { rol: 'medico' },
      select: {
        id: true,
        nombre: true,
        casosAsignados: {
          select: { id: true, estado: true },
        },
      },
    }),
    prisma.caso.findMany({
      where: { estado: 'entregado' },
      select: { fechaIngreso: true, actualizadoEn: true },
    }),
  ])

  const tiempoPromedio =
    casosEntregadosPorFechas.length > 0
      ? casosEntregadosPorFechas.reduce((sum: any, caso: any) => {
          const end = caso.actualizadoEn || new Date()
          const days = (end.getTime() - caso.fechaIngreso.getTime()) / (1000 * 60 * 60 * 24)
          return sum + days
        }, 0) / casosEntregadosPorFechas.length
      : null

  const cargaMedicosFormattedWithStats = cargaMedicos.map((medico: any) => {
    const casosAsignados = medico.casosAsignados.length
    const casosEntregados = medico.casosAsignados.filter((c: any) => c.estado === 'entregado').length
    const porcentajeCompletado = casosAsignados > 0 ? Math.round((casosEntregados / casosAsignados) * 100) : 0

    return {
      usuarioId: medico.id,
      nombre: medico.nombre,
      casosAsignados,
      casosCompletados: casosEntregados,
      porcentajeCompletado,
    }
  })

  return {
    totalCasos,
    casosCompletados: casosEntregados,
    casosEnProgreso,
    casosVencidos,
    tiempoPromedio: tiempoPromedio ? Math.round(tiempoPromedio * 10) / 10 : null,
    cargaMedicos: cargaMedicosFormattedWithStats.sort((a: any, b: any) => b.casosAsignados - a.casosAsignados),
  }
}

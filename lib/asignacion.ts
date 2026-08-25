import { prisma } from './prisma'

export const ESTADOS_ACTIVOS = ['recibido', 'en_revision', 'informe_en_validacion'] as const

export async function asignarMedico(): Promise<string | null> {
  const medicos = await prisma.usuario.findMany({
    where: { rol: 'medico', activo: true },
    orderBy: { creadoEn: 'asc' },
  })

  if (medicos.length === 0) return null

  const cargas = await Promise.all(
    medicos.map(async (medico: any) => ({
      medicoId: medico.id,
      carga: await prisma.caso.count({
        where: { medicoId: medico.id, estado: { in: [...ESTADOS_ACTIVOS] } },
      }),
    }))
  )

  cargas.sort((a: any, b) => a.carga - b.carga)

  return cargas[0].medicoId
}

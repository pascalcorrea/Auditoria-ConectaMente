import { prisma } from './prisma'
import type { Prisma } from '@prisma/client'

export async function crearSesion(casoId: string, dailyRoomUrl: string) {
  return prisma.sesion.create({
    data: {
      casoId,
      dailyRoomUrl,
      estado: 'agendada',
      fechaProgramada: new Date(),
    },
  })
}

export async function obtenerSesion(casoId: string) {
  return prisma.sesion.findUnique({
    where: { casoId },
  })
}

export async function actualizarSesion(casoId: string, data: Prisma.SesionUpdateInput) {
  return prisma.sesion.update({
    where: { casoId },
    data,
  })
}


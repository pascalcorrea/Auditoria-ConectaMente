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

async function generarDailyRoom(casoId: string) {
  if (!process.env.DAILY_API_KEY) throw new Error('DAILY_API_KEY not configured')

  const response = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      name: `conectamente-${casoId}`,
      properties: {
        enable_recording: 'all',
        max_participants: 2,
      },
    }),
  })

  if (!response.ok) throw new Error('Failed to create Daily room')
  const room = await response.json()
  return room.url
}

export async function obtenerOCrearSesion(casoId: string) {
  let sesion = await obtenerSesion(casoId)
  if (!sesion) {
    const dailyRoomUrl = await generarDailyRoom(casoId)
    sesion = await crearSesion(casoId, dailyRoomUrl)
  }
  return sesion
}

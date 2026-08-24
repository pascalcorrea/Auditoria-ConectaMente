'use server'

import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ameliaCreateProvider, ameliaUpdateProvider, ameliaGetServices } from '@/lib/amelia'

type DiaSemana = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo'
type Franja = { horaInicio: string; horaFin: string }

const DIA_MAP: Record<DiaSemana, number> = {
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
  domingo: 0,
}

export async function guardarHorarioMedico(
  medicoId: string,
  horario: Record<DiaSemana, Franja[]>
): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'backoffice') {
    return { ok: false, error: 'No autorizado' }
  }

  try {
    const usuario = await prisma.usuario.findUnique({ where: { id: medicoId } })
    if (!usuario || usuario.rol !== 'medico') {
      return { ok: false, error: 'Usuario no encontrado o no es médico' }
    }

    // Validar horas
    for (const [_dia, franjas] of Object.entries(horario)) {
      for (const franja of franjas) {
        if (franja.horaInicio >= franja.horaFin) {
          return { ok: false, error: 'Hora inicio debe ser menor a hora fin' }
        }
      }
    }

    // Construir periods para Amelia
    const weekDayList = Object.entries(horario).map(([dia, franjas]) => ({
      dayIndex: DIA_MAP[dia as DiaSemana],
      timeSlots: franjas.map((f) => ({
        startTime: f.horaInicio,
        endTime: f.horaFin,
      })),
    }))

    const AMELIA_SERVICE_ID = parseInt(process.env.AMELIA_SERVICE_ID || '2')

    // Si no existe provider, crear uno
    if (!usuario.ameliaProviderId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newProvider = await (ameliaCreateProvider as any)({
        firstName: usuario.nombre.split(' ')[0],
        lastName: usuario.nombre.split(' ').slice(1).join(' ') || usuario.nombre,
        email: usuario.email,
        serviceList: [AMELIA_SERVICE_ID],
        periods: [
          {
            periodStart: '2026-01-01',
            periodEnd: null,
            weekDayList,
          },
        ],
      })

      await prisma.usuario.update({
        where: { id: medicoId },
        data: { ameliaProviderId: newProvider.user?.id || newProvider.id },
      })
    } else {
      // Actualizar provider existente
      await ameliaUpdateProvider(usuario.ameliaProviderId, {
        periods: [
          {
            periodStart: '2026-01-01',
            periodEnd: null,
            weekDayList,
          },
        ],
      })
    }

    revalidatePath('/admin/usuarios')
    return { ok: true }
  } catch (err) {
    console.error('[guardarHorarioMedico]', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Error desconocido' }
  }
}

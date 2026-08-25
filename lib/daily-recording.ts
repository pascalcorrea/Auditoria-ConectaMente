import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
import { prisma } from './prisma'

export async function handleRecordingReady(payload: unknown) {
  const data = payload as { room_name: string; recording_url: string; recording_id: string }
  const { room_name, recording_url } = data

  const casoId = room_name.replace('conectamente-', '')
  if (!casoId) return

  await prisma.sesion.update({
    where: { casoId },
    data: {
      grabacionUrl: recording_url,
    },
  })
}

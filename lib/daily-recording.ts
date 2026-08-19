import { prisma } from './prisma'

export async function handleRecordingReady(payload: unknown) {
  const data = payload as { room_name: string; recording_url: string; recording_id: string }
  const { room_name, recording_url, recording_id } = data

  const casoId = room_name.replace('conectamente-', '')
  if (!casoId) return

  await prisma.sesion.update({
    where: { casoId },
    data: {
      recordingUrl: recording_url,
      recordingId: recording_id,
    },
  })
}

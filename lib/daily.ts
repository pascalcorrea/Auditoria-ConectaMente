export async function createDailyRoom(casoId: string) {
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
        enable_recording: 'cloud',
        max_participants: 2,
        enable_video: true,
        enable_audio: true,
      },
    }),
  })

  if (!response.ok) throw new Error('Failed to create Daily room')
  const room = await response.json()
  return room.url
}

export async function getDailyRoomUrl(casoId: string) {
  if (!process.env.DAILY_API_KEY) return null

  try {
    const response = await fetch(`https://api.daily.co/v1/rooms/conectamente-${casoId}`, {
      headers: { Authorization: `Bearer ${process.env.DAILY_API_KEY}` },
    })
    if (!response.ok) return null
    const room = await response.json()
    return room.url
  } catch {
    return null
  }
}

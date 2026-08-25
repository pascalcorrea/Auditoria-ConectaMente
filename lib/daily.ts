import crypto from 'crypto'

const DAILY_API_KEY = process.env.DAILY_API_KEY
const DAILY_API_SECRET = process.env.DAILY_API_SECRET
const DAILY_API_URL = 'https://api.daily.co/v1'

interface DailyRoomConfig {
  properties?: {
    enable_chat?: boolean
    enable_screenshare?: boolean
    enable_hand_raise?: boolean
  }
}

interface DailyTokenPayload {
  r: string
  d: number
  nbf?: number
  exp?: number
  aud?: string
  scopes?: string[]
  user_id?: string
  user_name?: string
}

export async function createRoom(roomName: string, config?: DailyRoomConfig) {
  if (!DAILY_API_KEY) throw new Error('DAILY_API_KEY not configured')

  const res = await fetch(`${DAILY_API_URL}/rooms`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DAILY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: roomName,
      privacy: 'private',
      ...config,
    }),
  })

  if (!res.ok) {
    throw new Error(`Daily.co error: ${res.statusText}`)
  }

  return res.json()
}

export function generateToken(
  roomName: string,
  userName: string,
  userRole: 'medico' | 'evaluado',
  expiresIn: number = 3600
) {
  if (!DAILY_API_SECRET) throw new Error('DAILY_API_SECRET not configured')

  const now = Math.floor(Date.now() / 1000)
  const payload: DailyTokenPayload = {
    r: roomName,
    d: now,
    nbf: now,
    exp: now + expiresIn,
    user_id: `${userRole}_${Date.now()}`,
    user_name: userName,
  }

  // Scopes based on role
  if (userRole === 'medico') {
    payload.scopes = ['participants:read', 'recordings:read', 'recordings:write']
  } else {
    payload.scopes = ['participants:read']
  }

  const header = Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'HS256' })).toString('base64url')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto
    .createHmac('sha256', DAILY_API_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url')

  return `${header}.${body}.${signature}`
}

export async function getRoom(roomName: string) {
  if (!DAILY_API_KEY) throw new Error('DAILY_API_KEY not configured')

  const res = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
    headers: {
      'Authorization': `Bearer ${DAILY_API_KEY}`,
    },
  })

  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Daily.co error: ${res.statusText}`)

  return res.json()
}

export interface WebhookEvent {
  event: string
  room_name: string
  participant?: {
    session_id: string
    user_id: string
    user_name: string
  }
  timestamp?: number
}

export function validateWebhook(payload: string, signature: string): boolean {
  if (!DAILY_API_SECRET) return false

  const hash = crypto
    .createHmac('sha256', DAILY_API_SECRET)
    .update(payload)
    .digest('hex')

  return hash === signature
}

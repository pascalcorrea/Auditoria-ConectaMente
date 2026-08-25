import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { handleRecordingReady } from '@/lib/daily-recording'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()

    if (payload.event === 'recording-ready') {
      await handleRecordingReady(payload.data)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
  }
}

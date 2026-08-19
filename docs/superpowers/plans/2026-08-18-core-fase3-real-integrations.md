# ConectaMente Core™ — Fase 3 (Real Integrations) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace MVP mocks with real integrations — Daily.co video conferencing, PDF report generation, AI-powered transcription, and session recording storage.

**Architecture:** Extend existing Next.js 15 + Prisma + PostgreSQL. Add Daily.co SDK client, PDF generation library (pdfkit or similar), and transcription API (Deepgram or similar).

**Tech Stack:** 
- Daily.co SDK for real video rooms (daily-js)
- pdfkit for PDF generation (or @react-pdf/renderer if ESM issues resolved)
- Deepgram API for transcription (or similar)
- S3 or local storage for recordings/PDFs

---

## Task 1: Daily.co Real Integration

**Files:**
- Modify: `components/DailyVideoRoom.tsx`
- Create: `lib/daily.ts` (Daily.co room management)
- Create: `app/api/medico/casos/[id]/daily-token/route.ts` (token generation)

**Interfaces:**
- Consumes: Daily.co API (DAILY_API_KEY)
- Produces: Real video call with recording

- [ ] **Step 1: Set up Daily.co SDK**

Install daily-js:
```bash
npm install daily-js
```

Create `lib/daily.ts`:

```typescript
import Daily from '@daily-js/daily-core'

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
  const response = await fetch(`https://api.daily.co/v1/rooms/${casoId}`, {
    headers: { Authorization: `Bearer ${process.env.DAILY_API_KEY}` },
  })
  if (!response.ok) return null
  const room = await response.json()
  return room.url
}
```

- [ ] **Step 2: Create token endpoint**

Create `app/api/medico/casos/[id]/daily-token/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'medico') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.DAILY_API_KEY) return NextResponse.json({ error: 'Daily API not configured' }, { status: 500 })

  const casoId = params.id
  const response = await fetch(`https://api.daily.co/v1/meeting-tokens`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      properties: {
        room_name: `conectamente-${casoId}`,
        user_name: session.user.nombre,
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
    }),
  })

  if (!response.ok) return NextResponse.json({ error: 'Failed to create token' }, { status: 500 })
  const { token } = await response.json()
  return NextResponse.json({ token })
}
```

- [ ] **Step 3: Update DailyVideoRoom.tsx**

Replace mock with real Daily.js integration:

```typescript
'use client'

import { useEffect, useRef, useState } from 'react'
import DailyIframe from '@daily-js/daily-core'
import { Button } from './ui/Button'

interface DailyVideoRoomProps {
  dailyRoomUrl: string
  userName: string
  casoId: string
}

export function DailyVideoRoom({ dailyRoomUrl, userName, casoId }: DailyVideoRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const callObjectRef = useRef<any>(null)
  const [consentGiven, setConsentGiven] = useState(false)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStartSession = async () => {
    if (!consentGiven) {
      setError('Debe dar consentimiento para grabar')
      return
    }

    try {
      // Fetch meeting token
      const tokenRes = await fetch(`/api/medico/casos/${casoId}/daily-token`, { method: 'POST' })
      const { token } = await tokenRes.json()

      // Create Daily call object
      const callObject = DailyIframe.createCallObject()
      callObjectRef.current = callObject

      // Join meeting
      await callObject.join({
        url: dailyRoomUrl,
        token,
      })

      setSessionStarted(true)

      // Update sesion state
      await fetch(`/api/medico/casos/${casoId}/sesion/consent`, { method: 'POST' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session')
    }
  }

  const handleEndSession = async () => {
    try {
      if (callObjectRef.current) {
        await callObjectRef.current.leave()
        callObjectRef.current = null
      }
      await fetch(`/api/medico/casos/${casoId}/sesion/end`, { method: 'POST' })
      setSessionStarted(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end session')
    }
  }

  if (!sessionStarted) {
    return (
      <div className="flex-1 flex items-center justify-center bg-brand-bgSecondary p-8">
        <div className="max-w-md">
          <h2 className="text-lg font-medium text-brand-text mb-4">Consentimiento de grabación</h2>
          <p className="text-sm text-brand-textSecondary mb-4">
            Confirma que tienes consentimiento del evaluado para grabar esta sesión.
          </p>
          {error && <p className="text-sm text-brand-danger mb-4">{error}</p>}
          <label className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-brand-text">Tengo consentimiento para grabar</span>
          </label>
          <Button onClick={handleStartSession} disabled={!consentGiven}>
            Iniciar sesión
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-brand-bgSecondary">
      <div ref={containerRef} className="flex-1" />
      <div className="p-4 bg-brand-bg border-t border-brand-borderSoft flex gap-2">
        <Button onClick={handleEndSession} variant="secondary">
          Finalizar sesión
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run build & tests**

```bash
npm run build
npm run test
```

Expected: SUCCESS (or only known SSH DB failures).

- [ ] **Step 5: Commit**

```bash
git add components/DailyVideoRoom.tsx lib/daily.ts app/api/medico/casos/[id]/daily-token/route.ts
git commit -m "feat: Real Daily.co integration (video conferencing + recording)"
git push
```

---

## Task 2: PDF Report Generation

**Files:**
- Create: `lib/pdf-generator.ts`
- Modify: `app/medico/casos/[id]/informe/page.tsx`
- Create: `app/api/medico/casos/[id]/informe/download/route.ts`

**Interfaces:**
- Consumes: pdfkit, caso data, transcription
- Produces: PDF report with case info, findings, transcription

- [ ] **Step 1: Install pdfkit**

```bash
npm install pdfkit
npm install -D @types/pdfkit
```

- [ ] **Step 2: Create PDF generator**

Create `lib/pdf-generator.ts`:

```typescript
import PDFDocument from 'pdfkit'
import { Caso } from '@prisma/client'

export async function generateCasoPDF(
  caso: Caso & { organizacion: any; medico: any },
  transcription: string
) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument()
    const buffers: Buffer[] = []

    doc.on('data', (chunk) => buffers.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(buffers)))
    doc.on('error', reject)

    // Header
    doc.fontSize(20).text('Informe de Auditoría Médica', { align: 'center' })
    doc.fontSize(12).text(`Caso: ${caso.nombreEvaluado}`, { align: 'center' })
    doc.moveDown()

    // Case info
    doc.fontSize(14).text('Información del Caso', { underline: true })
    doc.fontSize(10)
    doc.text(`Organización: ${caso.organizacion.nombre}`)
    doc.text(`Médico Evaluador: ${caso.medico.nombre}`)
    doc.text(`Estado: ${caso.estado}`)
    doc.text(`Fecha Límite: ${caso.fechaLimite.toLocaleDateString('es-CL')}`)
    doc.moveDown()

    // Transcription
    doc.fontSize(14).text('Transcripción de Sesión', { underline: true })
    doc.fontSize(10).text(transcription || 'Sin transcripción disponible')
    doc.moveDown()

    // Footer
    doc.fontSize(8).text(`Generado: ${new Date().toLocaleString('es-CL')}`, { align: 'right' })

    doc.end()
  })
}
```

- [ ] **Step 3: Create download endpoint**

Create `app/api/medico/casos/[id]/informe/download/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateCasoPDF } from '@/lib/pdf-generator'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'medico') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const caso = await prisma.caso.findUnique({
    where: { id: params.id },
    include: { organizacion: true, medico: true },
  })

  if (!caso) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (caso.medicoId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const sesion = await prisma.sesion.findUnique({ where: { casoId: params.id } })
  const transcription = sesion?.transcription || ''

  const pdf = await generateCasoPDF(caso, transcription)

  return new NextResponse(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="informe-${caso.id}.pdf"`,
    },
  })
}
```

- [ ] **Step 4: Update informe page**

Modify `app/medico/casos/[id]/informe/page.tsx` to use real download endpoint (instead of mock).

- [ ] **Step 5: Run build & tests**

```bash
npm run build
npm run test
```

Expected: SUCCESS.

- [ ] **Step 6: Commit**

```bash
git add lib/pdf-generator.ts app/api/medico/casos/[id]/informe/download/route.ts app/medico/casos/[id]/informe/page.tsx
git commit -m "feat: Real PDF report generation"
git push
```

---

## Task 3: AI Transcription (Deepgram)

**Files:**
- Create: `lib/transcription.ts`
- Create: `app/api/medico/casos/[id]/sesion/transcribe/route.ts`
- Modify: `lib/medico-sesion.ts` (add transcription storage)

**Interfaces:**
- Consumes: Deepgram API (DEEPGRAM_API_KEY), session recording URL
- Produces: Transcription text stored in sesion.transcription

- [ ] **Step 1: Install Deepgram SDK**

```bash
npm install @deepgram/sdk
```

- [ ] **Step 2: Create transcription helper**

Create `lib/transcription.ts`:

```typescript
import { Deepgram } from '@deepgram/sdk'

const deepgram = new Deepgram(process.env.DEEPGRAM_API_KEY)

export async function transcribeSesion(recordingUrl: string) {
  if (!process.env.DEEPGRAM_API_KEY) throw new Error('DEEPGRAM_API_KEY not configured')

  const response = await deepgram.listen.prerecorded.transcribeUrl(
    { url: recordingUrl },
    {
      model: 'nova-2',
      language: 'es',
    }
  )

  return response.result?.results?.channels[0]?.alternatives[0]?.transcript || ''
}
```

- [ ] **Step 3: Create transcription endpoint**

Create `app/api/medico/casos/[id]/sesion/transcribe/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { transcribeSesion } from '@/lib/transcription'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'medico') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { recordingUrl } = await req.json()
  if (!recordingUrl) return NextResponse.json({ error: 'recordingUrl required' }, { status: 400 })

  try {
    const transcription = await transcribeSesion(recordingUrl)

    await prisma.sesion.update({
      where: { casoId: params.id },
      data: { transcription },
    })

    return NextResponse.json({ transcription })
  } catch (err) {
    console.error('Transcription error:', err)
    return NextResponse.json({ error: 'Failed to transcribe' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Update sesion schema (if needed)**

Verify `prisma/schema.prisma` has `transcription` field on Sesion model. If not, add:

```prisma
model Sesion {
  ...
  transcription String? @default("")
  ...
}
```

Then run migration:

```bash
npx prisma migrate dev --name add_transcription_to_sesion
```

- [ ] **Step 5: Run build & tests**

```bash
npm run build
npm run test
```

Expected: SUCCESS.

- [ ] **Step 6: Commit**

```bash
git add lib/transcription.ts app/api/medico/casos/[id]/sesion/transcribe/route.ts lib/medico-sesion.ts prisma/migrations/
git commit -m "feat: AI transcription (Deepgram) for session recordings"
git push
```

---

## Task 4: Session Recording Storage

**Files:**
- Modify: `lib/medico-sesion.ts` (store recording URL from Daily.co)
- Create: `app/api/medico/casos/[id]/sesion/recording-ready/route.ts`

**Interfaces:**
- Consumes: Daily.co webhook (recording completed)
- Produces: sesion.recordingUrl stored, trigger transcription job

- [ ] **Step 1: Update sesion model (if needed)**

Verify `prisma/schema.prisma` has `recordingUrl` on Sesion. If not, add migration.

- [ ] **Step 2: Handle Daily.co webhook**

Create `app/api/medico/casos/[id]/sesion/recording-ready/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { room_name, recording_id, recording_url } = body

  if (!room_name || !recording_url) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  // Extract casoId from room_name (format: conectamente-{casoId})
  const casoId = room_name.replace('conectamente-', '')

  try {
    // Store recording URL
    await prisma.sesion.update({
      where: { casoId },
      data: { recordingUrl: recording_url },
    })

    // TODO: Trigger transcription job asynchronously
    // For now, transcription happens on-demand via /transcribe endpoint

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Failed to process recording' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Configure Daily.co webhook**

In Daily.co dashboard, set webhook URL to:
```
https://your-domain.com/api/medico/casos/[id]/sesion/recording-ready
```

- [ ] **Step 4: Run build & tests**

```bash
npm run build
npm run test
```

Expected: SUCCESS.

- [ ] **Step 5: Commit**

```bash
git add app/api/medico/casos/[id]/sesion/recording-ready/route.ts lib/medico-sesion.ts prisma/migrations/
git commit -m "feat: Session recording storage + webhook handling"
git push
```

---

## End of Fase 3

Real integrations complete: Daily.co, PDF generation, AI transcription, recording storage.

**Next:** Fase 4 (polish, performance, security) or ship.

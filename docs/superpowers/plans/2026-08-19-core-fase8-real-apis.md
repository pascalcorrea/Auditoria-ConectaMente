# ConectaMente Core™ — Fase 8 (Real API Integrations) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace all mock implementations with real API integrations — Daily.co, Deepgram, PDF generation.

**Architecture:** Same Next.js 15 stack. Integrate external APIs that were mocked in Fases 3-4.

**Tech Stack:** daily-js (Daily.co SDK), @deepgram/sdk (Deepgram), pdfkit (PDF generation).

---

## Task 1: Real Daily.co Video Integration

**Files:**
- Modify: `components/DailyVideoRoom.tsx` (replace iframe mock with real SDK)
- Modify: `lib/daily.ts` (room creation with real API)
- Create: `app/api/medico/casos/[id]/daily-token/route.ts` (token endpoint)
- Create: `lib/daily-recording.ts` (recording webhook handling)

**Interfaces:**
- Consumes: Daily.co API (DAILY_API_KEY, configured)
- Produces: Real video conferencing with cloud recording

- [ ] **Step 1: Install Daily.js SDK**

```bash
npm install @daily-js/daily-core
```

- [ ] **Step 2: Update lib/daily.ts with real API calls**

Replace mock with real Daily.co REST API:

```typescript
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
        enable_transcription: true,
        max_participants: 2,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Daily.co error: ${error.error}`)
  }

  const { url } = await response.json()
  return url
}
```

- [ ] **Step 3: Update DailyVideoRoom.tsx with real SDK**

Use Daily.js client-side SDK instead of iframe:

```typescript
'use client'

import { useEffect, useRef, useState } from 'react'
import DailyIframe from '@daily-js/daily-core'
import { Button } from './ui/Button'

export function DailyVideoRoom({ dailyRoomUrl, userName, casoId }: DailyVideoRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const callObjectRef = useRef<any>(null)
  const [consentGiven, setConsentGiven] = useState(false)
  const [sessionStarted, setSessionStarted] = useState(false)

  const handleStartSession = async () => {
    if (!consentGiven) return

    try {
      const tokenRes = await fetch(`/api/medico/casos/${casoId}/daily-token`, { method: 'POST' })
      const { token } = await tokenRes.json()

      const callObject = DailyIframe.createCallObject()
      callObjectRef.current = callObject

      await callObject.join({ url: dailyRoomUrl, token })
      setSessionStarted(true)

      await fetch(`/api/medico/casos/${casoId}/sesion/consent`, { method: 'POST' })
    } catch (err) {
      console.error('Session start error:', err)
    }
  }

  const handleEndSession = async () => {
    if (callObjectRef.current) {
      await callObjectRef.current.leave()
      callObjectRef.current = null
    }
    await fetch(`/api/medico/casos/${casoId}/sesion/end`, { method: 'POST' })
    setSessionStarted(false)
  }

  useEffect(() => {
    if (sessionStarted && containerRef.current) {
      callObjectRef.current?.setTheme({})
    }
  }, [sessionStarted])

  if (!sessionStarted) {
    return (
      <div className="flex-1 flex items-center justify-center bg-brand-bgSecondary p-8">
        <div className="max-w-md">
          <h2 className="text-lg font-medium text-brand-text mb-4">Consentimiento de grabación</h2>
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
    <div className="flex-1 flex flex-col bg-black">
      <div ref={containerRef} className="flex-1" />
      <div className="p-4 bg-brand-bg flex gap-2">
        <Button onClick={handleEndSession} variant="secondary">
          Finalizar
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create recording webhook handler**

Create `lib/daily-recording.ts`:

```typescript
import { prisma } from './prisma'

export async function handleRecordingReady(payload: any) {
  const { room_name, recording_id, recording_url } = payload

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
```

- [ ] **Step 5: Create webhook endpoint**

Create `app/api/webhooks/daily/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { handleRecordingReady } from '@/lib/daily-recording'

export async function POST(request: NextRequest) {
  const payload = await request.json()

  if (payload.event === 'recording-ready') {
    await handleRecordingReady(payload.data)
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 6: Build + test**

```bash
npm run build
npm run test
```

Expected: SUCCESS.

- [ ] **Step 7: Commit**

```bash
git add components/DailyVideoRoom.tsx lib/daily.ts lib/daily-recording.ts app/api/
git commit -m "feat: Real Daily.co integration (video SDK, cloud recording)"
git push
```

---

## Task 2: Real PDF Generation

**Files:**
- Modify: `lib/pdf-generator.ts` (replace mock with pdfkit)
- Modify: `app/api/medico/casos/[id]/informe/download/route.ts` (real PDF endpoint)

**Interfaces:**
- Consumes: Caso data, transcription
- Produces: Real PDF file download

- [ ] **Step 1: Install pdfkit**

```bash
npm install pdfkit
npm install -D @types/pdfkit
```

- [ ] **Step 2: Update pdf-generator.ts**

```typescript
import PDFDocument from 'pdfkit'
import { Caso } from '@prisma/client'

export async function generateCasoPDF(
  caso: Caso & { organizacion: { nombre: string }; medico: { nombre: string } },
  transcription: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
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
    doc.text(`Médico: ${caso.medico.nombre}`)
    doc.text(`Estado: ${caso.estado}`)
    doc.text(`Fecha Límite: ${caso.fechaLimite.toLocaleDateString('es-CL')}`)
    doc.moveDown()

    // Transcription
    doc.fontSize(14).text('Transcripción de Sesión', { underline: true })
    doc.fontSize(10).text(transcription || '(Sin transcripción disponible)')
    doc.moveDown()

    // Footer
    doc.fontSize(8).text(`Generado: ${new Date().toLocaleString('es-CL')}`, { align: 'right' })

    doc.end()
  })
}
```

- [ ] **Step 3: Update download endpoint**

```typescript
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!requireRole(session, 'medico')) return errorResponse('UNAUTHORIZED')

  const { id } = await params
  const caso = await prisma.caso.findUnique({
    where: { id },
    include: { organizacion: true, medico: true },
  })

  if (!caso || caso.medicoId !== session.user.id) return errorResponse('FORBIDDEN')

  const sesion = await prisma.sesion.findUnique({ where: { casoId: id } })
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

- [ ] **Step 4: Build + test**

```bash
npm run build
npm run test
```

- [ ] **Step 5: Commit**

```bash
git add lib/pdf-generator.ts app/api/medico/casos/[id]/informe/
git commit -m "feat: Real PDF generation (pdfkit)"
git push
```

---

## Task 3: Real AI Transcription (Deepgram)

**Files:**
- Modify: `lib/transcription.ts` (replace mock with Deepgram SDK)
- Create: `app/api/medico/casos/[id]/sesion/transcribe/route.ts`

**Interfaces:**
- Consumes: Deepgram API (DEEPGRAM_API_KEY, recording URL from Daily.co)
- Produces: Transcription text

- [ ] **Step 1: Install Deepgram SDK**

```bash
npm install @deepgram/sdk
```

- [ ] **Step 2: Update transcription.ts**

```typescript
import { Deepgram } from '@deepgram/sdk'

const deepgram = new Deepgram(process.env.DEEPGRAM_API_KEY)

export async function transcribeSesion(recordingUrl: string): Promise<string> {
  if (!process.env.DEEPGRAM_API_KEY) throw new Error('DEEPGRAM_API_KEY not configured')

  try {
    const response = await deepgram.listen.prerecorded.transcribeUrl(
      { url: recordingUrl },
      {
        model: 'nova-2',
        language: 'es',
        smart_format: true,
      }
    )

    const transcript = response.result?.results?.channels[0]?.alternatives[0]?.transcript
    return transcript || ''
  } catch (err) {
    console.error('Deepgram transcription error:', err)
    throw new Error('Failed to transcribe recording')
  }
}
```

- [ ] **Step 3: Create transcription endpoint**

```typescript
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!requireRole(session, 'medico')) return errorResponse('UNAUTHORIZED')

  const { id } = await params
  const { recordingUrl } = await request.json()

  if (!recordingUrl) return errorResponse('VALIDATION_ERROR', 'recordingUrl required')

  try {
    const transcription = await transcribeSesion(recordingUrl)

    await prisma.sesion.update({
      where: { casoId: id },
      data: { transcription },
    })

    return successResponse({ transcription })
  } catch (err) {
    console.error('Transcription error:', err)
    return errorResponse('SERVER_ERROR')
  }
}
```

- [ ] **Step 4: Build + test**

```bash
npm run build
npm run test
```

- [ ] **Step 5: Commit**

```bash
git add lib/transcription.ts app/api/medico/casos/[id]/sesion/transcribe/
git commit -m "feat: Real AI transcription (Deepgram)"
git push
```

---

## Task 4: End-to-End Integration Test

**Files:**
- Create: `scripts/e2e-test.sh` (full flow verification)

**Interfaces:**
- Tests: medico session → recording → transcription → PDF download

- [ ] **Step 1: Create E2E test script**

```bash
#!/bin/bash

echo "[E2E Test] Full integration flow"

# 1. Login as medico
echo "[1/5] Login medico..."
SESSION=$(curl -s -c /tmp/cookies.txt -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"medico@test.com","password":"test123"}' \
  https://conectamente.cl/api/auth/signin)

# 2. Start video session (creates Daily room + recording)
echo "[2/5] Start session..."
SESSION=$(curl -s -b /tmp/cookies.txt \
  https://conectamente.cl/api/medico/casos/123/daily-token)

# 3. Wait for recording (Daily webhook)
echo "[3/5] Wait for recording..."
sleep 30

# 4. Trigger transcription
echo "[4/5] Transcribe recording..."
curl -s -b /tmp/cookies.txt -X POST \
  https://conectamente.cl/api/medico/casos/123/sesion/transcribe

# 5. Download PDF
echo "[5/5] Download PDF..."
curl -b /tmp/cookies.txt \
  https://conectamente.cl/api/medico/casos/123/informe/download \
  -o informe.pdf

echo "[E2E Test] ✓ Complete"
```

- [ ] **Step 2: Commit**

```bash
git add scripts/e2e-test.sh
git commit -m "test: E2E integration test (session → recording → transcription → PDF)"
git push
```

---

## Task 5: Final Verification & Merge

**Files:**
- Run: full test suite
- Verify: all integrations working

**Interfaces:**
- Tests pass
- Build succeeds
- All APIs integrated

- [ ] **Step 1: Run tests**

```bash
npm run test
npm run build
```

- [ ] **Step 2: Tag release**

```bash
git tag -a v1.0.1-real-apis -m "Fase 8: Real API integrations"
git push origin v1.0.1-real-apis
```

---

## End of Fase 8

All mock implementations replaced with real APIs. Platform fully functional.

**Next:** Fase 9 (Advanced features: analytics, notifications, bulk operations) or production deployment with real APIs.

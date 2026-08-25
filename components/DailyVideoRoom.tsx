import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
'use client'

import { useRef, useState, useEffect } from 'react'
import { Button } from './ui/Button'

interface DailyVideoRoomProps {
  casoId: string
}

export function DailyVideoRoom({ casoId }: DailyVideoRoomProps) {
  const [consentGiven, setConsentGiven] = useState(false)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [roomUrl, setRoomUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const handleStartSession = async () => {
    if (!consentGiven) {
      setError('Debe dar consentimiento para grabar')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/medico/casos/${casoId}/sesion/token`)
      if (!res.ok) throw new Error('Failed to get token')

      const data = await res.json()
      setToken(data.token)
      setRoomUrl(data.roomUrl)

      await fetch(`/api/medico/casos/${casoId}/sesion/consent`, { method: 'POST' })
      setSessionStarted(true)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  const handleEndSession = async () => {
    try {
      await fetch(`/api/medico/casos/${casoId}/sesion/end`, { method: 'POST' })
      setSessionStarted(false)
      setToken(null)
      setRoomUrl(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al finalizar')
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
          <Button onClick={handleStartSession} disabled={!consentGiven || loading}>
            {loading ? 'Conectando...' : 'Iniciar sesión'}
          </Button>
        </div>
      </div>
    )
  }

  if (!token || !roomUrl) {
    return (
      <div className="flex-1 flex items-center justify-center bg-brand-bgSecondary">
        <div className="text-center">
          <p className="text-sm text-brand-textSecondary">Conectando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-black">
      <iframe
        ref={iframeRef}
        src={`${roomUrl}?token=${encodeURIComponent(token)}`}
        className="flex-1 w-full border-0"
        allow="camera; microphone; display-capture"
      />
      <div className="p-4 bg-brand-bg border-t border-brand-borderSoft flex gap-2">
        <Button onClick={handleEndSession} variant="secondary">
          Finalizar sesión
        </Button>
      </div>
    </div>
  )
}

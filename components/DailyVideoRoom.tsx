'use client'

import { useState } from 'react'
import { Button } from './ui/Button'

interface DailyVideoRoomProps {
  dailyRoomUrl: string
  userName: string
  casoId: string
  medicoId: string
}

export function DailyVideoRoom({ dailyRoomUrl, userName, casoId, medicoId }: DailyVideoRoomProps) {
  const [consentGiven, setConsentGiven] = useState(false)
  const [sessionStarted, setSessionStarted] = useState(false)

  const handleStartSession = async () => {
    if (!consentGiven) {
      alert('Debe dar consentimiento para grabar')
      return
    }

    await fetch(`/api/medico/casos/${casoId}/sesion/consent`, {
      method: 'POST',
    })

    setSessionStarted(true)

    // MVP: Mock session (real Daily.co integration in Fase 3)
    setTimeout(async () => {
      await fetch(`/api/medico/casos/${casoId}/sesion/end`, { method: 'POST' })
      setSessionStarted(false)
    }, 60000) // Auto-end after 1 minute for demo
  }

  if (!sessionStarted) {
    return (
      <div className="flex-1 flex items-center justify-center bg-brand-bgSecondary p-8">
        <div className="max-w-md">
          <h2 className="text-lg font-medium text-brand-text mb-4">Consentimiento de grabación</h2>
          <p className="text-sm text-brand-textSecondary mb-4">
            Confirma que tienes consentimiento del evaluado para grabar esta sesión.
          </p>
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
    <div className="flex-1 flex items-center justify-center bg-brand-bgSecondary">
      <div className="max-w-md text-center">
        <h2 className="text-lg font-medium text-brand-text mb-4">Sesión de video en progreso</h2>
        <p className="text-sm text-brand-textSecondary">
          MVP: Daily.co integration coming in Fase 3. Session will auto-end in 1 minute.
        </p>
      </div>
    </div>
  )
}

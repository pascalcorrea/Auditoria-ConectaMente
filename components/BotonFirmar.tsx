'use client'

import { useState } from 'react'
import { Button } from './ui/Button'

interface BotonFirmarProps {
  casoId: string
}

export function BotonFirmar({ casoId }: BotonFirmarProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFirmar = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/medico/casos/${casoId}/informe/firmar`, {
        method: 'POST',
      })

      if (!res.ok) {
        throw new Error('Error al firmar documento')
      }

      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={handleFirmar} disabled={loading}>
        {loading ? 'Firmando...' : 'Firmar documento'}
      </Button>
      {error && <p className="text-sm text-brand-danger mt-2">{error}</p>}
    </>
  )
}

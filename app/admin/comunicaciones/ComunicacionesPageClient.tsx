'use client'

import { useState } from 'react'
import ComunicacionesForm from './ComunicacionesForm'
import HistorialEnvios from './HistorialEnvios'

type Usuario = { id: string; nombre: string; email: string; rol: string }
type Caso = { id: string; nombreEvaluado: string; organizacion: { nombre: string } }

export default function ComunicacionesPageClient({
  usuarios,
  casos,
}: {
  usuarios: Usuario[]
  casos: Caso[]
}) {
  const [refetchTrigger, setRefetchTrigger] = useState(0)

  function handleEnviado() {
    setRefetchTrigger((prev) => prev + 1)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 text-lg font-semibold text-brand-text">Enviar comunicación</h2>
        <ComunicacionesForm usuarios={usuarios} casos={casos} onEnviado={handleEnviado} />
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-brand-text">Historial de envíos</h2>
        <HistorialEnvios refetchTrigger={refetchTrigger} />
      </div>
    </div>
  )
}

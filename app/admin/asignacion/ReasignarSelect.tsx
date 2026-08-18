'use client'

import { reasignarMedico } from './actions'

type Medico = { id: string; nombre: string }

export function ReasignarSelect({
  casoId,
  medicoIdActual,
  medicos,
}: {
  casoId: string
  medicoIdActual: string | null
  medicos: Medico[]
}) {
  return (
    <select
      aria-label="Médico asignado"
      defaultValue={medicoIdActual ?? ''}
      onChange={(e) => reasignarMedico(casoId, e.target.value)}
      className="rounded-lg border border-brand-border bg-brand-bg px-2 py-1 text-sm text-brand-text outline-none focus:border-brand-accent"
    >
      <option value="">Sin asignar</option>
      {medicos.map((m) => (
        <option key={m.id} value={m.id}>
          {m.nombre}
        </option>
      ))}
    </select>
  )
}

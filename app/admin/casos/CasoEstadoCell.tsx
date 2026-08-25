import type { EstadoCaso, PrioridadCaso } from '@/lib/types'
'use client'

import { cambiarEstadoCaso } from './actions'
import { StatusDropdown } from '@/components/ui/StatusDropdown'
import { ESTADO_DOT_COLOR, ESTADO_LABEL } from '@/components/ui/StatusBadge'


export default function CasoEstadoCell({ casoId, estadoActual }: { casoId: string; estadoActual: EstadoCaso }) {
  const estadosOpciones: EstadoCaso[] = ['recibido', 'en_revision', 'informe_en_validacion', 'entregado']

  const opciones = estadosOpciones.map((e) => ({
    value: e,
    label: ESTADO_LABEL[e],
    dot: ESTADO_DOT_COLOR[e],
  }))

  async function handleChange(nuevoEstado: string) {
    await cambiarEstadoCaso(casoId, nuevoEstado as EstadoCaso)
  }

  return (
    <StatusDropdown
      value={estadoActual}
      options={opciones}
      onChange={handleChange}
    />
  )
}

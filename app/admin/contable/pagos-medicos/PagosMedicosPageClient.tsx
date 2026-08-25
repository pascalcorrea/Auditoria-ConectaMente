'use client'

import { useEffect, useState } from 'react'
import { ESTADO_PAGO_LABEL, ESTADO_PAGO_TONO, TONO_CLASSES } from '@/components/ui/StatusBadge'

type PagoDetalle = {
  id: string
  estado: string
  montoClp: number
  medico: { nombre: string }
  caso: { nombreEvaluado: string }
}

type Props = {
  medicos: Array<{ id: string; nombre: string }>
}

export default function PagosMedicosPageClient({ medicos }: Props) {
  const [pagos, setPagos] = useState<PagoDetalle[]>([])
  const [loading, setLoading] = useState(true)
  const [medicoFilter, setMedicoFilter] = useState('')
  const [estadoFilter, setEstadoFilter] = useState('')

  useEffect(() => {
    async function fetchPagos() {
      setLoading(true)
      try {
        const url = new URL('/api/admin/contable/pagos-medico', window.location.origin)
        if (medicoFilter) url.searchParams.set('medicoId', medicoFilter)
        if (estadoFilter) url.searchParams.set('estado', estadoFilter)

        const res = await fetch(url.toString())
        const data = await res.json()
        setPagos(data.pagos || [])
      } catch (err) {
        console.error('Error fetching pagos:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPagos()
  }, [medicoFilter, estadoFilter])

  async function handleMarcarPagado(pagoId: string) {
    try {
      const res = await fetch(`/api/admin/contable/pagos-medico/${pagoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'pagado' }),
      })

      if (res.ok) {
        setPagos(pagos.map((p) => (p.id === pagoId ? { ...p, estado: 'pagado' } : p)))
      }
    } catch (err) {
      console.error('Error marking pago:', err)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="grid grid-cols-2 gap-3 rounded-lg border border-brand-borderSoft bg-white p-4">
        <select
          value={medicoFilter}
          onChange={(e) => setMedicoFilter(e.target.value)}
          className="rounded border border-brand-border px-2 py-1 text-sm"
        >
          <option value="">Todos los médicos</option>
          {medicos.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre}
            </option>
          ))}
        </select>
        <select
          value={estadoFilter}
          onChange={(e) => setEstadoFilter(e.target.value)}
          className="rounded border border-brand-border px-2 py-1 text-sm"
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="pagado">Pagado</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-lg border border-brand-borderSoft bg-white shadow-sm">
        <div className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr_1.2fr] gap-px bg-brand-bg px-5 py-2.5">
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-textSecondary">Médico</div>
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-textSecondary">Caso</div>
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-textSecondary">Monto CLP</div>
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-textSecondary">Estado</div>
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-textSecondary">Acción</div>
        </div>
        {pagos.length === 0 && (
          <div className="p-4 text-center text-sm text-brand-textMuted">Sin pagos registrados</div>
        )}
        {pagos.map((pago) => (
          <div key={pago.id} className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr_1.2fr] items-center border-t border-brand-borderSoft/70 px-5 py-3">
            <div className="text-sm text-brand-text">{pago.medico.nombre}</div>
            <div className="text-sm text-brand-textSecondary">{pago.caso.nombreEvaluado}</div>
            <div className="text-sm font-medium text-brand-text">${pago.montoClp.toLocaleString('es-CL')}</div>
            <div>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                  TONO_CLASSES[ESTADO_PAGO_TONO[pago.estado as keyof typeof ESTADO_PAGO_TONO]]
                }`}
              >
                {ESTADO_PAGO_LABEL[pago.estado as keyof typeof ESTADO_PAGO_LABEL]}
              </span>
            </div>
            <div>
              {pago.estado === 'pendiente' && (
                <button
                  onClick={() => handleMarcarPagado(pago.id)}
                  className="text-xs font-medium text-brand-accent hover:underline"
                >
                  Marcar pagado
                </button>
              )}
              {pago.estado === 'pagado' && <span className="text-xs text-brand-textMuted">Pagado</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { ESTADO_ENVIO_LABEL, ESTADO_ENVIO_TONO, TONO_CLASSES } from '@/components/ui/StatusBadge'

type LogEnvioDetalle = {
  estado: string
  caso?: { nombreEvaluado: string } | null
  destinatario?: { nombre: string } | null
  enviadoPor: { nombre: string }
}

export default function HistorialEnvios({ refetchTrigger }: { refetchTrigger: number }) {
  const [logs, setLogs] = useState<LogEnvioDetalle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHistorial() {
      setLoading(true)
      try {
        const res = await fetch('/api/admin/comunicaciones/historial?page=0')
        const data = await res.json()
        setLogs(data.logs || [])
      } catch (err) {
        console.error('Error fetching historial:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchHistorial()
  }, [refetchTrigger])

  if (loading) {
    return <div className="text-center text-sm text-brand-textMuted">Cargando...</div>
  }

  if (logs.length === 0) {
    return <div className="text-center text-sm text-brand-textMuted">Sin envíos registrados</div>
  }

  return (
    <div className="overflow-hidden rounded-lg border border-brand-borderSoft bg-white shadow-sm">
      <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1.2fr_1fr] gap-px bg-brand-bg px-5 py-2.5">
        <div className="text-xs font-semibold uppercase tracking-wider text-brand-textSecondary">
          Destino
        </div>
        <div className="text-xs font-semibold uppercase tracking-wider text-brand-textSecondary">
          Caso
        </div>
        <div className="text-xs font-semibold uppercase tracking-wider text-brand-textSecondary">
          Canal
        </div>
        <div className="text-xs font-semibold uppercase tracking-wider text-brand-textSecondary">
          Enviado por
        </div>
        <div className="text-xs font-semibold uppercase tracking-wider text-brand-textSecondary">
          Estado
        </div>
        <div className="text-xs font-semibold uppercase tracking-wider text-brand-textSecondary">
          Fecha
        </div>
      </div>
      {logs.map((log) => (
        <div
          key={log.id}
          className="grid grid-cols-[1fr_1fr_1fr_1fr_1.2fr_1fr] items-center border-t border-brand-borderSoft/70 px-5 py-3"
        >
          <div className="text-sm text-brand-textSecondary">{log.destino}</div>
          <div className="text-sm text-brand-textSecondary">{log.caso?.nombreEvaluado || '—'}</div>
          <div className="text-sm capitalize text-brand-text">{log.canal}</div>
          <div className="text-sm text-brand-textSecondary">{log.enviadoPor.nombre}</div>
          <div>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                TONO_CLASSES[ESTADO_ENVIO_TONO[log.estado]]
              }`}
            >
              {ESTADO_ENVIO_LABEL[log.estado]}
            </span>
          </div>
          <div className="text-sm tabular-nums text-brand-textMuted">
            {log.creadoEn.toLocaleDateString('es-CL')}
          </div>
        </div>
      ))}
    </div>
  )
}

import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
'use client'

import { useEffect, useState } from 'react'
import { ESTADO_FACTURA_LABEL, ESTADO_FACTURA_TONO, TONO_CLASSES } from '@/components/ui/StatusBadge'

type FacturaDetalle = FacturaOrganizacion & { organizacion: { nombre: string } }

type Props = {
  organizaciones: Array<{ id: string; nombre: string }>
}

export default function FacturacionPageClient({ organizaciones }: Props) {
  const [facturas, setFacturas] = useState<FacturaDetalle[]>([])
  const [loading, setLoading] = useState(true)
  const [periodoInicio, setPeriodoInicio] = useState('')
  const [periodoFin, setPeriodoFin] = useState('')
  const [organizacionId, setOrganizacionId] = useState('')
  const [generando, setGenerando] = useState(false)

  useEffect(() => {
    async function fetchFacturas() {
      setLoading(true)
      try {
        const res = await fetch('/api/admin/contable/facturas?page=0')
        const data = await res.json()
        setFacturas(data.facturas || [])
      } catch (err) {
        console.error('Error fetching facturas:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchFacturas()
  }, [])

  async function handleGenerarFactura(e: React.FormEvent) {
    e.preventDefault()
    if (!organizacionId || !periodoInicio || !periodoFin) return

    setGenerando(true)
    try {
      const res = await fetch('/api/admin/contable/facturas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizacionId,
          periodoInicio: new Date(periodoInicio),
          periodoFin: new Date(periodoFin),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setFacturas([data.factura, ...facturas])
        setPeriodoInicio('')
        setPeriodoFin('')
        setOrganizacionId('')
      }
    } catch (err) {
      console.error('Error generating factura:', err)
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Generador */}
      <form onSubmit={handleGenerarFactura} className="rounded-lg border border-brand-borderSoft bg-white p-6">
        <h3 className="mb-4 font-semibold text-brand-text">Generar nueva factura</h3>
        <div className="grid grid-cols-3 gap-3">
          <select
            value={organizacionId}
            onChange={(e) => setOrganizacionId(e.target.value)}
            className="rounded border border-brand-border px-2 py-2 text-sm"
          >
            <option value="">Seleccionar organización</option>
            {organizaciones.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nombre}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={periodoInicio}
            onChange={(e) => setPeriodoInicio(e.target.value)}
            className="rounded border border-brand-border px-2 py-2 text-sm"
          />
          <input
            type="date"
            value={periodoFin}
            onChange={(e) => setPeriodoFin(e.target.value)}
            className="rounded border border-brand-border px-2 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={generando}
          className="mt-3 rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-white hover:bg-brand-accentHover disabled:opacity-50"
        >
          {generando ? 'Generando...' : 'Generar'}
        </button>
      </form>

      {/* Tabla */}
      <div className="overflow-hidden rounded-lg border border-brand-borderSoft bg-white shadow-sm">
        <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1.2fr] gap-px bg-brand-bg px-5 py-2.5">
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-textSecondary">Organización</div>
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-textSecondary">Casos</div>
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-textSecondary">Monto CLP</div>
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-textSecondary">Estado</div>
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-textSecondary">Fecha</div>
        </div>
        {facturas.length === 0 && (
          <div className="p-4 text-center text-sm text-brand-textMuted">Sin facturas registradas</div>
        )}
        {facturas.map((factura) => (
          <div key={factura.id} className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1.2fr] items-center border-t border-brand-borderSoft/70 px-5 py-3">
            <div className="text-sm text-brand-text">{factura.organizacion.nombre}</div>
            <div className="text-sm text-brand-textSecondary">{factura.casosIncluidos}</div>
            <div className="text-sm font-medium text-brand-text">${factura.montoClp.toLocaleString('es-CL')}</div>
            <div>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                  TONO_CLASSES[ESTADO_FACTURA_TONO[factura.estado]]
                }`}
              >
                {ESTADO_FACTURA_LABEL[factura.estado]}
              </span>
            </div>
            <div className="text-sm tabular-nums text-brand-textMuted">{factura.creadoEn.toLocaleDateString('es-CL')}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

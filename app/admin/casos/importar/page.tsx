'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { TopHeader } from '@/components/layout/TopHeader'

type FilaImportacion = {
  numeroFila: number
  datos: { rut: string; nombre: string; organizacion: string; tipoLicencia: string; fechaEmision: string; prioridad: string }
  errores: string[]
}

export default function ImportarCasosPage() {
  const router = useRouter()
  const [filas, setFilas] = useState<FilaImportacion[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<{ creados: number; enviados: number } | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/admin/casos/importar/preview', { method: 'POST', body: formData })
    setLoading(false)

    if (!res.ok) {
      setError('No se pudo leer el archivo')
      return
    }

    const data = await res.json()
    setFilas(data.filas)
  }

  async function handleConfirmar() {
    if (!filas) return
    const filasValidas = filas.filter((f: any) => f.errores.length === 0).map((f: any) => f.datos)

    setLoading(true)
    setError(null)
    setResultado(null)

    const res = await fetch('/api/admin/casos/importar/confirmar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filas: filasValidas }),
    })
    setLoading(false)

    if (!res.ok) {
      setError('No se pudo confirmar la importación')
      return
    }

    const data = await res.json()
    const creados = typeof data.creados === 'number' ? data.creados : 0

    if (creados === filasValidas.length) {
      router.push('/admin/casos')
      return
    }

    // The confirm endpoint re-validates every row independently and may
    // reject some the preview accepted (e.g. an organización renamed in
    // between) — surface that instead of silently redirecting as if
    // everything the user saw as "valid" actually got created.
    setResultado({ creados, enviados: filasValidas.length })
  }

  const hayFilasValidas = filas?.some((f) => f.errores.length === 0) ?? false
  const filasValidasCount = filas?.filter((f: any) => f.errores.length === 0).length ?? 0
  const filasConErrorCount = filas ? filas.length - filasValidasCount : 0

  return (
    <>
      <TopHeader title="Importar casos" />
      <div className="flex-1 overflow-auto p-8">
        <div className="mb-6 flex items-center gap-2.5">
          <div className={`flex items-center gap-2 text-sm font-medium ${filas ? 'text-brand-accent' : 'text-brand-text'}`}>
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold text-white ${filas ? 'bg-brand-accent' : 'bg-brand-textMuted'}`}
            >
              {filas ? '✓' : '1'}
            </span>
            1. Subir archivo
          </div>
          <div className="h-px w-10 bg-brand-border" />
          <div className={`flex items-center gap-2 text-sm font-medium ${filas ? 'text-brand-text' : 'text-brand-textMuted'}`}>
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold text-white ${filas ? 'bg-brand-accent' : 'bg-brand-textMuted'}`}
            >
              2
            </span>
            2. Confirmar
          </div>
        </div>

        {!filas && (
          <Card className="max-w-md">
            <label className="text-sm text-brand-text">
              Archivo Excel/CSV
              <input type="file" accept=".xlsx,.csv" onChange={handleFileChange} className="mt-2 block text-sm" />
            </label>
            {loading && <p className="mt-2 text-sm text-brand-textSecondary">Leyendo archivo…</p>}
            {error && <p className="mt-2 text-sm text-brand-danger">{error}</p>}
          </Card>
        )}

        {filas && (
          <>
            <div className="mb-5 flex gap-4">
              <div className="flex-1 rounded-xl border border-brand-borderSoft bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)]">
                <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-brand-textSecondary">Filas válidas</div>
                <div className="text-xl font-semibold text-brand-accent">{filasValidasCount}</div>
              </div>
              <div className="flex-1 rounded-xl border border-brand-borderSoft bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)]">
                <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-brand-textSecondary">Filas con errores</div>
                <div className="text-xl font-semibold text-brand-danger">{filasConErrorCount}</div>
              </div>
            </div>

            <div className="mb-5 overflow-hidden rounded-xl border border-brand-borderSoft bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)]">
              <div className="grid grid-cols-[0.6fr_1.6fr_1.6fr_1.2fr_2fr] bg-brand-bg px-5 py-2.5">
                <div className="text-[10.5px] font-semibold uppercase tracking-wider text-brand-textSecondary">Fila</div>
                <div className="text-[10.5px] font-semibold uppercase tracking-wider text-brand-textSecondary">RUT</div>
                <div className="text-[10.5px] font-semibold uppercase tracking-wider text-brand-textSecondary">Nombre</div>
                <div className="text-[10.5px] font-semibold uppercase tracking-wider text-brand-textSecondary">Organización</div>
                <div className="text-[10.5px] font-semibold uppercase tracking-wider text-brand-textSecondary">Errores</div>
              </div>
              {filas.map((fila: any) => (
                <div
                  key={fila.numeroFila}
                  className={`grid grid-cols-[0.6fr_1.6fr_1.6fr_1.2fr_2fr] items-center border-t border-brand-borderSoft/70 px-5 py-3 ${fila.errores.length > 0 ? 'bg-brand-dangerSoft' : ''}`}
                >
                  <div className="text-sm tabular-nums text-brand-textSecondary">{fila.numeroFila}</div>
                  <div className="text-sm text-brand-text">{fila.datos.rut}</div>
                  <div className="text-sm text-brand-text">{fila.datos.nombre}</div>
                  <div className="text-sm text-brand-textSecondary">{fila.datos.organizacion}</div>
                  <div className="text-sm text-brand-danger">{fila.errores.join(', ')}</div>
                </div>
              ))}
            </div>

            {error && <p className="mb-4 text-sm text-brand-danger">{error}</p>}
            {resultado && (
              <p className="mb-4 text-sm text-brand-danger">
                Se crearon {resultado.creados} de {resultado.enviados} casos enviados — algunas filas fueron
                rechazadas al confirmar (por ejemplo, si una organización cambió entre la vista previa y la
                confirmación). Revisa <a href="/admin/casos" className="underline">/admin/casos</a> para ver qué
                se creó — no vuelvas a confirmar esta lista, o los casos ya creados se duplicarán.
              </p>
            )}
            {!resultado && (
              <div className="flex justify-end">
                <Button onClick={handleConfirmar} disabled={!hayFilasValidas || loading}>
                  {loading ? 'Confirmando…' : `Confirmar importación (${filasValidasCount})`}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

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
    const filasValidas = filas.filter((f) => f.errores.length === 0).map((f) => f.datos)

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

  return (
    <div className="p-8">
      <h1 className="text-lg font-medium text-brand-text">Importar casos</h1>

      {!filas && (
        <Card className="mt-4 max-w-md">
          <label className="text-sm text-brand-text">
            Archivo Excel/CSV
            <input type="file" accept=".xlsx,.csv" onChange={handleFileChange} className="mt-2 block" />
          </label>
          {loading && <p className="mt-2 text-sm text-brand-textSecondary">Leyendo archivo…</p>}
          {error && <p className="mt-2 text-sm text-brand-danger">{error}</p>}
        </Card>
      )}

      {filas && (
        <div className="mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-brand-textSecondary">
                <th className="pb-2">Fila</th>
                <th className="pb-2">RUT</th>
                <th className="pb-2">Nombre</th>
                <th className="pb-2">Organización</th>
                <th className="pb-2">Errores</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((fila) => (
                <tr
                  key={fila.numeroFila}
                  className={`border-t border-brand-borderSoft ${fila.errores.length > 0 ? 'bg-red-50' : ''}`}
                >
                  <td className="py-2">{fila.numeroFila}</td>
                  <td className="py-2">{fila.datos.rut}</td>
                  <td className="py-2">{fila.datos.nombre}</td>
                  <td className="py-2">{fila.datos.organizacion}</td>
                  <td className="py-2 text-brand-danger">{fila.errores.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {error && <p className="mt-2 text-sm text-brand-danger">{error}</p>}
          {resultado && (
            <p className="mt-2 text-sm text-brand-danger">
              Se crearon {resultado.creados} de {resultado.enviados} casos enviados — algunas filas fueron
              rechazadas al confirmar (por ejemplo, si una organización cambió entre la vista previa y la
              confirmación). Revisa <a href="/admin/casos" className="underline">/admin/casos</a> para ver qué
              se creó — no vuelvas a confirmar esta lista, o los casos ya creados se duplicarán.
            </p>
          )}
          {!resultado && (
            <Button className="mt-4" onClick={handleConfirmar} disabled={!hayFilasValidas || loading}>
              {loading ? 'Confirmando…' : 'Confirmar importación'}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

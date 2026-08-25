'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'

type Props = {
  usuarios: Array<{ id: string; nombre: string; email: string; rol: string }>
  casos: Array<{ id: string; nombreEvaluado: string; organizacion: { nombre: string } }>
  onEnviado: () => void
}

export default function ComunicacionesForm({ usuarios, casos, onEnviado }: Props) {
  const [canal, setCanal] = useState<'whatsapp' | 'email'>('email')
  const [destinatario, setDestinatario] = useState<'usuario' | 'manual'>('usuario')
  const [usuarioId, setUsuarioId] = useState('')
  const [casoId, setCasoId] = useState('')
  const [destinoManual, setDestinoManual] = useState('')
  const [asunto, setAsunto] = useState('')
  const [cuerpo, setCuerpo] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<{ ok: boolean; error?: string } | null>(null)

  async function handleEnviar() {
    setLoading(true)
    setResultado(null)

    try {
      const res = await fetch('/api/admin/comunicaciones/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canal,
          tipo: 'manual',
          casoId: casoId || null,
          destinatarioUsuarioId: destinatario === 'usuario' ? usuarioId : null,
          destinoManual: destinatario === 'manual' ? destinoManual : null,
          asunto: canal === 'email' ? asunto : null,
          cuerpo,
        }),
      })

      const data = await res.json()

      if (res.ok && data.ok) {
        setResultado({ ok: true })
        setAsunto('')
        setCuerpo('')
        setDestinoManual('')
        onEnviado()
      } else {
        setResultado({ ok: false, error: data.error || 'Error desconocido' })
      }
    } catch (err) {
      setResultado({ ok: false, error: err instanceof Error ? err.message : 'Error desconocido' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-brand-borderSoft bg-white p-6 shadow-sm">
      <div className="grid gap-4">
        {/* Canal */}
        <Select
          label="Canal"
          value={canal}
          onChange={(e) => setCanal(e.target.value as 'whatsapp' | 'email')}
          options={[
            { label: 'Email', value: 'email' },
            { label: 'WhatsApp', value: 'whatsapp' },
          ]}
        />

        {/* Tipo de destinatario */}
        <fieldset>
          <legend className="text-xs font-medium uppercase tracking-wide text-brand-textSecondary mb-2">Destinatario</legend>
          <div className="flex gap-4">
            <label className="flex items-center text-sm text-brand-text">
              <input
                type="radio"
                checked={destinatario === 'usuario'}
                onChange={() => setDestinatario('usuario')}
                className="mr-2"
              />
              Usuario
            </label>
            <label className="flex items-center text-sm text-brand-text">
              <input
                type="radio"
                checked={destinatario === 'manual'}
                onChange={() => setDestinatario('manual')}
                className="mr-2"
              />
              Manual
            </label>
          </div>
        </fieldset>

        {/* Usuario o manual */}
        {destinatario === 'usuario' ? (
          <Select
            label="Seleccionar usuario"
            value={usuarioId}
            onChange={(e) => setUsuarioId(e.target.value)}
            options={usuarios.map((u: any) => ({
              label: `${u.nombre} (${u.rol})`,
              value: u.id,
            }))}
          />
        ) : (
          <Input
            label="Destino (email o teléfono)"
            value={destinoManual}
            onChange={(e) => setDestinoManual(e.target.value)}
            placeholder="usuario@example.com o +56912345678"
          />
        )}

        {/* Caso (opcional) */}
        <Select
          label="Caso (opcional)"
          value={casoId}
          onChange={(e) => setCasoId(e.target.value)}
          options={[
            { label: 'Sin caso', value: '' },
            ...casos.map((c: any) => ({
              label: `${c.nombreEvaluado} - ${c.organizacion.nombre}`,
              value: c.id,
            })),
          ]}
        />

        {/* Email: asunto */}
        {canal === 'email' && (
          <Input label="Asunto" value={asunto} onChange={(e) => setAsunto(e.target.value)} />
        )}

        {/* Mensaje */}
        <Textarea
          label={canal === 'email' ? 'Cuerpo del email' : 'Mensaje WhatsApp'}
          value={cuerpo}
          onChange={(e) => setCuerpo(e.target.value)}
          placeholder="Escribe el mensaje aquí..."
          rows={4}
        />

        {/* Resultado */}
        {resultado && (
          <div
            className={`rounded p-3 text-sm ${
              resultado.ok
                ? 'bg-brand-accentSoft text-brand-accent'
                : 'bg-brand-dangerSoft text-brand-danger'
            }`}
          >
            {resultado.ok ? '✓ Enviado correctamente' : `✗ Error: ${resultado.error}`}
          </div>
        )}

        {/* Botón */}
        <Button
          onClick={handleEnviar}
          disabled={loading}
          className="w-full"
          variant="primary"
        >
          {loading ? 'Enviando...' : 'Enviar'}
        </Button>
      </div>
    </div>
  )
}

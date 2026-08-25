import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
'use client'

import { useState } from 'react'
import { Button } from './ui/Button'
import { Textarea } from './ui/Textarea'

interface FormularioEvaluacionProps {
  casoId: string
  nombreEvaluado: string
}

export function FormularioEvaluacion({ casoId, nombreEvaluado }: FormularioEvaluacionProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setError(null)

    try {
      const data = {
        antecedentes: formData.get('antecedentes'),
        hallazgosClinic: formData.get('hallazgosClinic'),
        diagnosticos: formData.get('diagnosticos'),
        conclusiones: formData.get('conclusiones'),
        recomendaciones: formData.get('recomendaciones'),
        observaciones: formData.get('observaciones'),
      }

      const res = await fetch(`/api/medico/casos/${casoId}/informe/generar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        throw new Error('Error al generar informe')
      }

      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-brand-text mb-2">
          Antecedentes relevantes
        </label>
        <Textarea
          name="antecedentes"
          placeholder="Antecedentes médicos, laborales, o relevantes para la evaluación..."
          rows={4}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-text mb-2">
          Hallazgos clínicos / de evaluación
        </label>
        <Textarea
          name="hallazgosClinic"
          placeholder="Describe los hallazgos encontrados durante la evaluación..."
          rows={4}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-text mb-2">
          Diagnósticos
        </label>
        <Textarea
          name="diagnosticos"
          placeholder="Diagnósticos establecidos..."
          rows={3}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-text mb-2">
          Conclusiones
        </label>
        <Textarea
          name="conclusiones"
          placeholder="Conclusiones de la evaluación..."
          rows={3}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-text mb-2">
          Recomendaciones
        </label>
        <Textarea
          name="recomendaciones"
          placeholder="Recomendaciones para el seguimiento o tratamiento..."
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-text mb-2">
          Observaciones adicionales
        </label>
        <Textarea
          name="observaciones"
          placeholder="Observaciones adicionales relevantes..."
          rows={2}
        />
      </div>

      {error && <p className="text-sm text-brand-danger">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? 'Generando PDF...' : 'Generar informe PDF'}
      </Button>
    </form>
  )
}

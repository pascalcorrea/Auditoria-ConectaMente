'use client'

import { useActionState } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { crearCasoIndividual, type CrearCasoState } from './actions'

type Organizacion = { id: string; nombre: string }

const initialState: CrearCasoState = { error: null }

export function NuevoCasoForm({ organizaciones }: { organizaciones: Organizacion[] }) {
  const [state, formAction, pending] = useActionState(crearCasoIndividual, initialState)

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div>
        <div className="mb-1 text-base font-semibold text-brand-text">Datos del evaluado</div>
        <div className="mb-4 text-xs text-brand-textSecondary">Información de la persona evaluada</div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="RUT evaluado" name="rut" required />
          <Input label="Nombre evaluado" name="nombreEvaluado" required />
          <Input label="Email evaluado" name="emailEvaluado" type="email" />
          <Input label="Teléfono evaluado" name="telefonoEvaluado" type="tel" />
        </div>
      </div>

      <div>
        <div className="mb-1 text-base font-semibold text-brand-text">Datos del caso</div>
        <div className="mb-4 text-xs text-brand-textSecondary">Definen el flujo de auditoría</div>
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Organización"
            name="organizacionId"
            required
            options={organizaciones.map((o) => ({ value: o.id, label: o.nombre }))}
          />
          <Input label="Tipo de licencia" name="tipoLicencia" required />
          <Input label="Fecha de emisión" name="fechaEmisionLicencia" type="date" required />
          <Select
            label="Prioridad"
            name="prioridad"
            options={[
              { value: 'normal', label: 'Normal' },
              { value: 'urgente', label: 'Urgente' },
            ]}
          />
        </div>
      </div>

      {state.error && <p className="text-sm text-brand-danger">{state.error}</p>}

      <div className="flex justify-end gap-3 border-t border-brand-borderSoft pt-5">
        <Button type="submit" disabled={pending}>
          {pending ? 'Creando…' : 'Guardar caso'}
        </Button>
      </div>
    </form>
  )
}

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
    <form action={formAction} className="flex flex-col gap-4">
      <Input label="RUT evaluado" name="rut" required />
      <Input label="Nombre evaluado" name="nombreEvaluado" required />
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
      {state.error && <p className="text-sm text-brand-danger">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? 'Creando…' : 'Crear caso'}
      </Button>
    </form>
  )
}

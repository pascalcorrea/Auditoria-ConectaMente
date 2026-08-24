'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { Usuario } from '@prisma/client'
import { Button } from '@/components/ui/Button'
import { guardarHorarioMedico } from '@/app/admin/usuarios/[id]/actions'

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const DIA_INDICES = { 0: 'lunes', 1: 'martes', 2: 'miercoles', 3: 'jueves', 4: 'viernes', 5: 'sabado', 6: 'domingo' } as const

type DiaSemana = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo'
type Franja = { horaInicio: string; horaFin: string }

interface WeeklyScheduleEditorProps {
  medico: Usuario
}

export function WeeklyScheduleEditor({ medico }: WeeklyScheduleEditorProps) {
  const [horario, setHorario] = useState<Record<DiaSemana, Franja[]>>({
    lunes: [],
    martes: [],
    miercoles: [],
    jueves: [],
    viernes: [],
    sabado: [],
    domingo: [],
  })

  const [atiende, setAtiende] = useState<Record<DiaSemana, boolean>>({
    lunes: false,
    martes: false,
    miercoles: false,
    jueves: false,
    viernes: false,
    sabado: false,
    domingo: false,
  })

  const handleToggleDia = (dia: DiaSemana) => {
    const nuevoAtiende = !atiende[dia]
    setAtiende((prev) => ({ ...prev, [dia]: nuevoAtiende }))
    if (!nuevoAtiende) {
      setHorario((prev) => ({ ...prev, [dia]: [] }))
    } else {
      setHorario((prev) => ({ ...prev, [dia]: [{ horaInicio: '09:00', horaFin: '17:00' }] }))
    }
  }

  const handleAddFranja = (dia: DiaSemana) => {
    setHorario((prev) => ({
      ...prev,
      [dia]: [...(prev[dia] || []), { horaInicio: '09:00', horaFin: '17:00' }],
    }))
  }

  const handleRemoveFranja = (dia: DiaSemana, index: number) => {
    setHorario((prev) => ({
      ...prev,
      [dia]: prev[dia].filter((_, i) => i !== index),
    }))
  }

  const handleChangeFranja = (dia: DiaSemana, index: number, field: 'horaInicio' | 'horaFin', value: string) => {
    setHorario((prev) => ({
      ...prev,
      [dia]: prev[dia].map((f, i) => (i === index ? { ...f, [field]: value } : f)),
    }))
  }

  const [state, action, isPending] = useActionState(
    async () => {
      const horarioFiltrado = Object.fromEntries(
        Object.entries(horario).filter(([_, franjas]) => franjas.length > 0)
      )
      return guardarHorarioMedico(medico.id, horarioFiltrado as Record<DiaSemana, Franja[]>)
    },
    { ok: false }
  )

  return (
    <div className="space-y-4">
      {DIAS.map((dia, idx) => {
        const diaKey = DIA_INDICES[idx as 0 | 1 | 2 | 3 | 4 | 5 | 6]
        return (
          <div key={dia} className="border border-brand-borderSoft rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <input
                type="checkbox"
                checked={atiende[diaKey]}
                onChange={() => handleToggleDia(diaKey)}
                className="w-4 h-4 accent-brand-accent"
              />
              <label className="text-sm font-medium text-brand-text flex-1">{dia}</label>
            </div>

            {atiende[diaKey] && (
              <div className="space-y-2 ml-7">
                {horario[diaKey].map((franja, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="time"
                      value={franja.horaInicio}
                      onChange={(e) => handleChangeFranja(diaKey, idx, 'horaInicio', e.target.value)}
                      className="w-24 rounded border border-brand-border px-2 py-1 text-sm"
                    />
                    <span className="text-brand-textSecondary">−</span>
                    <input
                      type="time"
                      value={franja.horaFin}
                      onChange={(e) => handleChangeFranja(diaKey, idx, 'horaFin', e.target.value)}
                      className="w-24 rounded border border-brand-border px-2 py-1 text-sm"
                    />
                    <button
                      onClick={() => handleRemoveFranja(diaKey, idx)}
                      className="text-xs text-brand-danger hover:text-brand-dangerHover px-2 py-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => handleAddFranja(diaKey)}
                  className="text-xs text-brand-accent hover:text-brand-accentHover"
                >
                  + Agregar franja
                </button>
              </div>
            )}
          </div>
        )
      })}

      <form action={action} className="flex gap-2 mt-6">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Guardando...' : 'Guardar horario'}
        </Button>
        {state.error && <span className="text-sm text-brand-danger">{state.error}</span>}
        {state.ok && <span className="text-sm text-brand-success">✓ Guardado</span>}
      </form>
    </div>
  )
}

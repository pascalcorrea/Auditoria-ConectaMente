import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
'use client'

import { useState, useActionState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Drawer } from '@/components/ui/Drawer'
import { Input } from '@/components/ui/Input'
import { EstadoBadge, PrioridadBadge } from '@/components/ui/StatusBadge'
import { agendarSesion, obtenerSlotsDisponibles } from './actions'

type Props = {
  caso: Caso & { sesion: Sesion | null; organizacion: Organizacion; medico: Usuario | null }
  open: boolean
}

type AgendarState = { ok?: boolean; error?: string; calendarWarning?: string }

export default function SesionDrawer({ caso, open }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [state, formAction, isPending] = useActionState(agendarSesion, {} as AgendarState)
  const [selectedDate, setSelectedDate] = useState('')
  const [slots, setSlots] = useState<string[]>([])
  const [selectedSlot, setSelectedSlot] = useState('')
  const [email, setEmail] = useState(caso.emailEvaluado || '')
  const [phone, setPhone] = useState(caso.telefonoEvaluado || '')
  const [loadingSlots, setLoadingSlots] = useState(false)

  useEffect(() => {
    if (state.ok) {
      setTimeout(() => handleClose(), 500)
    }
  }, [state.ok])

  async function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const date = e.target.value
    setSelectedDate(date)
    setSelectedSlot('')
    setSlots([])

    if (!date || !caso.medico?.id) return
    setLoadingSlots(true)
    try {
      const available = await obtenerSlotsDisponibles(caso.medico.id, date)
      setSlots(available)
    } catch (err) {
      console.warn('Error fetching slots:', err)
      setSlots([])
    }
    setLoadingSlots(false)
  }

  function handleClose() {
    const params = new URLSearchParams(searchParams)
    params.delete('detalle')
    router.push(`?${params.toString()}`)
  }

  const shouldShowScheduling = !caso.sesion || caso.sesion.estado === 'cancelada'
  const canSchedule = caso.medicoId && caso.medico?.ameliaProviderId

  return (
    <Drawer open={open} onClose={handleClose} title={`Caso: ${caso.nombreEvaluado}`}>
      {/* Datos del caso */}
      <div className="space-y-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-brand-textSecondary">Evaluado</div>
          <div className="font-medium text-brand-text">{caso.nombreEvaluado}</div>
          <div className="text-sm text-brand-textMuted">{caso.rutEvaluado}</div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wider text-brand-textSecondary">Organización</div>
          <div className="font-medium text-brand-text">{caso.organizacion.nombre}</div>
        </div>

        <div className="flex gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-brand-textSecondary">Estado</div>
            <EstadoBadge estado={caso.estado} />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-brand-textSecondary">Prioridad</div>
            <PrioridadBadge prioridad={caso.prioridad} />
          </div>
        </div>

        {/* Sesión */}
        {caso.sesion && caso.sesion.estado !== 'cancelada' && (
          <div className="border-t border-brand-borderSoft pt-4">
            <div className="mb-3 text-sm font-semibold text-brand-text">Sesión</div>
            <div className="space-y-2 text-sm text-brand-textSecondary">
              <div>
                <span className="text-xs uppercase tracking-wider">Estado:</span> {caso.sesion.estado}
              </div>
              {caso.sesion.dailyRoomUrl && (
                <div>
                  <a href={caso.sesion.dailyRoomUrl} target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline">
                    Daily.co link →
                  </a>
                </div>
              )}
              {caso.sesion.grabacionUrl && (
                <div>
                  <a href={caso.sesion.grabacionUrl} target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline">
                    Grabación →
                  </a>
                </div>
              )}
              {caso.sesion.consentimientoTimestamp && (
                <div>
                  <span className="text-xs uppercase tracking-wider">Consentimiento:</span> {caso.sesion.consentimientoTimestamp.toLocaleDateString('es-CL')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Agendamiento */}
        {shouldShowScheduling && (
          <div className="border-t border-brand-borderSoft pt-4">
            <div className="mb-3 text-sm font-semibold text-brand-text">Agendar sesión</div>
            {!canSchedule ? (
              <div className="rounded bg-brand-dangerSoft p-2 text-xs text-brand-danger">
                {!caso.medicoId ? 'Asigna un médico para agendar.' : 'El médico no tiene horario configurado.'}
              </div>
            ) : (
              <form action={formAction} className="space-y-3">
                <input type="hidden" name="casoId" value={caso.id} />

                <div>
                  <label className="text-xs uppercase tracking-wider text-brand-textSecondary">Fecha</label>
                  <input type="date" value={selectedDate} onChange={handleDateChange} disabled={isPending} className="w-full rounded border border-brand-border px-3 py-2 text-sm" />
                </div>

                {selectedDate && (
                  <div>
                    <label className="text-xs uppercase tracking-wider text-brand-textSecondary">Hora</label>
                    {loadingSlots ? (
                      <div className="text-xs text-brand-textMuted">Cargando horarios...</div>
                    ) : slots.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {slots.map(slot => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={`rounded px-2 py-1 text-xs font-medium transition ${
                              selectedSlot === slot
                                ? 'bg-brand-accent text-white'
                                : 'border border-brand-border bg-white text-brand-text hover:border-brand-accent'
                            }`}
                            disabled={isPending}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-brand-inactive">Sin horarios disponibles</div>
                    )}
                    <input type="hidden" name="fechaHora" value={selectedDate && selectedSlot ? `${selectedDate} ${selectedSlot}` : ''} />
                  </div>
                )}

                {(!email || !phone) && (
                  <div className="space-y-2 rounded bg-brand-inactiveSoft p-2">
                    {!email && (
                      <div>
                        <label className="text-xs uppercase tracking-wider text-brand-textSecondary">Email evaluado</label>
                        <input type="email" name="emailEvaluado" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" disabled={isPending} className="w-full rounded border border-brand-border px-3 py-2 text-sm" />
                      </div>
                    )}
                    {!phone && (
                      <div>
                        <label className="text-xs uppercase tracking-wider text-brand-textSecondary">Teléfono evaluado</label>
                        <input type="tel" name="telefonoEvaluado" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+56912345678" disabled={isPending} className="w-full rounded border border-brand-border px-3 py-2 text-sm" />
                      </div>
                    )}
                  </div>
                )}

                {state.error && <div className="text-xs text-brand-danger">{state.error}</div>}
                {state.calendarWarning && <div className="text-xs text-brand-warning">{state.calendarWarning}</div>}

                <button
                  type="submit"
                  disabled={!selectedDate || !selectedSlot || isPending}
                  className="w-full rounded bg-brand-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {isPending ? 'Agendando...' : 'Confirmar agendamiento'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </Drawer>
  )
}

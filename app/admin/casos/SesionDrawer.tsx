'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Drawer } from '@/components/ui/Drawer'
import { EstadoBadge, PrioridadBadge } from '@/components/ui/StatusBadge'
import type { Caso, Sesion, Usuario, Organizacion } from '@prisma/client'

type Props = {
  caso: Caso & { sesion: Sesion | null; organizacion: Organizacion; medico: Usuario | null }
  open: boolean
}

export default function SesionDrawer({ caso, open }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleClose() {
    const params = new URLSearchParams(searchParams)
    params.delete('detalle')
    router.push(`?${params.toString()}`)
  }

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
        {caso.sesion && (
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
        {!caso.sesion && (
          <div className="rounded bg-brand-inactiveSoft p-2 text-xs text-brand-inactive">Sin sesión registrada</div>
        )}
      </div>
    </Drawer>
  )
}

import type { EstadoCaso, PrioridadCaso } from '@prisma/client'

type Tono = 'positivo' | 'neutral' | 'negativo' | 'inactivo'

const TONO_CLASSES: Record<Tono, string> = {
  positivo: 'bg-brand-accentSoft text-brand-accent',
  neutral: 'bg-brand-neutralSoft text-brand-neutral',
  negativo: 'bg-brand-dangerSoft text-brand-danger',
  inactivo: 'bg-brand-inactiveSoft text-brand-inactive',
}

// Dot colors for status dropdowns (hex format)
export const ESTADO_DOT_COLOR: Record<EstadoCaso, string> = {
  recibido: '#6366F1',
  en_revision: '#6366F1',
  informe_en_validacion: '#6366F1',
  entregado: '#0CB87E',
}

// Dot classes for status dropdowns (Tailwind format, optional)
export const ESTADO_DOT_CLASS: Record<EstadoCaso, string> = {
  recibido: 'bg-brand-neutral',
  en_revision: 'bg-brand-neutral',
  informe_en_validacion: 'bg-brand-neutral',
  entregado: 'bg-brand-accent',
}

// Mirrors ConectaMente's real STATUS_COLOR convention (E:\Dev\ConectaMente-2):
// índigo for anything still in progress, green only once truly complete.
const ESTADO_TONO: Record<EstadoCaso, Tono> = {
  recibido: 'neutral',
  en_revision: 'neutral',
  informe_en_validacion: 'neutral',
  entregado: 'positivo',
}

export const ESTADO_LABEL: Record<EstadoCaso, string> = {
  recibido: 'Recibido',
  en_revision: 'En revisión',
  informe_en_validacion: 'Informe en validación',
  entregado: 'Entregado',
}

const PRIORIDAD_TONO: Record<PrioridadCaso, Tono> = {
  normal: 'inactivo',
  urgente: 'negativo',
}

const PRIORIDAD_LABEL: Record<PrioridadCaso, string> = {
  normal: 'Normal',
  urgente: 'Urgente',
}

function Badge({ tono, label }: { tono: Tono; label: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${TONO_CLASSES[tono]}`}
    >
      {label}
    </span>
  )
}

export function EstadoBadge({ estado }: { estado: EstadoCaso }) {
  return <Badge tono={ESTADO_TONO[estado]} label={ESTADO_LABEL[estado]} />
}

export function PrioridadBadge({ prioridad }: { prioridad: PrioridadCaso }) {
  return <Badge tono={PRIORIDAD_TONO[prioridad]} label={PRIORIDAD_LABEL[prioridad]} />
}

import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
import type { EstadoCaso, PrioridadCaso } from '@/lib/types'
import { render, screen } from '@testing-library/react'
import { EstadoBadge, PrioridadBadge } from './StatusBadge'

describe('EstadoBadge', () => {
  it('renders the Spanish label for every EstadoCaso value', () => {
    render(
      <>
        <EstadoBadge estado="recibido" />
        <EstadoBadge estado="en_revision" />
        <EstadoBadge estado="informe_en_validacion" />
        <EstadoBadge estado="entregado" />
      </>
    )
    expect(screen.getByText('Recibido')).toBeInTheDocument()
    expect(screen.getByText('En revisión')).toBeInTheDocument()
    expect(screen.getByText('Informe en validación')).toBeInTheDocument()
    expect(screen.getByText('Entregado')).toBeInTheDocument()
  })

  it('gives entregado the positive (accent) tone and other states a neutral tone', () => {
    render(
      <>
        <EstadoBadge estado="recibido" />
        <EstadoBadge estado="entregado" />
      </>
    )
    expect(screen.getByText('Recibido')).toHaveClass('text-brand-neutral')
    expect(screen.getByText('Entregado')).toHaveClass('text-brand-accent')
  })
})

describe('PrioridadBadge', () => {
  it('renders the Spanish label for both PrioridadCaso values', () => {
    render(
      <>
        <PrioridadBadge prioridad="normal" />
        <PrioridadBadge prioridad="urgente" />
      </>
    )
    expect(screen.getByText('Normal')).toBeInTheDocument()
    expect(screen.getByText('Urgente')).toBeInTheDocument()
  })

  it('gives urgente the negative (danger) tone', () => {
    render(<PrioridadBadge prioridad="urgente" />)
    expect(screen.getByText('Urgente')).toHaveClass('text-brand-danger')
  })
})

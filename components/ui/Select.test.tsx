import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
import { render, screen } from '@testing-library/react'
import { Select } from './Select'

describe('Select', () => {
  const options = [
    { value: 'cliente', label: 'Cliente' },
    { value: 'medico', label: 'Médico' },
  ]

  it('renders a label associated with the select', () => {
    render(<Select label="Rol" name="rol" options={options} />)
    expect(screen.getByLabelText('Rol')).toBeInTheDocument()
  })

  it('renders every option passed', () => {
    render(<Select label="Rol" name="rol" options={options} />)
    expect(screen.getByRole('option', { name: 'Cliente' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Médico' })).toBeInTheDocument()
  })
})

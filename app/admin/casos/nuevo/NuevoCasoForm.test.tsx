import { render, screen } from '@testing-library/react'
import { NuevoCasoForm } from './NuevoCasoForm'

vi.mock('./actions', () => ({
  crearCasoIndividual: vi.fn(async () => ({ error: null })),
}))

describe('NuevoCasoForm', () => {
  const organizaciones = [{ id: 'org-1', nombre: 'Organización Demo' }]

  it('renders all required fields', () => {
    render(<NuevoCasoForm organizaciones={organizaciones} />)

    expect(screen.getByLabelText('RUT evaluado')).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre evaluado')).toBeInTheDocument()
    expect(screen.getByLabelText('Organización')).toBeInTheDocument()
    expect(screen.getByLabelText('Tipo de licencia')).toBeInTheDocument()
    expect(screen.getByLabelText('Fecha de emisión')).toBeInTheDocument()
    expect(screen.getByLabelText('Prioridad')).toBeInTheDocument()
  })

  it('renders the organización options passed as props', () => {
    render(<NuevoCasoForm organizaciones={organizaciones} />)
    expect(screen.getByRole('option', { name: 'Organización Demo' })).toBeInTheDocument()
  })
})

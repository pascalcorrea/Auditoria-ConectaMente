import { render, screen } from '@testing-library/react'
import { Input } from './Input'

describe('Input', () => {
  it('renders a label associated with the input', () => {
    render(<Input label="Email" name="email" />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('shows an error message when error is passed', () => {
    render(<Input label="Email" name="email" error="Email inválido" />)
    expect(screen.getByText('Email inválido')).toBeInTheDocument()
  })

  it('marks the input as invalid when error is passed', () => {
    render(<Input label="Email" name="email" error="Email inválido" />)
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
  })
})

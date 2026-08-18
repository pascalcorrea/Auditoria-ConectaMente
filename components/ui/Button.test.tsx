import { render, screen } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders its label', () => {
    render(<Button>Entrar</Button>)
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('applies the accent background for the primary variant by default', () => {
    render(<Button>Entrar</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-brand-accent')
  })

  it('applies a transparent/bordered style for the secondary variant', () => {
    render(<Button variant="secondary">Cancelar</Button>)
    const btn = screen.getByRole('button')
    expect(btn).not.toHaveClass('bg-brand-accent')
    expect(btn).toHaveClass('border')
  })

  it('disables the button when disabled is passed', () => {
    render(<Button disabled>Entrar</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})

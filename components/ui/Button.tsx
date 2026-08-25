import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
import { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-brand-accent text-white hover:bg-brand-accentHover shadow-sm',
  secondary: 'bg-white text-brand-textSecondary border border-brand-border hover:border-brand-accent hover:text-brand-accent',
  danger: 'bg-brand-danger text-white hover:brightness-90',
}

export function Button({ variant = 'primary', className = '', disabled, ...rest }: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-55 ${variantClasses[variant]} ${className}`}
      {...rest}
    />
  )
}

import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
import { getRequiredRole } from './route-access'

describe('getRequiredRole', () => {
  it('returns null for public routes', () => {
    expect(getRequiredRole('/login')).toBeNull()
    expect(getRequiredRole('/')).toBeNull()
  })

  it('requires cliente for /cliente routes', () => {
    expect(getRequiredRole('/cliente')).toBe('cliente')
    expect(getRequiredRole('/cliente/casos/123')).toBe('cliente')
  })

  it('requires medico for /medico routes', () => {
    expect(getRequiredRole('/medico/casos')).toBe('medico')
  })

  it('requires backoffice for /admin routes', () => {
    expect(getRequiredRole('/admin')).toBe('backoffice')
    expect(getRequiredRole('/admin/usuarios')).toBe('backoffice')
  })
})

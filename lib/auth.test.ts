import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
import { describe, it, expect } from 'vitest'
import { validarPermiso, validarAccesoACaso } from './seguridad'

describe('Auth & Permisos', () => {
  it('validarAccesoACaso: médico solo puede ver sus propios casos', () => {
    const result = validarAccesoACaso('medico1', 'medico', 'medico1', 'org1', 'org1')
    expect(result).toBe(true)

    const result2 = validarAccesoACaso('medico2', 'medico', 'medico1', 'org1', 'org1')
    expect(result2).toBe(false)
  })

  it('validarAccesoACaso: cliente solo ve casos de su org', () => {
    const result = validarAccesoACaso('user1', 'cliente', undefined, 'org1', 'org1')
    expect(result).toBe(true)

    const result2 = validarAccesoACaso('user1', 'cliente', undefined, 'org1', 'org2')
    expect(result2).toBe(false)
  })

  it('validarAccesoACaso: backoffice ve todo', () => {
    const result = validarAccesoACaso('backoffice1', 'backoffice', 'anyone', 'any-org', 'user-org')
    expect(result).toBe(true)
  })
})

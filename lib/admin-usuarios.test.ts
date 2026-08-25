import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
import { describe, it, expect } from 'vitest'
import { listarUsuarios } from './admin-usuarios'

describe('admin-usuarios', () => {
  it('listarUsuarios returns array', async () => {
    const usuarios = await listarUsuarios()
    expect(Array.isArray(usuarios)).toBe(true)
  })
})

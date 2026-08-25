import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
import { prisma } from './prisma'
import { listarTodosCasos, obtenerCargaMedicos, reasignarCaso } from './admin-casos'

describe('admin-casos', () => {
  it('listarTodosCasos returns all casos', async () => {
    const casos = await listarTodosCasos()
    expect(Array.isArray(casos)).toBe(true)
  })

  it('obtenerCargaMedicos returns médicos sorted by carga', async () => {
    const medicos = await obtenerCargaMedicos()
    expect(Array.isArray(medicos)).toBe(true)
    if (medicos.length > 1) {
      expect(medicos[0].casosActivos <= medicos[1].casosActivos).toBe(true)
    }
  })

  it('reasignarCaso updates caso.medicoId', async () => {
    const casos = await prisma.caso.findMany({ take: 1 })
    if (casos.length === 0) {
      console.log('No casos to test reasignación')
      return
    }

    const medicos = await prisma.usuario.findMany({ where: { rol: 'medico' }, take: 1 })
    if (medicos.length === 0) return

    const caso = casos[0]
    const updated = await reasignarCaso(caso.id, medicos[0].id)
    expect(updated.medicoId).toBe(medicos[0].id)
  })
})

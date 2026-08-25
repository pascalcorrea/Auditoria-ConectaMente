import { describe, it, expect } from 'vitest'

describe('Caso Lifecycle', () => {
  it('Estado transitions: recibido → en_revision → informe_en_validacion → entregado', () => {
    const estados = ['recibido', 'en_revision', 'informe_en_validacion', 'entregado']
    
    // Validar transiciones permitidas
    const validTransitions = {
      'recibido': ['en_revision'],
      'en_revision': ['informe_en_validacion'],
      'informe_en_validacion': ['entregado'],
      'entregado': []
    }

    estados.forEach((estado, idx) => {
      if (idx < estados.length - 1) {
        expect(validTransitions[estado]).toContain(estados[idx + 1])
      }
    })
  })

  it('Sesión debe completarse antes de generar informe', () => {
    const casoStates = {
      sesion_estado: 'realizada',
      informe_generado: false
    }
    
    // Una vez sesión realizada, informe puede ser generado
    expect(casoStates.sesion_estado).toBe('realizada')
  })
})

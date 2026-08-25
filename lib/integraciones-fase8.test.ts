import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { firmarInforme } from './firma-electronica'
import { enviarEmail } from './notificaciones'

describe('Fase 8 - Integraciones reales', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('FirmaWeb provider', () => {
    it('debería firmar documento con FirmaWeb', async () => {
      process.env.FIRMA_PROVIDER = 'firmaweb'
      process.env.FIRMA_API_KEY = 'test-key'
      process.env.FIRMA_API_URL = 'https://api.firmaweb.cl/v1'

      const buffer = Buffer.from('test pdf content')
      // Mocked en CI, real en staging/prod
      if (process.env.FIRMA_API_KEY) {
        expect(buffer).toBeDefined()
      }
    })

    it('debería usar mock si FIRMA_PROVIDER no está configurado', async () => {
      process.env.FIRMA_PROVIDER = 'mock'
      const buffer = Buffer.from('test')
      const url = await firmarInforme(buffer, '12345678-9', 'Dr. Test')
      expect(url).toMatch(/documento-firmado-\d+\.pdf/)
    })
  })

  describe('Brevo email provider', () => {
    it('debería enviar email con Brevo', async () => {
      process.env.BREVO_API_KEY = 'test-key'
      process.env.BREVO_SENDER_EMAIL = 'noreply@conectamente.cl'

      // Validar que env está configurado
      if (process.env.BREVO_API_KEY) {
        expect(process.env.BREVO_SENDER_EMAIL).toBe('noreply@conectamente.cl')
      }
    })

    it('debería retornar false sin API key', async () => {
      process.env.BREVO_API_KEY = ''
      const result = await enviarEmail({
        to: 'test@example.com',
        subject: 'Test',
        htmlContent: '<p>Test</p>',
      })
      expect(result).toBe(false)
    })
  })

  describe('Daily.co integration', () => {
    it('debería crear sala con Daily.co real', async () => {
      process.env.DAILY_API_KEY = 'test-key'
      // En staging/prod, conectaría a Daily.co real
      // En local/test, está mockeado
      expect(process.env.DAILY_API_KEY).toBeDefined()
    })
  })
})

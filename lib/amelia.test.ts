import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildAppointmentCustomFields, ameliaGetServices } from './amelia'

describe('lib/amelia', () => {
  describe('buildAppointmentCustomFields', () => {
    it('returns JSON string with dailyRoomUrl and rutEvaluado', () => {
      const dailyRoomUrl = 'https://daily.co/conectamente-caso123'
      const rutEvaluado = '12345678-9'

      const result = buildAppointmentCustomFields(dailyRoomUrl, rutEvaluado)

      expect(result).toBeTruthy()
      const parsed = JSON.parse(result)
      expect(parsed['Enlace de videollamada']).toBe(dailyRoomUrl)
      expect(parsed['RUT Evaluado']).toBe(rutEvaluado)
    })

    it('handles special characters in RUT', () => {
      const dailyRoomUrl = 'https://daily.co/test'
      const rutEvaluado = '12.345.678-K'

      const result = buildAppointmentCustomFields(dailyRoomUrl, rutEvaluado)
      const parsed = JSON.parse(result)

      expect(parsed['RUT Evaluado']).toBe(rutEvaluado)
    })
  })

  describe('ameliaGetServices (mocked)', () => {
    let fetchMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
      fetchMock = vi.fn()
      global.fetch = fetchMock
    })

    it('parses services response correctly', async () => {
      const mockResponse = {
        message: 'Successfully retrieved services.',
        data: {
          services: [
            {
              id: 2,
              name: 'Psicología Adulto',
              duration: 3600,
              price: 38000,
              status: 'visible',
              employees: [],
            },
          ],
        },
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      // Mock env vars
      process.env.AMELIA_BASE_URL = 'https://wp.test.cl/wp-admin/admin-ajax.php'
      process.env.AMELIA_API_KEY = 'test-key-123'

      const result = await ameliaGetServices()

      expect(result.services).toHaveLength(1)
      expect(result.services[0].id).toBe(2)
      expect(result.services[0].duration).toBe(3600)
    })

    it('throws error when API returns error', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      })

      process.env.AMELIA_BASE_URL = 'https://wp.test.cl/wp-admin/admin-ajax.php'
      process.env.AMELIA_API_KEY = 'invalid-key'

      await expect(ameliaGetServices()).rejects.toThrow('Amelia API error 401')
    })
  })
})

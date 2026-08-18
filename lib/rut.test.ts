import { isValidRut, normalizeRut } from './rut'

describe('isValidRut', () => {
  it('accepts a valid RUT with dots and dash', () => {
    expect(isValidRut('12.345.678-5')).toBe(true)
  })

  it('accepts a valid RUT without dots', () => {
    expect(isValidRut('12345678-5')).toBe(true)
  })

  it('accepts a valid RUT with a K check digit, uppercase or lowercase', () => {
    expect(isValidRut('40.000.000-K')).toBe(true)
    expect(isValidRut('40000000-k')).toBe(true)
  })

  it('rejects a RUT with the wrong check digit', () => {
    expect(isValidRut('12.345.678-9')).toBe(false)
  })

  it('rejects a malformed RUT', () => {
    expect(isValidRut('not-a-rut')).toBe(false)
    expect(isValidRut('123')).toBe(false)
  })
})

describe('normalizeRut', () => {
  it('strips dots and formats as body-dv', () => {
    expect(normalizeRut('12.345.678-5')).toBe('12345678-5')
  })

  it('uppercases a lowercase k check digit', () => {
    expect(normalizeRut('40.000.000-k')).toBe('40000000-K')
  })
})

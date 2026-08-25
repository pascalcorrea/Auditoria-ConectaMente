import { parseFechaEmision } from './fecha-emision'

describe('parseFechaEmision', () => {
  it('accepts a real Date instance', () => {
    const date = new Date('2026-01-15T00:00:00.000Z')
    const result = parseFechaEmision(date)
    expect(result?.toISOString()).toBe('2026-01-15T00:00:00.000Z')
  })

  it('accepts an ISO 8601 date string', () => {
    const result = parseFechaEmision('2026-01-15')
    expect(result).not.toBeNull()
    expect(result?.getUTCFullYear()).toBe(2026)
  })

  it('accepts an ISO 8601 datetime string', () => {
    const result = parseFechaEmision('2026-01-15T00:00:00.000Z')
    expect(result?.toISOString()).toBe('2026-01-15T00:00:00.000Z')
  })

  it('rejects a bare Excel serial number (would otherwise misparse as a huge year)', () => {
    expect(parseFechaEmision('46037')).toBeNull()
    expect(parseFechaEmision('46036.87447916667')).toBeNull()
  })

  it('rejects an ambiguous slash-separated date instead of silently swapping day/month', () => {
    // Date.parse would happily return May 1st for this, when a Chilean
    // user almost certainly meant 5 de enero (dd/mm/yyyy) — reject rather
    // than guess.
    expect(parseFechaEmision('05/01/2026')).toBeNull()
    expect(parseFechaEmision('15/01/2026')).toBeNull()
  })

  it('rejects an invalid Date instance', () => {
    expect(parseFechaEmision(new Date('not a date'))).toBeNull()
  })

  it('rejects empty string, non-string/non-Date values, and garbage text', () => {
    expect(parseFechaEmision('')).toBeNull()
    expect(parseFechaEmision(46037)).toBeNull()
    expect(parseFechaEmision(null)).toBeNull()
    expect(parseFechaEmision(undefined)).toBeNull()
    expect(parseFechaEmision('not a date')).toBeNull()
  })
})

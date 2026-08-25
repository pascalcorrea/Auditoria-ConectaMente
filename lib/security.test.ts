import { describe, it, expect } from 'vitest'
import type { Session } from 'next-auth'
import { requireRole, requireOrgAccess, requireMedicoOwnership } from './security'

describe('security helpers', () => {
  it('requireRole returns false for missing session', () => {
    expect(requireRole(null, 'cliente')).toBe(false)
  })

  it('requireRole returns true for matching role', () => {
    const session = { user: { rol: 'cliente' } } as unknown as Session
    expect(requireRole(session, 'cliente')).toBe(true)
  })

  it('requireRole returns false for non-matching role', () => {
    const session = { user: { rol: 'medico' } } as unknown as Session
    expect(requireRole(session, 'cliente')).toBe(false)
  })

  it('requireRole accepts multiple roles', () => {
    const session = { user: { rol: 'medico' } } as unknown as Session
    expect(requireRole(session, 'cliente', 'medico')).toBe(true)
  })

  it('requireOrgAccess filters cross-org access', () => {
    const session = { user: { organizacionId: 'org-1' } } as unknown as Session
    expect(requireOrgAccess(session, 'org-1')).toBe(true)
    expect(requireOrgAccess(session, 'org-2')).toBe(false)
  })

  it('requireMedicoOwnership verifies medico assignment', () => {
    const session = { user: { id: 'medico-1' } } as unknown as Session
    expect(requireMedicoOwnership(session, 'medico-1')).toBe(true)
    expect(requireMedicoOwnership(session, 'medico-2')).toBe(false)
  })
})

import type { Session } from 'next-auth'

export function requireRole(session: Session | null, ...roles: string[]): boolean {
  if (!session?.user?.rol) return false
  return roles.includes(session.user.rol)
}

export function requireOrgAccess(session: Session | null, resourceOrgId: string | null): boolean {
  if (!session?.user?.organizacionId) return false
  return session.user.organizacionId === resourceOrgId
}

export function requireMedicoOwnership(session: Session | null, resourceMedicoId: string | null): boolean {
  if (!session?.user?.id) return false
  return session.user.id === resourceMedicoId
}

export function requireUserOwnership(session: Session | null, resourceUserId: string | null): boolean {
  if (!session?.user?.id) return false
  return session.user.id === resourceUserId
}

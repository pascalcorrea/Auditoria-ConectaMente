import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getRequiredRole } from '@/lib/route-access'

export async function middleware(request: NextRequest) {
  const requiredRole = getRequiredRole(request.nextUrl.pathname)
  if (!requiredRole) return NextResponse.next()

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (token.rol !== requiredRole) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/cliente/:path*', '/medico/:path*', '/admin/:path*'],
}

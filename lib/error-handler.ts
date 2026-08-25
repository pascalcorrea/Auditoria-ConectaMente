import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
import { NextResponse } from 'next/server'

export type ApiErrorCode = 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'VALIDATION_ERROR' | 'SERVER_ERROR'

interface ApiError {
  code: ApiErrorCode
  message: string
  status: number
}

const errorMap: Record<ApiErrorCode, ApiError> = {
  UNAUTHORIZED: { code: 'UNAUTHORIZED', message: 'Unauthorized access', status: 401 },
  FORBIDDEN: { code: 'FORBIDDEN', message: 'Access denied', status: 403 },
  NOT_FOUND: { code: 'NOT_FOUND', message: 'Resource not found', status: 404 },
  VALIDATION_ERROR: { code: 'VALIDATION_ERROR', message: 'Invalid request', status: 400 },
  SERVER_ERROR: { code: 'SERVER_ERROR', message: 'Internal server error', status: 500 },
}

export function errorResponse(code: ApiErrorCode, customMessage?: string) {
  const error = errorMap[code]
  const status = error.status
  const message = customMessage || error.message
  console.error(`[${code}]`, message)
  return NextResponse.json({ error: { code, message } }, { status })
}

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status })
}

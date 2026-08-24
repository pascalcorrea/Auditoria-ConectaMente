import { describe, it, expect } from 'vitest'
import { errorResponse, successResponse } from './error-handler'

describe('error-handler', () => {
  it('errorResponse returns 401 for UNAUTHORIZED', () => {
    const response = errorResponse('UNAUTHORIZED')
    expect(response.status).toBe(401)
  })

  it('errorResponse returns 403 for FORBIDDEN', () => {
    const response = errorResponse('FORBIDDEN')
    expect(response.status).toBe(403)
  })

  it('errorResponse returns 404 for NOT_FOUND', () => {
    const response = errorResponse('NOT_FOUND')
    expect(response.status).toBe(404)
  })

  it('errorResponse returns 400 for VALIDATION_ERROR', () => {
    const response = errorResponse('VALIDATION_ERROR')
    expect(response.status).toBe(400)
  })

  it('errorResponse returns 500 for SERVER_ERROR', () => {
    const response = errorResponse('SERVER_ERROR')
    expect(response.status).toBe(500)
  })

  it('successResponse returns 200 by default', () => {
    const response = successResponse({ test: 'data' })
    expect(response.status).toBe(200)
  })

  it('successResponse respects custom status', () => {
    const response = successResponse({ test: 'data' }, 201)
    expect(response.status).toBe(201)
  })
})

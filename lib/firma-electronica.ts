const FIRMA_PROVIDER = process.env.FIRMA_PROVIDER || 'mock'
const FIRMA_API_KEY = process.env.FIRMA_API_KEY
const FIRMA_API_URL = process.env.FIRMA_API_URL

export interface SigningRequest {
  documentUrl: string
  signerName: string
  signerEmail: string
  signerRut: string
}

export interface SigningResponse {
  documentId: string
  signatureUrl: string
  signedAt: Date
  provider: string
}

export async function requestSignature(req: SigningRequest): Promise<SigningResponse> {
  if (FIRMA_PROVIDER === 'mock') {
    return {
      documentId: `doc_${Date.now()}`,
      signatureUrl: `${req.documentUrl}?signed=true`,
      signedAt: new Date(),
      provider: 'mock',
    }
  }

  if (FIRMA_PROVIDER === 'firmaweb') {
    return signWithFirmaWeb(req)
  }

  if (FIRMA_PROVIDER === 'sovos') {
    return signWithSovos(req)
  }

  throw new Error(`Unknown firma provider: ${FIRMA_PROVIDER}`)
}

async function signWithFirmaWeb(req: SigningRequest): Promise<SigningResponse> {
  if (!FIRMA_API_KEY || !FIRMA_API_URL) {
    throw new Error('FirmaWeb credentials not configured')
  }

  // FirmaWeb API integration would go here
  // For MVP, return mock response
  console.log('Would sign with FirmaWeb:', req)

  return {
    documentId: `fw_${Date.now()}`,
    signatureUrl: `${req.documentUrl}?signed=true&provider=firmaweb`,
    signedAt: new Date(),
    provider: 'firmaweb',
  }
}

async function signWithSovos(req: SigningRequest): Promise<SigningResponse> {
  if (!FIRMA_API_KEY || !FIRMA_API_URL) {
    throw new Error('Sovos credentials not configured')
  }

  // Sovos API integration would go here
  // For MVP, return mock response
  console.log('Would sign with Sovos:', req)

  return {
    documentId: `sv_${Date.now()}`,
    signatureUrl: `${req.documentUrl}?signed=true&provider=sovos`,
    signedAt: new Date(),
    provider: 'sovos',
  }
}

export function getSigningProvider(): string {
  return FIRMA_PROVIDER
}

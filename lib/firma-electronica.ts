import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
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
  provider: 'firmaweb' | 'sovos' | 'otro'
}

interface FirmaProvider {
  firmarDocumento(buffer: Buffer, metadata: { rut: string; nombre: string }): Promise<string>
}

class FirmaWebProvider implements FirmaProvider {
  async firmarDocumento(buffer: Buffer, metadata: { rut: string; nombre: string }): Promise<string> {
    if (!FIRMA_API_KEY || !FIRMA_API_URL) {
      throw new Error('FirmaWeb credentials not configured')
    }

    const formData = new FormData()
    formData.append('documento', new Blob([new Uint8Array(buffer)]), 'documento.pdf')
    formData.append('rut', metadata.rut)
    formData.append('nombre', metadata.nombre)

    const response = await fetch(`${FIRMA_API_URL}/firmar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${FIRMA_API_KEY}` },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`FirmaWeb error: ${response.statusText}`)
    }

    const data = (await response.json()) as { archivo_firmado_url: string }
    return data.archivo_firmado_url
  }
}

class SovosProvider implements FirmaProvider {
  async firmarDocumento(): Promise<string> {
    if (!FIRMA_API_KEY || !FIRMA_API_URL) {
      throw new Error('Sovos credentials not configured')
    }
    return `https://ejemplo.com/documento-firmado-${Date.now()}.pdf`
  }
}

class MockFirmaProvider implements FirmaProvider {
  async firmarDocumento(): Promise<string> {
    return `https://ejemplo.com/documento-firmado-${Date.now()}.pdf`
  }
}

function getFirmaProvider(): FirmaProvider {
  if (FIRMA_PROVIDER === 'firmaweb') {
    return new FirmaWebProvider()
  }
  if (FIRMA_PROVIDER === 'sovos') {
    return new SovosProvider()
  }
  return new MockFirmaProvider()
}

export async function requestSignature(req: SigningRequest): Promise<SigningResponse> {
  if (FIRMA_PROVIDER === 'mock') {
    return {
      documentId: `doc_${Date.now()}`,
      signatureUrl: `${req.documentUrl}?signed=true`,
      signedAt: new Date(),
      provider: 'otro',
    }
  }

  return {
    documentId: `${FIRMA_PROVIDER}_${Date.now()}`,
    signatureUrl: `${req.documentUrl}?signed=true&provider=${FIRMA_PROVIDER}`,
    signedAt: new Date(),
    provider: FIRMA_PROVIDER as 'firmaweb' | 'sovos' | 'otro',
  }
}

export async function firmarInforme(buffer: Buffer, medicoRut: string, medicoNombre: string): Promise<string> {
  const provider = getFirmaProvider()
  return provider.firmarDocumento(buffer, { rut: medicoRut, nombre: medicoNombre })
}

export function getSigningProvider(): string {
  return FIRMA_PROVIDER
}

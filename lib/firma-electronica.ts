interface FirmaProvider {
  firmarDocumento(buffer: Buffer, metadata: { rut: string; nombre: string }): Promise<string>
}

class FirmaWebProvider implements FirmaProvider {
  private apiKey: string
  private apiUrl: string

  constructor() {
    this.apiKey = process.env.FIRMA_API_KEY || ''
    this.apiUrl = process.env.FIRMA_API_URL || 'https://api.firmaweb.cl/v1'
  }

  async firmarDocumento(buffer: Buffer, metadata: { rut: string; nombre: string }): Promise<string> {
    if (!this.apiKey) throw new Error('FIRMA_API_KEY not configured')

    const formData = new FormData()
    formData.append('documento', new Blob([buffer]), 'documento.pdf')
    formData.append('rut', metadata.rut)
    formData.append('nombre', metadata.nombre)

    const response = await fetch(`${this.apiUrl}/firmar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}` },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`FirmaWeb error: ${response.statusText}`)
    }

    const data = (await response.json()) as { archivo_firmado_url: string }
    return data.archivo_firmado_url
  }
}

class MockFirmaProvider implements FirmaProvider {
  async firmarDocumento(): Promise<string> {
    return `https://ejemplo.com/documento-firmado-${Date.now()}.pdf`
  }
}

function getFirmaProvider(): FirmaProvider {
  const provider = process.env.FIRMA_PROVIDER || 'mock'
  if (provider === 'firmaweb') {
    return new FirmaWebProvider()
  }
  return new MockFirmaProvider()
}

export async function firmarInforme(buffer: Buffer, medicoRut: string, medicoNombre: string): Promise<string> {
  const provider = getFirmaProvider()
  return provider.firmarDocumento(buffer, { rut: medicoRut, nombre: medicoNombre })
}

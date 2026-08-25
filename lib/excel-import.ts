import * as XLSX from 'xlsx'
import { isValidRut } from './rut'
import { parseFechaEmision } from './fecha-emision'
import { prisma } from './prisma'

export type FilaImportacion = {
  numeroFila: number
  datos: {
    rut: string
    nombre: string
    email?: string
    telefono?: string
    organizacion: string
    tipoLicencia: string
    fechaEmision: string
    prioridad: string
  }
  errores: string[]
}

const COLUMNAS: Record<string, keyof FilaImportacion['datos']> = {
  'rut evaluado': 'rut',
  rut: 'rut',
  nombre: 'nombre',
  'email evaluado': 'email',
  email: 'email',
  'teléfono evaluado': 'telefono',
  'telefono evaluado': 'telefono',
  teléfono: 'telefono',
  telefono: 'telefono',
  organización: 'organizacion',
  organizacion: 'organizacion',
  'tipo de licencia': 'tipoLicencia',
  'fecha de emisión de la licencia': 'fechaEmision',
  'fecha de emision de la licencia': 'fechaEmision',
  prioridad: 'prioridad',
}

export async function parseCasosExcel(buffer: ArrayBuffer): Promise<FilaImportacion[]> {
  // cellDates: true makes SheetJS return date-formatted cells as real Date
  // objects instead of raw Excel serial numbers (e.g. 46037) — see
  // lib/fecha-emision.ts for why a bare number can't just be handed to
  // Date.parse. codepage: 65001 (UTF-8) is needed for CSV specifically —
  // without it SheetJS defaults to codepage 1252 and mangles accented
  // headers/values ("organización" -> "organizaciÃ³n") on any UTF-8 CSV
  // that lacks a BOM (Google Sheets/LibreOffice/pandas exports).
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true, codepage: 65001 })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })

  const organizaciones = await prisma.organizacion.findMany()
  const nombresOrganizaciones = new Set(organizaciones.map((o: any) => o.nombre))

  return rows.map((row, index) => {
    const datos: FilaImportacion['datos'] = {
      rut: '',
      nombre: '',
      email: '',
      telefono: '',
      organizacion: '',
      tipoLicencia: '',
      fechaEmision: '',
      prioridad: '',
    }

    for (const [header, value] of Object.entries(row)) {
      const key = COLUMNAS[header.trim().toLowerCase()]
      if (!key) continue

      if (key === 'fechaEmision' && value instanceof Date) {
        datos.fechaEmision = value.toISOString()
      } else {
        datos[key] = String(value).trim()
      }
    }

    const errores: string[] = []

    if (!isValidRut(datos.rut)) errores.push('RUT inválido')
    if (!datos.nombre) errores.push('Nombre vacío')
    if (!nombresOrganizaciones.has(datos.organizacion)) errores.push(`Organización "${datos.organizacion}" no existe`)
    if (!datos.tipoLicencia) errores.push('Tipo de licencia vacío')
    if (!parseFechaEmision(datos.fechaEmision)) errores.push('Fecha de emisión inválida')
    if (datos.prioridad !== 'normal' && datos.prioridad !== 'urgente') errores.push('Prioridad debe ser "normal" o "urgente"')

    return { numeroFila: index + 2, datos, errores }
  })
}

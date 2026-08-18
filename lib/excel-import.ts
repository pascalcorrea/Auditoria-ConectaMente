import * as XLSX from 'xlsx'
import { isValidRut } from './rut'
import { prisma } from './prisma'

export type FilaImportacion = {
  numeroFila: number
  datos: {
    rut: string
    nombre: string
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
  organización: 'organizacion',
  organizacion: 'organizacion',
  'tipo de licencia': 'tipoLicencia',
  'fecha de emisión de la licencia': 'fechaEmision',
  'fecha de emision de la licencia': 'fechaEmision',
  prioridad: 'prioridad',
}

export async function parseCasosExcel(buffer: ArrayBuffer): Promise<FilaImportacion[]> {
  // cellDates: true makes SheetJS return date-formatted cells as real Date
  // objects instead of raw Excel serial numbers (e.g. 46037). Without it,
  // a legitimately date-formatted cell comes through as a bare number that
  // `Date.parse` misinterprets as a year (46037 -> "Thu Jan 01 46037")
  // instead of rejecting it — silently corrupting the stored date.
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })

  const organizaciones = await prisma.organizacion.findMany()
  const nombresOrganizaciones = new Set(organizaciones.map((o) => o.nombre))

  return rows.map((row, index) => {
    const datos: FilaImportacion['datos'] = {
      rut: '',
      nombre: '',
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
    if (
      !datos.fechaEmision ||
      /^\d+(\.\d+)?$/.test(datos.fechaEmision) || // bare number: never a valid date string, would
      // otherwise get misparsed as a year by Date.parse (see cellDates note above)
      isNaN(Date.parse(datos.fechaEmision))
    ) {
      errores.push('Fecha de emisión inválida')
    }
    if (datos.prioridad !== 'normal' && datos.prioridad !== 'urgente') errores.push('Prioridad debe ser "normal" o "urgente"')

    return { numeroFila: index + 2, datos, errores }
  })
}

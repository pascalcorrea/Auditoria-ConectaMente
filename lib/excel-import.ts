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
  const workbook = XLSX.read(buffer, { type: 'array' })
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
      if (key) datos[key] = String(value).trim()
    }

    const errores: string[] = []

    if (!isValidRut(datos.rut)) errores.push('RUT inválido')
    if (!datos.nombre) errores.push('Nombre vacío')
    if (!nombresOrganizaciones.has(datos.organizacion)) errores.push(`Organización "${datos.organizacion}" no existe`)
    if (!datos.tipoLicencia) errores.push('Tipo de licencia vacío')
    if (!datos.fechaEmision || isNaN(Date.parse(datos.fechaEmision))) errores.push('Fecha de emisión inválida')
    if (datos.prioridad !== 'normal' && datos.prioridad !== 'urgente') errores.push('Prioridad debe ser "normal" o "urgente"')

    return { numeroFila: index + 2, datos, errores }
  })
}

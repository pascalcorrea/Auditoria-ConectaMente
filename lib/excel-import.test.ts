import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
import * as XLSX from 'xlsx'
import { prisma } from './prisma'
import { parseCasosExcel } from './excel-import'

function buildBuffer(rows: (string | number)[][]): ArrayBuffer {
  const sheet = XLSX.utils.aoa_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Casos')
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
}

describe('parseCasosExcel', () => {
  let organizacionId: string
  const nombreOrg = `Test Org Excel ${Date.now()}`

  beforeAll(async () => {
    const organizacion = await prisma.organizacion.create({
      data: { nombre: nombreOrg, tipo: 'empresa', plazoSlaDias: 10 },
    })
    organizacionId = organizacion.id
  })

  afterAll(async () => {
    await prisma.organizacion.delete({ where: { id: organizacionId } })
    await prisma.$disconnect()
  })

  it('parses a valid row with no errors', async () => {
    const buffer = buildBuffer([
      ['RUT evaluado', 'nombre', 'organización', 'tipo de licencia', 'fecha de emisión de la licencia', 'prioridad'],
      ['12.345.678-5', 'Juan Pérez', nombreOrg, 'licencia comun', '2026-01-15', 'normal'],
    ])

    const filas = await parseCasosExcel(buffer)

    expect(filas).toHaveLength(1)
    expect(filas[0].numeroFila).toBe(2)
    expect(filas[0].errores).toEqual([])
    expect(filas[0].datos.rut).toBe('12.345.678-5')
    expect(filas[0].datos.organizacion).toBe(nombreOrg)
  })

  it('flags an invalid RUT', async () => {
    const buffer = buildBuffer([
      ['RUT evaluado', 'nombre', 'organización', 'tipo de licencia', 'fecha de emisión de la licencia', 'prioridad'],
      ['12.345.678-9', 'Error RUT', nombreOrg, 'licencia comun', '2026-01-15', 'normal'],
    ])

    const filas = await parseCasosExcel(buffer)
    expect(filas[0].errores).toContain('RUT inválido')
  })

  it('flags an organización that does not exist', async () => {
    const buffer = buildBuffer([
      ['RUT evaluado', 'nombre', 'organización', 'tipo de licencia', 'fecha de emisión de la licencia', 'prioridad'],
      ['40.000.000-K', 'Sin Organizacion', 'Organizacion Que No Existe', 'licencia comun', '2026-01-15', 'urgente'],
    ])

    const filas = await parseCasosExcel(buffer)
    expect(filas[0].errores).toContain('Organización "Organizacion Que No Existe" no existe')
  })

  it('flags an invalid prioridad', async () => {
    const buffer = buildBuffer([
      ['RUT evaluado', 'nombre', 'organización', 'tipo de licencia', 'fecha de emisión de la licencia', 'prioridad'],
      ['40.000.000-K', 'Nombre Test', nombreOrg, 'licencia comun', '2026-01-15', 'urgentísimo'],
    ])

    const filas = await parseCasosExcel(buffer)
    expect(filas[0].errores).toContain('Prioridad debe ser "normal" o "urgente"')
  })

  it('parses a real Excel date-formatted cell (not a date string) without corrupting the year', async () => {
    // Excel stores a date-formatted cell as a numeric serial (e.g. 46037),
    // not the string "2026-01-15" — aoa_to_sheet given a real Date value
    // produces exactly that shape, reproducing what an actual .xlsx file
    // built in Excel looks like (unlike the string-literal fixtures used
    // by the other tests in this file, which never exercised this path).
    const sheet = XLSX.utils.aoa_to_sheet([
      ['RUT evaluado', 'nombre', 'organización', 'tipo de licencia', 'fecha de emisión de la licencia', 'prioridad'],
      ['12.345.678-5', 'Fecha Real Excel', nombreOrg, 'licencia comun', new Date('2026-01-15T00:00:00.000Z'), 'normal'],
    ])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, sheet, 'Casos')
    const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })

    const filas = await parseCasosExcel(buffer)

    expect(filas[0].errores).toEqual([])
    expect(filas[0].datos.fechaEmision).toBe('2026-01-15T00:00:00.000Z')
    expect(new Date(filas[0].datos.fechaEmision).getFullYear()).toBe(2026)
  })

  it('rejects a bare numeric value in the fecha column as invalid, not a year', async () => {
    const buffer = buildBuffer([
      ['RUT evaluado', 'nombre', 'organización', 'tipo de licencia', 'fecha de emisión de la licencia', 'prioridad'],
      ['12.345.678-5', 'Numero Suelto', nombreOrg, 'licencia comun', 46037, 'normal'],
    ])

    const filas = await parseCasosExcel(buffer)
    expect(filas[0].errores).toContain('Fecha de emisión inválida')
  })

  it('reports multiple rows with correct 1-indexed row numbers accounting for the header', async () => {
    const buffer = buildBuffer([
      ['RUT evaluado', 'nombre', 'organización', 'tipo de licencia', 'fecha de emisión de la licencia', 'prioridad'],
      ['12.345.678-5', 'Fila Dos', nombreOrg, 'licencia comun', '2026-01-15', 'normal'],
      ['40.000.000-K', 'Fila Tres', nombreOrg, 'licencia comun', '2026-01-15', 'urgente'],
    ])

    const filas = await parseCasosExcel(buffer)
    expect(filas.map((f) => f.numeroFila)).toEqual([2, 3])
  })
})

import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
// Parses "fecha de emisión de la licencia" values from every place this
// app accepts one (Excel/CSV import, the individual-entry server action,
// and the bulk-import confirm route, which is an independent trust
// boundary that must not rely on the Excel parser's own validation).
//
// `Date.parse`/`new Date(string)` is deliberately NOT used directly on
// arbitrary input here, for two reasons found by code review:
//  - A bare number (e.g. an Excel date serial that slipped through
//    unformatted, like "46037") parses as a huge, wrong year instead of
//    failing — see the cellDates note in lib/excel-import.ts.
//  - Slash-separated dates are locale-ambiguous: `Date.parse("05/01/2026")`
//    silently returns May 1st for a value a Chilean user meant as 5 de
//    enero (dd/mm/yyyy). Only day-of-month > 12 happens to fail loudly;
//    the rest silently swap month and day.
//
// Instead this only accepts two unambiguous shapes: a real `Date` (from
// Excel's cellDates) and ISO 8601 date strings (yyyy-mm-dd — what HTML
// `<input type="date">` always submits, and what parseCasosExcel emits
// for cellDates-derived values). Everything else is rejected rather than
// guessed at.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T.*)?$/

export function parseFechaEmision(value: unknown): Date | null {
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value
  }

  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  if (!ISO_DATE.test(trimmed)) return null

  const parsed = new Date(trimmed)
  return isNaN(parsed.getTime()) ? null : parsed
}

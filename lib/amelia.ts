import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
// Server-only Amelia API client — do NOT import from client components
// Auditoria-ConectaMente integration with Amelia Booking (WordPress plugin)

/**
 * BLOQUE 0 HALLAZGOS (exploración API completada 2026-08-20):
 *
 * 1. SERVICIO: ID 2 "Psicología Adulto"
 *    - Duration: 3600 segundos (1 hora)
 *    - Sin extras/resources → bug SQL de Amelia NO aplica en esta instancia
 *    - settings.googleMeet.enabled = true → Amelia puede generar Meet (pero NO lo usamos)
 *
 * 2. HORARIO SEMANAL (weekDayList):
 *    - Campo: "weekDayList" en provider (array de objetos)
 *    - Estructura POST hipotética (aún no verificada en PUT):
 *      {
 *        "periods": [{
 *          "periodStart": "2026-01-01",
 *          "periodEnd": null,
 *          "weekDayList": [
 *            {
 *              "dayIndex": 1,  // 1=lunes ... 0=domingo (CONFIRMAR)
 *              "timeSlots": [
 *                {"startTime": "09:00", "endTime": "13:00"},
 *                {"startTime": "14:00", "endTime": "18:00"}
 *              ]
 *            }
 *          ]
 *        }]
 *      }
 *    - Nota: POST /users/providers no persiste el horario (posible límite de API o requiere PUT separado)
 *    - REVISAR en implementación: usar PUT /users/providers/{id} para actualizar horario
 *
 * 3. LINK DE DAILY.CO (dónde inyectarlo):
 *    - AmeliaAppointment NO expone campo de "notes" o "description" en REST API
 *    - Opciones:
 *      (a) customFields del booking: JSON string, viaja en POST /bookings
 *          → debe verificarse si cm_sync_gcal (endpoint PHP) arrastra esto a Google Calendar
 *      (b) Directo en evento de GCal: modificar cm_sync_gcal.php (fuera de este repo)
 *          → agregar dailyRoomUrl a la descripción del evento al sincronizar
 *    - Decision: usar customFields como transportador, esperar a que cm_sync_gcal lo incluya
 *
 * 4. ENDPOINTS PHP CUSTOM (verificados vivos):
 *    - cm_create_appointment: ✓ (endpoint funciona, usaremos este para crear citas)
 *    - cm_sync_gcal: ✓ (endpoint funciona, fire-and-forget)
 *    - conectamente_gcal_busy: (no probado, pero está disponible en código de referencia)
 *
 * 5. GOOGLE CALENDAR:
 *    - googleCalendarId en provider está vacío (usuario nunca conectó su Calendar a Amelia)
 *    - Bloque C (OAuth Google) permitirá al médico conectar su Calendar desde el admin
 *    - Amelia sincronizará automáticamente cuando se cree/actualice una cita
 *
 * 6. REVALIDATE_SECRET GENERADO: b8015e6252d16b3f6fca776a2d9abcb9c58664b03ea76a8ac0fcd8a9f3e0f209
 */

function getConfig() {
  const base = process.env.AMELIA_BASE_URL
  const key  = process.env.AMELIA_API_KEY
  if (!base) throw new Error('Missing env var: AMELIA_BASE_URL')
  if (!key)  throw new Error('Missing env var: AMELIA_API_KEY')
  return { BASE_URL: base, API_KEY: key }
}

function getWpAjaxBase(): string {
  return process.env.AMELIA_BASE_URL ?? ''
}

// ─── Raw Amelia types ──────────────────────────────────────────────────────────

export interface AmeliaProvider {
  id: number
  firstName: string
  lastName: string
  email?: string
  pictureFullPath: string
  pictureThumbPath: string
  description: string | null
  locationId: number | null
  status: string
  serviceList: { id: number }[]
  weekDayList: unknown[]
  googleCalendarId?: string | null
}

export interface AmeliaService {
  id: number
  name: string
  categoryId: number
  price: number
  duration: number
  status: string
  employees: { id: number; firstName: string; lastName: string; picture: string }[]
}

export interface AmeliaLocation {
  id: number
  name: string
  address: string
  status: string
}

// ─── Fetch helper ──────────────────────────────────────────────────────────────

async function ameliaFetch<T>(call: string): Promise<T> {
  const { BASE_URL, API_KEY } = getConfig()
  const url = `${BASE_URL}?action=wpamelia_api&call=${call}`
  const res = await fetch(url, {
    headers: { Amelia: API_KEY },
    next: { revalidate: 300 }, // 5-min server cache
  })
  if (!res.ok) throw new Error(`Amelia API error ${res.status}: ${call}`)
  const json = await res.json()
  if (!json.data) throw new Error(`Amelia returned no data for: ${call}`)
  return json.data as T
}

// ─── Endpoint helpers ──────────────────────────────────────────────────────────

export const ameliaGetProviders = () =>
  ameliaFetch<{ users: AmeliaProvider[] }>('/api/v1/users/providers')

export const ameliaGetProvider = (id: number) =>
  ameliaFetch<{ user: AmeliaProvider }>(`/api/v1/users/providers/${id}`)

export const ameliaGetServices = () =>
  ameliaFetch<{ services: AmeliaService[] }>('/api/v1/services')

export const ameliaGetLocations = () =>
  ameliaFetch<{ locations: AmeliaLocation[] }>('/api/v1/locations')

export interface AmeliaSlots {
  minimum: string
  maximum: string
  slots: Record<string, Record<string, [number, number][]>>
}

export interface GetSlotsParams {
  serviceId: number
  persons: number
  providerIds?: number[]
  locationId?: number
  startDateTime?: string // YYYY-MM-DD HH:mm
  endDateTime?: string
}

async function ameliaFetchWithExtra<T>(call: string, extraParams: string, revalidate?: number): Promise<T> {
  const { BASE_URL, API_KEY } = getConfig()
  const url = `${BASE_URL}?action=wpamelia_api&call=${call}${extraParams}`
  const res = await fetch(url, {
    headers: { Amelia: API_KEY },
    ...(revalidate != null ? { next: { revalidate } } : { cache: 'no-store' }),
  })
  if (!res.ok) throw new Error(`Amelia API error ${res.status}: ${call}`)
  const json = await res.json()
  if (!json.data) throw new Error(`Amelia returned no data for: ${call}`)
  return json.data as T
}

export function ameliaGetSlots(params: GetSlotsParams & { revalidate?: number }): Promise<AmeliaSlots> {
  const { serviceId, persons, providerIds, locationId, startDateTime, endDateTime, revalidate } = params
  const qs = new URLSearchParams()
  qs.set('serviceId', String(serviceId))
  qs.set('persons', String(persons))
  if (providerIds?.length) providerIds.forEach(id => qs.append('providerIds[]', String(id)))
  if (locationId)          qs.set('locationId', String(locationId))
  if (startDateTime)       qs.set('startDateTime', startDateTime)
  if (endDateTime)         qs.set('endDateTime', endDateTime)
  return ameliaFetchWithExtra<AmeliaSlots>('/api/v1/slots', '&' + qs.toString(), revalidate)
}

export interface AmeliaCustomer {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
}

export async function ameliaGetCustomers(params?: {
  search?: string
  page?: number
  countPerPage?: number
}): Promise<{ customers: AmeliaCustomer[]; total: number }> {
  const { BASE_URL, API_KEY } = getConfig()

  async function fetchPage(page: number, perPage = 100): Promise<{ list: AmeliaCustomer[]; total: number }> {
    const qs = new URLSearchParams()
    if (params?.search) qs.set('search', params.search)
    qs.set('page',         String(page))
    qs.set('countPerPage', String(perPage))
    const qsStr = qs.toString()
    const url = `${BASE_URL}?action=wpamelia_api&call=/api/v1/users/customers&${qsStr}`
    const res  = await fetch(url, { headers: { Amelia: API_KEY }, cache: 'no-store' })
    const text = await res.text()
    if (!res.ok) throw new Error(`Amelia customers HTTP ${res.status}: ${text.slice(0, 200)}`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json = JSON.parse(text) as any
    const data = json?.data ?? json
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const list: AmeliaCustomer[] = (data?.users ?? data?.customers ?? []).map((u: AmeliaCustomer) => ({
      id:        u.id,
      firstName: u.firstName,
      lastName:  u.lastName,
      email:     u.email  ?? '',
      phone:     u.phone  ?? '',
    }))
    return { list, total: data?.total ?? list.length }
  }

  const first = await fetchPage(1, 100)
  if (first.list.length === 0) return { customers: [], total: 0 }

  const pageSize = first.list.length
  const all: AmeliaCustomer[] = [...first.list]

  const BATCH_SIZE = 10
  let   batchStart = 2
  while (true) {
    const pageNums = Array.from({ length: BATCH_SIZE }, (_, i) => batchStart + i)
    const results  = await Promise.all(pageNums.map(p => fetchPage(p, 100)))
    let   done     = false
    for (const { list } of results) {
      if (list.length === 0) { done = true; break }
      all.push(...list)
      if (list.length < pageSize) { done = true; break }
    }
    if (done) break
    batchStart += BATCH_SIZE
  }

  return { customers: all, total: all.length }
}

export async function ameliaCreateCustomer(data: {
  firstName: string
  lastName: string
  email: string
  phone?: string
}): Promise<AmeliaCustomer> {
  const { BASE_URL, API_KEY } = getConfig()
  const url = `${BASE_URL}?action=wpamelia_api&call=/api/v1/users/customers`
  const res = await fetch(url, {
    method:  'POST',
    headers: { Amelia: API_KEY, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ type: 'customer', ...data, phone: data.phone ?? '' }),
    cache:   'no-store',
  })
  const text = await res.text()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let json: { message?: string | null; data?: any }
  try { json = JSON.parse(text) } catch { throw new Error(`Amelia parse error: ${text.slice(0, 300)}`) }
  if (!res.ok) throw new Error(`Amelia HTTP ${res.status}: ${json.message ?? text.slice(0, 200)}`)
  const user = json.data?.user ?? json.data
  if (!user?.id) throw new Error('Amelia createCustomer: no user id in response')
  return { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email ?? '', phone: user.phone ?? '' }
}

// ─── Create appointment via direct MySQL endpoint (bypasses Amelia ORM SQL IN() bug) ───

export async function ameliaAdminCreateAppointmentDirect(params: {
  serviceId: number
  providerId: number
  locationId?: number | null
  bookingStart: string // "YYYY-MM-DD HH:MM"
  bookingEnd: string
  customerId: number
  price: number
  status?: string
  customFields?: string
  notifyParticipants?: number
}): Promise<{ appointment: { id: number; bookingStart: string; bookingEnd: string; status: string; serviceId: number; providerId: number; locationId: number | null; bookings: unknown[] } }> {
  const secret = process.env.REVALIDATE_SECRET
  if (!secret) throw new Error('REVALIDATE_SECRET not set — cannot use direct appointment creation')

  const base = getWpAjaxBase()
  const url  = `${base}?action=cm_create_appointment`

  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'X-Secret': secret },
    body:    JSON.stringify(params),
    cache:   'no-store',
  })

  const text = await res.text()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let json: { ok?: boolean; appointment?: unknown; error?: string }
  try { json = JSON.parse(text) } catch { throw new Error(`cm_create_appointment parse error: ${text.slice(0, 300)}`) }

  if (!res.ok || !json.ok) {
    throw new Error(`cm_create_appointment error ${res.status}: ${json.error ?? text.slice(0, 200)}`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return json as any
}

// ─── Trigger GCal sync after appointment creation ────────────────────────────────

export async function ameliaTriggerGcalSync(appointmentId: number): Promise<void> {
  const secret = process.env.REVALIDATE_SECRET
  if (!secret) return
  const base = getWpAjaxBase()
  try {
    const res = await fetch(`${base}?action=cm_sync_gcal`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'X-Secret': secret },
      body:    JSON.stringify({ appointmentId }),
      cache:   'no-store',
      signal:  AbortSignal.timeout(15000),
    })
    const text = await res.text()
    console.log(`[amelia] gcalSync(${appointmentId}) HTTP ${res.status}:`, text.slice(0, 200))
  } catch (e) {
    console.warn('[amelia] gcalSync error (non-fatal):', e instanceof Error ? e.message : e)
  }
}

// ─── Update appointment status ────────────────────────────────────────────────

export async function ameliaUpdateAppointmentStatus(
  appointmentId: number,
  status: 'approved' | 'pending' | 'canceled' | 'rejected' | 'no-show',
) {
  const { BASE_URL, API_KEY } = getConfig()
  const url = `${BASE_URL}?action=wpamelia_api&call=/api/v1/appointments/status/${appointmentId}`
  const res = await fetch(url, {
    method:  'POST',
    headers: { Amelia: API_KEY, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ status, packageCustomerId: null }),
    cache:   'no-store',
  })
  const text = await res.text()
  console.log(`[amelia] updateAppointmentStatus(${appointmentId}, ${status}) HTTP ${res.status}:`, text.slice(0, 300))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let json: { message?: string | null; data?: unknown }
  try { json = JSON.parse(text) } catch { throw new Error(`Amelia parse error: ${text.slice(0, 300)}`) }
  if (!res.ok) throw new Error(`Amelia HTTP ${res.status}: ${json.message ?? text.slice(0, 200)}`)
  return json.data
}

// ─── Get appointment by ID ─────────────────────────────────────────────────────

export async function ameliaGetAppointmentById(appointmentId: number) {
  const { BASE_URL, API_KEY } = getConfig()
  const url = `${BASE_URL}?action=wpamelia_api&call=/api/v1/appointments/${appointmentId}`
  const res = await fetch(url, {
    headers: { Amelia: API_KEY },
    cache:   'no-store',
  })
  const text = await res.text()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let json: { message?: string | null; data?: any }
  try { json = JSON.parse(text) } catch { throw new Error(`Amelia parse error: ${text.slice(0, 300)}`) }
  if (!res.ok) throw new Error(`Amelia HTTP ${res.status}: ${json.message ?? text.slice(0, 200)}`)
  return json.data
}

// ─── Create provider ──────────────────────────────────────────────────────────

export interface AmeliaPeriod {
  periodStart: string // YYYY-MM-DD
  periodEnd: string | null
  weekDayList: Array<{
    dayIndex: number // 1=lunes ... 0=domingo
    timeSlots: Array<{ startTime: string; endTime: string }> // HH:MM format
  }>
}

export interface AmeliaCreateProviderPayload {
  type?: 'provider'
  firstName: string
  lastName: string
  email: string
  phone?: string
  serviceList: number[]
  periods?: AmeliaPeriod[]
  status?: 'visible' | 'hidden'
}

export async function ameliaCreateProvider(payload: AmeliaCreateProviderPayload): Promise<{ user: { id: number } }> {
  const { BASE_URL, API_KEY } = getConfig()
  const url = `${BASE_URL}?action=wpamelia_api&call=/api/v1/users/providers`
  const res = await fetch(url, {
    method: 'POST',
    headers: { Amelia: API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'provider', ...payload }),
    cache: 'no-store',
  })
  const text = await res.text()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let json: { message?: string | null; data?: any }
  try { json = JSON.parse(text) } catch { throw new Error(`Amelia parse error: ${text.slice(0, 300)}`) }
  if (!res.ok) throw new Error(`Amelia HTTP ${res.status}: ${json.message ?? text.slice(0, 200)}`)
  return json.data
}

export async function ameliaUpdateProvider(
  providerId: number,
  payload: Partial<AmeliaCreateProviderPayload>,
): Promise<void> {
  const { BASE_URL, API_KEY } = getConfig()
  const url = `${BASE_URL}?action=wpamelia_api&call=/api/v1/users/providers/${providerId}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { Amelia: API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  })
  const text = await res.text()
  console.log(`[amelia] updateProvider(${providerId}) HTTP ${res.status}:`, text.slice(0, 300))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let json: { message?: string | null; data?: unknown }
  try { json = JSON.parse(text) } catch { throw new Error(`Amelia parse error: ${text.slice(0, 300)}`) }
  if (!res.ok) throw new Error(`Amelia HTTP ${res.status}: ${json.message ?? text.slice(0, 200)}`)
}

// ─── Utility: build customFields for appointment (carries Daily.co link + RUT) ────

export function buildAppointmentCustomFields(dailyRoomUrl: string, rutEvaluado: string): string {
  return JSON.stringify({
    'Enlace de videollamada': dailyRoomUrl,
    'RUT Evaluado': rutEvaluado,
  })
}

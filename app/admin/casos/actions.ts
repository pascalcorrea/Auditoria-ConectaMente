'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createRoom } from '@/lib/daily'
import { ameliaGetSlots, ameliaGetCustomers, ameliaCreateCustomer, ameliaAdminCreateAppointmentDirect, ameliaTriggerGcalSync, buildAppointmentCustomFields } from '@/lib/amelia'
import { sendEmailBrevo } from '@/lib/comunicaciones/email'
import { sendWhatsAppText } from '@/lib/comunicaciones/whatsapp'
import type { EstadoCaso } from '@prisma/client'

export async function cambiarEstadoCaso(casoId: string, estado: EstadoCaso) {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'backoffice') return

  const estadosValidos: EstadoCaso[] = ['recibido', 'en_revision', 'informe_en_validacion', 'entregado']
  if (!estadosValidos.includes(estado)) return

  await prisma.caso.update({
    where: { id: casoId },
    data: { estado },
  })

  revalidatePath('/admin/casos')
  revalidatePath('/admin/cumplimiento')
}

export async function obtenerSlotsDisponibles(medicoId: string, fechaYMD: string): Promise<string[]> {
  try {
    const medico = await prisma.usuario.findUnique({ where: { id: medicoId }, select: { ameliaProviderId: true } })
    if (!medico?.ameliaProviderId) return []

    const startDateTime = `${fechaYMD} 00:00`
    const endDateTime = `${fechaYMD} 23:59`
    const serviceId = parseInt(process.env.AMELIA_SERVICE_ID || '24')

    const slots = await ameliaGetSlots({
      serviceId,
      persons: 1,
      providerIds: [medico.ameliaProviderId],
      startDateTime,
      endDateTime,
    })

    const daySlots = slots.slots[fechaYMD] || {}
    return Object.keys(daySlots).sort()
  } catch (err) {
    console.warn('[obtenerSlotsDisponibles]', err)
    return []
  }
}

export async function agendarSesion(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok?: boolean; error?: string; calendarWarning?: string }> {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'backoffice') return { error: 'No autorizado' }

  const casoId = formData.get('casoId') as string
  const fechaHora = formData.get('fechaHora') as string
  const emailEvaluado = (formData.get('emailEvaluado') as string) || undefined
  const telefonoEvaluado = (formData.get('telefonoEvaluado') as string) || undefined

  if (!casoId || !fechaHora) return { error: 'Datos incompletos' }

  try {
    const [fechaYMD, hora] = fechaHora.split(' ')
    const caso = await prisma.caso.findUnique({
      where: { id: casoId },
      include: { medico: true },
    })

    if (!caso?.medico?.ameliaProviderId) return { error: 'Médico sin configuración Amelia' }

    if (emailEvaluado || telefonoEvaluado) {
      await prisma.caso.update({
        where: { id: casoId },
        data: {
          ...(emailEvaluado ? { emailEvaluado } : {}),
          ...(telefonoEvaluado ? { telefonoEvaluado } : {}),
        },
      })
    }

    const serviceId = parseInt(process.env.AMELIA_SERVICE_ID || '24')
    const email = emailEvaluado || caso.emailEvaluado || ''
    const phone = telefonoEvaluado || caso.telefonoEvaluado || ''

    let customerId = 0
    if (email) {
      const customers = await ameliaGetCustomers({ search: email })
      if (customers.customers.length > 0) {
        customerId = customers.customers[0].id
      } else {
        const newCustomer = await ameliaCreateCustomer({
          firstName: caso.nombreEvaluado.split(' ')[0],
          lastName: caso.nombreEvaluado.split(' ').slice(1).join(' '),
          email,
          phone,
        })
        customerId = newCustomer.id
      }
    } else {
      return { error: 'Email evaluado requerido para crear cita' }
    }

    const dailyRoomUrl = await createRoom(casoId)
    const bookingStart = `${fechaYMD} ${hora}`
    const bookingEnd = new Date(new Date(`${fechaYMD}T${hora}:00`).getTime() + 3600000).toLocaleString('sv-SE', { timeZone: 'America/Santiago' }).slice(0, 16)

    const appointment = await ameliaAdminCreateAppointmentDirect({
      serviceId,
      providerId: caso.medico.ameliaProviderId,
      bookingStart,
      bookingEnd,
      customerId,
      price: 0,
      customFields: buildAppointmentCustomFields(dailyRoomUrl, caso.rutEvaluado),
    })

    await ameliaTriggerGcalSync(appointment.appointment.id)

    await prisma.sesion.create({
      data: {
        casoId,
        fechaProgramada: new Date(bookingStart),
        dailyRoomUrl,
        ameliaAppointmentId: appointment.appointment.id,
        estado: 'agendada',
      },
    })

    const notifyEmail = emailEvaluado || caso.emailEvaluado
    const notifyPhone = telefonoEvaluado || caso.telefonoEvaluado

    if (notifyEmail) {
      await sendEmailBrevo({
        to: notifyEmail,
        toName: caso.nombreEvaluado,
        subject: 'Sesión agendada',
        html: `<p>Tu sesión ha sido agendada para el ${fechaYMD} a las ${hora}.</p><p><a href="${dailyRoomUrl}">Ingresar a la sesión</a></p>`,
      }).catch(() => {})
    }

    if (notifyPhone) {
      await sendWhatsAppText({ to: notifyPhone, text: `Tu sesión ha sido agendada para el ${fechaYMD} a las ${hora}. ${dailyRoomUrl}` }).catch(() => {})
    }

    await sendEmailBrevo({
      to: caso.medico.email,
      toName: caso.medico.nombre,
      subject: 'Nueva sesión agendada',
      html: `<p>Nueva sesión agendada para ${caso.nombreEvaluado} el ${fechaYMD} a las ${hora}.</p>`,
    }).catch(() => {})

    revalidatePath('/admin/casos')
    return { ok: true }
  } catch (err) {
    console.error('[agendarSesion]', err)
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    return { error: msg }
  }
}

const BREVO_API_KEY = process.env.BREVO_API_KEY
const BREVO_SENDER = process.env.BREVO_SENDER_EMAIL || 'noreply@conectamente.cl'
const BREVO_API_URL = 'https://api.brevo.com/v3'

export interface EmailParams {
  to: string
  subject: string
  htmlContent: string
  textContent?: string
}

export async function enviarEmail(params: EmailParams): Promise<boolean> {
  if (!BREVO_API_KEY) {
    console.warn('BREVO_API_KEY not configured, skipping email')
    return false
  }

  try {
    const res = await fetch(`${BREVO_API_URL}/smtp/email`, {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { email: BREVO_SENDER, name: 'ConectaMente' },
        to: [{ email: params.to }],
        subject: params.subject,
        htmlContent: params.htmlContent,
        textContent: params.textContent,
      }),
    })

    if (!res.ok) {
      console.error('Brevo API error:', await res.text())
      return false
    }

    return true
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}

export function generarEmailAlertaPlazo(nombreEvaluado: string, diasRestantes: number, organizacion: string): EmailParams {
  return {
    to: '', // Will be filled by caller
    subject: `⚠️ Plazo próximo a vencer: ${nombreEvaluado}`,
    htmlContent: `
      <h2>Alerta de plazo</h2>
      <p>El caso de <strong>${nombreEvaluado}</strong> vence en <strong>${diasRestantes} días</strong>.</p>
      <p><strong>Organización:</strong> ${organizacion}</p>
      <p>Por favor, completa la evaluación antes de la fecha límite.</p>
    `,
    textContent: `Alerta: ${nombreEvaluado} vence en ${diasRestantes} días`,
  }
}

export function generarEmailInformeEntregado(nombreEvaluado: string, organizacion: string, enlaceDescarga: string): EmailParams {
  return {
    to: '', // Will be filled by caller
    subject: `✅ Informe disponible: ${nombreEvaluado}`,
    htmlContent: `
      <h2>Informe disponible</h2>
      <p>El informe de evaluación de <strong>${nombreEvaluado}</strong> está disponible para descargar.</p>
      <p><strong>Organización:</strong> ${organizacion}</p>
      <p><a href="${enlaceDescarga}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Descargar informe</a></p>
    `,
    textContent: `Informe disponible para ${nombreEvaluado}`,
  }
}

export function generarEmailSesionRealizadaMedico(nombreEvaluado: string, duracion: number): EmailParams {
  return {
    to: '', // Will be filled by caller
    subject: `✓ Sesión completada: ${nombreEvaluado}`,
    htmlContent: `
      <h2>Sesión completada</h2>
      <p>La sesión de evaluación de <strong>${nombreEvaluado}</strong> fue completada exitosamente.</p>
      <p><strong>Duración efectiva:</strong> ${duracion} minutos</p>
      <p>La grabación está disponible en el sistema.</p>
    `,
    textContent: `Sesión de ${nombreEvaluado} completada`,
  }
}

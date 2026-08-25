import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
// Brevo (Sendinblue) via fetch directo
// Adaptado de ConectaMente-1 lib/send-booking-email.ts

type SendEmailParams = {
  to: string; // email address
  toName?: string;
  subject: string;
  html: string;
};

type SendResult = {
  ok: boolean;
  messageId?: string;
  error?: string;
};

type BrevoApiResponse = {
  messageId?: string;
  message?: string;
};

export async function sendEmailBrevo(params: SendEmailParams): Promise<SendResult> {
  const { to, toName, subject, html } = params;

  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || 'ConectaMente';

  if (!apiKey || !senderEmail) {
    return { ok: false, error: 'Brevo credentials not configured' };
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: senderName },
        to: [{ email: to, name: toName || to }],
        subject,
        htmlContent: html,
      }),
    });

    const data = (await response.json()) as BrevoApiResponse;

    if (response.ok && data.messageId) {
      return { ok: true, messageId: data.messageId };
    }

    return {
      ok: false,
      error: data.message || 'Failed to send email',
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

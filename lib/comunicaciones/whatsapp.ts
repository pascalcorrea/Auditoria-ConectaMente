// No deps externas, solo fetch nativo
// Adaptado de ConectaMente-1 lib/whatsapp.ts

type SendWhatsAppTemplateParams = {
  to: string; // teléfono normalizado, ej: +56912345678
  templateName: string; // nombre de plantilla en Meta Business Suite
  params?: Record<string, string>; // variables de la plantilla
};

type SendWhatsAppTextParams = {
  to: string;
  text: string; // máximo 1000 caracteres
};

type SendResult = {
  ok: boolean;
  messageId?: string;
  error?: string;
};

type WhatsAppApiResponse = {
  messages?: Array<{ id: string }>;
  error?: { message: string };
};

export async function sendWhatsAppTemplate(params: SendWhatsAppTemplateParams): Promise<SendResult> {
  const { to, templateName, params: templateParams } = params;

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    return { ok: false, error: 'WhatsApp credentials not configured' };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'template',
          template: {
            name: templateName,
            language: {
              code: 'es_ES',
            },
            components: templateParams
              ? [
                  {
                    type: 'body',
                    parameters: Object.values(templateParams).map((val: any) => ({ type: 'text', text: val })),
                  },
                ]
              : undefined,
          },
        }),
      }
    );

    const data = (await response.json()) as WhatsAppApiResponse;

    if (response.ok && data.messages?.[0]?.id) {
      return { ok: true, messageId: data.messages[0].id };
    }

    return {
      ok: false,
      error: data.error?.message || 'Failed to send WhatsApp template',
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

export async function sendWhatsAppText(params: SendWhatsAppTextParams): Promise<SendResult> {
  const { to, text } = params;

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    return { ok: false, error: 'WhatsApp credentials not configured' };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: { body: text },
        }),
      }
    );

    const data = (await response.json()) as WhatsAppApiResponse;

    if (response.ok && data.messages?.[0]?.id) {
      return { ok: true, messageId: data.messages[0].id };
    }

    return {
      ok: false,
      error: data.error?.message || 'Failed to send WhatsApp text',
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

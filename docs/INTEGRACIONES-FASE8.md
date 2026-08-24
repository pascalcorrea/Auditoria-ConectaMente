# Fase 8 - Integraciones Reales

## Descripción
Reemplazo de servicios mock con integraciones reales:
- **Daily.co**: Salas de video en vivo
- **Brevo**: Email transaccional
- **FirmaWeb**: Firma electrónica

## Daily.co - Video Sesiones

### Setup
1. Crear cuenta en https://daily.co
2. Obtener API key en Settings > Developers

### Configuración
```env
DAILY_API_KEY=<tu-api-key>
DAILY_API_SECRET=<tu-api-secret>
```

### Endpoints
- `app/api/medico/casos/[id]/sesion/token.ts` - Genera tokens para acceso a sala
- `app/api/webhooks/daily/route.ts` - Webhook para eventos de sesión

### Validación
```bash
# Test: curl -H "Authorization: Bearer $DAILY_API_KEY" https://api.daily.co/v1/rooms
```

## Brevo - Email Transaccional

### Setup
1. Crear cuenta en https://brevo.com
2. Obtener API key en Settings > SMTP & API

### Configuración
```env
BREVO_API_KEY=<tu-api-key>
BREVO_SENDER_EMAIL=noreply@conectamente.cl
```

### Emails
- Alerta de plazo (3 días antes de fecha límite)
- Informe entregado (cuando médico firma)
- Sesión completada (webhook desde Daily.co)

### Testing
```bash
# Test: curl -X POST https://api.brevo.com/v3/smtp/email \
  -H "api-key: $BREVO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to":[{"email":"test@example.com"}],"subject":"Test","htmlContent":"<p>Test</p>","sender":{"email":"noreply@conectamente.cl"}}'
```

## FirmaWeb - Firma Electrónica

### Setup
1. Registrarse en https://firmaweb.cl (o Sovos)
2. Obtener credenciales

### Configuración
```env
FIRMA_PROVIDER=firmaweb|mock
FIRMA_API_KEY=<tu-api-key>
FIRMA_API_URL=https://api.firmaweb.cl/v1
```

### Workflow
1. Médico genera informe PDF
2. Endpoint `app/api/medico/casos/[id]/informe/firmar.ts` envía a FirmaWeb
3. Archivo firmado se retorna y se guarda en S3/storage

### Testing
```bash
# Mock (local dev)
FIRMA_PROVIDER=mock npm run dev

# Real (staging)
FIRMA_PROVIDER=firmaweb npm run dev
```

## Environment Variables Completo

```env
# Daily.co
DAILY_API_KEY=
DAILY_API_SECRET=

# Brevo
BREVO_API_KEY=
BREVO_SENDER_EMAIL=noreply@conectamente.cl

# FirmaWeb
FIRMA_PROVIDER=mock  # or firmaweb
FIRMA_API_KEY=
FIRMA_API_URL=

# Database & Auth (existentes)
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Jobs
CRON_SECRET=
INTERNAL_SECRET=
```

## Testing

### Unit Tests
```bash
npm run test lib/integraciones-fase8.test.ts
```

### E2E Tests
```bash
npm run test:e2e medico.spec.ts
```

### Validación en Staging
```bash
# 1. Configurar env en staging
# 2. Deploy a staging: git push staging core-fase8-integraciones-reales
# 3. Pruebas manuales:
#    - Médico inicia sesión
#    - Médico inicia sesión de video
#    - Video se graba en Daily.co
#    - Médico firma informe
#    - Email se recibe en Brevo
```

## Fallbacks
- Sin DAILY_API_KEY → Error en sesión
- Sin BREVO_API_KEY → Emails no se envían (log warning)
- Sin FIRMA_API_KEY → Firma usa mock

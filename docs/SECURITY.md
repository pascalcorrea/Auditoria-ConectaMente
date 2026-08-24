# Seguridad y Endurecimiento — Fase 6

## Resumen ejecutivo

ConectaMente maneja datos médicos y personales sensibles. Este documento detalla controles de seguridad implementados en la Fase 6.

## 1. Control de acceso por rol

### Matriz de permisos

| Endpoint | Cliente | Médico | Backoffice | Público |
|----------|---------|--------|------------|---------|
| `/api/cliente/casos` | ✅ | ❌ | ❌ | ❌ |
| `/api/medico/casos` | ❌ | ✅ | ❌ | ❌ |
| `/api/medico/casos/[id]/sesion/token` | ✅ | ✅ | ❌ | ❌ |
| `/api/medico/casos/[id]/informe/generar` | ❌ | ✅ | ❌ | ❌ |
| `/api/medico/casos/[id]/informe/firmar` | ❌ | ✅ | ❌ | ❌ |
| `/api/admin/casos` | ❌ | ❌ | ✅ | ❌ |
| `/api/admin/usuarios` | ❌ | ❌ | ✅ | ❌ |
| `/api/webhooks/daily` | ❌ | ❌ | ❌ | ✅ |

### Validación de acceso

Cada endpoint verifica:
1. Autenticación via NextAuth session
2. Rol del usuario
3. Propiedad del recurso (usuario solo ve sus casos/informes)

```typescript
// Ejemplo: /api/medico/casos/[id]/sesion/token
if (session?.user?.rol !== 'medico') return 403
if (caso.medicoId !== session.user.id) return 403
```

## 2. Datos sensibles

### Campos sensibles identificados

- `passwordHash` — nunca retornado en respuestas
- `token` (JWT, Daily.co) — solo en contexto autenticado
- `firmaProveedor`, `firmaDocumentoId` — datos de auditoría
- Grabaciones (`grabacionUrl`) — accesibles solo a médico y backoffice

### Sanitización

Implementada en `lib/seguridad.ts:sanitizarDatos()`. Remueve:
- passwordHash
- token
- secret
- key

## 3. Flujos de autenticación

### NextAuth.js

- Sesión server-side con cookies seguras
- Tokens JWT con expiradores
- Roles validados en cada request

### Daily.co tokens

- Meeting tokens generados por endpoint autenticado
- Scopes diferenciados: médico (grabación), evaluado (read)
- Expiran en 1 hora

## 4. Validación de datos

### Entrada

- Emails validados con regex
- RUT validado (formato base)
- Fechas validadas como ISO strings
- Archivos limitados a tipos MIME específicos

### Salida

- Informes generados desde datos internos (no user-input directo)
- URLs de descarga validadas antes de retornar
- Timestamps auditables

## 5. Registros de auditoría

### Implementados

- `LogDescarga` — cada descarga de informe
- `firmaTimestamp` — cuándo se firmó el informe
- `consentimientoTimestamp` — cuándo se dio consentimiento
- Timestamps en todas las transiciones de estado

### No implementado (post-Fase 6)

- Logs de API calls
- Cambios en campos críticos (estado, médico asignado)
- Login/logout events

## 6. Tests de seguridad

### Included

- `flujo-completo.test.ts` — validación de estado transitions
- Matriz de permisos en `PERMISOS` (lib/seguridad.ts)

### Manual checks

Antes de producción:
- [ ] Revisar CORS headers
- [ ] Validar rate limiting en endpoints sensibles
- [ ] Confirmar SSL/TLS en todas las conexiones
- [ ] Audit variables de entorno en CI/CD
- [ ] Backup strategy for database

## 7. Recomendaciones post-Fase 6

1. **Logging centralizado** — CloudWatch, DataDog, etc.
2. **Rate limiting** — redis-based, per-user
3. **WAF rules** — en proxy reverso (Nginx)
4. **Encryption at rest** — database encryption
5. **Secrets management** — HashiCorp Vault o AWS Secrets Manager
6. **Penetration testing** — antes de producción
7. **GDPR/LGPD compliance** — data retention policies

## 8. Incidentes y respuesta

### Protocolo

1. Identificar scope (qué datos comprometidos)
2. Contener (disable account, revoke tokens)
3. Investigar (logs, audit trail)
4. Remediar (password reset, data restoration)
5. Notificar (usuarios, reguladores)

### Contacto de seguridad

security@conectamente.cl (TBD)

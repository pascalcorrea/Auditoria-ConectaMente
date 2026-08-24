# Checklist Pre-Producción — Fase 6

## Seguridad

- [ ] Todos los endpoints validan rol del usuario
- [ ] No hay datos sensibles (passwords, tokens) en logs
- [ ] HTTPS/SSL configurado en dominio
- [ ] CORS headers restrictivos
- [ ] Rate limiting implementado
- [ ] Validación de entrada en todos los formularios

## Base de datos

- [ ] Backups automatizados configurados
- [ ] Índices creados en columnas críticas (fechaLimite, estado, organizacionId)
- [ ] Variables de entorno no contienen credenciales en versión control
- [ ] Migraciones testeadas en entorno staging

## Notificaciones

- [ ] Brevo API key configurada
- [ ] Cron jobs para alertas de plazo programados
- [ ] Templates de email revisados para typos
- [ ] Test de entrega de emails ejecutado

## Integraciones externas

- [ ] Daily.co credentials validadas
- [ ] Firma electrónica (FirmaWeb/Sovos) configurada
- [ ] Webhooks de Daily.co registrados en dashboard

## Performance

- [ ] Queries optimizadas (no N+1)
- [ ] Pagination implementada en listados grandes
- [ ] Caché configurado (ISR, SWR)
- [ ] Imágenes optimizadas
- [ ] Bundles minificados

## Testing

- [ ] Unit tests para lógica crítica
- [ ] E2E tests para flujos principales
- [ ] Tests de permisos/seguridad
- [ ] Load testing (simulación de picos)

## Monitoring

- [ ] Error tracking (Sentry/similar) configurado
- [ ] Logs centralizados
- [ ] Alertas para errores 5xx
- [ ] Dashboard de health checks

## Documentación

- [ ] README actualizado con instrucciones de deploy
- [ ] API docs generadas (Swagger/similar)
- [ ] Runbook para incidentes disponible
- [ ] Variables de entorno documentadas

## Compliance

- [ ] Privacy policy publicada
- [ ] Términos de servicio publicados
- [ ] GDPR/LGPD compliance checklist
- [ ] Data retention policies definidas
- [ ] Consent forms para grabación validados

## Deployment

- [ ] CI/CD pipeline funcionando
- [ ] Secrets no en repositorio
- [ ] Blue-green deployment preparado
- [ ] Rollback plan documentado
- [ ] Staging environment igual a producción

## Acepción

- [ ] Stakeholders aprueban Go/No-go
- [ ] Comunicado de launch preparado
- [ ] Support team entrenado
- [ ] Escalation procedures definidas

---

**Fecha de checklist:** [YYYY-MM-DD]
**Responsable:** 
**Aprobado por:** 

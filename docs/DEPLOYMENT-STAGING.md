# Fase 9 - Deployment a Staging

## Pre-Deployment Checklist

### Código
- [ ] Todos los tests pasan: `npm run test`
- [ ] Lint sin errores: `npm run lint`
- [ ] Build sin errores: `npm run build`
- [ ] Rama actualizada con main: `git rebase main`

### Integraciones
- [ ] Daily.co API key validado
- [ ] Brevo API key validado
- [ ] Database connection string preparado
- [ ] FirmaWeb credentials (si aplica)

### Secrets
- [ ] NEXTAUTH_SECRET generado (min 32 chars)
- [ ] CRON_SECRET generado
- [ ] INTERNAL_SECRET generado
- [ ] Todos en staging secrets manager

## Deployment Steps

### 1. Build & Push
```bash
# Desde la rama core-fase9-deploy-staging
git push origin core-fase9-deploy-staging

# Crear PR a staging branch
gh pr create --base staging --head core-fase9-deploy-staging \
  --title "Deploy Fase 9 to Staging" \
  --body "Production-ready build with real integrations"
```

### 2. Merge a Staging
```bash
gh pr merge <PR-NUMBER> --squash --delete-branch
```

### 3. Deploy (via GitHub Actions o manual)
```bash
# Manual: Build y deploy en servidor staging
ssh staging@staging.conectamente.cl
cd /app
git pull origin staging
npm ci
npm run build
npx prisma migrate deploy
npm run seed
npm start
```

## Health Checks

### API Health
```bash
curl https://staging.conectamente.cl/api/health
# Esperado: {"status":"ok","version":"0.1.0"}
```

### Database
```bash
curl https://staging.conectamente.cl/api/health/db
# Esperado: {"status":"connected"}
```

### Integrations
```bash
curl https://staging.conectamente.cl/api/health/integrations
# Esperado: {"daily":"ok","brevo":"ok","firma":"ok"}
```

## Smoke Tests (Post-Deploy)

### 1. Cliente Portal
- [ ] Login como cliente
- [ ] Ver casos asignados
- [ ] Descargar informe PDF

### 2. Médico Portal
- [ ] Login como médico
- [ ] Ver casos asignados
- [ ] Iniciar sesión de video (Daily.co)
- [ ] Generar informe
- [ ] Firmar informe (FirmaWeb)

### 3. Backoffice
- [ ] Login como admin
- [ ] Ver dashboard
- [ ] Ver cumplimiento
- [ ] Crear caso

### 4. Email Notifications
- [ ] Recibir alerta de plazo
- [ ] Recibir informe entregado

## Rollback

Si algo falla:

```bash
# Revertir a versión anterior
git revert <commit-hash>
git push origin staging

# Deploy versión anterior
ssh staging@staging.conectamente.cl
cd /app
git pull origin staging
npm run build
npm start
```

## Monitoring

### Logs
```bash
# Ver logs en tiempo real
ssh staging@staging.conectamente.cl
tail -f /var/log/conectamente/app.log

# O via CloudWatch/Datadog
```

### Metrics to Watch
- API response time (target: <200ms)
- Database connection pool usage
- Daily.co room creation latency
- Brevo email delivery rate
- Error rate (target: <0.1%)

## Success Criteria

✅ All smoke tests pass  
✅ No 5xx errors in logs  
✅ Database migrations complete  
✅ All integrations responding  
✅ Email notifications working  

Ready for production deployment after staging validation.

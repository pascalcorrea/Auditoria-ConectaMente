# Testing Plan — Fase 7

## Test Coverage

### Unit Tests
- ✅ Seguridad (permisos, acceso a recursos)
- ✅ Caso lifecycle (transiciones de estado)
- ⏳ Notificaciones (generación de emails)
- ⏳ PDF generation (validación de contenido)
- ⏳ Firma electrónica (mock providers)

### Integration Tests
- ⏳ Auth flow (login, roles, session)
- ⏳ Caso CRUD (crear, leer, actualizar)
- ⏳ Sesión + grabación
- ⏳ Informe generación + firma
- ⏳ Notificaciones end-to-end

### E2E Tests (Playwright)
- ⏳ Cliente: ver casos, descargar informe
- ⏳ Médico: listar casos, iniciar sesión, generar informe, firmar
- ⏳ Backoffice: crear caso, asignar médico, ver cumplimiento
- ⏳ Permiso denials (403 errors)

### Performance Tests
- ⏳ Listado de 1000+ casos (pagination)
- ⏳ PDF generation time < 5s
- ⏳ API response time < 200ms

## Running Tests

```bash
npm run test                 # Run all unit tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report
npx playwright test         # Run E2E tests
```

## CI/CD Integration
- Tests run on every push
- Coverage report generated
- E2E tests run on PR creation
- Min 70% coverage required

## Known Gaps
1. Video session mocking (need Daily.co mock)
2. Real Brevo email testing
3. Firma electrónica provider testing
4. Database snapshot testing

# Prompt Maestro — Inicio del Proyecto ConectaMente Auditoría

Vas a construir dos desarrollos relacionados para **ConectaMente Auditoría**, un nuevo servicio B2B/B2G de auditoría y segunda revisión de licencias médicas para isapres, COMPIN, empresas y seguros en Chile:

1. **Sitio web institucional** en `auditoria.conectamente.cl`
2. **Plataforma operativa (ConectaMente Core™)** en `core.conectamente.cl`

## Antes de escribir una sola línea de código, lee estos documentos en este orden

1. **`02_App_MVP_ConectaMente_Core.md`** — el criterio de negocio: qué se construye y por qué, qué queda fuera y por qué. Este documento define el estándar de "necesario". Cualquier duda sobre si algo debe construirse se resuelve con su criterio central: *¿el servicio deja de ser confiable end-to-end sin esto?* Si la respuesta es no, no se construye todavía.
2. **`03_App_Especificacion_Tecnica_ConectaMente_Core.md`** — stack, modelo de datos, rutas, flujos funcionales, seguridad, plan de fases y documentación de referencia por tecnología. Este es tu documento de ejecución principal para la app.
3. **`01_Web_Estructura_ConectaMente_Auditoria.md`**, **`04_Web_Wireframes_Conceptuales.md`**, **`05_Web_Copy_Home_Isapres.md`** — estructura, wireframes y copy del sitio web.

No repitas ni resumas el contenido de estos documentos de vuelta a mí — ya los conozco. Úsalos como fuente de verdad y trabaja directamente sobre ellos.

## Reglas de trabajo

- **Sigue el plan de fases de la sección 9 del documento técnico, en orden.** No saltes fases ni adelantes funcionalidad de fases posteriores, aunque técnicamente sea fácil hacerlo en el momento.
- **Al terminar cada fase**, resume qué construiste, qué decisiones tomaste si algo no estaba explícito en los documentos, y qué queda pendiente antes de pasar a la siguiente. Espera confirmación antes de avanzar.
- **Antes de iniciar cada fase**, carga solo la documentación de stack correspondiente a esa fase (sección 11 del documento técnico) — no cargues toda la documentación de una vez, satura el contexto sin necesidad.
- **Nada fuera del alcance del MVP** (listado en ambos documentos 02 y 03) se construye sin preguntar primero — aunque parezca una mejora obvia o de bajo esfuerzo. El criterio de scope ya fue decidido deliberadamente, no es un descuido.
- **Si algo es ambiguo o falta un detalle para construirlo bien, pregunta antes de asumir.** No rellenes vacíos de los documentos con suposiciones silenciosas — especialmente en todo lo relacionado a permisos por rol, manejo de datos sensibles, y la máquina de estados de sesión.
- **El stack ya está decidido y no se cambia sin confirmación explícita:** Next.js + TypeScript, Prisma + PostgreSQL, NextAuth.js, Daily.co, Brevo, VPS Hostinger, Cloudflare R2, firma electrónica avanzada (FirmaWeb o Sovos — proveedor final a confirmar antes de la Fase 4).
- **Proyecto nuevo desde cero** — no se comparte código, base de datos ni autenticación con el sistema clínico actual de ConectaMente. Sí se reutiliza el sistema de diseño (UX/UI, componentes, tipografía, paleta) de conectamente.cl y conectamente.cl/admin como base visual de ambos desarrollos.
- **Seguridad y datos sensibles no son negociables** en ningún punto del desarrollo, incluso en fases tempranas o de prueba: cifrado en tránsito y en reposo, control de acceso estricto por rol, minimización de datos personales del evaluado.

## Primer paso

Empieza por la **Fase 0** del documento técnico (sección 9): setup del proyecto, extracción del sistema de diseño base de conectamente.cl/admin, y aprovisionamiento del VPS Hostinger (Node.js, PM2, Nginx, SSL, estrategia de backup).

Antes de escribir código, confírmame: acceso al VPS (credenciales, si ya está creado), si el subdominio `core.conectamente.cl` ya apunta al VPS, y qué de la base de código de conectamente.cl/admin tengo disponible para extraer el sistema de diseño (repositorio, o solo capturas/inspección visual).

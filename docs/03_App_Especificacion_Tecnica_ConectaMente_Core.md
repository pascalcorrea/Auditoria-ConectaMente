# ConectaMente Core — Especificación Técnica del MVP

**Para:** desarrollo guiado con Claude Code, por fases.
**Contexto de negocio y criterio de alcance (qué se incluye y por qué):** ver `02_App_MVP_ConectaMente_Core.md`. Este documento es la bajada técnica ejecutable de ese alcance — no repite el razonamiento de negocio, solo lo traduce a arquitectura.

---

## 1. Stack tecnológico recomendado

| Capa | Elección | Por qué |
|---|---|---|
| Framework full-stack | **Next.js (React) + TypeScript** | Un solo framework para frontend y backend (API routes), reduce complejidad para un equipo pequeño. Ecosistema muy grande, bien soportado por herramientas de desarrollo asistido. |
| ORM | **Prisma** | Migraciones tipadas, reduce errores manuales de esquema, buena integración con TypeScript. |
| Autenticación | **NextAuth.js (Auth.js)** o **Clerk** | Auth basada en roles sin construir el sistema desde cero. Clerk es más rápido de implementar si el presupuesto lo permite; NextAuth es gratuito y suficiente para el MVP. |
| Almacenamiento de archivos | **Cloudflare R2** o **AWS S3** | Almacenamiento de PDFs e informes con cifrado en reposo, control de acceso por URL firmada. |
| Video | **Daily.co** (ya definido) | Componentes de UI prediseñados, API de grabación integrada. |
| Generación de PDF | **@react-pdf/renderer** | Genera el informe final desde el formulario estructurado sin depender de un servicio externo. |
| Notificaciones (email) | **Brevo** | Definido por el usuario. Cubre el envío de alertas de plazo (un solo canal, según lo definido en el alcance del MVP). |
| Hosting | **VPS Hostinger** (auto-gestionado) | Definido por el usuario. A diferencia de un hosting serverless (Vercel), esto implica responsabilidad propia sobre: proceso de la app (PM2 o similar), proxy reverso (Nginx), certificado SSL (Let's Encrypt/Certbot), y backups — se incluye como tarea explícita en la Fase 0, no algo que "viene incluido". |
| Base de datos | **PostgreSQL** — evaluar si se auto-hospeda en el mismo VPS o en una instancia separada (recomendado: separada, aunque sea otro VPS pequeño o un Postgres administrado económico, para no mezclar carga de la app con la base de datos y facilitar backups independientes) | Datos fuertemente relacionales (casos, usuarios, organizaciones, informes) — encaja mejor que una base NoSQL. |

**Nota:** si ConectaMente (negocio clínico) ya tiene un stack definido y sistemas reutilizables para base de datos/hosting, esta elección debe revisarse — por ahora se define como VPS propio (ver decisión 6 en sección 12).

---

## 2. Modelo de datos (entidades principales)

```
Usuario
  id, nombre, email, password_hash, rol [cliente|medico|backoffice],
  organizacion_id (nullable, solo para rol=cliente), especialidad (nullable, solo rol=medico),
  activo (boolean), creado_en

Organizacion
  id, nombre, tipo [isapre|compin|empresa|seguro|subcontratista],
  plazo_sla_dias (int) — plazo de entrega contractual de esa organización,
  creado_en

Caso
  id, organizacion_id, medico_id (nullable hasta asignación),
  estado [recibido|en_revision|informe_en_validacion|entregado],
  tipo_licencia (texto libre o catálogo simple),
  fecha_ingreso, fecha_limite (calculada = fecha_ingreso + organizacion.plazo_sla_dias),
  prioridad [normal|urgente],
  creado_en, actualizado_en

Sesion
  id, caso_id, fecha_programada, daily_room_url,
  estado [agendada|en_curso|realizada|incumplida_medico|incumplida_evaluado|reprogramada|cancelada],
  consentimiento_timestamp (nullable hasta que se registre),
  grabacion_url (nullable hasta que termine la sesión),
  medico_hora_conexion (nullable), medico_hora_desconexion (nullable),
  evaluado_hora_conexion (nullable), evaluado_hora_desconexion (nullable),
  duracion_efectiva_segundos (calculada = solape entre ambas ventanas de conexión, no el tiempo total de sala)

Informe
  id, caso_id, archivo_url, generado_en, generado_por (medico_id),
  firma_proveedor [firmaweb|sovos|otro], firma_timestamp, firma_documento_id (referencia del proveedor externo),
  archivo_firmado_url

LogDescarga
  id, informe_id, usuario_id, timestamp
```

**Nota de escala:** el volumen esperado es bajo al inicio, con un techo objetivo de referencia de ~1.000 sesiones mensuales más adelante (~33/día). Esto no cambia ninguna decisión de alcance del MVP, pero sí implica diseñar el esquema con paginación e índices adecuados desde el principio (`Caso.fecha_limite`, `Caso.organizacion_id`, `Caso.estado`) para que el listado de casos no se degrade al crecer.

**Relaciones clave:**
- Una `Organizacion` tiene muchos `Caso`.
- Un `Caso` tiene un `Usuario` (rol médico) asignado, una `Sesion`, y un `Informe`.
- `LogDescarga` registra cada vez que un usuario cliente descarga un `Informe` (trazabilidad exigida en el alcance del MVP).

---

## 3. Roles y permisos

| Acción | Cliente institucional | Médico | Backoffice |
|---|---|---|---|
| Crear caso (individual o carga masiva por Excel) | ❌ | ❌ | ✅ |
| Ver estado de caso | ✅ (solo los suyos) | ✅ (solo los asignados a él) | ✅ (todos) |
| Asignar médico a caso | ❌ | ❌ | ✅ (automático por regla simple, con opción de reasignar manualmente) |
| Unirse a sesión de video | ❌ | ✅ (solo casos asignados) | ❌ |
| Firmar informe (FEA) | ❌ | ✅ (firma personal del médico, no de ConectaMente) | ❌ |
| Descargar informe | ✅ (solo los suyos, queda registrado en LogDescarga) | ✅ (los que él generó) | ✅ (todos) |
| Ver panel de cumplimiento de plazos y de sesiones incumplidas | ❌ | ❌ | ✅ |

---

## 4. Estructura de rutas

```
/login

/cliente
  /cliente/casos                  → listado filtrable por estado (solo lectura)
  /cliente/casos/[id]             → detalle + descarga de informe cuando esté disponible

/medico
  /medico/casos                   → listado de casos asignados, ordenado por fecha_limite
  /medico/casos/[id]              → detalle del caso + formulario estructurado
  /medico/casos/[id]/sesion       → sala de videollamada (Daily.co embebido) + captura de consentimiento
  /medico/casos/[id]/informe      → generación del informe final + firma electrónica avanzada (FEA)

/admin
  /admin/casos                    → vista de todos los casos
  /admin/casos/nuevo              → ingreso individual de un caso
  /admin/casos/importar           → carga masiva vía Excel (ver 5.1)
  /admin/asignacion               → ver/ajustar asignaciones (la asignación ocurre automáticamente al crear el caso — ver 5.2)
  /admin/cumplimiento             → tabla de casos por vencer / vencidos por organización
  /admin/usuarios                 → alta de usuarios (clientes, médicos, backoffice) — CRUD simple
```

---

## 5. Flujos funcionales clave (para construir en orden)

### 5.1 Ingreso de caso (administración/backoffice — no el cliente)

El cliente institucional **no ingresa casos directamente** — solo tiene visibilidad de lectura sobre sus propios casos. El ingreso lo hace siempre el equipo de backoffice, de dos formas:

**Individual** (`/admin/casos/nuevo`): formulario manual, igual al definido originalmente — tipo de licencia, datos del evaluado, organización, antecedentes.

**Carga masiva por Excel** (`/admin/casos/importar`) — este es el flujo esperado como principal, dado que así es como probablemente llegue la información de los clientes:
- Backoffice sube un archivo `.xlsx`/`.csv` con una **plantilla fija definida por ConectaMente** (columnas: RUT evaluado, nombre, organización, tipo de licencia, fecha de emisión de la licencia, prioridad). Para el MVP, si el archivo que envía el cliente viene en un formato distinto, backoffice lo traspasa manualmente a la plantilla antes de subirlo — **no se construye un mapeo de columnas flexible por cliente en el MVP** (eso queda para fase 2 si se confirma que varios clientes mandan formatos muy distintos y el traspaso manual se vuelve un cuello de botella real).
- El sistema valida cada fila (RUT válido, organización existente, campos obligatorios) y muestra una **vista previa con errores marcados por fila** antes de confirmar la importación — no se insertan filas con error silenciosamente.
- Al confirmar, se crean todos los `Caso` válidos de una vez, cada uno con `fecha_limite` calculada automáticamente y **asignación automática de médico** (ver 5.2).
- Librería sugerida: `xlsx` (SheetJS) para lectura del archivo en el backend.

### 5.2 Asignación (automática, simple — no motor de matching complejo)

Al crearse un caso (individual o por Excel), el sistema asigna automáticamente al médico habilitado con **menor cantidad de casos activos en ese momento** (regla simple de "menor carga"), filtrando primero por especialidad si el tipo de caso lo requiere. No hay ponderación de múltiples factores (esto se deja para fase 2 si con datos reales se justifica un motor más sofisticado).
- Backoffice puede **reasignar manualmente** desde `/admin/asignacion` si lo considera necesario (ej. médico de vacaciones, caso urgente).
- Al asignar, estado del caso pasa a `en_revision`.

### 5.3 Sesión de evaluación (médico + evaluado)
- Médico genera sala Daily.co desde el detalle del caso.
- Al crear la sala, se generan **meeting tokens distintos para médico y evaluado**, cada uno con `user_id`/`user_name` propio (ej. `medico_{id}`, `evaluado_{caso_id}`) — esto es lo que permite identificar automáticamente quién es quién en los eventos de conexión, sin intervención manual.
- Antes de habilitar grabación: captura de consentimiento (checkbox + timestamp guardado en `Sesion.consentimiento_timestamp`).
- Al finalizar, la grabación se guarda y su URL queda asociada a la `Sesion`.

### 5.3.1 Máquina de estados de la sesión

```
agendada
   │
   ├─→ en_curso        (al menos una parte se conecta — webhook participant.joined)
   │       │
   │       ├─→ realizada            (ambas partes se conectaron y hubo solape de tiempo)
   │       ├─→ incumplida_medico    (evaluado se conectó, médico nunca — pasado el tiempo de gracia)
   │       └─→ incumplida_evaluado  (médico se conectó, evaluado nunca — pasado el tiempo de gracia)
   │
   ├─→ incumplida_medico     (nadie se conectó del lado médico y pasó el tiempo de gracia sin que el evaluado tampoco entrara — revisar ambos campos)
   ├─→ incumplida_evaluado
   ├─→ reprogramada
   └─→ cancelada
```

### 5.3.2 Captura de telemetría (webhook de Daily.co, automática)

- Se configura un endpoint propio (`/api/webhooks/daily`) suscrito a los eventos `participant.joined` y `participant.left` de Daily.co.
- Cada evento trae `user_id` (el que se definió al generar el token) y el timestamp — con eso se completan `medico_hora_conexion/desconexion` y `evaluado_hora_conexion/desconexion` sin que nadie lo registre a mano.
- `duracion_efectiva_segundos` se calcula al cerrar la sesión: `min(ambas desconexiones) − max(ambas conexiones)`, es decir, el tiempo en que **ambas partes estuvieron conectadas al mismo tiempo** — esto es lo que realmente sirve para detectar, por ejemplo, una sesión "realizada" pero anormalmente corta (posible incumplimiento de calidad, no solo de asistencia).
- Job programado revisa sesiones en estado `agendada`/`en_curso` cuyo tiempo de gracia (ej. 15 min) ya pasó sin conexión de una de las partes, y las transiciona automáticamente a `incumplida_medico` o `incumplida_evaluado` según corresponda.

### 5.3.3 Matriz de notificaciones por transición de estado

| Transición | Destinatarios | Urgencia |
|---|---|---|
| `agendada` (creación) | Médico + evaluado (con link de acceso) | Normal |
| Recordatorio previo (ya definido en 5.6) | Médico + evaluado | Normal |
| → `en_curso` | Sin correo — solo cambio de estado interno, no generar ruido de notificaciones | — |
| → `realizada` | Cliente institucional (aviso de que el informe está en camino) + backoffice | Normal |
| → `incumplida_medico` | Backoffice (inmediato — riesgo directo de incumplir SLA del contrato) | **Alta** |
| → `incumplida_evaluado` | Backoffice + cliente institucional (para que gestionen la reprogramación con el trabajador) | **Alta** |
| → `reprogramada` | Médico + evaluado (con la nueva fecha) | Normal |
| → `cancelada` | Médico + evaluado + backoffice | Normal |

**Nota de diseño:** las transiciones internas (`en_curso`) no generan correo — solo las que requieren que alguien actúe o tenga visibilidad (agendamiento, incumplimiento, resultado final). Notificar cada micro-cambio de estado generaría fatiga de alertas y le restaría urgencia real a los correos de incumplimiento, que son los que más importan.

### 5.4 Generación, firma y entrega de informe
- Médico completa formulario estructurado de evaluación.
- Sistema genera PDF con `@react-pdf/renderer`.
- **Firma electrónica avanzada (FEA):** el médico firma el PDF personalmente (no ConectaMente) desde `/medico/casos/[id]/informe`, vía integración API con un proveedor acreditado (ver evaluación de proveedores — FirmaWeb o Sovos). El PDF firmado queda como el documento final e inmutable — cualquier corrección posterior requiere generar y firmar un nuevo documento, no editar el existente.
- Estado pasa a `informe_en_validacion` → backoffice revisa (paso manual simple, sin flujo de aprobación complejo en el MVP) → estado pasa a `entregado`.

### 5.5 Descarga por el cliente
- Cliente descarga desde `/cliente/casos/[id]`.
- Cada descarga crea un registro en `LogDescarga`.

### 5.6 Alertas de plazo
- Job programado (cron diario) revisa casos con `fecha_limite` a N días de vencer y sin estado `entregado`.
- Envía email al médico asignado y a backoffice vía Brevo.

---

## 6. Firma electrónica de informes

- **Tipo requerido: Firma Electrónica Avanzada (FEA)**, no Firma Electrónica Simple (FES) — dado que estos informes pueden ser cuestionados en sede administrativa (COMPIN, SUSESO) o judicial, se necesita el mayor valor probatorio posible (equivalente a firma manuscrita/notarial bajo la Ley 19.799), no una firma de conveniencia.
- **Firmante: el médico personalmente**, no ConectaMente como empresa — la responsabilidad clínica del informe es del profesional.
- **Proveedores a evaluar (con API para integrar en `/medico/casos/[id]/informe`):**
  - **FirmaWeb** — API REST documentada para FES y FEA, pensada para integrarse como funcionalidad nativa de un SaaS propio. Primera opción a evaluar por facilidad de integración para un equipo pequeño.
  - **Sovos** — integración vía API, verificación de identidad biométrica, acreditada por el Ministerio de Economía. Evaluar si el costo se justifica frente a FirmaWeb.
- **Antes de contratar cualquiera:** confirmar que el proveedor esté efectivamente acreditado como Prestador de Servicios de Certificación ante el Ministerio de Economía — es lo que le da validez legal a la FEA, no basta con el nombre comercial.

---

## 7. Seguridad y datos (no negociable, aplica desde el primer commit)

- Cifrado en tránsito (HTTPS) y en reposo (almacenamiento de archivos cifrado).
- Control de acceso estricto por rol en cada endpoint — un cliente jamás debe poder consultar casos de otra organización, ni un médico casos no asignados a él.
- Cumplimiento Ley 21.719 (protección de datos personales) — minimizar datos almacenados del evaluado a lo estrictamente necesario para el informe.
- `LogDescarga` como registro de auditoría mínimo obligatorio.

---

## 8. Explícitamente fuera del MVP

(Detalle y justificación completa en `02_App_MVP_ConectaMente_Core.md` — resumen técnico aquí, actualizado:)

- Transcripción/borrador de informe por IA.
- Motor de asignación **ponderado por múltiples factores** (especialidad + carga + otros criterios) — el MVP sí incluye asignación automática, pero con una regla simple de "menor carga activa" (ver 5.2), no un algoritmo de matching complejo.
- Mapeo flexible de columnas por cliente en la carga de Excel — el MVP usa una plantilla fija; si el archivo del cliente viene distinto, backoffice lo traspasa manualmente antes de subir.
- Integraciones externas (imed u otros) — el ingreso de caso es manual/por Excel, no por API de terceros.
- App móvil nativa — solo web responsive.
- Certificación CENS del módulo de video.
- Portales diferenciados por segmento de cliente — un solo portal `/cliente` genérico.
- Facturación y registro de credenciales de médicos — proceso manual fuera de la app (planilla).

---

## 9. Plan de construcción por fases (para ejecutar con Claude Code)

**Fase 0 — Setup**
Proyecto nuevo desde cero en infraestructura, datos y autenticación (no se comparte base de datos ni auth con el sistema clínico). **Sí se reutiliza el UX/UI y la estructura base de conectamente.cl/admin** — extraer/replicar el sistema de diseño (componentes, tipografía, paleta, layout de navegación) como punto de partida del proyecto nuevo, en vez de diseñar desde cero. Inicializar proyecto Next.js + TypeScript en `core.conectamente.cl`, configurar Prisma + PostgreSQL, configurar autenticación con roles. Aprovisionar VPS Hostinger: Node.js runtime, gestor de procesos (PM2), Nginx como proxy reverso, certificado SSL (Certbot), y definir estrategia de backup de la base de datos (esto no viene incluido automáticamente como en un hosting serverless — debe quedar resuelto antes de pasar a producción). Deploy inicial y verificación end-to-end.

**Fase 1 — Modelo de datos y CRUD base**
Implementar esquema Prisma completo (sección 2), migraciones, seed de datos de prueba (organizaciones, usuarios de cada rol).

**Fase 2 — Portal cliente (solo lectura) + ingreso de casos por administración**
Rutas `/cliente/*` (listado filtrable de solo lectura + detalle). Rutas `/admin/casos/nuevo` (ingreso individual) y `/admin/casos/importar` (carga masiva por Excel con `xlsx`/SheetJS, validación por fila, vista previa de errores antes de confirmar). Lógica de asignación automática por "menor carga activa" al crear cada caso.

**Fase 3 — Portal médico + video**
Rutas `/medico/*`, integración Daily.co (sala + grabación) con meeting tokens diferenciados por rol, endpoint de webhook para capturar eventos de conexión/desconexión, máquina de estados de sesión con transición automática por tiempo de gracia, captura de consentimiento, formulario estructurado de evaluación, generación de PDF.

**Fase 4 — Firma electrónica y backoffice**
Integración con proveedor de FEA (FirmaWeb o Sovos) en `/medico/casos/[id]/informe`. Rutas `/admin/asignacion` (ajuste manual), `/admin/cumplimiento` (plazos y sesiones incumplidas), `/admin/usuarios`.

**Fase 5 — Notificaciones**
Job de alertas de plazo (Brevo), notificación de entrega de informe al cliente, matriz completa de notificaciones por transición de estado de sesión (sección 5.3.3).

**Fase 6 — Endurecimiento**
Revisión de permisos por rol en cada endpoint, pruebas de flujo completo caso-a-caso, revisión de manejo de datos sensibles.

---

## 10. Variables de entorno esperadas

```
DATABASE_URL=
NEXTAUTH_SECRET=
DAILY_API_KEY=
BREVO_API_KEY=
FIRMA_ELECTRONICA_API_KEY=
STORAGE_BUCKET_URL=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
```

**Nota sobre almacenamiento de archivos:** aunque la app viva en el VPS de Hostinger, se recomienda mantener el almacenamiento de PDFs/grabaciones en un servicio de object storage externo (Cloudflare R2 o S3) en vez de guardarlos en el disco del VPS — evita perder archivos si el VPS falla y separa esa responsabilidad de backup.

---

## 11. Documentación de referencia por tecnología

Links a documentación oficial para que Claude Code los tenga como contexto directo al construir cada pieza — mejor pasarlos explícitamente que asumir que ya los conoce bien, sobre todo para las integraciones más específicas (Daily.co webhooks, firma electrónica).

| Tecnología | Qué documentar | Por qué es importante pasarlo explícitamente |
|---|---|---|
| Next.js + TypeScript | docs.nextjs.org (App Router, API routes) | Base de todo el proyecto — asegura que se use el patrón actual (App Router), no el antiguo Pages Router |
| Prisma | prisma.io/docs | Esquema, migraciones y queries — evita errores de sintaxis en el ORM |
| NextAuth.js (Auth.js) | authjs.dev | Configuración de roles y sesiones — es la pieza más propensa a errores de seguridad si se hace mal |
| Daily.co | docs.daily.co — específicamente **REST API de rooms/meeting tokens** y **Webhooks (participant.joined/left)** | Es la integración más específica del proyecto (sección 5.3.2) — sin la doc exacta de webhooks, es fácil implementar mal la captura de eventos |
| Brevo | developers.brevo.com | API de envío transaccional (no la de campañas de marketing, que es otro producto dentro de Brevo) |
| Cloudflare R2 | developers.cloudflare.com/r2 | Configuración de bucket, credenciales S3-compatibles, políticas de acceso |
| xlsx (SheetJS) | docs.sheetjs.com | Lectura del archivo de carga masiva (sección 5.1) — la librería tiene varias formas de leer un archivo, importa usar la recomendada para Node.js/servidor |
| @react-pdf/renderer | react-pdf.org | Generación del informe en PDF |
| Proveedor de firma electrónica (FirmaWeb o Sovos, según cuál se elija) | Documentación de API del proveedor elegido | Se define recién cuando se cierre la cotización — no hay documentación pública genérica que sirva mientras tanto |
| PM2 | pm2.keymetrics.io | Gestión de procesos en el VPS Hostinger |
| Nginx | nginx.org/en/docs | Configuración de proxy reverso |
| Certbot | certbot.eff.org | Emisión y renovación automática de SSL |

**Recomendación práctica:** antes de empezar cada fase del plan de construcción (sección 9), pasarle a Claude Code el link de documentación correspondiente a esa fase específica, en vez de todos de una vez al inicio — reduce la carga de contexto y mantiene la documentación relevante al trabajo que se está haciendo en ese momento.

---

## 12. Decisiones ya resueltas (contexto para Claude Code)

1. **Volumen esperado:** bajo al inicio; techo de referencia ~1.000 sesiones mensuales más adelante. No cambia el alcance del MVP, pero sí exige buena indexación desde el esquema inicial (ver nota de escala en sección 2).
2. **Base reutilizable de ConectaMente:** se reutiliza el **UX/UI y la estructura base** del sitio (conectamente.cl) y del admin (conectamente.cl/admin) — sistema de diseño, componentes, tipografía, paleta y patrones de navegación, para mantener consistencia visual de marca. No implica necesariamente compartir base de datos ni autenticación con el sistema clínico (ver Fase 0 actualizada).
3. **Experiencia del desarrollador:** ya tiene experiencia previa con Next.js/TypeScript (construyó el admin de ConectaMente) — el stack elegido está alineado con lo que ya domina, no hay curva de aprendizaje adicional por esta elección.
4. **Primera organización cliente:** aún no está definida. La Fase 1 debe avanzar con datos de prueba (seed) sin bloquearse esperando el cliente real; el onboarding de la primera organización real puede ocurrir en paralelo o después del MVP funcional.
5. **Plazo de lanzamiento:** no hay fecha fija — las 6 fases pueden ejecutarse secuencialmente sin presión de comprimir el cronograma.
6. **Dominio:** se usan subdominios de conectamente.cl — `auditoria.conectamente.cl` para el sitio institucional (doc 01) y `core.conectamente.cl` para la plataforma operativa (este documento). Nota de negocio a tener presente: esto mantiene la marca raíz "ConectaMente" visible en la URL — si la separación de marca frente al negocio clínico (para evitar percepción de conflicto de interés, discutida en la investigación de mercado) se vuelve un tema sensible con clientes institucionales grandes, es más fácil migrar de subdominio a dominio propio ahora que más adelante.

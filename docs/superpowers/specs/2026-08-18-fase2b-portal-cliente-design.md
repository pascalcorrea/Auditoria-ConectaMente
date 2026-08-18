# ConectaMente Core — Fase 2b: Portal cliente (solo lectura) (diseño)

**Fecha:** 2026-08-18
**Contexto:** segunda mitad de Fase 2 (doc `03_App_Especificacion_Tecnica_ConectaMente_Core.md` §9).
Fase 2a (ingreso de casos + asignación automática) está completa y en
producción — ya existe una forma real de crear `Caso`s. Este spec cubre
la parte de solo lectura para el cliente institucional.

## Alcance

`/cliente/casos` (listado filtrable por estado, solo de la organización
del usuario logueado), `/cliente/casos/[id]` (detalle + descarga de
informe cuando corresponda), un endpoint de descarga que registra cada
descarga en `LogDescarga`, extensión de la sesión de NextAuth con
`organizacionId`, y datos de seed con un caso de ejemplo por
organización.

## Decisiones resueltas con el usuario antes de este diseño

- **Mecanismo de descarga:** endpoint de servidor (no un `<a href>`
  directo al archivo) — doc 03 §5.5 exige que "cada descarga crea un
  registro en `LogDescarga`", y un link directo no permite interceptar el
  clic del lado servidor de forma confiable para loguearlo.
- **Cuándo mostrar la descarga:** solo cuando `Caso.estado === 'entregado'`,
  no apenas `Informe.archivoFirmadoUrl` existe. El modelo de estados
  (doc 03 §5.4) tiene un paso intermedio donde el médico ya firmó pero
  backoffice todavía no completó su revisión interna
  (`informe_en_validacion`) — el cliente institucional no debe ver el
  informe hasta que ese paso interno termine y el caso pase a
  `entregado`, que es explícitamente el estado que doc 02 llama "informe
  final".
- **Datos de prueba:** sí, se agrega un `Caso` de ejemplo por
  organización sembrada en Fase 1, en estado `entregado`, con su
  `Informe` correspondiente — porque ninguna fase construida hasta ahora
  (Fase 3/4 son video y firma electrónica) crea filas de `Informe`, y sin
  esto el portal no tendría nada real que mostrar hasta que esas fases
  existan.

## Vacío técnico encontrado (no es una decisión de alcance, es una extensión necesaria)

La sesión de NextAuth configurada en Fase 0 (`lib/auth.ts`,
`types/next-auth.d.ts`) solo propaga `id`, `email`, `name`, y `rol` al
JWT/sesión — pese a que `Usuario.organizacionId` existe desde Fase 1.
Sin `organizacionId` en la sesión, no hay forma de que las queries de
`/cliente/*` sepan de qué organización filtrar. Este spec extiende el
mismo mecanismo que Fase 0 ya usa para `rol` (callback `jwt` guarda el
campo en el token, callback `session` lo expone en `session.user`).

## RBAC en dos capas

1. **A nivel de ruta:** `middleware.ts` (Fase 0) ya exige `rol: cliente`
   para cualquier ruta bajo `/cliente/*` — sin cambios.
2. **A nivel de fila:** cada query en las páginas de este spec filtra
   explícitamente por `organizacionId === session.user.organizacionId`.
   Si un usuario cliente intenta acceder a `/cliente/casos/[id]` de un
   caso que pertenece a otra organización, la respuesta es **404** (no
   403) — doc 03 §7 exige que "un cliente jamás debe poder consultar
   casos de otra organización"; un 404 no confirma que el caso exista,
   un 403 sí lo haría.

## Esquema

**Sin cambios de esquema.** `Caso`, `Informe`, `LogDescarga`, y
`Usuario.organizacionId` ya existen desde Fase 1 — este spec es
puramente de lectura sobre datos que ya tienen dónde vivir.

## Extensión de autenticación

`lib/auth.ts`:
- `authorize()`: el objeto retornado por `CredentialsProvider` incluye
  `organizacionId: usuario.organizacionId`.
- Callback `jwt`: `token.organizacionId = user.organizacionId` (mismo
  patrón que ya existe para `token.rol`).
- Callback `session`: `session.user.organizacionId = token.organizacionId`.

`types/next-auth.d.ts`: se agrega `organizacionId?: string | null` a
`Session.user` y a `JWT` — nullable porque `medico`/`backoffice` no
tienen organización (Fase 1, `Usuario.organizacionId` es opcional).

## Rutas

### `/cliente/casos`

Server component. Query: `prisma.caso.findMany({ where: { organizacionId:
session.user.organizacionId, ...(estadoFiltro && { estado: estadoFiltro
}) } })`. El filtro por estado se lee de `searchParams` (`?estado=entregado`),
sin JavaScript de cliente necesario — es un `<select>` dentro de un
`<form>` con `method="get"` que recarga la página con el query param, o
un conjunto de links con el query param ya armado (ambas opciones son
igual de simples; se decide en el plan de implementación cuál es más
directa de construir con los componentes UI existentes). Columnas:
evaluado (nombre + RUT — el cliente institucional ya conoce a sus propios
evaluados, son quienes originaron el caso a través de backoffice, no es
información nueva para ellos), estado, prioridad, fecha límite.

### `/cliente/casos/[id]`

Server component. Busca el `Caso` por `id` con `include: { organizacion:
true, informe: true }`. Si no existe, o
`caso.organizacionId !== session.user.organizacionId`, `notFound()` (next/navigation) →
404. Muestra evaluado, tipo de licencia, estado, prioridad, fechas. Si
`caso.estado === 'entregado' && caso.informe`, muestra un botón/link que
apunta al endpoint de descarga (sección siguiente) — en cualquier otro
caso, un mensaje indicando que el informe aún no está disponible.

## Endpoint de descarga

`GET /api/cliente/casos/[id]/descargar` — fuera del `matcher` de
`middleware.ts` (que solo cubre `/cliente/:path*`, no `/api/cliente/*`,
mismo vacío que Fase 2a ya identificó y resolvió para `/api/admin/*`),
así que este endpoint valida la sesión inline al inicio, igual que los
endpoints de Fase 2a.

Lógica:
1. `getServerSession` — si no hay sesión o `rol !== 'cliente'`, 403.
2. Busca el `Caso` por `id` con `include: { organizacion: true, informe:
   true }`.
3. Si no existe, o `organizacionId` no coincide con la sesión, o
   `estado !== 'entregado'`, o no hay `informe`/`archivoFirmadoUrl` →
   404 (mismo criterio que la página de detalle — no distinguir "no
   existe" de "no te pertenece" de "no está listo" en la respuesta).
4. Crea `LogDescarga { informeId: caso.informe.id, usuarioId:
   session.user.id }`.
5. `NextResponse.redirect(caso.informe.archivoFirmadoUrl)`.

No hay integración de almacenamiento de archivos real todavía (Cloudflare
R2/S3 es Fase 3/4 per doc 03 §10) — `archivoFirmadoUrl` es hoy un string
cualquiera que se haya guardado en `Informe`; el endpoint solo redirige a
esa URL tal cual, sin generar URLs firmadas ni servir el archivo él
mismo. Este spec no construye almacenamiento, solo el flujo de acceso y
auditoría alrededor de donde sea que el archivo termine viviendo.

## Seed (extiende `prisma/seed.ts`)

Por cada organización sembrada (`isapre`, `empresa`), un `Caso` adicional:
- `estado: 'entregado'`, con datos de evaluado de ejemplo distintos por
  organización.
- `medicoId`: alguno de los dos médicos ya sembrados.
- `fechaIngreso`/`fechaLimite` coherentes con un caso ya cerrado (fecha
  límite en el pasado).
- Un `Informe` asociado con `archivoFirmadoUrl` apuntando a un valor de
  placeholder (no un archivo real, ya que no hay storage integrado) y
  `firmaProveedor` cualquiera de los tres valores del enum.

No se agrega ningún `LogDescarga` en el seed — esos registros solo deben
existir cuando alguien realmente pasa por el endpoint de descarga, no
como dato precargado.

## Testing

Mismo patrón de integración contra la base de datos real (Fases 0-2a):
- Query de listado: confirma que solo trae casos de la organización del
  usuario (crea casos en dos organizaciones distintas, verifica
  aislamiento).
- Filtro por estado: confirma que el filtro reduce correctamente el
  conjunto.
- Endpoint de descarga: caso de la propia organización + estado
  `entregado` + informe existente → 302/redirect y una fila nueva en
  `LogDescarga`; caso de otra organización → 404; caso propio pero no
  `entregado` → 404 sin crear `LogDescarga`.
- Extensión de auth: test de que el callback `jwt`/`session` propaga
  `organizacionId` correctamente (puede probarse llamando los callbacks
  directamente, sin necesidad de un flujo HTTP completo).

## Fuera de alcance (explícito)

- Cualquier lógica de `Sesion` (video, consentimiento) — Fase 3, y de
  todas formas el cliente institucional no participa en la
  videollamada (es el médico y el evaluado quienes lo hacen, doc 02).
- Generación o firma de `Informe` — Fase 3/4; este spec solo lee filas
  de `Informe` que ya existan (por seed o, más adelante, por Fase 4).
- Almacenamiento real de archivos (Cloudflare R2/S3) — Fase 3/4 per doc
  03 §10; el endpoint de descarga redirige a lo que sea que
  `archivoFirmadoUrl` contenga, sin generar ni validar esa URL.
- Paginación en `/cliente/casos` — mismo criterio YAGNI que Fase 2a con
  `/admin/casos`, se agrega cuando el volumen lo justifique.

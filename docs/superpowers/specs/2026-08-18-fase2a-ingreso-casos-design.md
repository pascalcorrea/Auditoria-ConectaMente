# ConectaMente Core — Fase 2a: Ingreso de casos + asignación automática (diseño)

**Fecha:** 2026-08-18
**Contexto:** primera mitad de Fase 2 (doc `03_App_Especificacion_Tecnica_ConectaMente_Core.md` §9). La segunda
mitad — portal cliente de solo lectura (`/cliente/*`) — es un spec/plan
separado, construido después de este, porque necesita `Caso`s reales para
probar contra algo más que datos de seed.

## Decisiones resueltas con el usuario antes de este diseño

- **Contradicción doc 02 vs doc 03 sobre asignación:** doc 02 (scope de
  negocio) dice que el motor de asignación automática está fuera del MVP
  ("asignación manual... apoyada por una vista de carga de trabajo, no
  motor automático"); doc 03 §5.2 dice que Fase 2 sí incluye asignación
  automática por "menor carga activa". Resuelto: **ambas** — el sistema
  asigna automáticamente al crear el caso (comportamiento por defecto, per
  doc 03), y existe una vista de reasignación manual con carga de trabajo
  por médico visible (per doc 02). Esto es consistente con lo que doc 03
  §5.2 ya preveía: "Backoffice puede reasignar manualmente... si lo
  considera necesario."
- **Filtro por especialidad en la asignación:** doc 03 §5.2 dice que se
  debería filtrar primero por especialidad "si el tipo de caso lo
  requiere", pero no existe ningún catálogo que conecte `Caso.tipoLicencia`
  (texto libre, decisión de Fase 1) con qué `Usuario.especialidad` se
  necesita. Resuelto: Fase 2a asigna solo por menor carga activa, sin
  filtro por especialidad. Se agrega un catálogo tipoLicencia→especialidad
  en una fase posterior si datos reales confirman que hace falta.
- **Campos del formulario individual:** doc 03 §5.1 solo dice "tipo de
  licencia, datos del evaluado, organización, antecedentes" sin
  itemizar. Resuelto: los mismos campos que ya exige la plantilla Excel
  (RUT, nombre, organización, tipo de licencia, fecha de emisión,
  prioridad) — nada de "antecedentes" como campo libre adicional, para que
  ambos caminos de ingreso (individual y Excel) pidan exactamente lo mismo
  y generen el mismo tipo de `Caso`.

## Vacío de esquema encontrado (no es una decisión de alcance, es un bug de Fase 1)

El modelo `Caso` de Fase 1 — y el propio doc 03 §2 — no tiene ningún campo
para identificar al evaluado. Ni RUT ni nombre existen en el esquema, pese
a que tanto el formulario individual como la plantilla Excel de doc 03 §5.1
los piden explícitamente como datos de entrada. Tampoco existe
`fechaEmisionLicencia` (la fecha en que se emitió la licencia médica en
papel) — es un dato distinto de `fechaIngreso` (cuándo el caso entra al
sistema de ConectaMente), y doc 03 §5.1 lo lista como columna separada de
la plantilla.

Este spec agrega los tres campos faltantes a `Caso` vía una migración
nueva (ver sección Esquema). Es una extensión del modelo existente, no un
rediseño — todos los campos, enums, e índices de Fase 1 quedan intactos.

## Esquema

Modificación de `prisma/schema.prisma`, agregando a `model Caso`:

```
rutEvaluado           String
nombreEvaluado        String
fechaEmisionLicencia  DateTime
```

Sin cambios en las relaciones, enums, ni índices existentes de Fase 1.
`fechaLimite` sigue siendo un campo `DateTime` normal en el esquema (Fase 1
ya lo definió) — lo que cambia en Fase 2a es que ahora hay código que lo
calcula (`fechaIngreso + organizacion.plazoSlaDias` días) en vez de
dejarlo sin poblar como en Fase 1.

**RUT almacenado como `String`, no validado a nivel de esquema:** el
formato chileno de RUT (con o sin puntos, con guión antes del dígito
verificador) varía según cómo lo escriba quien lo tipeó o cómo venga en
un Excel. La validación (formato + dígito verificador) ocurre en código de
aplicación (`lib/rut.ts`, ver sección Lógica compartida) antes de guardar,
no en una constraint de base de datos — Postgres no tiene un tipo nativo
para esto y una CHECK constraint con la lógica del dígito verificador sería
mucho más frágil de mantener que una función TypeScript testeada.

## Lógica compartida (`lib/`)

### `lib/rut.ts` — validación de RUT chileno

Dos funciones:
- `normalizeRut(rut: string): string` — quita puntos y espacios, pone el
  dígito verificador en mayúscula (para el caso `K`), retorna formato
  `12345678-9`.
- `isValidRut(rut: string): boolean` — normaliza y valida el dígito
  verificador con el algoritmo módulo 11 estándar chileno.

El RUT se guarda normalizado (`rutEvaluado`) para que búsquedas/comparaciones
futuras no tengan que lidiar con variantes de formato.

### `lib/fecha-limite.ts` — cálculo de plazo

`calcularFechaLimite(fechaIngreso: Date, plazoSlaDias: number): Date` —
suma `plazoSlaDias` días a `fechaIngreso`. Función pura, sin acceso a base
de datos — quien la llama ya tiene ambos valores (el flujo de creación de
caso ya cargó la `Organizacion` para obtener `plazoSlaDias`).

### `lib/asignacion.ts` — asignación automática

`asignarMedico(): Promise<string | null>` — consulta todos los `Usuario`
con `rol: 'medico'` y `activo: true`, cuenta para cada uno sus `Caso` en
estado `recibido`, `en_revision`, o `informe_en_validacion` (no
`entregado` — un caso entregado ya no consume tiempo del médico), y
retorna el `id` del médico con menor conteo. **Desempate:** si dos o más
médicos tienen el mismo conteo mínimo, se elige el de `creadoEn` más
antiguo (el médico con más antigüedad en el sistema) — determinístico y
sin necesidad de un campo nuevo. Si no hay ningún médico activo, retorna
`null` y el caso se crea con `medicoId: null` (igual que el estado
"nullable hasta asignación" que Fase 1 ya modeló) — no es un error, solo
significa que backoffice tendrá que asignar manualmente después desde
`/admin/asignacion`.

### `lib/excel-import.ts` — parseo y validación de la plantilla Excel

Usa la librería `xlsx` (SheetJS), agregada como dependencia nueva —
ninguna fase anterior la había necesitado. `parseCasosExcel(buffer:
ArrayBuffer): FilaImportacion[]` lee la primera hoja, mapea columnas por
nombre de encabezado (no por posición — más tolerante a que alguien
reordene columnas) a: `rut`, `nombre`, `organizacion` (nombre de texto, se
resuelve a `organizacionId` por match exacto contra `Organizacion.nombre`),
`tipoLicencia`, `fechaEmision`, `prioridad`.

Cada fila se valida independientemente y el resultado es:

```typescript
type FilaImportacion = {
  numeroFila: number
  datos: { rut: string; nombre: string; organizacion: string; tipoLicencia: string; fechaEmision: string; prioridad: string }
  errores: string[]  // vacío si la fila es válida
}
```

Errores posibles por fila: RUT inválido, nombre vacío, organización que no
existe (comparación exacta de nombre contra la tabla `Organizacion`),
tipoLicencia vacío, fechaEmision no parseable como fecha, prioridad fuera
de `normal`/`urgente`. La función solo parsea y valida — no toca la base
de datos ni crea nada; eso lo hace el endpoint que la llama, después de
que backoffice confirma la vista previa.

## Rutas y UI

Todas bajo `/admin/*`, ya protegidas por `middleware.ts`/`lib/route-access.ts`
de Fase 0 (requieren `rol: backoffice`) — sin cambios necesarios ahí.

### `/admin/casos` (nueva)

Listado simple, server component: tabla con evaluado (nombre + RUT),
organización, médico asignado (o "Sin asignar"), estado, prioridad, fecha
límite. Sin filtros ni paginación en Fase 2a (YAGNI — con el volumen bajo
de doc 03 §12 decisión 1, y sin usuarios reales todavía, una tabla simple
alcanza; paginación se agrega cuando el volumen lo justifique). Existe
para poder verificar visualmente que el ingreso funcionó, y como base para
`/admin/asignacion`.

### `/admin/casos/nuevo` (nueva)

Formulario cliente (`'use client'`) reusando `Input`/`Select`/`Button` de
Fase 0: RUT, nombre evaluado, organización (`Select` poblado desde
`Organizacion`, pasado como prop desde el server component padre),
tipoLicencia, fecha de emisión, prioridad (`Select` normal/urgente). Al
enviar: server action que valida RUT, calcula `fechaLimite`, llama
`asignarMedico()`, crea el `Caso`, y redirige a `/admin/casos`.

### `/admin/casos/importar` (nueva)

Dos pasos en una sola página (`'use client'` con estado local):
1. **Subir archivo:** input de tipo `file`, acepta `.xlsx`/`.csv`. Al
   seleccionar, se envía a un endpoint (`POST /api/admin/casos/importar/preview`)
   que llama `parseCasosExcel` y retorna el arreglo de `FilaImportacion`.
2. **Vista previa:** tabla mostrando cada fila con sus datos y, si tiene
   errores, resaltada y con la lista de errores visible junto a la fila
   (doc 03 §5.1: "vista previa con errores marcados por fila"). Botón
   "Confirmar importación" — habilitado siempre que haya al menos una fila
   válida — que llama `POST /api/admin/casos/importar/confirmar` con las
   filas válidas (identificadas por `numeroFila`), creando un `Caso` por
   cada una (mismo flujo de cálculo de `fechaLimite` + asignación
   automática que el ingreso individual). Filas con error nunca se
   insertan, ni siquiera parcialmente (doc 03 §5.1: "no se insertan filas
   con error silenciosamente").

### `/admin/asignacion` (nueva)

Doc 03 §9 la ubica en Fase 4, pero la decisión de este spec de tener
asignación automática *y* manual la trae a Fase 2a — sin esta vista, la
opción manual no existiría. Server component: para cada médico activo,
nombre + conteo de casos activos (mismo criterio de "activo" que
`asignarMedico()`); debajo, tabla de todos los `Caso` cuyo `estado` no sea
`entregado` (con o sin médico ya asignado — incluye los que
`asignarMedico()` dejó en `null` por falta de médicos activos al
crearse), cada uno con un selector para asignar/reasignar (`Select` de
médicos) — al cambiar, server action que actualiza `Caso.medicoId`
directamente (no vuelve a correr el algoritmo automático, es una
sobreescritura manual explícita).

## Testing

Sigue el patrón de integración contra base de datos real (sin mocks) de
Fases 0-1:

- `lib/rut.test.ts` — casos válidos e inválidos conocidos (incluye un RUT
  con dígito verificador `K`), formatos con/sin puntos.
- `lib/fecha-limite.test.ts` — función pura, casos simples.
- `lib/asignacion.test.ts` — crea médicos con distintas cargas activas
  (incluyendo casos en estado `entregado`, que no deben contar), confirma
  que se elige el de menor carga; caso de empate confirma el criterio de
  desempate por antigüedad; caso sin médicos activos confirma que retorna
  `null`.
- `lib/excel-import.test.ts` — parsea un buffer construido en memoria (no
  un archivo fijo en disco) con filas válidas e inválidas mezcladas,
  confirma que cada fila reporta los errores esperados y que las válidas
  no tienen errores.
- Tests de componente (Testing Library, patrón de `Button`/`Input`/`Select`
  de Fase 0) para el formulario de `/admin/casos/nuevo`: render de todos
  los campos, envío deshabilitado o con error si el RUT es inválido antes
  de enviar (validación en cliente además de servidor, para feedback
  inmediato).

No se agregan tests end-to-end de navegador (Playwright/Cypress) — fuera
del patrón de testing ya establecido en este proyecto, que usa Vitest +
Testing Library para componentes e integración directa contra Postgres
para lógica de datos.

## Fuera de alcance (explícito)

- Portal cliente (`/cliente/*`) — spec/plan separado, después de este.
- Filtro de asignación por especialidad — sin catálogo tipoLicencia→especialidad todavía.
- Paginación/filtros en `/admin/casos` — se agrega cuando el volumen lo justifique.
- Mapeo flexible de columnas Excel por cliente — doc 03 §5.1 ya lo excluye explícitamente del MVP; se usa la plantilla fija.
- Cualquier lógica de `Sesion`, `Informe`, video, firma electrónica — Fase 3/4.
- `/admin/cumplimiento`, `/admin/usuarios` — Fase 4 per doc 03 §9 (no afectados por traer `/admin/asignacion` a esta fase).

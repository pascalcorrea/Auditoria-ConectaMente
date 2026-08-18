# ConectaMente Core — Fase 1: Modelo de datos y CRUD base (diseño)

**Fecha:** 2026-08-18
**Contexto:** segunda fase del plan de construcción del doc
`03_App_Especificacion_Tecnica_ConectaMente_Core.md` §9. Fase 0 (setup, auth,
deploy) está completa y en producción en `https://app.conectamente.cl`.

## Alcance

Solo modelo de datos: esquema Prisma completo (doc 03 §2), una migración, y
un script de seed con datos de prueba mínimos. **No incluye rutas ni UI**
— aunque el título de la fase en doc 03 §9 dice "CRUD base", la descripción
de esa misma sección solo menciona "esquema Prisma completo, migraciones,
seed de datos de prueba". Las rutas CRUD reales (`/admin/casos/nuevo`,
`/cliente/*`, lógica de asignación) están explícitamente en Fase 2. Confirmado
con el usuario antes de diseñar esta fase.

Tampoco incluye lógica de negocio como código (cálculo de `fechaLimite`,
asignación automática por "menor carga") — eso vive en Fase 2 según doc 03 §9.
Fase 1 solo deja la estructura de datos lista para que esa lógica se
construya encima.

## Esquema

Todos los campos en camelCase (TypeScript/Prisma), no snake_case — sigue la
convención ya establecida por el modelo `Usuario` de Fase 0, aunque el
pseudocódigo del doc 03 §2 use snake_case.

### Usuario (extensión del modelo de Fase 0)

Se agregan dos campos nullable al modelo existente:
- `organizacionId String?` — FK a `Organizacion`. Solo tiene sentido cuando
  `rol = cliente`.
- `especialidad String?` — solo tiene sentido cuando `rol = medico`.

No se agrega un CHECK constraint que fuerce esa relación condicional
(rol↔campo) a nivel de base de datos — Postgres/Prisma no modelan bien
nullability condicional, y validarlo es responsabilidad de la capa de
aplicación que en Fase 1 todavía no existe (los formularios que escriben
estos campos llegan en Fase 2/4).

### Organizacion (nueva)

```
id            String   @id @default(cuid())
nombre        String
tipo          TipoOrganizacion  (enum: isapre | compin | empresa | seguro | subcontratista)
plazoSlaDias  Int
creadoEn      DateTime @default(now())
```

### Caso (nueva)

```
id             String   @id @default(cuid())
organizacionId String   (FK -> Organizacion, onDelete: Restrict)
medicoId       String?  (FK -> Usuario, onDelete: Restrict, nullable hasta asignación)
estado         EstadoCaso  (enum: recibido | en_revision | informe_en_validacion | entregado)
tipoLicencia   String   (texto libre — ver nota abajo)
fechaIngreso   DateTime
fechaLimite    DateTime
prioridad      PrioridadCaso  (enum: normal | urgente)
creadoEn       DateTime @default(now())
actualizadoEn  DateTime @updatedAt
```

Índices: `@@index([fechaLimite])`, `@@index([organizacionId])`,
`@@index([estado])` — explícitamente pedidos en doc 03 §2 ("Nota de escala")
para que el listado de casos no se degrade al crecer.

**`tipoLicencia` como `String` libre, no enum:** doc 03 §2 lo describe como
"texto libre o catálogo simple" (ambiguo). Se elige texto libre porque (a) es
la opción más simple, (b) ninguna fase del plan de construcción (§9, Fases
1-6) menciona un catálogo controlado de tipos de licencia como requisito, y
(c) convertirlo a enum más adelante es un cambio de schema aislado si se
necesita.

**`fechaLimite` no se calcula en Fase 1:** doc 03 §2 dice que se calcula
como `fechaIngreso + organizacion.plazoSlaDias`, pero ese cálculo es lógica
de aplicación (vive en el flujo de ingreso de caso, Fase 2 §5.1). En Fase 1
el campo existe en el schema pero no hay código que lo derive. En la práctica
no importa para el seed de Fase 1, que no siembra ningún `Caso` (ver sección
Seed).

### Sesion (nueva)

```
id                          String    @id @default(cuid())
casoId                      String    @unique (FK -> Caso, onDelete: Restrict)
fechaProgramada             DateTime
dailyRoomUrl                String?
estado                      EstadoSesion  (enum: agendada | en_curso | realizada | incumplida_medico | incumplida_evaluado | reprogramada | cancelada)
consentimientoTimestamp     DateTime?
grabacionUrl                String?
medicoHoraConexion          DateTime?
medicoHoraDesconexion       DateTime?
evaluadoHoraConexion        DateTime?
evaluadoHoraDesconexion     DateTime?
duracionEfectivaSegundos    Int?
```

**`casoId` es `@unique` (una Sesion por Caso, no una relación 1-a-muchos):**
doc 03 §5.3.1 modela `reprogramada` como una transición de estado dentro de
la misma sesión (se actualiza `fechaProgramada`, no se crea una fila nueva).
Nada en el documento sugiere reintentos como filas separadas. Si en una fase
posterior se necesita historial de reprogramaciones, ese es un cambio de
diseño explícito a evaluar entonces, no algo que Fase 1 deba anticipar.

### Informe (nueva)

```
id                String   @id @default(cuid())
casoId            String   @unique (FK -> Caso, onDelete: Restrict)
archivoUrl        String
generadoEn        DateTime @default(now())
generadoPor       String   (FK -> Usuario/medico, onDelete: Restrict)
firmaProveedor    FirmaProveedor  (enum: firmaweb | sovos | otro)
firmaTimestamp    DateTime?
firmaDocumentoId  String?
archivoFirmadoUrl String?
```

`casoId @unique` por la misma razón que Sesion — doc 03 §5.4 dice
explícitamente que una corrección posterior "requiere generar y firmar un
nuevo documento, no editar el existente", lo cual en este modelo significaría
un nuevo `Informe`, no una fila reutilizada. Fase 1 no resuelve ese caso (no
hay lógica de "nueva versión" todavía) — se deja como estructura simple
1-a-1 y se revisita si Fase 4 (firma electrónica) lo requiere.

### LogDescarga (nueva)

```
id         String   @id @default(cuid())
informeId  String   (FK -> Informe, onDelete: Restrict)
usuarioId  String   (FK -> Usuario, onDelete: Restrict)
timestamp  DateTime @default(now())
```

Solo inserciones — registro de auditoría, doc 03 §7.

### Borrado en cascada

`onDelete: Restrict` en **todas** las relaciones, incluyendo `Caso.medicoId`
pese a ser nullable (nullable solo porque el caso puede no tener médico
asignado aún, no como señal de que su borrado deba propagar). Son registros
de auditoría/cumplimiento bajo Ley 21.719 (doc 03 §7) — nada debe poder
desaparecer en cascada por un borrado accidental de una `Organizacion` o
`Usuario`. Ninguna fase hasta ahora (0-6) incluye una función de borrado en
la UI, así que esto no bloquea nada — es una postura conservadora por
defecto.

## Seed (extiende `prisma/seed.ts` de Fase 0)

Mantiene el usuario `backoffice@conectamente.cl` ya sembrado en Fase 0, y
agrega (todo vía `upsert`, mismo patrón idempotente):

- 2 `Organizacion`: una `tipo: isapre`, una `tipo: empresa` — cubre dos de
  los cinco valores del enum sin sobre-construir; suficiente para probar la
  FK y el enum.
- 2 `Usuario` con `rol: medico`, cada uno con `especialidad` distinta — para
  que la lógica de "menor carga" de Fase 2 tenga algo que diferenciar
  cuando se construya.
- 2 `Usuario` con `rol: cliente`, uno por cada `Organizacion` sembrada
  (`organizacionId` seteado).
- Ningún `Caso`/`Sesion`/`Informe`/`LogDescarga` sembrado — decisión
  explícita del usuario (opción "mínimo" sobre "seed más rico"): nada en la
  UI puede crear o mostrar estas filas hasta Fase 2+, así que sembrarlas
  ahora no tiene consumidor.

Mismo password de placeholder (`ChangeMe123!`, vía bcrypt) que el seed
existente, mismo patrón `upsert` por email.

## Testing

Sigue el patrón de `lib/prisma.test.ts` de Fase 0 (Task 3): tests de
integración contra la base de datos real de desarrollo local, sin mocks.
Para cada modelo nuevo, un test que:
1. Crea una fila válida (con sus FKs apuntando a filas existentes o creadas
   en el mismo test) y confirma que se puede leer de vuelta.
2. Confirma que una FK inválida (ej. `organizacionId` inexistente en
   `Caso`) falla con el error de constraint esperado.
3. Limpia lo que creó al final (`afterAll`/`afterEach`), igual que el patrón
   ya usado.

No se agregan tests de los enums en sí (Prisma los valida en tiempo de
compilación vía TypeScript) ni de los índices (no hay forma significativa de
testear que un índice existe sin inspeccionar el plan de query, que está
fuera de alcance para Fase 1).

## Fuera de alcance (explícito)

- Cualquier ruta o página (`/admin/casos`, `/cliente/casos`, etc.) — Fase 2.
- Cálculo de `fechaLimite`, asignación automática por carga — Fase 2.
- Lógica de máquina de estados de `Sesion` (transiciones, webhooks
  Daily.co) — Fase 3.
- Generación/firma de `Informe` — Fase 4.
- Cualquier validación de negocio a nivel de aplicación (ej. que
  `organizacionId` en `Usuario` solo se use si `rol = cliente`) — se deja
  para cuando exista un formulario que escriba esos campos.

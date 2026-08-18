# Contexto de diseño — ConectaMente Core (para Claude Design)

**Propósito de este documento:** dar a una sesión de Claude Design todo el
contexto necesario para diseñar (o rediseñar) las pantallas de
**ConectaMente Core**, la app operativa interna en `app.conectamente.cl`
(no confundir con el sitio institucional público de docs 01/04/05, que es
un proyecto separado en otro dominio). El objetivo es que el trabajo de
diseño y el de implementación queden desacoplados: acá se define cómo se
ve cada pantalla, y la implementación (Claude Code) se concentra en que
funcione, sin tener que tomar decisiones visuales sobre la marcha.

---

## 1. Qué es la app

Plataforma de auditoría de licencias médicas, con 3 portales por rol:

- **Backoffice** (equipo operativo de ConectaMente): ingresa casos, asigna
  médicos, hace seguimiento de cumplimiento de plazos.
- **Médico revisor**: recibe casos asignados, hace la evaluación por
  videollamada, genera y firma el informe.
- **Cliente institucional** (isapre, empresa, COMPIN, aseguradora,
  subcontratista): ve el estado de sus propios casos y descarga el
  informe final cuando está listo. Es de solo lectura — no ingresa casos
  directamente.

Herramienta interna, no pública. Sobria, funcional, orientada a tablas y
formularios — no es un producto de consumo masivo ni necesita
"venderse" visualmente. El tono es clínico-administrativo, confiable,
sin ornamentación.

---

## 2. Sistema de diseño ya establecido (no rediseñar desde cero)

El sistema de diseño se heredó del panel de administración del sitio
clínico existente de ConectaMente (`E:\Dev\ConectaMente-2`,
`conectamente.cl/admin`). La Fase 0 de este proyecto portó solo un
subconjunto mínimo (tokens de color + `Button`/`Input`/`Select`/`Card`,
justo lo necesario para el login). **Esta sección junta ese subconjunto
ya portado con el resto del sistema real de la fuente original** —
patrones de tabla, filtros, badges de estado, sidebar de navegación,
tarjetas resumen, paginación, drawer/modal — que todavía no se portaron a
este proyecto pero existen y están probados en producción en el panel
original. La sesión de diseño debe usar estos patrones reales como base,
no inventar equivalentes nuevos.

### Paleta de colores

```
accent (verde marca):     #0CB87E
accent hover:              #0A9A69
accent soft (fondos):      #E4F9F2
texto principal:           #0D1626
texto secundario:          #64748B
texto muted:                #94A3B8
fondo base (app):           #F8FAFC
fondo base (panel/admin):   #EDF0F5
fondo hover:                #F1F5F9
borde:                      rgba(15, 23, 42, 0.10)
borde suave:                 rgba(15, 23, 42, 0.07)
borde muy suave (filas tabla): rgba(15, 23, 42, 0.05)
danger/error:                #EF4444 (Core) / #DC2626 (panel original)
danger bg suave:              #FEF2F2
texto placeholder:            #94A3B8
texto disabled/other-month:   #CBD5E1
```

**Convención semántica de color para estados** (extraída de
`AdminDashboard.tsx`'s `STATUS_COLOR` — el mapeo real que el panel usa
para pintar badges de estado de reservas, directamente aplicable al
badge de `EstadoCaso`/`EstadoSesion` de Core):

```
positivo/completado     → texto #0CB87E, fondo #E4F9F2  (verde accent)
neutral/en curso         → texto #6366F1, fondo #EEEDFF  (índigo)
negativo/cancelado       → texto #DC2626, fondo #FEF2F2  (rojo)
inactivo/no aplica        → texto #6B7280, fondo #F3F4F6  (gris)
```

Propuesta de mapeo para los enums de Core (a confirmar en la sesión de
diseño, no una regla ya decidida):
- `EstadoCaso`: `recibido`→índigo, `en_revision`→índigo, `informe_en_validacion`→índigo, `entregado`→verde.
- `EstadoSesion`: `agendada`/`en_curso`→índigo, `realizada`→verde, `incumplida_medico`/`incumplida_evaluado`/`cancelada`→rojo, `reprogramada`→gris.
- `PrioridadCaso`: `normal`→gris o sin badge, `urgente`→rojo.

### Tipografía

**DM Sans** (Google Fonts) como fuente única, con fallback a
`-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif`. Prácticamente
todo el sistema original usa `font-weight: 400` incluso donde otro
sistema usaría 500/600 — el énfasis se logra con color (verde accent) o
tamaño, no con negrita, salvo el nombre de marca en el sidebar (600).

### Fondo de pantallas de autenticación

La pantalla de login usa un gradiente sutil de fondo, distinto del resto
de la app:
```
linear-gradient(135deg, #EDF0F5 0%, #E8EEF6 50%, #EAF2ED 100%)
```

### Componentes base ya portados a Core (Tailwind CSS)

- **Button**: 3 variantes — `primary` (fondo verde accent, texto blanco),
  `secondary` (fondo blanco, borde, texto secundario, hover a color
  accent), `danger` (fondo rojo). Radio de borde `rounded-lg`, padding
  `px-4 py-2`, texto `text-sm font-medium`.
- **Input**: label en mayúsculas pequeñas arriba (`text-xs uppercase
  tracking-wide`, color texto secundario), campo con fondo `bg-brand-bg`,
  borde sutil, focus con anillo verde translúcido. Mensaje de error en
  rojo debajo.
- **Select**: mismo tratamiento visual que Input.
- **Card**: contenedor blanco, `rounded-xl`, sombra doble sutil
  (`shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)]`),
  borde muy suave.

### Patrones reales del sistema original todavía NO portados a Core

Estos existen y están probados en `conectamente.cl/admin` — la sesión de
diseño debe adaptarlos, no inventar desde cero.

**Header de sección** (`.header`): franja blanca fija arriba (`height:
58px`, `position: sticky`), borde inferior sutil, sombra de 1px. A la
izquierda: marca + título de página separado por una línea vertical
(`border-left`). A la derecha: badge con el total de registros (`fondo
#E4F9F2, texto verde, radio 20px, padding 3px 10px`) + botón de logout
(borde sutil, hover a rojo).

**Barra de filtros** (`.filters`): franja blanca debajo del header,
`padding: 18px 28px`, controles alineados abajo (`align-items:
flex-end`). Cada filtro es un grupo label-arriba (uppercase, 11px, gris)
+ control abajo. Inputs/selects comparten el mismo tratamiento: fondo
`#F8FAFC`, borde `1.5px solid rgba(15,23,42,0.10)`, radio `8px`, foco con
borde verde + `box-shadow: 0 0 0 3px rgba(12,184,126,0.12)`. Selects
usan una flecha SVG verde custom (no la nativa del navegador). Botón
principal de filtrar: fondo verde, sombra de color a juego
(`box-shadow: 0 1px 3px rgba(12,184,126,0.30)`), se eleva 1px en hover.
Botón "limpiar": blanco con borde, sin color de acento.

**Tabla de datos** (`.table`/`.th`/`.td`/`.row`): envuelta en un
contenedor blanco con borde redondeado 12px y sombra doble sutil
(mismo patrón que `Card`). Encabezados uppercase 10.5px gris sobre fondo
`#F8FAFC`, separador `1.5px`. Filas separadas por líneas casi
invisibles (`rgba(15,23,42,0.05)`), hover con fondo `#F8FAFC`. Números
(precios, horas) usan `font-variant-numeric: tabular-nums` para alinear
columnas.

**Badge de estado** (`.badge`): píldora (`border-radius: 20px`, padding
`4px 10px`), texto 11.5px, color de fondo/texto según la convención
semántica de arriba. Es clickeable (abre un dropdown para cambiar de
estado) — `cursor: pointer`, se oscurece 8% y sube 1px en hover.

**Tarjetas resumen / KPI** (`.summaryCards`/`.summaryCard`): fila de
tarjetas blancas iguales (`flex: 1`, `min-width: 160px`), cada una con
label uppercase pequeño arriba y un número grande (`24px`) abajo — el
número puede pintarse verde para destacar un valor positivo.

**Paginación** (`.pagination`/`.pageButton`): botones "anterior/
siguiente" con borde, deshabilitados al 40% de opacidad en los extremos,
info de página centrada entre ambos.

**Drawer/modal lateral** (`.drawerSection`/`.drawerField`/
`.drawerSaveButton`): panel de detalle/edición con secciones tituladas
(uppercase, gris), campos label-arriba igual que los filtros, botón de
guardar de ancho completo al final.

**Estado vacío** (`.emptyState`): centrado, mucho padding vertical (72px),
texto gris — sin ilustración compleja, solo texto simple.

**Chips de preset/filtro rápido** (`.presets`/`.preset`): fila de
píldoras pequeñas (ej. "Hoy", "Esta semana") — inactivas con borde
sutil, la activa con fondo verde sólido.

### Sidebar de navegación (patrón completo, no portado a Core todavía)

El panel original usa un sidebar lateral colapsable (no un header con
tabs como en la versión más vieja) — este es el patrón que Core debería
adoptar para sus 3 portales, dado que la app va a crecer a más de una
sección por rol.

- **Ancho:** 220px expandido, 64px colapsado (solo íconos), con
  transición suave (`0.22s cubic-bezier`). El estado se guarda en
  `localStorage`.
- **Estructura:** logo arriba (36×36px, esquinas redondeadas, halo verde
  sutil) → separador → nav con categorías agrupadas (label uppercase
  9.5px gris cuando expandido, o solo un separador de línea cuando
  colapsado) → botón de colapsar/expandir siempre anclado abajo.
- **Item activo:** barra vertical verde de 3px pegada al borde izquierdo
  (con resplandor sutil `box-shadow`), fondo verde muy suave
  (`rgba(12,184,126,0.09)`), ícono y texto en verde accent.
- **Item en hover (no activo):** fondo `#F0FDF8`, ícono se pinta verde.
- **Íconos:** SVG lineales de 19×19px, `strokeWidth: 2`, color dinámico
  según estado (gris `#9BAABC` inactivo → verde `#0CB87E` activo/hover).
- **Mobile:** el sidebar se oculta completo y se reemplaza por una barra
  de navegación inferior fija (5-6 íconos, sin texto, indicador de activo
  como una barrita verde arriba del ícono).

Para Core, las categorías serían por rol/sección — ej. para backoffice:
"Casos" (Casos, Nuevo caso, Importar), "Asignación", y más adelante
"Cumplimiento", "Usuarios"; para médico: "Mis casos"; para cliente: "Mis
casos" (una sola sección, no necesita categorías).

### Restricciones técnicas para el diseño

- Se implementa en **Next.js 15 (App Router) + Tailwind CSS**, sin
  librería de componentes adicional (no Material UI, no Chakra, etc.) —
  los diseños deben poder traducirse a componentes React simples con
  clases Tailwind, no a sistemas de diseño con su propio runtime.
- Mobile-responsive no es prioridad — es una herramienta de uso interno,
  probablemente en desktop la mayoría del tiempo, pero no debe romperse
  en pantallas más chicas.
- Sin modo oscuro por ahora (no hay ningún requisito de negocio que lo
  pida).

---

## 3. Inventario completo de pantallas

### Ya construidas y en producción

| Ruta | Rol | Descripción | Estado |
|---|---|---|---|
| `/login` | público | Formulario de acceso (email + contraseña) | Construida — diseño mínimo, sin pulir |
| `/admin` | backoffice | Home con links a las secciones | Construida — muy básica, solo lista de links |
| `/admin/casos` | backoffice | Tabla de todos los casos | Construida — tabla HTML simple |
| `/admin/casos/nuevo` | backoffice | Formulario de ingreso individual de caso | Construida — formulario simple en Card |
| `/admin/casos/importar` | backoffice | Carga masiva por Excel/CSV, con vista previa de errores por fila | Construida — flujo de 2 pasos (subir → confirmar) |
| `/admin/asignacion` | backoffice | Carga de trabajo por médico + reasignación manual | Construida — tabla + selects inline |

### En construcción ahora (Fase 2b)

| Ruta | Rol | Descripción |
|---|---|---|
| `/cliente/casos` | cliente institucional | Listado de sus propios casos, filtrable por estado |
| `/cliente/casos/[id]` | cliente institucional | Detalle del caso + botón de descarga del informe (solo cuando está `entregado`) |

### Planificadas para fases futuras (Fase 3-4) — diseñar ahora si es posible, para no repetir trabajo de diseño más adelante

| Ruta | Rol | Descripción |
|---|---|---|
| `/medico` o `/medico/casos` | médico | Listado de casos asignados al médico, ordenado por fecha límite |
| `/medico/casos/[id]` | médico | Detalle del caso + formulario estructurado de evaluación clínica |
| `/medico/casos/[id]/sesion` | médico | Sala de videollamada embebida (Daily.co) + captura de consentimiento del evaluado antes de grabar |
| `/medico/casos/[id]/informe` | médico | Generación del informe final + firma electrónica avanzada (FEA) vía proveedor externo |
| `/admin/cumplimiento` | backoffice | Tabla de casos por vencer / vencidos, agrupados por organización — panel de cumplimiento de SLA |
| `/admin/usuarios` | backoffice | CRUD simple de usuarios (clientes, médicos, backoffice) |

### Estados de negocio que la UI necesita representar visualmente

Un `Caso` tiene 4 estados (probablemente el elemento visual más repetido
en toda la app — vale la pena diseñar un componente de badge de estado
reutilizable):

```
recibido → en_revision → informe_en_validacion → entregado
```

Una `Sesion` (videollamada) tiene 7 estados:
```
agendada → en_curso → realizada
                    → incumplida_medico
                    → incumplida_evaluado
         → reprogramada
         → cancelada
```

Prioridad de un caso: `normal` | `urgente` (probablemente otro badge).

---

## 4. Qué se espera de esta sesión de diseño

- Adaptar a Core los patrones reales listados en la sección 2 que
  todavía no se portaron: sidebar de navegación colapsable, badge de
  estado (con la convención semántica de color ya definida), tabla de
  datos, barra de filtros, tarjetas resumen, paginación, drawer/modal,
  estado vacío — no inventar equivalentes desde cero cuando ya existe un
  patrón probado en el sistema original.
- Diseñar las pantallas ya construidas con más cuidado visual (hoy son
  funcionales pero mínimas — tablas HTML sin estilo, sin navegación
  visible más allá de un home con links).
- Diseñar las pantallas de Fase 2b (`/cliente/*`) y, si el tiempo
  alcanza, las de fases futuras (`/medico/*`, `/admin/cumplimiento`,
  `/admin/usuarios`) para tener el mapa completo de la app resuelto.
- Mantenerse dentro de lo que Tailwind + componentes React simples puede
  producir — evitar interacciones o efectos que requieran librerías de
  animación/gráficos no incluidas en el stack actual. El sistema
  original usa CSS Modules con estilos inline puntuales (ver
  `AdminSidebar.tsx`) — al portar a Core, todo eso se traduce a clases
  Tailwind sobre los tokens de `lib/design-tokens.ts`, no a CSS Modules
  nuevos.

---

## 5. Qué NO es parte de esta sesión de diseño

- El sitio institucional público (`auditoria.conectamente.cl`, docs
  01/04/05) — es un proyecto de marketing separado, con su propia
  paleta (azul `#2D6B9E`, tipografía `Inter`), no relacionado con esta
  app operativa.
- Lógica de negocio, validaciones, o comportamiento — eso lo resuelve la
  implementación por separado, usando el diseño como referencia visual.

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
clínico existente de ConectaMente (`conectamente.cl/admin`), portado en
la Fase 0 de este proyecto. **Ya está implementado en código** — el
propósito de esta sesión de diseño es extenderlo consistentemente a
pantallas nuevas, no inventar uno nuevo.

### Paleta de colores

```
accent (verde marca):     #0CB87E
accent hover:              #0A9A69
accent soft (fondos):      #E4F9F2
texto principal:           #0D1626
texto secundario:          #64748B
texto muted:                #94A3B8
fondo base:                 #F8FAFC
fondo hover:                #F1F5F9
borde:                      rgba(15, 23, 42, 0.10)
borde suave:                 rgba(15, 23, 42, 0.07)
danger/error:                #EF4444
```

### Tipografía

**DM Sans** (Google Fonts) como fuente única, con fallback a
`-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif`.

### Fondo de pantallas de autenticación

La pantalla de login usa un gradiente sutil de fondo, distinto del resto
de la app (que usa el fondo base sólido `#F8FAFC`):
```
linear-gradient(135deg, #EDF0F5 0%, #E8EEF6 50%, #EAF2ED 100%)
```

### Componentes base ya construidos (Tailwind CSS)

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

No hay todavía: badges de estado, tablas con estilo propio más allá de
HTML básico, sidebar de navegación, patrones de paginación, toasts/
notificaciones, modales. Todo esto se puede/debe diseñar en esta sesión —
son los huecos reales del sistema de diseño actual.

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

- Extender el sistema de diseño existente (no reemplazarlo) con los
  patrones que faltan: badge de estado, badge de prioridad, patrón de
  tabla de datos consistente, navegación lateral o superior para los 3
  portales, estado vacío ("sin casos todavía"), estado de carga.
- Diseñar las pantallas ya construidas con más cuidado visual (hoy son
  funcionales pero mínimas — tablas HTML sin estilo, sin navegación
  visible más allá de un home con links).
- Diseñar las pantallas de Fase 2b (`/cliente/*`) y, si el tiempo
  alcanza, las de fases futuras (`/medico/*`, `/admin/cumplimiento`,
  `/admin/usuarios`) para tener el mapa completo de la app resuelto.
- Mantenerse dentro de lo que Tailwind + componentes React simples puede
  producir — evitar interacciones o efectos que requieran librerías de
  animación/gráficos no incluidas en el stack actual.

---

## 5. Qué NO es parte de esta sesión de diseño

- El sitio institucional público (`auditoria.conectamente.cl`, docs
  01/04/05) — es un proyecto de marketing separado, con su propia
  paleta (azul `#2D6B9E`, tipografía `Inter`), no relacionado con esta
  app operativa.
- Lógica de negocio, validaciones, o comportamiento — eso lo resuelve la
  implementación por separado, usando el diseño como referencia visual.

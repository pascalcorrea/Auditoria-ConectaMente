# ConectaMente Auditoría — Sitio web institucional (diseño)

**Fecha:** 2026-08-20
**Contexto:** doc maestro `00_Prompt_Maestro_Claude_Code.md` define dos
desarrollos relacionados: la plataforma operativa (ConectaMente Core,
este repo, ya en Fase 2b) y el **sitio web institucional** en
`auditoria.conectamente.cl` (docs `01_Web_Estructura...`,
`04_Web_Wireframes_Conceptuales.md`, `05_Web_Copy_Home_Isapres.md`).
Este spec cubre el sitio web — es un proyecto nuevo, no una fase de Core.

## Alcance

Las 9 páginas del sitemap definido en doc 01: `/`, `/servicio-auditoria`,
`/segmentos/isapres`, `/segmentos/compin`, `/segmentos/empresas`,
`/segmentos/seguros`, `/nosotros`, `/tecnologia`, `/proveedor`,
`/contacto`. Todo en una sola fase — no hay decomposición en sub-fases
porque es mayormente contenido estático (SSG), sin lógica de negocio
compleja que justifique fasarlo como se hizo con Core.

**Fuera de alcance de este spec** (explícitamente, según doc 01):
blog (fase 2 del sitio, no MVP), precios públicos, chat B2C genérico.

## Decisiones resueltas con el usuario antes de este diseño

- **Proyecto separado, no una ruta más de Core.** Repo de GitHub nuevo,
  carpeta local `E:\Dev\Web-ConectaMente-Auditoria`, sin compartir
  código/DB/auth con este repo. Razón: dominios distintos
  (`auditoria.conectamente.cl` vs `app.conectamente.cl`), el `/` de
  Core ya está tomado por un `redirect('/login')` (`app/page.tsx`), y
  mezclar los pipelines de deploy pondría en riesgo la app ya en
  producción por un fallo de build del sitio. Se descartó monorepo
  compartido (mayor inversión de setup no justificada aún) y "mismo
  proyecto, mismo deploy" (acopla dos productos distintos).
- **Todo el sitio en una fase**, incluyendo redactar el copy que falta
  para las landings de COMPIN, Empresas y Seguros siguiendo la guía de
  tono de `05_Web_Copy_Home_Isapres.md` (sección "Guía para replicar el
  tono"). La landing de Seguros tiene el dolor central marcado como "aún
  no validado" en los docs — se escribe un copy genérico defendible
  (capacidad + trazabilidad, sin inventar el proceso de contratación) y
  se marca explícitamente para revisión del usuario antes de publicar.
- **Sistema de diseño extraído de la fuente real**, no interpretado
  desde los docs. Fuente: `E:\Dev\ConectaMente-2` (el sitio clínico
  público real), específicamente:
  - `app/globals.css` → paleta real (CSS custom properties, lo que
    realmente consumen los componentes vía `var(--primary)` etc. — el
    `tailwind.config.ts` del proyecto define una paleta azul distinta
    que resultó no estar en uso real por ningún componente, se descarta
    como fuente): `--primary` `#2C7F66`, `--primary-dark` `#1F5C4B`,
    `--primary-light` `#EBF5F0`, `--primary-subtle` `#F5FAF7`,
    `--bg-page` `#FAFBFC`, `--text-primary` `#1A1A2E`,
    `--text-secondary` `#5F6B7A`, `--text-muted` `#9CA3AF`, `--border`
    `#E5E7EB`, `--border-light` `#F0F1F3`. Tipografía: system font stack
    (`-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica
    Neue', sans-serif`), no `Inter` como sugería el tailwind.config sin
    uso real. Esta misma familia verde es la que ya usa
    `lib/design-tokens.ts` de este repo (Core) para el retrofit del
    admin — consistente entre ambos productos.
  - `components/layout/Header.tsx` / `Footer.tsx` (+ sus `.module.css`)
    como referencia de estructura de nav/footer (mega-menús y enlaces
    específicos de la clínica no aplican al sitio institucional — se
    reutiliza el patrón visual: top bar, header sticky con blur, botones
    con radio 8px, no el contenido).
  - `app/(public)/layout.tsx` como referencia del layout base público.
  - No se copia código 1:1 (proyecto nuevo desde cero, por mandato del
    doc maestro) — se reconstruyen los tokens y patrones en el
    Tailwind config del proyecto nuevo.
  - El tono se ajusta al posicionamiento institucional ("capacidad, no
    calidez") aunque la paleta base sea la misma — sin imágenes de stock
    de "doctor sonriendo"; hero con elementos abstractos/técnicos.
- **Link al portal en el header.** El nav incluye un link a
  `https://app.conectamente.cl` (label tipo "Portal" / "Iniciar
  sesión") junto al CTA "Conversemos", para que clientes/médicos con
  cuenta entren directo a Core.
- **Bloque tecnológico con placeholder.** Las 3 páginas que piden
  capturas/mockups del dashboard de Core (`/`, `/servicio-auditoria`,
  `/tecnologia`) se construyen con el layout y la estructura listos pero
  sin imagen real todavía — el usuario va a crear esos mockups con
  Claude Design por separado y se insertan después. No bloquea el resto
  del sitio.
- **Ficha de proveedor:** el PDF descargable de `/proveedor` es
  **estático**, con contenido (RUT, certificaciones, especialidades) que
  el usuario provee — no se genera dinámicamente desde datos. Mientras
  no exista el archivo, el botón de descarga queda deshabilitado o el
  layout completo sin link roto.
- **Formulario de contacto vía Brevo.** Server action / API route que
  valida el input y llama a la API transaccional de Brevo — consistente
  con el proveedor de email ya decidido en el doc maestro para el resto
  del proyecto. La API key se pasa como variable de entorno cuando se
  llegue a esa parte de la implementación, nunca hardcodeada.
- **Segmentación del formulario por query param:** cada landing de
  segmento enlaza a `/contacto?tipo=<segmento>` y el formulario
  preselecciona el dropdown "Tipo de consulta" en base a eso.
- **Sin base de datos, sin autenticación.** Contenido estático + un
  único endpoint de envío de formulario. No hay necesidad de
  persistencia para el MVP del sitio.

## Infraestructura y deploy

- Mismo VPS Hostinger que ya usa Core. Nuevo proceso PM2 en el puerto
  **3200** (siguiente libre después del 3100 de Core), nuevo server
  block de Nginx para `auditoria.conectamente.cl`, workflow de GitHub
  Actions propio en el repo nuevo (mismo patrón que
  `.github/workflows/deploy.yml` de este repo: push a `main` → SSH →
  build → `pm2 startOrRestart`), apuntando a su propio directorio y
  proceso — sin tocar el pipeline ni el proceso PM2 de Core.
- **DNS de `auditoria.conectamente.cl` sin verificar todavía.** Dado el
  precedente de `core.conectamente.cl` vs `app.conectamente.cl` (ver
  memoria del proyecto — la documentación puede no reflejar la zona DNS
  real), se confirma el registro A real antes de la fase de deploy, no
  se asume.

## Estructura de páginas

Layout común: `Header` (nav: Servicio / Segmentos ▾ / Tecnología /
Nosotros / Contacto, botón "Conversemos" destacado, link a
`app.conectamente.cl`) + `Footer` (links legales, política de datos,
contacto directo) en todas las páginas.

| Ruta | Contenido | Notas |
|---|---|---|
| `/` | Hero (frase de capacidad + CTA), bloque de confianza (badge RNPI), 3 líneas de servicio (Auditoría activa / Peritajes y Interconsultoría "Próximamente"), bloque tecnológico, métricas de capacidad (sin cifras inventadas), CTA final | Copy ya escrito en doc 05 |
| `/servicio-auditoria` | Qué evalúa (3 íconos), modalidades (caso a caso vs. lote), timeline de entrega (5 pasos), bloque tecnológico, CTA por segmento (grid 4 tarjetas) | |
| `/segmentos/isapres` | Hero, 3 razones, cómo funciona, CTA | Copy ya escrito en doc 05 |
| `/segmentos/compin` | Mismo patrón de bloques | Copy nuevo: dolor = procesos desiertos + cobertura regional |
| `/segmentos/empresas` | Mismo patrón de bloques | Copy nuevo: dolor = no pueden invalidar por sí mismos, necesitan respaldo antes de derivar; tono más cercano a RRHH |
| `/segmentos/seguros` | Mismo patrón de bloques | Copy nuevo genérico, marcado para revisión — dolor no validado aún |
| `/nosotros` | Historia breve, credenciales (afirmación agregada, sin nombres de equipo), política de datos (resumen + link), CTA | |
| `/tecnologia` | Hero de ConectaMente Core™, screenshots (placeholder), lista de capacidades, tabla comparativa implícita, CTA | Sin nombrar competidores |
| `/proveedor` | Bloque explicativo, datos clave en pantalla, botón de descarga PDF | PDF pendiente de contenido del usuario |
| `/contacto` | Formulario segmentado (preselección por query param), datos de contacto directo, nota de tiempo de respuesta | Envío vía Brevo |

## Detalles técnicos

- **SEO:** metadata por página (`title`/`description`), `sitemap.xml`,
  `robots.txt` — básico pero correcto; el doc marca "SEO institucional"
  como prioridad explícita.
- **Testing:** Vitest + Testing Library, proporcional al riesgo real —
  validación y submit del formulario de contacto, smoke test de que
  cada ruta renderiza. No requiere la cobertura exhaustiva de Core (sin
  lógica de negocio, RBAC, ni estados complejos aquí).
- **Sin precios públicos** en ninguna página (regla explícita del doc
  01).

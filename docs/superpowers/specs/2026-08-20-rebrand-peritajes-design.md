# ConectaMente Peritajes — Rebrand del sitio institucional (diseño)

**Fecha:** 2026-08-20
**Contexto:** el sitio institucional (`docs/superpowers/specs/2026-08-20-sitio-web-institucional-design.md`,
ya implementado y desplegable en `E:\Dev\Web-ConectaMente-Auditoria`) se reposiciona
antes de su primer deploy público. El negocio no cambia — sigue siendo la misma
revisión clínica/regulatoria de licencias médicas — pero el nombre bajo el que
se presenta cambia de "auditoría de licencias" a "peritaje de segunda opinión",
y el dominio cambia en consecuencia.

## Alcance

Rebrand del sitio ya construido, no un sitio nuevo. Mismo repo local
(`E:\Dev\Web-ConectaMente-Auditoria`, sin renombrar la carpeta/repo), mismos
9→8 rutas (una tarjeta de servicio se fusiona, ver abajo), misma arquitectura
técnica (Next.js, Tailwind, Brevo, deploy en VPS puerto 3200). No toca
ConectaMente Core (la plataforma técnica) ni su nombre — `/tecnologia` sigue
describiendo "ConectaMente Core™" como producto.

## Decisiones resueltas con el usuario antes de este diseño

- **Reemplaza, no coexiste.** `peritajes.conectamente.cl` reemplaza a
  `auditoria.conectamente.cl` — un solo negocio, un solo sitio. Confirmado
  vía DNS real: `auditoria.conectamente.cl` nunca llegó a resolver (verificado
  contra los nameservers autoritativos `apollo`/`athena.dns-parking.com`,
  NXDOMAIN), mientras que `peritajes.conectamente.cl` ya resuelve al VPS
  (`31.97.167.199`) al momento de este diseño — sin costo de migración, es
  la primera y única URL real del sitio.
- **El servicio no cambia, el nombre sí.** "Servicio de peritajes de segunda
  opinión" es el nombre correcto y preferido; "auditoría de licencias
  médicas" sigue siendo una forma válida de describir lo mismo y se
  mantiene como sinónimo aclaratorio dentro del copy (no en títulos
  principales).
- **Fusión de la tarjeta "Peritajes Médico-Legales (Próximamente)".** Esa
  tarjeta (antes descrita como "evaluaciones de invalidez, secuelas y nexo
  causal laboral", una oferta separada y futura) desaparece como línea de
  negocio aparte — el servicio principal ahora se llama "Peritajes de
  Segunda Opinión", así que mantenerla por separado sería confuso/redundante.
  El bloque de "líneas de servicio" en Home pasa de 3 a 2 tarjetas: Peritajes
  de Segunda Opinión (activa) + Interconsultoría Institucional
  (Próximamente). No se inventa una tercera línea para rellenar el layout.
- **Nombre de marca:** "ConectaMente Peritajes" en header, footer, títulos
  y metadata (reemplaza "ConectaMente Auditoría").
- **Nombre del servicio principal:** "Peritajes de Segunda Opinión" para
  nav/tarjetas/rutas; "Peritajes de Segunda Opinión sobre Licencias Médicas"
  para el hero de Home y de la página de servicio, mencionando "auditoría de
  licencias" como sinónimo dentro del cuerpo del texto, no en el título.
- **Ruta renombrada:** `/servicio-auditoria` → `/servicio-peritajes`. El sitio
  no está en producción todavía (sin historial SEO/backlinks que perder), así
  que renombrar ahora no tiene costo. Todos los links internos (Header,
  Footer, Home, las 4 landings de segmento, `app/sitemap.ts`) se actualizan
  para apuntar a la ruta nueva.
- **Landings de segmento: solo cambio terminológico, no reescritura.** Los 3
  "razones"/dolores por segmento (isapres/COMPIN/empresas/seguros) y la
  estructura de cada landing siguen siendo válidos y se mantienen — solo se
  reemplaza vocabulario ("auditoría"/"auditar" → "peritaje de segunda
  opinión"/"revisar") donde aparece, sin rederivar el análisis de dolor de
  cada segmento desde cero.

## Archivos afectados

**Dominio/config (BASE_URL y metadata):**
- `app/sitemap.ts` — `BASE_URL` → `https://peritajes.conectamente.cl`
- `app/robots.ts` — mismo cambio de dominio en el link al sitemap
- `app/layout.tsx` — `metadataBase` → mismo dominio nuevo; `metadata.title`
  default y template usan "ConectaMente Peritajes"

**Marca (Header/Footer):**
- `components/layout/Header.tsx` — texto de marca "ConectaMente Auditoría"
  → "ConectaMente Peritajes"; link de nav "Servicio" apunta a
  `/servicio-peritajes`
- `components/layout/Footer.tsx` — mismo cambio de marca; columna "Servicio"
  actualiza su link a `/servicio-peritajes`

**Ruta renombrada:**
- `app/servicio-auditoria/` → `app/servicio-peritajes/` (mover
  `page.tsx` y `page.test.tsx`; actualizar título/hero/metadata dentro del
  archivo al nuevo nombre de servicio)
- Todo link interno a `/servicio-auditoria` (Header, Footer, Home,
  `SegmentLanding.tsx` si aplica, `lib/segments-data.ts` si algo referencia
  la ruta) actualizado a `/servicio-peritajes`

**Home (`app/page.tsx`):**
- Hero: "Peritajes de Segunda Opinión sobre Licencias Médicas" como título,
  mencionando auditoría de licencias como sinónimo en el body
- Bloque de líneas de servicio: 2 tarjetas en vez de 3 — "Peritajes de
  Segunda Opinión" (activa, link a `/servicio-peritajes`) +
  "Interconsultoría Institucional" (Próximamente). Layout de grid ajustado
  de `md:grid-cols-3` a `md:grid-cols-2`. La tarjeta "Peritajes
  Médico-Legales" eliminada.

**Landings de segmento (`lib/segments-data.ts`):**
- Reemplazo terminológico en `heroTitle`, `heroBody`, `reasons[].title`,
  `reasons[].body`, `howItWorks`, `ctaTitle`, `ctaBody` de los 4 segmentos
  donde aparezca "auditoría"/"auditar"/"auditoría de licencias" — sustituir
  por "peritaje de segunda opinión"/"revisar"/variantes naturales en
  español, sin cambiar la estructura de 3 razones ni el dolor central de
  cada segmento (ya validado en el spec original).

**Documentación:**
- `README.md` (del repo del sitio) — actualizar cualquier mención al
  dominio o nombre anterior
- `.github/workflows/deploy.yml` — sin cambios funcionales (no referencia
  el dominio directamente), solo revisar comentarios si los hay

## Fuera de alcance

- ConectaMente Core (la app operativa en `app.conectamente.cl`) — sin
  cambios, ni en nombre ni en modelo de datos. El término "Caso" en Core
  sigue siendo válido (un peritaje de segunda opinión sobre una licencia
  sigue siendo, técnicamente, un caso).
- `/nosotros`, `/proveedor`, `/tecnologia` — sin cambios de contenido más
  allá del nombre de marca en el header/footer que envuelve la página (no
  usan "auditoría" en su propio copy de forma central).
- El registro DNS de `auditoria.conectamente.cl` no se crea — se abandona
  esa URL sin haber sido nunca pública.
- Deploy a producción (VPS, Nginx, SSL, secrets de GitHub Actions) — sigue
  pendiente como acción separada del usuario, ahora usando
  `peritajes.conectamente.cl` en vez de `auditoria.conectamente.cl` en la
  configuración de Nginx.

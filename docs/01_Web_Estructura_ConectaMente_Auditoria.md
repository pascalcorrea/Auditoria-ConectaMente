# ConectaMente Auditoría — Estructura del Sitio Web

**Dominio:** `auditoria.conectamente.cl`

**Propósito del sitio:** credenciales institucionales para compradores B2B/B2G (COMPIN, isapres, seguros, empresas). No es venta directa al público, no lleva precios, no es una landing de "agenda tu hora".

**Referencia de posicionamiento:** hablar el idioma de la institución (capacidad, cumplimiento, riesgo, trazabilidad) — no el idioma de calidez/empatía que usan los peritajes judiciales B2C (Centro Pericial, Evidere) ni el lenguaje puramente clínico de TrustDoc. Diferenciador central: tecnología visible (algo que ningún competidor local muestra hoy).

**Base de diseño:** se reutiliza el UX/UI y la estructura base de conectamente.cl y conectamente.cl/admin (sistema de diseño, componentes, tipografía, paleta) — no se diseña desde cero.

---

## Sitemap

```
/                           → Home
/servicio-auditoria         → Auditoría de Licencias Médicas
/segmentos/isapres           → Landing por segmento
/segmentos/compin
/segmentos/empresas
/segmentos/seguros
/nosotros                    → Quiénes somos, equipo, credenciales
/tecnologia                  → ConectaMente Core™ (la plataforma)
/proveedor                   → Ficha de proveedor descargable (para compras públicas)
/contacto                    → Formulario segmentado por tipo de consulta
/blog                        → (fase 2, no MVP del sitio)
```

---

## Home (`/`)

- **Hero:** frase de capacidad institucional, no de calidez. Ej. tono: "Auditoría médico-legal de licencias con trazabilidad y cumplimiento normativo, a la escala que su organización necesita."
- **Bloque de confianza:** logos de clientes en cuanto existan (TrustDoc usa esto como pieza central — sin logos reales, usar en su lugar certificaciones/acreditaciones del equipo, RNPI, etc.)
- **Tres líneas de servicio en tarjetas:** Auditoría de Licencias / Peritajes Médico-Legales (fase 2 del negocio, no prioridad hoy) / Interconsultoría Institucional (fase 3, aspiracional)
- **Bloque diferenciador tecnológico:** captura de pantalla o mockup del dashboard de ConectaMente Core — esto es lo que TrustDoc no tiene y hay que mostrarlo, no solo describirlo.
- **Métricas de capacidad** (cuando existan datos reales): tiempo promedio de entrega, cobertura regional, volumen procesado. En el arranque, usar métricas de capacidad instalada (ej. "cobertura nacional vía modalidad telemática") en vez de inventar cifras.
- CTA: "Conversemos sobre su organización" → `/contacto`

## Servicio: Auditoría de Licencias Médicas (`/servicio-auditoria`)

- Qué es: revisión clínica, regulatoria y documental de licencias emitidas.
- Qué evalúa: coherencia diagnóstico-reposo, cumplimiento normativo (Ley 21.746, circulares MINSAL), detección de patrones anómalos.
- Modalidades: caso a caso / lote masivo.
- Cómo se entrega: formato de informe, plazos, trazabilidad.
- Diferenciador tecnológico: dashboard de estado en tiempo real para el cliente.
- CTA por segmento (dirige a la landing correspondiente).

## Landings por segmento (`/segmentos/...`)

Cada landing debe responder al dolor específico de ese cliente, no repetir el mismo texto:

| Segmento | Dolor central a abordar en el copy |
|---|---|
| Isapres | Riesgo legal de rechazar/aprobar sin respaldo clínico sólido (Ley 21.746, responsabilidad solidaria del prestador institucional); volumen alto de casos complejos que su contraloría interna no da abasto a cubrir |
| COMPIN | Procesos que quedan desiertos por falta de oferta; necesidad de cobertura multi-región vía modalidad telemática |
| Empresas | No pueden invalidar una licencia por sí mismas; necesitan respaldo clínico antes de derivar un caso a COMPIN/isapre para no denunciar sin fundamento |
| Seguros | Dolor específico aún sin validar — pendiente confirmar el proceso real de contratación de este segmento antes de escribir el copy final de su landing |

## Nosotros (`/nosotros`)

- Historia breve. Nota de marca: el sitio vive en un subdominio de conectamente.cl (decisión ya tomada), por lo que la separación respecto a la atención clínica no es de dominio — se logra con tono, contenido y ausencia de referencias cruzadas explícitas entre ambos negocios, no con una URL completamente distinta.
- Credenciales del equipo médico: inscripción RNPI, especialidades, ejercicio activo.
- Política de confidencialidad y tratamiento de datos (Ley 19.628 / Ley 21.719) — TrustDoc lo muestra explícitamente en su FAQ, es un estándar esperado del sector.

## Tecnología (`/tecnologia`)

- Presentación de ConectaMente Core™ como producto, no como mención de paso.
- Capturas del dashboard de cliente, trazabilidad, y (cuando exista) del módulo de asistencia por IA para borradores de informe.
- Este es el bloque que más separa a ConectaMente de TrustDoc — no escatimar espacio aquí.

## Ficha de proveedor (`/proveedor`)

- Documento descargable (PDF) con RUT, experiencia, certificaciones, especialidades cubiertas — pensado para que un encargado de compras públicas o de contraloría médica lo baje directo, sin tener que pedirlo por correo.

## Contacto (`/contacto`)

- Formulario segmentado por tipo de consulta (igual patrón que usa TrustDoc: Auditoría de Licencias / Peritaje / Interconsultoría / Otro).
- Sin chat genérico tipo venta B2C — tono institucional, "responderemos en menos de 24 horas hábiles" (estándar que ya fija TrustDoc en el mercado).

---

## Notas de implementación

- **Stack: Next.js + TypeScript**, el mismo que la app (`core.conectamente.cl`) — no un HTML estático aparte. Razón: permite compartir componentes de UI directamente con el admin de conectamente.cl y con ConectaMente Core, en vez de mantener dos sistemas de diseño en paralelo. Sigue siendo un sitio liviano (mayormente páginas estáticas/SSG), no una SPA compleja — prioriza velocidad de carga y SEO institucional igual que antes.
- Sin precios públicos en ninguna página.
- Sin blog en el MVP del sitio — es contenido que compite por tiempo de desarrollo sin aportar a la conversión con compradores institucionales en esta etapa.

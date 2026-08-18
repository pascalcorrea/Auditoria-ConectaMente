# ConectaMente Auditoría — Wireframes Conceptuales

Bloques por página, en orden de aparición. No es diseño visual — es la estructura de contenido que el diseño debe respetar.

---

## Home (`/`)

1. **Header** — logo, nav (Servicio / Segmentos ▾ / Tecnología / Nosotros / Contacto), botón "Conversemos" destacado.
2. **Hero** — titular + bajada + botón CTA. Sin imagen de stock genérica de "doctor sonriendo" — preferir algo abstracto/técnico (líneas de datos, dashboard) acorde al posicionamiento de capacidad, no de calidez.
3. **Bloque de confianza** — logos de clientes (cuando existan) o, mientras tanto, certificaciones/acreditaciones del equipo (RNPI) en formato de badges.
4. **Tres líneas de servicio** — 3 tarjetas horizontales: Auditoría de Licencias (activa, con link) / Peritajes Médico-Legales (badge "Próximamente") / Interconsultoría Institucional (badge "Próximamente").
5. **Bloque tecnológico** — mockup del dashboard de ConectaMente Core a la izquierda, lista de 4 capacidades a la derecha (trazabilidad en tiempo real, alertas de SLA, registro auditable, firma electrónica avanzada).
6. **Métricas de capacidad** — 3-4 stat cards simples (sin inventar cifras — usar afirmaciones de capacidad instalada mientras no haya datos reales).
7. **CTA final** — repetir "Conversemos sobre su organización".
8. **Footer** — links legales, política de datos, contacto directo.

---

## Servicio: Auditoría de Licencias Médicas (`/servicio-auditoria`)

1. **Header** (igual en todas las páginas)
2. **Hero del servicio** — qué es, en una frase, + para quién es.
3. **Qué evalúa** — 3 íconos con texto corto: coherencia diagnóstico-reposo / cumplimiento normativo (Ley 21.746, circulares MINSAL) / detección de patrones anómalos.
4. **Modalidades** — dos columnas comparativas: "Caso a caso" vs. "Lote masivo (Excel)".
5. **Cómo se entrega** — mini-timeline horizontal de 5 pasos: Ingreso → Asignación → Evaluación → Informe firmado (FEA) → Entrega con trazabilidad.
6. **Diferenciador tecnológico** — repetir mockup del dashboard, con foco en el estado del caso.
7. **CTA por segmento** — grid de 4 tarjetas (Isapres / COMPIN / Empresas / Seguros), cada una lleva a su landing.

---

## Landing por segmento (`/segmentos/isapres`, `/segmentos/compin`, `/segmentos/empresas`, `/segmentos/seguros`)

Misma estructura de bloques para las 4, contenido distinto en cada una:

1. **Header**
2. **Hero específico** — titular que nombra el dolor concreto de ese segmento (no genérico).
3. **3 razones** — por qué ConectaMente Auditoría resuelve ese dolor específico (ver contenido por segmento en `01_Web_Estructura`).
4. **Cómo funciona para este cliente** — 3-4 líneas, sin repetir el timeline genérico del servicio.
5. **CTA de contacto** — el formulario llega pre-seleccionado con el segmento correspondiente.

---

## Nosotros (`/nosotros`)

1. **Header**
2. **Historia breve** — 2-3 párrafos, sin mención cruzada al negocio clínico.
3. **Equipo/credenciales** — grid de profesionales con badge de acreditación RNPI (sin nombres si aún no está definido el equipo público, usar "Equipo 100% acreditado ante la Superintendencia de Salud" como afirmación agregada).
4. **Política de datos** — resumen de 3-4 líneas (Ley 19.628 / 21.719) + link a política completa.
5. **CTA contacto**

---

## Tecnología (`/tecnologia`)

1. **Header**
2. **Hero de ConectaMente Core™** — titular que la nombra como producto, no como feature.
3. **Screenshots/mockups** — 2-3 capturas del dashboard (estado de casos, panel de cumplimiento).
4. **Lista de capacidades** — trazabilidad en tiempo real, alertas automáticas de SLA, telemetría de cumplimiento de sesión (duración, conexión/desconexión), firma electrónica avanzada por informe.
5. **Tabla comparativa implícita** — "Con ConectaMente Core" vs. "Proceso tradicional" (2 columnas, sin nombrar a TrustDoc directamente).
6. **CTA**

---

## Ficha de proveedor (`/proveedor`)

1. **Header**
2. **Bloque explicativo breve** — para qué sirve esta ficha.
3. **Datos clave visibles en pantalla** — RUT, certificaciones, especialidades cubiertas (no solo en el PDF, también legible sin descargar).
4. **Botón de descarga PDF**

---

## Contacto (`/contacto`)

1. **Header**
2. **Formulario segmentado** — dropdown "Tipo de consulta" (Auditoría de Licencias / Otro), campo de organización, mensaje.
3. **Datos de contacto directo** — email, teléfono si aplica.
4. **Nota de tiempo de respuesta** — "Respondemos en menos de 24 horas hábiles."

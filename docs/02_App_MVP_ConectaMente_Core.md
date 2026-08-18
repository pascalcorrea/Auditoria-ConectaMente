# ConectaMente Core™ — Especificación del MVP

**Objetivo del MVP:** operar el servicio de Auditoría de Licencias Médicas como **subproveedor** de empresas que ya ganan licitaciones COMPIN, y como proveedor directo para isapres/empresas — con la menor complejidad técnica posible que siga sosteniendo la promesa de trazabilidad y calidad. El MVP no busca demostrar todo el potencial tecnológico del producto — busca operar de forma confiable y dejar evidencia (datos, patrones, feedback real) para diseñar bien la fase 2.

**Principio guía:** cada funcionalidad incluida debe resolver un problema que ya confirmamos que existe (procesos desiertos, falta de trazabilidad, riesgo legal por informes débiles). Cada funcionalidad excluida se deja fuera porque depende de datos/volumen que aún no tenemos, o porque un proceso manual es suficiente mientras el volumen sea bajo.

---

## Roles de usuario (3 portales)

1. **Cliente institucional** (isapre, empresa, o la empresa a la que subcontratas si partes como subproveedor)
2. **Médico revisor/auditor**
3. **Backoffice / operaciones** (tu equipo)

---

## Alcance incluido en el MVP

### Portal del cliente institucional
- Ingreso de casos vía formulario estructurado (no integración automática con sistemas externos todavía — carga manual o por planilla).
- Dashboard de estado por caso: *Recibido → En revisión → Informe en validación → Entregado*. Estados simples, sin sub-estados granulares. El listado es filtrable por estado — no se construye una vista agregada aparte, sería duplicar la misma información.
- Descarga de informe final en PDF, con registro de quién lo descargó y cuándo (trazabilidad básica).

### Portal del médico revisor
- Lista de casos asignados, ordenados por vencimiento de plazo.
- Formulario estructurado de evaluación (un formato estándar único al inicio, no uno por tipo de patología — se puede diferenciar más adelante con datos reales de qué varía y qué no).
- Videollamada **nativa integrada vía Daily.co** (componentes de UI prediseñados, no un build custom desde cero) — reemplaza a Meet desde el MVP. Decisión: como la app se construye de todas formas, integrar Daily.co ahora evita reconstruir este módulo más adelante y da control sobre grabación, consentimiento y marca propia desde el día uno.
- **Grabación de la sesión con captura de consentimiento** habilitada desde el MVP (solo almacenamiento — sin transcripción ni borrador automático por IA todavía, eso sigue en fase 2). Se incluye ahora porque construir el módulo de video sin dejar la grabación bien enganchada al flujo de consentimiento significaría volver a tocar el mismo componente más adelante.
- Carga de informe final (documento o formulario que genera el PDF).
- Alerta simple de plazos próximos a vencer (email o notificación in-app, no multicanal todavía).

### Backoffice
- Asignación manual de casos a médicos (una persona del equipo decide, apoyada por una vista de carga de trabajo por médico — no motor automático de asignación).
- Panel de cumplimiento de plazos por cliente/contrato — vista simple tipo tabla, no dashboard analítico avanzado.

> Registro de credenciales de médicos y facturación/cobro por caso: **fuera del alcance de software del MVP** (ver sección "Qué se maneja fuera de la app" más abajo) — con el volumen inicial, una planilla resuelve esto sin restar funcionalidad real al servicio.

### Autenticación y datos
- Login simple por rol (cliente, médico, backoffice) — sin necesidad de SSO corporativo en el MVP.
- Almacenamiento de datos clínicos con cifrado estándar y control de acceso por rol — esto NO es negociable ni siquiera en MVP, por tratarse de datos sensibles de salud (Ley 21.719).

---

## Explícitamente fuera del MVP (y por qué)

| Funcionalidad | Por qué queda fuera ahora |
|---|---|
| **Transcripción asistida por IA + borrador automático de informe** | Es el diferenciador más potente a futuro, pero automatizar la redacción de un documento con peso médico-legal antes de tener el proceso manual bien validado es riesgoso — primero hay que estabilizar el formato y calidad del informe humano, luego entrenar/ajustar la asistencia de IA sobre un proceso ya probado. La grabación con consentimiento sí queda activada desde el MVP (ver alcance incluido) para tener el insumo listo cuando se construya esta pieza. |
| **Motor de asignación automática (matching caso-médico por carga/especialidad)** | Con bajo volumen inicial (fase de subproveedor), la asignación manual por una persona es más simple y más flexible que construir un algoritmo sin datos reales todavía de qué variables importan más. |
| **Integración con imed u otras plataformas externas de licencias** | Automatiza el ingreso de casos, pero requiere validar primero si es técnicamente viable (¿tienen API pública? No confirmado) y si el volumen justifica el desarrollo. Carga manual/por planilla es suficiente al inicio. |
| **App móvil nativa (iOS/Android)** | El MVP debe ser una web app responsive. Una app nativa exige mantención duplicada sin evidencia todavía de que los médicos o clientes la necesiten fuera del navegador. |
| **Certificación CENS propia / módulo de video certificado** | Solo es indispensable si se licita directo a nombre de ConectaMente. En fase de subproveedor no es bloqueante (ver conversación anterior sobre Meet). Se planifica en paralelo, no se bloquea el lanzamiento por esto. |
| **Portales diferenciados por segmento (COMPIN vs. isapre vs. empresa vs. seguros)** | El MVP usa un solo portal de cliente genérico. Diferenciar portales por segmento tiene sentido cuando haya suficiente volumen y aprendizaje de qué necesita cada uno específicamente. |
| **Facturación electrónica automatizada** | A bajo volumen, gestión manual/planilla es suficiente y evita construir integración con SII antes de tiempo. |
| **Notificaciones multicanal (WhatsApp + SMS + email)** | El MVP usa un solo canal (email). Multicanal se justifica cuando el volumen de casos genere fricción real por canal único. |

---

## Qué se maneja fuera de la app en el MVP (proceso manual, no software)

Estas cosas son necesarias para operar el negocio, pero **no necesitan ser parte del software del MVP** — con el volumen inicial, resolverlas manualmente no resta funcionalidad real al servicio, y construirlas ahora sería tiempo de desarrollo que no cambia la experiencia de nadie:

- **Facturación y cobro por caso** → planilla.
- **Registro de credenciales de médicos** (documento, vigencia) → planilla o carpeta compartida.
- **Comunicación comercial con clientes potenciales/nuevos** → correo directo, no CRM integrado.

Criterio para decidir cuándo esto se justifica pasar a software: cuando el volumen o la cantidad de médicos/clientes hace que el error humano en la planilla empiece a ser un riesgo real — no antes.

---

## Criterio general usado en este documento

Cada funcionalidad de este MVP pasó por la pregunta: **¿el servicio deja de ser confiable end-to-end sin esto?** Si la respuesta es no, queda fuera de la app (ya sea en fase 2, o como proceso manual permanente hasta que el volumen lo justifique). Esto es intencional: un MVP "100% funcional" no significa construir todo lo que sería bueno tener — significa que lo que sí se construye funciona de verdad y sostiene la promesa que se le hace al cliente (trazabilidad, cumplimiento de plazo, calidad del informe).



- Transcripción asistida + borrador de informe con IA, sobre formato ya estabilizado y usando las grabaciones ya capturadas desde el MVP.
- Motor de asignación automática.
- Portales diferenciados por segmento de cliente.
- Certificación CENS si se decide licitar directo.

## Fase 3 (aspiracional)

- Interconsultoría Institucional como línea de servicio (requiere trayectoria y reputación ya construida).
- Integraciones API con sistemas de terceros (imed u otros).
- Analítica avanzada / indicadores predictivos de riesgo de fraude en patrones de licencias.

---

## Decisiones de contexto ya resueltas

Volumen esperado, stack del desarrollador, base reutilizable de ConectaMente, primera organización cliente y plazo de lanzamiento — todo esto ya está resuelto y documentado en `03_App_Especificacion_Tecnica_ConectaMente_Core.md`, sección 12.

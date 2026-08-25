import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
// Placeholder de plantillas WhatsApp aprobadas en Meta Business Suite
// Las plantillas reales se crean en la consola de Meta, no aquí

export interface PlantillaWhatsApp {
  nombre: string;
  label: string;
  paramLabels: string[]; // nombres de variables, ej: ["nombre", "fecha"]
}

export const PLANTILLAS_WHATSAPP: PlantillaWhatsApp[] = [
  // Placeholder inicial — agregar plantillas reales una vez aprobadas en Meta
  {
    nombre: 'caso_asignado',
    label: 'Caso asignado',
    paramLabels: ['nombreEvaluado', 'rutEvaluado'],
  },
  {
    nombre: 'informe_listo',
    label: 'Informe listo',
    paramLabels: ['nombreEvaluado'],
  },
];

export function obtenerPlantilla(nombre: string): PlantillaWhatsApp | undefined {
  return PLANTILLAS_WHATSAPP.find((p) => p.nombre === nombre);
}

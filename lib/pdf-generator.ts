import { Caso } from '@prisma/client'

export async function generateCasoPDF(
  caso: Caso & { organizacion: { nombre: string }; medico: { nombre: string } },
  transcription: string
): Promise<string> {
  // Mock PDF generation - in production, use pdfkit or similar
  // Returns a data URL representing the PDF
  const html = `
    <html>
      <body>
        <h1>Informe de Auditoría Médica</h1>
        <h2>${caso.nombreEvaluado}</h2>
        <p><strong>Organización:</strong> ${caso.organizacion.nombre}</p>
        <p><strong>Médico:</strong> ${caso.medico.nombre}</p>
        <p><strong>Estado:</strong> ${caso.estado}</p>
        <p><strong>Fecha Límite:</strong> ${caso.fechaLimite.toLocaleDateString('es-CL')}</p>
        <h3>Transcripción</h3>
        <p>${transcription || 'Sin transcripción disponible'}</p>
        <p><small>Generado: ${new Date().toLocaleString('es-CL')}</small></p>
      </body>
    </html>
  `
  return `data:text/html;base64,${Buffer.from(html).toString('base64')}`
}

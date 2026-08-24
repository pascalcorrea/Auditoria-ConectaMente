import PDFDocument from 'pdfkit'
import type { Caso } from '@prisma/client'

export async function generateCasoPDF(
  caso: Caso & { organizacion: { nombre: string }; medico: { nombre: string } },
  transcription: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument()
    const buffers: Buffer[] = []

    doc.on('data', (chunk: Buffer) => buffers.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(buffers)))
    doc.on('error', reject)

    doc.fontSize(20).text('Informe de Auditoría Médica', { align: 'center' })
    doc.fontSize(12).text(`Caso: ${caso.nombreEvaluado}`, { align: 'center' })
    doc.moveDown()

    doc.fontSize(14).text('Información del Caso', { underline: true })
    doc.fontSize(10)
    doc.text(`Organización: ${caso.organizacion.nombre}`)
    doc.text(`Médico: ${caso.medico.nombre}`)
    doc.text(`Estado: ${caso.estado}`)
    doc.text(`Fecha Límite: ${caso.fechaLimite.toLocaleDateString('es-CL')}`)
    doc.moveDown()

    doc.fontSize(14).text('Transcripción de Sesión', { underline: true })
    doc.fontSize(10).text(transcription || '(Sin transcripción disponible)')
    doc.moveDown()

    doc.fontSize(8).text(`Generado: ${new Date().toLocaleString('es-CL')}`, { align: 'right' })

    doc.end()
  })
}

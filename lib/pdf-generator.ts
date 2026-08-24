interface PDFData {
  nombreEvaluado: string
  rutEvaluado: string
  organizacion: string
  fecha: Date
  medico: string
  antecedentes: string
  hallazgos: string
  diagnosticos: string
  conclusiones: string
  recomendaciones: string
  observaciones: string
}

export async function generatePDFBuffer(data: PDFData): Promise<Buffer> {
  // Dynamic import to avoid issues in edge environments
  const PDFDocument = (await import('pdfkit')).default

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument()
      const chunks: Buffer[] = []

      doc.on('data', (chunk: Buffer) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('Informe de Evaluación', { align: 'center' })
      doc.fontSize(11).font('Helvetica').text('ConectaMente', { align: 'center' })
      doc.moveDown(0.5)

      // Info block
      doc.fontSize(10)
      doc.text(`Fecha: ${data.fecha.toLocaleDateString('es-CL')}`)
      doc.text(`Evaluado: ${data.nombreEvaluado} (${data.rutEvaluado})`)
      doc.text(`Organización: ${data.organizacion}`)
      doc.text(`Médico evaluador: ${data.medico}`)
      doc.moveDown(1)

      // Sections
      const sections = [
        { title: 'Antecedentes', content: data.antecedentes },
        { title: 'Hallazgos clínicos', content: data.hallazgos },
        { title: 'Diagnósticos', content: data.diagnosticos },
        { title: 'Conclusiones', content: data.conclusiones },
      ]

      if (data.recomendaciones) {
        sections.push({ title: 'Recomendaciones', content: data.recomendaciones })
      }

      if (data.observaciones) {
        sections.push({ title: 'Observaciones', content: data.observaciones })
      }

      sections.forEach((section) => {
        doc.fontSize(12).font('Helvetica-Bold').text(section.title)
        doc.fontSize(10).font('Helvetica').text(section.content, { align: 'justify' })
        doc.moveDown(0.5)
      })

      // Footer
      doc.fontSize(8).text('Este documento es confidencial', { align: 'center' })

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}

import bcrypt from 'bcryptjs'

if (process.env.NODE_ENV === 'production') {
  throw new Error('El seed contiene datos de prueba — no ejecutar en producción')
}

const PrismaClient = require('@prisma/client').PrismaClient
const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('ChangeMe123!', 10)

  await prisma.usuario.upsert({
    where: { email: 'backoffice@conectamente.cl' },
    update: {},
    create: {
      nombre: 'Backoffice Demo',
      email: 'backoffice@conectamente.cl',
      passwordHash,
      rol: 'backoffice',
    },
  })

  const isapre = await prisma.organizacion.upsert({
    where: { id: 'seed-org-isapre' },
    update: {},
    create: {
      id: 'seed-org-isapre',
      nombre: 'Isapre Demo',
      tipo: 'isapre',
      plazoSlaDias: 10,
    },
  })

  const empresa = await prisma.organizacion.upsert({
    where: { id: 'seed-org-empresa' },
    update: {},
    create: {
      id: 'seed-org-empresa',
      nombre: 'Empresa Demo',
      tipo: 'empresa',
      plazoSlaDias: 15,
    },
  })

  const medico1 = await prisma.usuario.upsert({
    where: { email: 'medico1@conectamente.cl' },
    update: {},
    create: {
      nombre: 'Dra. María García',
      email: 'medico1@conectamente.cl',
      passwordHash,
      rol: 'medico',
      especialidad: 'psiquiatria',
      organizacionId: isapre.id,
    },
  })

  const medico2 = await prisma.usuario.upsert({
    where: { email: 'medico2@conectamente.cl' },
    update: {},
    create: {
      nombre: 'Dr. Juan Rodríguez',
      email: 'medico2@conectamente.cl',
      passwordHash,
      rol: 'medico',
      especialidad: 'medicina_general',
      organizacionId: empresa.id,
    },
  })

  const clienteIsapre = await prisma.usuario.upsert({
    where: { email: 'cliente-isapre@conectamente.cl' },
    update: {},
    create: {
      nombre: 'Cliente Isapre Demo',
      email: 'cliente-isapre@conectamente.cl',
      passwordHash,
      rol: 'cliente',
      organizacionId: isapre.id,
    },
  })

  const clienteEmpresa = await prisma.usuario.upsert({
    where: { email: 'cliente-empresa@conectamente.cl' },
    update: {},
    create: {
      nombre: 'Cliente Empresa Demo',
      email: 'cliente-empresa@conectamente.cl',
      passwordHash,
      rol: 'cliente',
      organizacionId: empresa.id,
    },
  })

  const cases = [
    {
      id: 'seed-caso-isapre-entregado',
      organizacionId: isapre.id,
      medicoId: medico1.id,
      rutEvaluado: '12345678-5',
      nombreEvaluado: 'Juan Pérez',
      estado: 'entregado' as const,
      tipoLicencia: 'licencia comun',
      prioridad: 'normal' as const,
      fechaEmisionLicencia: new Date('2026-07-01'),
      fechaIngreso: new Date('2026-07-05'),
      fechaLimite: new Date('2026-07-15'),
    },
    {
      id: 'seed-caso-isapre-en-revision',
      organizacionId: isapre.id,
      medicoId: medico1.id,
      rutEvaluado: '98765432-1',
      nombreEvaluado: 'María López',
      estado: 'en_revision' as const,
      tipoLicencia: 'licencia medica',
      prioridad: 'urgente' as const,
      fechaEmisionLicencia: new Date('2026-08-10'),
      fechaIngreso: new Date('2026-08-12'),
      fechaLimite: new Date('2026-08-22'),
    },
    {
      id: 'seed-caso-isapre-recibido',
      organizacionId: isapre.id,
      medicoId: null,
      rutEvaluado: '55555555-5',
      nombreEvaluado: 'Carlos Díaz',
      estado: 'recibido' as const,
      tipoLicencia: 'licencia comun',
      prioridad: 'normal' as const,
      fechaEmisionLicencia: new Date('2026-08-15'),
      fechaIngreso: new Date('2026-08-18'),
      fechaLimite: new Date('2026-08-28'),
    },
    {
      id: 'seed-caso-empresa-entregado',
      organizacionId: empresa.id,
      medicoId: medico2.id,
      rutEvaluado: '40000000-K',
      nombreEvaluado: 'Ana Silva',
      estado: 'entregado' as const,
      tipoLicencia: 'licencia comun',
      prioridad: 'normal' as const,
      fechaEmisionLicencia: new Date('2026-07-01'),
      fechaIngreso: new Date('2026-07-05'),
      fechaLimite: new Date('2026-07-20'),
    },
    {
      id: 'seed-caso-empresa-validacion',
      organizacionId: empresa.id,
      medicoId: medico2.id,
      rutEvaluado: '30000000-9',
      nombreEvaluado: 'Roberto Martín',
      estado: 'informe_en_validacion' as const,
      tipoLicencia: 'licencia medica',
      prioridad: 'urgente' as const,
      fechaEmisionLicencia: new Date('2026-08-08'),
      fechaIngreso: new Date('2026-08-10'),
      fechaLimite: new Date('2026-08-20'),
    },
    {
      id: 'seed-caso-empresa-sesion',
      organizacionId: empresa.id,
      medicoId: medico2.id,
      rutEvaluado: '20000000-3',
      nombreEvaluado: 'Patricia González',
      estado: 'en_revision' as const,
      tipoLicencia: 'licencia comun',
      prioridad: 'normal' as const,
      fechaEmisionLicencia: new Date('2026-08-16'),
      fechaIngreso: new Date('2026-08-18'),
      fechaLimite: new Date('2026-08-28'),
    },
  ]

  for (const casoData of cases) {
    const { id, ...data } = casoData
    await prisma.caso.upsert({
      where: { id },
      update: {},
      create: { id, ...data },
    })
  }

  const casoEntregadoIsapre = await prisma.caso.findUniqueOrThrow({ where: { id: 'seed-caso-isapre-entregado' } })
  await prisma.informe.upsert({
    where: { casoId: casoEntregadoIsapre.id },
    update: {},
    create: {
      casoId: casoEntregadoIsapre.id,
      archivoUrl: 'https://example.com/informe-juan-borrador.pdf',
      archivoFirmadoUrl: 'https://example.com/informe-juan-firmado.pdf',
      generadoPor: medico1.id,
      firmaProveedor: 'firmaweb',
      firmaTimestamp: new Date('2026-07-14'),
    },
  })

  const casoEntregadoEmpresa = await prisma.caso.findUniqueOrThrow({ where: { id: 'seed-caso-empresa-entregado' } })
  await prisma.informe.upsert({
    where: { casoId: casoEntregadoEmpresa.id },
    update: {},
    create: {
      casoId: casoEntregadoEmpresa.id,
      archivoUrl: 'https://example.com/informe-ana-borrador.pdf',
      archivoFirmadoUrl: 'https://example.com/informe-ana-firmado.pdf',
      generadoPor: medico2.id,
      firmaProveedor: 'sovos',
      firmaTimestamp: new Date('2026-07-19'),
    },
  })

  console.log('\n✅ SEED COMPLETADO\n')
  console.log('📋 Backoffice:')
  console.log('   Email: backoffice@conectamente.cl')
  console.log('   Clave: ChangeMe123!\n')
  console.log('👨‍⚕️ Médicos (profesionales):')
  console.log('   Médico 1 (Isapre):')
  console.log('     Email: medico1@conectamente.cl')
  console.log('     Clave: ChangeMe123!')
  console.log('   Médico 2 (Empresa):')
  console.log('     Email: medico2@conectamente.cl')
  console.log('     Clave: ChangeMe123!\n')
  console.log('🏢 Clientes (organizaciones):')
  console.log('   Cliente Isapre:')
  console.log('     Email: cliente-isapre@conectamente.cl')
  console.log('     Clave: ChangeMe123!')
  console.log('   Cliente Empresa:')
  console.log('     Email: cliente-empresa@conectamente.cl')
  console.log('     Clave: ChangeMe123!\n')
  console.log('📊 Casos cargados:')
  console.log('   - 3 casos Isapre (1 entregado, 1 en revisión, 1 recibido)')
  console.log('   - 3 casos Empresa (1 entregado, 1 validación informe, 1 en revisión)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

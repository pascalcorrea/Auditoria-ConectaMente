import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

if (process.env.NODE_ENV === 'production') {
  throw new Error('El seed contiene datos de prueba — no ejecutar en producción')
}

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

  await prisma.usuario.upsert({
    where: { email: 'medico1@conectamente.cl' },
    update: {},
    create: {
      nombre: 'Dra. Medico Uno',
      email: 'medico1@conectamente.cl',
      passwordHash,
      rol: 'medico',
      especialidad: 'psiquiatria',
    },
  })

  await prisma.usuario.upsert({
    where: { email: 'medico2@conectamente.cl' },
    update: {},
    create: {
      nombre: 'Dr. Medico Dos',
      email: 'medico2@conectamente.cl',
      passwordHash,
      rol: 'medico',
      especialidad: 'medicina_general',
    },
  })

  await prisma.usuario.upsert({
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

  await prisma.usuario.upsert({
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

  console.log('Seeded backoffice@conectamente.cl / ChangeMe123!')
  console.log('Seeded medico1@conectamente.cl, medico2@conectamente.cl / ChangeMe123!')
  console.log('Seeded cliente-isapre@conectamente.cl, cliente-empresa@conectamente.cl / ChangeMe123!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

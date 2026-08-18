import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

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
  console.log('Seeded backoffice@conectamente.cl / ChangeMe123!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

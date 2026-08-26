// Prisma v7 config - datasource.url is required by the Prisma CLI
// (migrate/studio); the app's runtime PrismaClient uses its own adapter
// in lib/prisma.ts and does not read this file.
module.exports = {
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
}

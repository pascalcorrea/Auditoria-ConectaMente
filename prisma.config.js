// Prisma v7 config - datasource.url is required by the Prisma CLI
// (migrate/studio); the app's runtime PrismaClient uses its own adapter
// in lib/prisma.ts and does not read this file.
//
// Prisma's CLI evaluates this file before it finishes loading .env itself,
// so process.env.DATABASE_URL isn't populated yet at this point unless we
// load it ourselves first.
require('dotenv').config()

module.exports = {
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
}

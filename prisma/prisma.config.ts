import { defineConfig } from '@prisma/internals'

export default defineConfig({
  datasourceUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/conectamente',
})

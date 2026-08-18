import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  // Load .env / .env.local (Next.js-style) into process.env for test runs,
  // e.g. so lib/prisma.ts can read DATABASE_URL like it does in the Next.js runtime.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))

  return {
    plugins: [react()],
    test: {
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.ts'],
      globals: true,
    },
    resolve: {
      alias: { '@': path.resolve(__dirname, '.') },
    },
  }
})

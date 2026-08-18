import { configDefaults, defineConfig } from 'vitest/config'
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
      // Exclude git worktrees (superpowers:using-git-worktrees creates them
      // under .worktrees/) — otherwise running tests from the main checkout
      // while a worktree exists double-runs every test file it contains.
      exclude: [...configDefaults.exclude, '**/.worktrees/**'],
      // This project's tests hit a real, shared local Postgres (no mocks,
      // no per-worktree isolation) — some tests (e.g. lib/asignacion.test.ts)
      // temporarily mutate shared rows (deactivating pre-existing médicos)
      // for the duration of a test and restore them afterward. Running test
      // files in parallel forks would let those windows overlap across
      // files, causing intermittent cross-file pollution. Run files
      // sequentially instead.
      fileParallelism: false,
    },
    resolve: {
      alias: { '@': path.resolve(__dirname, '.') },
    },
  }
})

'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6">
        <h2 className="mb-2 text-lg font-semibold text-red-800">Error</h2>
        <p className="mb-4 text-sm text-red-700">
          {error.message || 'Algo salió mal. Por favor, intenta de nuevo.'}
        </p>
        <button
          onClick={reset}
          className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  )
}

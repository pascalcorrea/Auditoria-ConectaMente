export function logRequest(method: string, path: string, userId?: string, level: 'info' | 'warn' | 'error' = 'info') {
  const timestamp = new Date().toISOString()
  const userInfo = userId ? ` (user: ${userId})` : ''
  const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
  logFn(`[${timestamp}] [${level.toUpperCase()}] ${method} ${path}${userInfo}`)
}

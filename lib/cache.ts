const cache = new Map<string, { data: unknown; expiry: number }>()

export function getCachedOrFetch<T>(key: string, fetcher: () => Promise<T>, ttlSeconds = 300): Promise<T> {
  const cached = cache.get(key)
  if (cached && cached.expiry > Date.now()) {
    return Promise.resolve(cached.data as T)
  }
  return fetcher().then((data) => {
    cache.set(key, { data, expiry: Date.now() + ttlSeconds * 1000 })
    return data
  })
}

export function invalidateCache(pattern: string) {
  Array.from(cache.keys()).filter((key) => key.includes(pattern)).forEach((key) => cache.delete(key))
}

export function clearCache() {
  cache.clear()
}

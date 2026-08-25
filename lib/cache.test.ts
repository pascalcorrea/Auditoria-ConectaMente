import { describe, it, expect, beforeEach } from 'vitest'
import { getCachedOrFetch, invalidateCache, clearCache } from './cache'

describe('cache', () => {
  beforeEach(() => clearCache())

  it('getCachedOrFetch fetches on first call', async () => {
    let callCount = 0
    const result = await getCachedOrFetch('test', async () => {
      callCount++
      return 'data'
    })
    expect(result).toBe('data')
    expect(callCount).toBe(1)
  })

  it('getCachedOrFetch returns cached result on second call', async () => {
    let callCount = 0
    const fetcher = async () => {
      callCount++
      return 'data'
    }
    await getCachedOrFetch('test', fetcher)
    await getCachedOrFetch('test', fetcher)
    expect(callCount).toBe(1)
  })

  it('invalidateCache clears matching keys', async () => {
    let callCount = 0
    const fetcher = async () => {
      callCount++
      return 'data'
    }
    await getCachedOrFetch('user:1', fetcher)
    invalidateCache('user')
    await getCachedOrFetch('user:1', fetcher)
    expect(callCount).toBe(2)
  })

  it('clearCache removes all entries', async () => {
    let callCount = 0
    const fetcher = async () => {
      callCount++
      return 'data'
    }
    await getCachedOrFetch('key1', fetcher)
    await getCachedOrFetch('key2', fetcher)
    clearCache()
    await getCachedOrFetch('key1', fetcher)
    expect(callCount).toBe(3)
  })
})

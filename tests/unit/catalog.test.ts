import { describe, expect, it } from 'vitest'
import { loadCatalog } from '@/lib/catalog'

describe('catalog result boundary', () => {
  it('distinguishes a successful empty result from a failed request', async () => {
    await expect(loadCatalog(() => Promise.resolve([]))).resolves.toEqual({
      status: 'empty',
      data: [],
    })

    await expect(loadCatalog(() => Promise.reject(new Error('upstream')))).resolves.toMatchObject({
      status: 'failure',
      error: { code: 'UNKNOWN' },
    })
  })

  it('keeps the public failure copy provider-safe', async () => {
    const result = await loadCatalog(() => Promise.reject(new Error('TMDB error 500: secret path')))

    expect(result.status).toBe('failure')
    expect(result.error?.message).toBe('The catalog is temporarily unavailable. Please try again.')
    expect(result.error?.message).not.toContain('secret path')
  })

  it('maps typed TMDB failures to stable catalog codes', async () => {
    const { TMDBError } = await import('@/lib/tmdb')
    const result = await loadCatalog(() => Promise.reject(new TMDBError('TMDB_API_KEY_MISSING')))

    expect(result).toMatchObject({ status: 'failure', error: { code: 'CONFIGURATION' } })
  })
})

import { describe, expect, it, vi } from 'vitest'

const getUser = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({ auth: { getUser } })),
}))

import { getAuthenticatedUser } from '@/lib/supabase/auth'

describe('authenticated account boundary', () => {
  it('returns the server-confirmed user identity', async () => {
    getUser.mockResolvedValueOnce({ data: { user: { id: 'user-a', email: 'a@example.com' } }, error: null })

    await expect(getAuthenticatedUser()).resolves.toEqual({ id: 'user-a', email: 'a@example.com' })
  })

  it('fails closed when there is no session or auth is unavailable', async () => {
    getUser.mockResolvedValueOnce({ data: { user: null }, error: null })
    await expect(getAuthenticatedUser()).resolves.toBeNull()

    getUser.mockRejectedValueOnce(new Error('AUTH_UNAVAILABLE'))
    await expect(getAuthenticatedUser()).resolves.toBeNull()
  })
})

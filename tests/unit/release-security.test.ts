import { afterEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/telegram/webhook/route'
import nextConfig from '../../next.config.mjs'

afterEach(() => vi.unstubAllEnvs())
describe('release security boundaries', () => {
  it('rejects missing webhook configuration before parsing a body', async () => {
    vi.stubEnv('TELEGRAM_WEBHOOK_SECRET', '')
    const response = await POST(new Request('https://veyra.test/api/telegram/webhook', { method: 'POST', body: 'invalid json' }))
    expect(response.status).toBe(401)
  })
  it('rejects a wrong webhook secret before processing', async () => {
    vi.stubEnv('TELEGRAM_WEBHOOK_SECRET', 'expected-secret')
    const response = await POST(new Request('https://veyra.test/api/telegram/webhook', { method: 'POST', headers: { 'x-telegram-bot-api-secret-token': 'wrong' }, body: '{}' }))
    expect(response.status).toBe(401)
  })
  it('permits the configured Supabase origin in CSP for browser sync', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://release-test.supabase.co')
    if (!nextConfig.headers) throw new Error('Next config must define security headers')
    const entries = await (nextConfig.headers as () => Promise<Array<{ headers: Array<{ key: string; value: string }> }>>)()
    const csp = entries[0].headers.find((h: { key: string }) => h.key === 'Content-Security-Policy')!.value
    expect(csp.split('; ').find((s: string) => s.startsWith('connect-src'))).toContain('https://release-test.supabase.co')
  })
})

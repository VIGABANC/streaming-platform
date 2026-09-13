import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { describe, expect, it } from 'vitest'

describe('service worker navigation contract', () => {
  for (const path of ['/movies', '/my-list', '/watch/movie/1']) {
    it(`returns an honest offline response for ${path} without caching personal pages`, async () => {
      const listeners: Record<string, (event: unknown) => void> = {}
      const offline = new Response('You are offline')
      let response: Promise<Response> | undefined
      vm.runInNewContext(readFileSync('public/sw.js', 'utf8'), {
        self: { location: { origin: 'https://veyra.test' }, addEventListener: (type: string, fn: (event: unknown) => void) => { listeners[type] = fn } },
        URL, Response, fetch: async () => { throw new Error('offline') },
        caches: { match: async () => offline },
      })
      listeners.fetch({ request: { url: `https://veyra.test${path}`, mode: 'navigate', method: 'GET' }, respondWith: (value: Promise<Response>) => { response = value } })
      expect(response).toBeDefined()
      expect(await (await response!).text()).toBe('You are offline')
    })
  }
})

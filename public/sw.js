// VEYRA Service Worker — App Shell & Offline Support
// Strictly caches navigation shell & static UI assets. Does NOT cache third-party video streams.

const CACHE_NAME = 'veyra-shell-v2'
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icon.svg',
  '/poster-fallback.svg',
  '/backdrop-fallback.svg'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Never intercept or cache external video streams, iframes, or API calls
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/watch/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/profile') ||
    url.pathname.startsWith('/my-list') ||
    url.pathname.startsWith('/favorites') ||
    url.pathname.startsWith('/history') ||
    url.pathname.startsWith('/settings')
  ) {
    return
  }

  // Network first with offline fallback for navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/offline') || caches.match('/')
      })
    )
    return
  }

  // Only cache immutable framework assets and the explicit app-shell assets.
  const cacheable = url.pathname.startsWith('/_next/static/') || STATIC_ASSETS.includes(url.pathname)
  if (!cacheable) return

  // Stale-while-revalidate for static assets
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetched = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const toCache = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, toCache))
        }
        return networkResponse
      }).catch(() => cached)

      return cached || fetched
    })
  )
})

'use client'

import { useEffect } from 'react'
import { reportClientError, reportWebVital } from '@/lib/observability/client'

export function WebVitals() {
  useEffect(() => {
    const observers: PerformanceObserver[] = []
    let cls = 0
    let inp = 0
    let latestLcp = 0

    const observe = (type: string, callback: (entries: PerformanceEntryList) => void) => {
      if (!('PerformanceObserver' in window) || !PerformanceObserver.supportedEntryTypes?.includes(type)) return
      const observer = new PerformanceObserver((list) => callback(list.getEntries()))
      observer.observe({ type, buffered: true })
      observers.push(observer)
    }

    observe('largest-contentful-paint', (entries) => {
      latestLcp = entries.at(-1)?.startTime ?? latestLcp
    })
    observe('layout-shift', (entries) => {
      for (const entry of entries as (PerformanceEntry & { value?: number; hadRecentInput?: boolean })[]) {
        if (!entry.hadRecentInput) cls += entry.value ?? 0
      }
    })
    observe('event', (entries) => {
      for (const entry of entries as (PerformanceEntry & { duration?: number })[]) inp = Math.max(inp, entry.duration ?? 0)
    })
    observe('first-input', (entries) => {
      for (const entry of entries as (PerformanceEntry & { duration?: number })[]) inp = Math.max(inp, entry.duration ?? 0)
    })

    const report = () => {
      if (latestLcp > 0) reportWebVital('LCP', latestLcp)
      reportWebVital('CLS', cls)
      if (inp > 0) reportWebVital('INP', inp)
    }
    const onVisibilityChange = () => { if (document.visibilityState === 'hidden') report() }
    const onError = () => reportClientError('error')
    const onUnhandledRejection = () => reportClientError('unhandledrejection')

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)

    return () => {
      report()
      observers.forEach((observer) => observer.disconnect())
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
    }
  }, [])

  return null
}

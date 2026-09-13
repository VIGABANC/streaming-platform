'use client'

import { useEffect } from 'react'
import { useReportWebVitals } from 'next/web-vitals'
import { reportClientError, reportWebVital } from '@/lib/observability/client'

const report: Parameters<typeof useReportWebVitals>[0] = ({ name, value }) => {
  // Standard web-vitals accounts for interaction grouping and CLS session windows.
  reportWebVital(name, value)
  window.dispatchEvent(new CustomEvent('veyra-web-vital', { detail: { name, value } }))
}

export function WebVitals() {
  useReportWebVitals(report)
  useEffect(() => {
    const onError = () => reportClientError('error')
    const onUnhandledRejection = () => reportClientError('unhandledrejection')
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
    }
  }, [])
  return null
}

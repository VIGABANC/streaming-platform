import type { Metadata } from 'next'
import { Shell } from '@/components/layout/Shell'
import { AuditReport } from '@/components/audit/AuditReport'

export const metadata: Metadata = {
  title: 'Professional Audit',
  description: 'A product, architecture, reliability, and production-readiness review of VEYRA.',
  robots: { index: false, follow: false },
}

export default function AuditPage() {
  return (
    <Shell>
      <AuditReport />
    </Shell>
  )
}

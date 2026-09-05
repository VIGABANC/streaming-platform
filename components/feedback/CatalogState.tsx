import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'
import type { CatalogFailure } from '@/lib/catalog'

export function CatalogFailureState({
  error,
  resetHref = '/',
}: {
  error?: CatalogFailure
  resetHref?: string
}) {
  const configured = error?.code === 'CONFIGURATION'
  return (
    <ErrorState
      title={configured ? 'Catalog not connected' : 'Unable to load titles'}
      text={error?.message ?? 'The catalog is temporarily unavailable. Please try again.'}
      resetHref={resetHref}
    />
  )
}

export function CatalogEmptyState({ resetHref }: { resetHref?: string }) {
  return (
    <EmptyState
      title="No titles available"
      description="There are no titles to show here yet. Try another section or adjust your filters."
      action={resetHref ? <a href={resetHref} className="text-primary underline underline-offset-4">Reset filters</a> : undefined}
    />
  )
}

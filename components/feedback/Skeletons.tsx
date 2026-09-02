// Rail skeleton
export function SkeletonRail({ count = 6 }: { count?: number }) {
  return (
    <section className="mt-10" aria-hidden="true">
      <div className="mb-4 px-5 lg:px-8">
        <div className="h-5 w-36 animate-pulse rounded bg-white/10" />
      </div>
      <div className="flex gap-3 overflow-hidden px-5 lg:gap-4 lg:px-8">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="aspect-[2/3] w-[145px] shrink-0 animate-pulse rounded-xl bg-white/10 sm:w-[170px] lg:w-[190px]"
          />
        ))}
      </div>
    </section>
  )
}

// Grid skeleton
export function SkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 lg:gap-4"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="aspect-[2/3] animate-pulse rounded-xl bg-white/10" />
      ))}
    </div>
  )
}

// Hero skeleton
export function SkeletonHero() {
  return (
    <div
      aria-hidden="true"
      className="relative min-h-[520px] overflow-hidden bg-surface md:min-h-[600px]"
    >
      <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-white/5 to-transparent" />
      <div className="relative flex min-h-[520px] max-w-2xl flex-col justify-end px-5 pb-16 md:min-h-[600px] lg:px-12 lg:pb-20">
        <div className="mb-4 h-3 w-24 animate-pulse rounded bg-white/10" />
        <div className="h-12 w-64 animate-pulse rounded-lg bg-white/10 sm:h-16 sm:w-80" />
        <div className="mt-4 h-4 w-48 animate-pulse rounded bg-white/10" />
        <div className="mt-4 h-12 w-full max-w-md animate-pulse rounded bg-white/5" />
        <div className="mt-6 flex gap-3">
          <div className="h-11 w-28 animate-pulse rounded-full bg-white/10" />
          <div className="h-11 w-28 animate-pulse rounded-full bg-white/5" />
        </div>
      </div>
    </div>
  )
}

// Episode list skeleton
export function SkeletonEpisodeList({ count = 6 }: { count?: number }) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4 rounded-xl p-3">
          <div className="aspect-video w-36 shrink-0 animate-pulse rounded-lg bg-white/10" />
          <div className="flex flex-1 flex-col justify-center gap-2">
            <div className="h-4 w-48 animate-pulse rounded bg-white/10" />
            <div className="h-3 w-24 animate-pulse rounded bg-white/5" />
            <div className="h-3 w-full animate-pulse rounded bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Detail page skeleton
export function SkeletonDetail() {
  return (
    <div aria-hidden="true" className="p-5 lg:p-12">
      <div className="flex flex-col gap-8 md:flex-row md:items-end">
        <div className="aspect-[2/3] w-40 animate-pulse rounded-xl bg-white/10 md:w-56" />
        <div className="flex-1 space-y-4">
          <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
          <div className="h-10 w-64 animate-pulse rounded-lg bg-white/10" />
          <div className="h-20 w-full max-w-xl animate-pulse rounded bg-white/5" />
          <div className="flex gap-3">
            <div className="h-11 w-32 animate-pulse rounded-full bg-white/10" />
            <div className="h-11 w-24 animate-pulse rounded-full bg-white/5" />
          </div>
        </div>
      </div>
    </div>
  )
}

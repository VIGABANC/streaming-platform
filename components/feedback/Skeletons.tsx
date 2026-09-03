// Skeleton card — matches MediaCard poster dimensions exactly
function SkeletonCard({ landscape = false }: { landscape?: boolean }) {
  return (
    <div
      className={`shrink-0 rounded-xl ${landscape ? 'w-64 aspect-video' : 'w-[145px] sm:w-[170px] lg:w-[190px] aspect-[2/3]'}`}
    >
      <div className="h-full w-full skeleton-shimmer rounded-xl bg-[#0A0D14]" />
    </div>
  )
}

// Rail skeleton — matches MediaRail layout
export function SkeletonRail({ count = 6, landscape = false }: { count?: number; landscape?: boolean }) {
  return (
    <section className="mt-10" aria-hidden="true">
      <div className="mb-4 px-5 lg:px-8">
        <div className="h-5 w-36 skeleton-shimmer rounded bg-white/5" />
      </div>
      <div className="flex gap-3 overflow-hidden px-5 lg:gap-4 lg:px-8">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} landscape={landscape} />
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
        <div key={i} className="aspect-[2/3] skeleton-shimmer rounded-xl bg-[#0A0D14]" />
      ))}
    </div>
  )
}

// Hero skeleton
export function SkeletonHero() {
  return (
    <div
      aria-hidden="true"
      className="relative min-h-[540px] overflow-hidden bg-[#050507] md:min-h-[640px]"
    >
      <div className="absolute inset-0 skeleton-shimmer opacity-50" />
      <div className="relative flex min-h-[540px] max-w-2xl flex-col justify-end px-5 pb-16 md:min-h-[640px] lg:px-12 lg:pb-24">
        <div className="mb-3 h-3 w-28 skeleton-shimmer rounded bg-white/10" />
        <div className="h-14 w-72 skeleton-shimmer rounded-lg bg-white/10 sm:h-20 sm:w-96" />
        <div className="mt-4 flex gap-2">
          <div className="h-4 w-16 skeleton-shimmer rounded bg-white/8" />
          <div className="h-4 w-16 skeleton-shimmer rounded bg-white/8" />
          <div className="h-4 w-24 skeleton-shimmer rounded bg-white/8" />
        </div>
        <div className="mt-4 h-12 w-full max-w-lg skeleton-shimmer rounded bg-white/5" />
        <div className="mt-8 flex gap-3">
          <div className="h-12 w-32 skeleton-shimmer rounded-full bg-[#E50914]/20" />
          <div className="h-12 w-28 skeleton-shimmer rounded-full bg-white/8" />
          <div className="h-12 w-24 skeleton-shimmer rounded-full bg-white/5" />
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
        <div key={i} className="flex gap-4 rounded-xl p-3 bg-[#0A0D14]/50">
          <div className="aspect-video w-36 shrink-0 skeleton-shimmer rounded-lg bg-white/5" />
          <div className="flex flex-1 flex-col justify-center gap-2">
            <div className="h-4 w-48 skeleton-shimmer rounded bg-white/8" />
            <div className="h-3 w-24 skeleton-shimmer rounded bg-white/5" />
            <div className="h-3 w-full skeleton-shimmer rounded bg-white/5" />
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
        <div className="aspect-[2/3] w-40 skeleton-shimmer rounded-xl bg-[#0A0D14] md:w-56" />
        <div className="flex-1 space-y-4">
          <div className="h-3 w-24 skeleton-shimmer rounded bg-white/8" />
          <div className="h-10 w-64 skeleton-shimmer rounded-lg bg-white/10" />
          <div className="h-20 w-full max-w-xl skeleton-shimmer rounded bg-white/5" />
          <div className="flex gap-3">
            <div className="h-12 w-32 skeleton-shimmer rounded-full bg-[#E50914]/20" />
            <div className="h-12 w-24 skeleton-shimmer rounded-full bg-white/8" />
          </div>
        </div>
      </div>
    </div>
  )
}

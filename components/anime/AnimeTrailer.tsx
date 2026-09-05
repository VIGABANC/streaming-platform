import type { AnimeDetail } from '@/lib/anilist'

export function AnimeTrailer({ anime }: { anime: AnimeDetail }) {
  if (!anime.trailer) return null
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://veyra.stream'
  return (
    <section className="px-5 py-8 lg:px-12" aria-label="Official anime trailer">
      <h2 className="section-title mb-5">Official trailer</h2>
      <div className="relative aspect-video max-w-3xl overflow-hidden rounded-2xl bg-black ring-1 ring-white/10 shadow-2xl">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${anime.trailer.videoId}?rel=0&origin=${encodeURIComponent(origin)}`}
          title={`${anime.title} official trailer`}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          className="h-full w-full"
        />
      </div>
    </section>
  )
}

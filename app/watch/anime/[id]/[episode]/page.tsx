import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, CircleOff } from 'lucide-react'
import { notFound } from 'next/navigation'
import { Shell } from '@/components/layout/Shell'
import { isStrictPositiveInteger } from '@/lib/player'

interface AnimeWatchPageProps {
  params: Promise<{ id: string; episode: string }>
}

export async function generateMetadata({ params }: AnimeWatchPageProps): Promise<Metadata> {
  const { id, episode } = await params
  return {
    title: `Watch Anime ${id} Episode ${episode} — VEYRA`,
    description: `Anime episode ${episode} playback is unavailable until a verified provider exists.`,
  }
}

export default async function AnimeWatchPage({ params }: AnimeWatchPageProps) {
  const { id, episode } = await params
  if (!isStrictPositiveInteger(id) || !isStrictPositiveInteger(episode)) notFound()

  return (
    <Shell>
      <div className="mx-auto max-w-[1440px] px-4 pt-6 sm:px-6 lg:px-8">
        <Link href="/browse" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-white">
          <ArrowLeft size={16} />
          Back to catalog
        </Link>
        <div className="mt-6 rounded-2xl border border-white/10 bg-black p-8 text-center">
          <CircleOff size={36} className="mx-auto mb-4 text-primary" aria-hidden="true" />
          <h1 className="text-lg font-bold text-white font-display">Playback unavailable for this media type</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            VEYRA has no verified anime episode provider. No iframe or playback claim is presented.
          </p>
          <p className="mt-3 text-xs text-white/45">Anime {id} · Episode {episode}</p>
        </div>
      </div>
    </Shell>
  )
}

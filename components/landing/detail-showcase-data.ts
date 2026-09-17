import type { MovieDetail, TVDetail } from '@/lib/tmdb'
import { formatRuntime } from '@/lib/utils'

export function detailRuntime(detail: MovieDetail | TVDetail): string {
  const runtime = detail.media_type === 'tv'
    ? detail.episode_run_time?.find((minutes) => minutes > 0)
    : detail.runtime

  return formatRuntime(runtime)
}

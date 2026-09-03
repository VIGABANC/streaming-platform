import Link from 'next/link'
import type { MediaType } from '@/lib/tmdb'

interface GenreTagProps {
  id: number
  name: string
  type: MediaType
  className?: string
}

export function GenreTag({ id, name, type, className = '' }: GenreTagProps) {
  return (
    <Link
      href={`/genre/${type}/${id}`}
      className={`inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-md transition-all duration-200 hover:scale-105 hover:border-primary/50 hover:bg-primary/10 hover:text-white active:scale-95 ${className}`}
    >
      {name}
    </Link>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Play, X } from 'lucide-react'

interface TrailerModalProps {
  trailerKey?: string
  title: string
}

export function TrailerModal({ trailerKey, title }: TrailerModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  if (!trailerKey) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-12 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 text-xs font-semibold text-white hover:border-primary/50 hover:bg-white/15 transition-all hover:scale-[1.02]"
      >
        <Play size={16} fill="currentColor" />
        <span>Watch Trailer</span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title} Official Trailer`}
          className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4 sm:p-8 backdrop-blur-xl animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-black border border-white/15 shadow-2xl"
            style={{ boxShadow: '0 25px 80px rgba(0,0,0,0.9), 0 0 50px rgba(229,9,20,0.2)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 bg-[#0A0D14] px-5 py-3.5">
              <h3 className="font-display text-sm font-bold text-white truncate max-w-md">
                {title} — Official Trailer
              </h3>
              <button
                type="button"
                aria-label="Close trailer"
                onClick={() => setIsOpen(false)}
                className="grid size-8 place-items-center rounded-full text-white/50 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Video Player Frame */}
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`}
                title={`${title} Trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

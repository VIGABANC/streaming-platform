'use client'

import { useEffect, useRef, useState } from 'react'
import { Play, X } from 'lucide-react'

interface TrailerModalProps {
  trailerKey?: string
  title: string
}

export function TrailerModal({ trailerKey, title }: TrailerModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const trailerFrameRef = useRef<HTMLIFrameElement>(null)
  const openerRef = useRef<HTMLButtonElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen && returnFocusRef.current) {
      returnFocusRef.current.focus()
      returnFocusRef.current = null
    }
  }, [isOpen])

  const openModal = () => {
    returnFocusRef.current = openerRef.current
    setIsOpen(true)
  }

  const closeModal = () => setIsOpen(false)

  if (!trailerKey) return null

  return (
    <>
      <button
        ref={openerRef}
        type="button"
        onClick={openModal}
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
          onClick={closeModal}
        >
          <span tabIndex={0} aria-hidden="true" className="sr-only" onFocus={() => trailerFrameRef.current?.focus()} />
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
                ref={closeButtonRef}
                aria-label="Close trailer"
                onClick={closeModal}
                className="grid size-8 place-items-center rounded-full text-white/50 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Video Player Frame */}
            <div className="relative aspect-video w-full bg-black">
              <iframe
                ref={trailerFrameRef}
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`}
                title={`${title} Trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          </div>
          <span tabIndex={0} aria-hidden="true" className="sr-only" onFocus={() => closeButtonRef.current?.focus()} />
        </div>
      )}
    </>
  )
}

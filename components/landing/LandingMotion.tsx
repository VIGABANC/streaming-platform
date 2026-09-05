'use client'

import { useLayoutEffect, useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface LandingMotionProps {
  children: ReactNode
  className?: string
}

export function LandingMotion({ children, className }: LandingMotionProps) {
  const root = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const context = gsap.context(() => {
      const media = gsap.matchMedia()
      const revealTargets = '[data-landing-reveal]'

      media.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(revealTargets, { clearProps: 'all', autoAlpha: 1 })
      })

      media.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          revealTargets,
          { autoAlpha: 0, y: 24 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.65,
            ease: 'power2.out',
            stagger: 0.08,
            scrollTrigger: { trigger: root.current, start: 'top 80%' },
          },
        )
      })

      return () => media.revert()
    }, root)

    return () => context.revert()
  }, [])

  return <div ref={root} className={className}>{children}</div>
}

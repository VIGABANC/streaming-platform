import type { ReactNode } from 'react'

interface LandingSectionProps {
  id: string
  eyebrow: string
  title: string
  description?: string
  children: ReactNode
}

export function LandingSection({
  id,
  eyebrow,
  title,
  description,
  children,
}: LandingSectionProps) {
  const headingId = `${id}-heading`

  return (
    <section id={id} className="landing-section" aria-labelledby={headingId}>
      <div className="signal-spine" aria-hidden="true" />
      <div className="mx-auto max-w-[1440px] px-5 sm:px-6 lg:px-12">
        <header className="mb-7 max-w-2xl">
          <p className="eyebrow">{eyebrow}</p>
          <h2 id={headingId} className="section-title mt-2">{title}</h2>
          {description ? <p className="mt-2 text-sm leading-6 text-white/60">{description}</p> : null}
        </header>
        {children}
      </div>
    </section>
  )
}

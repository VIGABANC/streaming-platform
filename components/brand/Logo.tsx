import Link from 'next/link'

interface LogoProps {
  className?: string
}

/**
 * VEYRA brand logo component.
 *
 * A placeholder wordmark is rendered here.
 * When the final logo asset is provided, replace the SVG mark
 * with an <Image> or updated SVG — the layout won't change.
 */
export function Logo({ className }: LogoProps) {
  return (
    <Link
      href="/"
      aria-label="VEYRA — home"
      className={`inline-flex items-center gap-2.5 select-none focus-visible:outline-primary ${className ?? ''}`}
    >
      {/* V mark — Signal Red to Electric Cyan gradient + Warm Amber signal dot */}
      <span aria-hidden="true" className="relative flex size-8 shrink-0 items-center justify-center">
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-full">
          <rect width="32" height="32" rx="8" fill="#0A0D14" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" />
          <path
            d="M8 10L16 22L24 10"
            stroke="url(#veyra-gradient)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Signal dot */}
          <circle cx="16" cy="22" r="2.2" fill="#FFB300" />
          <defs>
            <linearGradient id="veyra-gradient" x1="8" y1="10" x2="24" y2="10" gradientUnits="userSpaceOnUse">
              <stop stopColor="#E50914" />
              <stop offset="1" stopColor="#00F2FE" />
            </linearGradient>
          </defs>
        </svg>
      </span>
      {/* Wordmark */}
      <span className="text-xl font-bold tracking-[-0.06em] text-white font-display">
        VEYRA
      </span>
    </Link>
  )
}

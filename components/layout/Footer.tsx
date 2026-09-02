import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-white/8 px-5 py-12 md:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          {/* TMDB attribution — required */}
          <p className="text-xs text-muted-foreground max-w-md">
            This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>

          {/* Footer links */}
          <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {[
              { href: '/discover', label: 'Discover' },
              { href: '/my-list', label: 'My List' },
              { href: 'https://www.themoviedb.org/', label: 'TMDB', external: true },
            ].map(({ href, label, external }) => (
              <Link
                key={label}
                href={href}
                {...(external
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
                className="text-xs text-muted-foreground hover:text-white transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Brand line */}
        <p className="mt-6 text-xs text-white/20 font-display tracking-widest uppercase">
          VEYRA — The Night Signal
        </p>
      </div>
    </footer>
  )
}

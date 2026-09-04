'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleDot,
  Gauge,
  LockKeyhole,
  MonitorCheck,
  Play,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TestTube2,
  Zap,
} from 'lucide-react'

const sections = [
  { id: 'overview', label: 'Overview' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'product', label: 'Product clarity' },
  { id: 'reliability', label: 'Reliability' },
  { id: 'security', label: 'Security' },
  { id: 'experience', label: 'Experience' },
  { id: 'roadmap', label: 'Roadmap' },
]

const scorecard = [
  ['Product clarity', 78],
  ['UI / UX', 82],
  ['Visual consistency', 80],
  ['Mobile experience', 76],
  ['Accessibility', 72],
  ['Architecture', 77],
  ['Performance', 70],
  ['Security', 66],
  ['Reliability', 64],
  ['Production readiness', 61],
  ['Brand polish', 84],
]

const architecture = [
  ['/', 'Discovery home', 'Server + client rails', 'TMDB + local store', 'Homepage request waterfall'],
  ['/search', 'Catalog search', 'Client + route handler', 'TMDB + local history', 'Needs abuse controls'],
  ['/movie/[id]', 'Movie detail', 'Server + client', 'TMDB + local store', 'Dense page hierarchy'],
  ['/watch/*', 'External playback', 'Client', 'Third-party embeds', 'Highest reliability risk'],
  ['/provider/*', 'Provider catalog', 'Server', 'TMDB filters', 'Region and TV coverage'],
  ['/my-list', 'Personal library', 'Client', 'localStorage', 'Not account-synced'],
  ['/auth/*', 'Authentication', 'Client + server', 'Supabase', 'Data layer remains local'],
]

const priorities = [
  ['P0', 'Stabilize and document external playback', 'L'],
  ['P1', 'Connect authenticated accounts to user libraries', 'L'],
  ['P1', 'Fix homepage request waterfall', 'S'],
  ['P1', 'Add search rate limiting and validation', 'M'],
  ['P1', 'Complete or remove inactive PWA behavior', 'M'],
  ['P1', 'Merge duplicate provider route systems', 'S'],
  ['P1', 'Add provider region selection', 'M'],
  ['P2', 'Add local store schema versioning', 'M'],
  ['P2', 'Track real watch progress and time remaining', 'M'],
  ['P2', 'Add critical-route E2E coverage', 'M'],
]

function ScoreBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-white/8" aria-label={`${value} out of 100`}>
      <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
    </div>
  )
}

export function AuditReport() {
  const [activeSection, setActiveSection] = useState('overview')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActiveSection(visible.target.id)
      },
      { rootMargin: '-18% 0px -68% 0px', threshold: [0.1, 0.4, 0.8] },
    )
    sections.forEach(({ id }) => document.getElementById(id) && observer.observe(document.getElementById(id)!))
    return () => observer.disconnect()
  }, [])

  const stats = useMemo(() => [
    { label: 'Overall score', value: '74', suffix: '/100', icon: Gauge, tone: 'text-accent' },
    { label: 'Tests passing', value: '36', suffix: '/36', icon: TestTube2, tone: 'text-cyan' },
    { label: 'P0 risks', value: '1', suffix: ' open', icon: AlertTriangle, tone: 'text-primary' },
    { label: 'Review surface', value: '24', suffix: ' routes', icon: MonitorCheck, tone: 'text-foreground' },
  ], [])

  return (
    <div className="px-5 pb-24 pt-10 lg:px-8 lg:pt-14">
      <section id="overview" className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-card px-6 py-10 shadow-card sm:px-10 lg:px-14 lg:py-14">
        <div className="pointer-events-none absolute -right-28 -top-28 size-80 rounded-full bg-primary/12 blur-3xl" />
        <div className="relative max-w-4xl">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className="eyebrow">Professional audit / 04.2026</span>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Internal review</span>
          </div>
          <h1 className="font-display text-balance text-4xl font-semibold tracking-[-0.06em] text-white sm:text-6xl lg:text-7xl">The signal is strong.<br /><span className="text-white/45">Make it dependable.</span></h1>
          <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">VEYRA is a visually strong cinematic discovery frontend with a clear night-signal identity. This audit maps the path from compelling MVP to production-grade product.</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#roadmap" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground transition-transform duration-150 ease-out hover:bg-primary/90 active:scale-[.97]">View the roadmap <ArrowUpRight className="size-4" /></a>
            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground"><Sparkles className="size-4 text-accent" /> Audit complete · desktop and mobile reviewed</span>
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[190px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="eyebrow mb-3">On this page</p>
          <nav aria-label="Audit sections" className="flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-1 lg:overflow-visible">
            {sections.map((section) => (
              <a key={section.id} href={`#${section.id}`} className={`block shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${activeSection === section.id ? 'bg-white/10 text-white' : 'text-muted-foreground hover:bg-white/5 hover:text-white'}`}>{section.label}</a>
            ))}
          </nav>
          <div className="mt-8 hidden border-t border-white/8 pt-5 lg:block">
            <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-white"><ChevronRight className="size-4 rotate-180" /> Back to VEYRA</Link>
          </div>
        </aside>

        <div className="min-w-0 space-y-14">
          <section aria-label="Audit summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map(({ label, value, suffix, icon: Icon, tone }) => (
              <div key={label} className="rounded-2xl border border-white/8 bg-surface p-5">
                <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">{label}</span><Icon className={`size-4 ${tone}`} /></div>
                <p className="mt-5 font-display text-3xl font-semibold tracking-tight text-white">{value}<span className="ml-1 text-sm font-medium text-muted-foreground">{suffix}</span></p>
              </div>
            ))}
          </section>

          <section aria-labelledby="scorecard-title" className="rounded-2xl border border-white/8 bg-surface p-5 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Signal / scorecard</p><h2 id="scorecard-title" className="mt-2 font-display text-2xl font-semibold tracking-tight text-white">A strong surface with a reliability gap.</h2></div><span className="font-mono text-xs text-muted-foreground">11 dimensions</span></div>
            <div className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">{scorecard.map(([label, value]) => <div key={label as string}><div className="mb-2 flex items-center justify-between gap-3 text-xs"><span className="text-muted-foreground">{label}</span><span className="font-mono text-white">{value}</span></div><ScoreBar value={value as number} /></div>)}</div>
          </section>

          <section id="architecture" className="scroll-mt-24">
            <SectionIntro eyebrow="01 / Architecture" title="A complete MVP with a few structural knots." copy="The product surface is broad and coherent. The next level is reducing duplicate concepts, separating failure domains, and making the data model match the account promise." />
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/8 bg-surface">
              <div className="hidden grid-cols-[1.1fr_1.4fr_1.5fr_1.5fr_1.6fr] gap-4 border-b border-white/8 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground md:grid"><span>Route</span><span>Purpose</span><span>Rendering</span><span>Data / state</span><span>Main concern</span></div>
              {architecture.map((row) => <div key={row[0]} className="grid gap-2 border-b border-white/6 px-5 py-4 last:border-0 md:grid-cols-[1.1fr_1.4fr_1.5fr_1.5fr_1.6fr] md:gap-4"><code className="text-xs text-cyan">{row[0]}</code><span className="text-sm font-semibold text-white">{row[1]}</span><span className="text-xs text-muted-foreground">{row[2]}</span><span className="text-xs text-muted-foreground">{row[3]}</span><span className="text-xs text-primary/90">{row[4]}</span></div>)}
            </div>
          </section>

          <section id="product" className="scroll-mt-24">
            <SectionIntro eyebrow="02 / Product clarity" title="VEYRA should own the moment before play." copy="The strongest position is not another content owner. It is the signal layer for deciding what to watch next—taste, availability, momentum, and confidence in one place." />
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <Insight icon={Search} label="Value proposition" title="Discovery with taste" copy="Fast, visually immersive discovery with provider-aware browsing and a clear cinematic identity." />
              <Insight icon={Play} label="Positioning" title="The signal layer" copy="Emphasize what is worth watching next—not ownership of the content itself." />
              <Insight icon={Smartphone} label="MVP foundation" title="Useful personal context" copy="Watchlist, favorites, history, and continue watching are strong foundations once persistence is truthful." />
            </div>
            <div className="mt-4 rounded-2xl border border-accent/20 bg-accent/8 p-6"><p className="font-display text-xl font-semibold tracking-tight text-white sm:text-2xl">“The signal layer for deciding what to watch next.”</p><p className="mt-2 text-sm leading-6 text-muted-foreground">A more ownable promise than competing directly with Netflix or JustWatch.</p></div>
          </section>

          <section id="reliability" className="scroll-mt-24">
            <SectionIntro eyebrow="03 / Reliability" title="The player and persistence layer define trust." copy="The visual product already earns attention. Reliability is what earns return visits: playback recovery, honest account behavior, stable provider coverage, and explicit failure states." />
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Finding priority="P0" title="External playback" copy="Strictly allowlist player origins, isolate the iframe, define minimum permissions, and disclose external providers." icon={LockKeyhole} />
              <Finding priority="P1" title="Account persistence" copy="Supabase auth exists, but the primary library remains local-only. Either make that local-first promise explicit or sync it." icon={CircleDot} />
              <Finding priority="P1" title="Provider coverage" copy="Merge movie and TV provider catalogs, add a URL-persisted region, and make the canonical slug route clear." icon={Zap} />
              <Finding priority="P2" title="Search resilience" copy="Add rate limiting, minimum and maximum query lengths, and rail-level error states that explain recovery." icon={ShieldCheck} />
            </div>
          </section>

          <section id="security" className="scroll-mt-24">
            <SectionIntro eyebrow="04 / Security & delivery" title="Ship the cinematic surface with production guardrails." copy="The current defensive baseline is good, but third-party playback, search abuse, inactive PWA behavior, and CSP looseness should be treated as release gates." />
            <div className="mt-6 rounded-2xl border border-white/8 bg-surface p-5 sm:p-6">
              {[
                ['CSP', 'Remove unsafe-eval where the production toolchain permits it.', 'P1'],
                ['PWA', 'Complete service-worker registration and update behavior, or remove the inactive claim.', 'P1'],
                ['Testing', 'Install Playwright Chromium in CI and add provider, profile, settings, player, and accessibility coverage.', 'P1'],
                ['Privacy', 'Disclose TMDB, external images, player providers, analytics, localStorage, and account data behavior.', 'P2'],
              ].map(([label, copy, priority]) => <div key={label} className="flex flex-col gap-3 border-b border-white/8 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold text-white">{label}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{copy}</p></div><span className={`shrink-0 font-mono text-[10px] font-bold tracking-[0.18em] ${priority === 'P1' ? 'text-primary' : 'text-accent'}`}>{priority}</span></div>)}
            </div>
          </section>

          <section id="experience" className="scroll-mt-24">
            <SectionIntro eyebrow="05 / Experience" title="Keep the atmosphere. Tighten the rhythm." copy="VEYRA’s visual identity is already differentiated. The design move is restraint: fewer competing rails, stronger hierarchy, clearer surfaces, and reduced motion that still feels intentional." />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/8 bg-surface p-6"><div className="flex items-center gap-2 text-cyan"><MonitorCheck className="size-4" /><span className="eyebrow !text-cyan">Strengths</span></div><ul className="mt-5 space-y-3 text-sm leading-6 text-muted-foreground">{['Strong first impression', 'Readable mobile hero', 'Meaningful focus states', 'Provider rail is discoverable', 'Reduced-motion foundation exists'].map((item) => <li key={item} className="flex gap-2"><Check className="mt-1 size-4 shrink-0 text-cyan" />{item}</li>)}</ul></div>
              <div className="rounded-2xl border border-primary/15 bg-primary/5 p-6"><div className="flex items-center gap-2 text-primary"><AlertTriangle className="size-4" /><span className="eyebrow !text-primary">Tighten next</span></div><ul className="mt-5 space-y-3 text-sm leading-6 text-muted-foreground">{['Reduce homepage rail fatigue', 'Clarify Favorites vs Watchlist', 'Improve profile menu keyboard behavior', 'Reserve glow for hero moments', 'Make local metrics explicitly device-scoped'].map((item) => <li key={item} className="flex gap-2"><ChevronRight className="mt-1 size-4 shrink-0 text-primary" />{item}</li>)}</ul></div>
            </div>
          </section>

          <section id="roadmap" className="scroll-mt-24">
            <SectionIntro eyebrow="06 / Roadmap" title="A focused path from 74 to dependable." copy="Prioritize trust-bearing work before adding more surface area. The roadmap below is intentionally sequenced around reliability, account truth, and release confidence." />
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/8 bg-surface">
              {priorities.map(([priority, title, complexity], index) => <div key={title} className="grid grid-cols-[42px_minmax(0,1fr)_30px] items-center gap-3 border-b border-white/8 px-5 py-4 last:border-0 sm:grid-cols-[52px_minmax(0,1fr)_48px_30px]"><span className={`font-mono text-[10px] font-bold tracking-[0.15em] ${priority === 'P0' ? 'text-primary' : priority === 'P1' ? 'text-accent' : 'text-cyan'}`}>{priority}</span><span className="text-sm font-semibold text-white">{title}</span><span className="hidden text-xs text-muted-foreground sm:block">{complexity === 'S' ? 'Small' : complexity === 'M' ? 'Medium' : 'Large'}</span><span className="text-right font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, '0')}</span></div>)}
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3"><RoadmapCard label="Quick wins" time="1 day" copy="Concurrency, canonical routes, validation, warning cleanup, provider and library coverage." /><RoadmapCard label="Professionalization" time="1 week" copy="Supabase sync, schema migrations, provider regions, pagination, PWA lifecycle, and metadata." /><RoadmapCard label="Premium product" time="2–4 weeks" copy="Watch progress, personalized ordering, availability comparison, visual regression, and monitoring." /></div>
          </section>

          <footer className="border-t border-white/8 pt-6 text-xs leading-6 text-muted-foreground"><p>VEYRA Professional Audit · Overall score 74/100 · Prepared for product and engineering review.</p><p className="mt-1">The audit reflects the reviewed repository state and should be revisited after the reliability roadmap lands.</p></footer>
        </div>
      </div>
    </div>
  )
}

function SectionIntro({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return <div className="max-w-3xl"><p className="eyebrow">{eyebrow}</p><h2 className="mt-3 font-display text-balance text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">{title}</h2><p className="mt-4 text-pretty text-sm leading-7 text-muted-foreground sm:text-base">{copy}</p></div>
}

function Insight({ icon: Icon, label, title, copy }: { icon: typeof Search; label: string; title: string; copy: string }) {
  return <div className="rounded-2xl border border-white/8 bg-surface p-5"><Icon className="size-5 text-accent" /><p className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</p><h3 className="mt-2 font-display text-lg font-semibold text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p></div>
}

function Finding({ priority, title, copy, icon: Icon }: { priority: string; title: string; copy: string; icon: typeof LockKeyhole }) {
  return <article className="rounded-2xl border border-white/8 bg-surface p-5"><div className="flex items-start justify-between gap-4"><Icon className="size-5 text-primary" /><span className="font-mono text-[10px] font-bold tracking-[0.18em] text-primary">{priority}</span></div><h3 className="mt-6 font-display text-lg font-semibold text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p></article>
}

function RoadmapCard({ label, time, copy }: { label: string; time: string; copy: string }) {
  return <div className="rounded-2xl border border-white/8 bg-surface p-5"><div className="flex items-center justify-between"><p className="font-display text-lg font-semibold text-white">{label}</p><span className="rounded-full bg-white/6 px-2.5 py-1 font-mono text-[10px] text-muted-foreground">{time}</span></div><p className="mt-4 text-sm leading-6 text-muted-foreground">{copy}</p></div>
}

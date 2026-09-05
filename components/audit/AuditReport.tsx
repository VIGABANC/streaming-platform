'use client'

import Link from 'next/link'
import { ArrowUpRight, CheckCircle2, Clock3, Gauge, ShieldCheck } from 'lucide-react'

const findings = [
  ['F-01', 'Supabase configuration', 'Remediated', 'Optional proxy startup and explicit auth configuration errors; production still needs real public Supabase variables.', 'verified'],
  ['F-02', 'Catalog failure handling', 'Remediated', 'Catalog loaders now distinguish empty results from configuration, network, rate-limit, and upstream failures.', 'verified'],
  ['F-03', 'Account library persistence', 'Implemented / migration pending', 'Local guest data merges deterministically with a versioned Supabase snapshot protected by auth.uid() RLS.', 'pending'],
  ['F-04', 'PWA lifecycle', 'Remediated', 'Production registration, update prompt, cache bypasses for private routes, and required raster icons are present.', 'verified'],
  ['F-05', 'Settings integrity', 'Remediated', 'Default server, ambient lighting, and reduced motion are wired; unsupported autoplay control was removed.', 'verified'],
  ['F-06', 'Mobile filter dialog', 'Remediated', 'The sheet now has dialog semantics, focus trap/return, Escape handling, scroll lock, and an accessible close name.', 'verified'],
  ['F-07', 'JSON-LD script safety', 'Remediated', 'Structured data uses HTML-script-safe escaping with hostile-content regression coverage.', 'verified'],
  ['F-08', 'API hardening', 'Remediated', 'Strict route validation, bounded in-process rate limiting, stable public errors, cache policy, and redacted logs are present.', 'verified'],
  ['F-09', 'SEO discovery and canonical URLs', 'Partially remediated', 'Stable metadata base, canonical detail routes, search noindex, and public-only sitemap routes are present; catalog URL expansion remains a follow-up.', 'pending'],
  ['F-10', 'Performance and observability', 'Remediated / production measurement pending', 'next/font, smaller hero and eager-image budgets, Web Vitals, and privacy-safe client error events are implemented.', 'pending'],
] as const

export function AuditReport() {
  return (
    <div className="mx-auto max-w-[1280px] px-5 py-12 sm:px-8 lg:px-12 lg:py-20">
      <header className="max-w-4xl">
        <p className="eyebrow text-primary">Remediation / 2026-09-05</p>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-[-0.06em] text-white sm:text-6xl">
          The signal is stronger.<br /><span className="text-white/45">Now make deployment truthful.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground">
          This page records the status of the ten findings in the baseline audit. It separates code-level verification from actions that require a real Supabase project or production-device measurement.
        </p>
      </header>

      <section id="overview" className="mt-12 grid gap-4 sm:grid-cols-3" aria-label="Remediation summary">
        <SummaryCard icon={<CheckCircle2 className="size-5 text-accent" />} label="Findings reviewed" value="10 / 10" copy="Each baseline finding has a corresponding code path or explicit gate." />
        <SummaryCard icon={<ShieldCheck className="size-5 text-primary" />} label="Code remediations" value="8" copy="Configuration, reliability, security, accessibility, PWA, settings, and telemetry controls." />
        <SummaryCard icon={<Clock3 className="size-5 text-cyan" />} label="Deployment gates" value="2" copy="Apply the library migration and run production catalog/SEO/performance checks." />
      </section>

      <section id="findings" className="mt-16" aria-labelledby="findings-title">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="eyebrow">Finding ledger</p><h2 id="findings-title" className="mt-2 font-display text-3xl font-semibold tracking-tight text-white">What changed</h2></div>
          <span className="font-mono text-xs text-muted-foreground">Baseline → verified implementation</span>
        </div>
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-surface">
          {findings.map(([id, title, status, copy, state]) => (
            <article key={id} className="grid gap-3 border-b border-white/8 px-5 py-5 last:border-0 md:grid-cols-[76px_220px_230px_minmax(0,1fr)] md:items-start md:gap-5">
              <span className="font-mono text-xs font-bold tracking-[0.16em] text-primary">{id}</span>
              <h3 className="font-semibold text-white">{title}</h3>
              <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] ${state === 'verified' ? 'border-accent/30 bg-accent/10 text-accent' : 'border-primary/30 bg-primary/10 text-primary'}`}>
                {state === 'verified' ? <CheckCircle2 className="size-3" aria-hidden="true" /> : <Clock3 className="size-3" aria-hidden="true" />}
                {status}
              </span>
              <p className="text-sm leading-6 text-muted-foreground">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="verification" className="mt-16 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <div className="rounded-2xl border border-white/10 bg-surface p-6">
          <p className="eyebrow">Verification snapshot</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-white">Evidence from the current branch</h2>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-muted-foreground">
            <li><span className="font-semibold text-white">Passed:</span> `npm ci`, typecheck, lint, unit tests, production build, and production dependency audit.</li>
            <li><span className="font-semibold text-white">Passed:</span> Playwright Chromium and Mobile Chrome smoke coverage, including the mobile filter dialog.</li>
            <li><span className="font-semibold text-white">Measured locally:</span> production homepage returned 200; self-hosted fonts produced zero external font requests in a 390px headless sample.</li>
            <li><span className="font-semibold text-white">Not claimed:</span> live Supabase migration, production credentials, or a production-device Lighthouse score.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-primary/20 bg-primary/[.06] p-6">
          <Gauge className="size-5 text-primary" aria-hidden="true" />
          <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Release gate</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-white">Two actions remain outside the codebase</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Apply the versioned Supabase migration in the target project, then run the production route matrix and real-device performance check with valid provider credentials.</p>
          <Link href="/profile" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-white">Open the account surface <ArrowUpRight className="size-4" /></Link>
        </div>
      </section>
    </div>
  )
}

function SummaryCard({ icon, label, value, copy }: { icon: React.ReactNode; label: string; value: string; copy: string }) {
  return <div className="rounded-2xl border border-white/10 bg-surface p-5"><div>{icon}</div><p className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</p><p className="mt-2 font-display text-3xl font-semibold text-white">{value}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p></div>
}

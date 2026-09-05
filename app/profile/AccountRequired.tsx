import Link from 'next/link'
import { Shell } from '@/components/layout/Shell'

export function AccountRequired() {
  return (
    <Shell>
      <main className="mx-auto flex min-h-[60vh] max-w-xl items-center px-5 py-16">
        <section className="w-full rounded-3xl border border-white/10 bg-[#0A0D14] p-8 text-center shadow-2xl sm:p-12" aria-labelledby="account-required-title">
          <p className="eyebrow text-primary">Private signal</p>
          <h1 id="account-required-title" className="mt-3 font-display text-3xl font-bold text-white">Sign in to your account</h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-white/60">
            Your profile and account-backed library are private. Guest browsing and device-local lists remain available without an account.
          </p>
          <Link href="/auth/login" className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90">
            Sign in
          </Link>
        </section>
      </main>
    </Shell>
  )
}

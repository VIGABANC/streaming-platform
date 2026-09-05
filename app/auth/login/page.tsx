'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigError } from '@/lib/config'
import { Shell } from '@/components/layout/Shell'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('')
    let authError: Error | null = null
    try {
      const { error } = await createClient().auth.signInWithPassword({ email, password })
      authError = error
    } catch (error) {
      authError = error instanceof Error ? error : new Error('AUTH_REQUEST_FAILED')
    }
    setBusy(false)
    if (authError) {
      setError(isSupabaseConfigError(authError) ? 'Authentication is not configured for this environment.' : authError.message.toLowerCase().includes('confirm') ? 'Confirm your email before signing in.' : 'Invalid email or password.')
      return
    }
    router.push('/profile'); router.refresh()
  }
  return <Shell><main className="mx-auto flex min-h-[70vh] max-w-md items-center px-5 py-12"><form onSubmit={submit} className="w-full space-y-6 rounded-2xl border border-white/10 bg-[#0A0D14] p-7"><div><p className="eyebrow text-primary">The Night Signal</p><h1 className="mt-2 font-display text-3xl font-extrabold text-white">Return to VEYRA</h1><p className="mt-2 text-sm text-white/60">Sign in to sync your library across every screen.</p></div><label className="block text-sm text-white/70">Email<input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none focus:border-primary" /></label><label className="block text-sm text-white/70">Password<input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none focus:border-primary" /></label>{error && <p role="alert" className="text-sm text-rose-300">{error}</p>}<button disabled={busy} className="w-full rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground disabled:opacity-50">{busy ? 'Connecting…' : 'Sign in'}</button><p className="text-center text-sm text-white/50">New to VEYRA? <Link href="/auth/sign-up" className="text-primary hover:underline">Create an account</Link></p></form></main></Shell>
}

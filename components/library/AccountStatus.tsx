'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

export function AccountStatus() {
  const [signedIn, setSignedIn] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    try {
      const { data } = createClient().auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => setSignedIn(Boolean(session)))
      return () => data.subscription.unsubscribe()
    } catch { /* Local library remains available without account configuration. */ }
  }, [])
  async function signOut() {
    setBusy(true)
    setError('')
    try {
      const { error } = await createClient().auth.signOut({ scope: 'local' })
      if (error) throw error
    } catch { setError('Could not sign out. Reconnect and try again.') }
    finally { setBusy(false) }
  }
  return <section aria-label="Library account" className="rounded-xl border border-white/10 p-4 text-sm text-muted-foreground">
    <p>{signedIn ? 'Account library: changes sync while connected. Signing out restores the anonymous library on this device. Unsynced account changes stay saved separately until you sign in again.' : 'Anonymous library: saved on this device. Signing in merges it into your account. It is not shared with other devices until sync succeeds.'}</p>
    {signedIn ? <button type="button" className="mt-3 min-h-11 rounded-lg border border-white/20 px-4 text-white" disabled={busy} onClick={() => void signOut()}>{busy ? 'Signing out…' : 'Sign out on this device'}</button> : <Link href="/auth/login" className="mt-3 inline-flex min-h-11 items-center rounded-lg border border-white/20 px-4 text-white">Sign in to sync</Link>}
    {error && <p role="alert">{error}</p>}
  </section>
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { clearLocalLibrary } from '@/lib/library/local-repository'
import { createClient } from '@/lib/supabase/client'

export function SignOutButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function handleSignOut() {
    setBusy(true)
    try {
      const { error } = await createClient().auth.signOut()
      if (error) return
      clearLocalLibrary()
      router.replace('/auth/login?signout=1')
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <button type="button" onClick={handleSignOut} disabled={busy} className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 transition-colors hover:border-white/30 hover:bg-white/10 disabled:cursor-wait disabled:opacity-50">
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { Settings, Edit2 } from 'lucide-react'
import { store, type UserProfile } from '@/lib/store'
import Link from 'next/link'

export function ProfileCard() {
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    setProfile(store.getProfile())
    
    const unsubscribe = subscribeToStoreChange()
    return unsubscribe
  }, [])

  function subscribeToStoreChange() {
    const handler = () => setProfile(store.getProfile())
    window.addEventListener('veyra-store-change', handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener('veyra-store-change', handler)
      window.removeEventListener('storage', handler)
    }
  }

  if (!profile) return null

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0A0D14] p-6 shadow-xl sm:p-8">
      {/* Decorative background glow */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-[80px]" />
      
      <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center">
        {/* Avatar */}
        <div className="relative size-24 shrink-0 overflow-hidden rounded-full border-2 border-white/10 bg-white/5 sm:size-32">
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/40 to-primary/10 text-4xl uppercase text-white shadow-inner">
            {profile.name.charAt(0)}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
                {profile.name}
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                Member since {new Date(profile.joinedAt).toLocaleDateString()}
              </p>
            </div>
            
            <Link 
              href="/settings"
              className="inline-flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Settings size={18} />
            </Link>
          </div>

          <p className="mt-4 text-sm text-white/80 leading-relaxed max-w-xl">
            {profile.bio}
          </p>
        </div>
      </div>
    </div>
  )
}

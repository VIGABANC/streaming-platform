'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  User,
  Heart,
  Bookmark,
  Star,
  Clock,
  History,
  Settings,
  Download,
  Upload,
  ChevronRight,
  Edit2,
  Check,
  Play,
} from 'lucide-react'
import { Shell } from '@/components/layout/Shell'
import { MediaCard } from '@/components/media/MediaCard'
import {
  store,
  subscribeToStorageChanges,
  type UserProfile,
  type WatchStats,
  type FavoriteItem,
  type WatchlistItem,
  type RatingItem,
  type HistoryItem,
  showToast,
} from '@/lib/store'
import type { MediaType } from '@/lib/tmdb'

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<WatchStats | null>(null)
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [ratings, setRatings] = useState<RatingItem[]>([])
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [bioInput, setBioInput] = useState('')
  const [mounted, setMounted] = useState(false)

  const reload = () => {
    const prof = store.getProfile()
    setProfile(prof)
    setNameInput(prof.name)
    setBioInput(prof.bio)
    setStats(store.getWatchStats())
    setFavorites(store.getFavorites())
    setWatchlist(store.getWatchlist())
    setRatings(store.getRatings())
    setHistory(store.getHistory())
  }

  useEffect(() => {
    setMounted(true)
    reload()
    return subscribeToStorageChanges('all', reload)
  }, [])

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nameInput.trim()) return
    const updated = store.updateProfile({
      name: nameInput.trim(),
      bio: bioInput.trim(),
    })
    setProfile(updated)
    setIsEditing(false)
    showToast({
      title: 'Profile updated',
      type: 'success',
    })
  }

  const handleExport = () => {
    const data = store.exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `veyra-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast({
      title: 'Data backup exported',
      type: 'success',
    })
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      if (text) {
        const ok = store.importData(text)
        if (ok) {
          reload()
          showToast({
            title: 'Data restored successfully',
            type: 'success',
          })
        } else {
          showToast({
            title: 'Failed to import backup file',
            description: 'Invalid JSON structure',
            type: 'error',
          })
        }
      }
    }
    reader.readAsText(file)
  }

  if (!mounted || !profile || !stats) {
    return (
      <Shell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="size-9 animate-spin rounded-full border-2 border-white/20 border-t-primary" />
        </div>
      </Shell>
    )
  }

  const joinedDateStr = new Date(profile.joinedAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <Shell>
      <div className="mx-auto max-w-[1440px] px-5 py-8 lg:px-12 space-y-10">
        {/* Profile Card Header */}
        <section
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#121620] via-[#0A0D14] to-[#050507] p-6 lg:p-10 shadow-2xl"
          style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(229,9,20,0.1)' }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar Ring */}
              <div
                className="relative grid size-24 sm:size-28 place-items-center rounded-full bg-gradient-to-tr from-primary via-primary/80 to-cyan text-white shadow-xl ring-4 ring-white/10"
                style={{ boxShadow: '0 0 30px rgba(229,9,20,0.4)' }}
              >
                <User size={48} />
              </div>

              {/* Identity & Bio */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_#E50914]" />
                  <span>The Night Signal Pioneer</span>
                </div>

                {isEditing ? (
                  <form onSubmit={handleSaveProfile} className="mt-2 space-y-2">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="rounded-lg border border-primary bg-black/60 px-3 py-1.5 text-lg font-bold text-white focus:outline-none"
                      placeholder="Display Name"
                      maxLength={30}
                    />
                    <textarea
                      value={bioInput}
                      onChange={(e) => setBioInput(e.target.value)}
                      className="block w-full rounded-lg border border-white/20 bg-black/60 p-2 text-xs text-white/80 focus:outline-none"
                      rows={2}
                      placeholder="Your personal bio..."
                      maxLength={160}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-white"
                      >
                        <Check size={12} /> Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="rounded-full border border-white/20 px-3 py-1.5 text-xs text-white/60 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-white mt-1">
                      {profile.name}
                    </h1>
                    <p className="mt-1 text-xs sm:text-sm text-white/70 max-w-lg leading-relaxed">
                      {profile.bio}
                    </p>
                    <p className="mt-2 text-[11px] text-white/40">Member since {joinedDateStr}</p>
                  </>
                )}
              </div>
            </div>

            {/* Top Right Action buttons */}
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 hover:border-white/30 hover:bg-white/10 transition-colors"
                >
                  <Edit2 size={13} />
                  <span>Edit Profile</span>
                </button>
              )}
              <Link
                href="/settings"
                className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:text-white transition-colors"
                title="Settings"
              >
                <Settings size={16} />
              </Link>
            </div>
          </div>
        </section>

        {/* Watch Stats Grid */}
        <section aria-label="Watch Stats">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="glass-panel rounded-2xl p-4 text-center">
              <History size={18} className="mx-auto mb-1.5 text-cyan" />
              <p className="font-display text-2xl sm:text-3xl font-bold text-white">
                {stats.totalWatchedCount}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-white/50 mt-1">Watched</p>
            </div>

            <div className="glass-panel rounded-2xl p-4 text-center">
              <Bookmark size={18} className="mx-auto mb-1.5 text-primary" />
              <p className="font-display text-2xl sm:text-3xl font-bold text-white">
                {stats.watchlistCount}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-white/50 mt-1">Watchlist</p>
            </div>

            <div className="glass-panel rounded-2xl p-4 text-center">
              <Heart size={18} className="mx-auto mb-1.5 text-rose-500" />
              <p className="font-display text-2xl sm:text-3xl font-bold text-white">
                {stats.favoritesCount}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-white/50 mt-1">Favorites</p>
            </div>

            <div className="glass-panel rounded-2xl p-4 text-center">
              <Star size={18} className="mx-auto mb-1.5 text-amber-400" />
              <p className="font-display text-2xl sm:text-3xl font-bold text-white">
                {stats.ratingsCount}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-white/50 mt-1">Rated Titles</p>
            </div>

            <div className="glass-panel rounded-2xl p-4 text-center">
              <span className="inline-block text-amber-400 font-bold text-base mb-0.5">★</span>
              <p className="font-display text-2xl sm:text-3xl font-bold text-white">
                {stats.averageGivenRating ? `${stats.averageGivenRating}` : '—'}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-white/50 mt-1">Avg Given</p>
            </div>

            <div className="glass-panel rounded-2xl p-4 text-center">
              <Clock size={18} className="mx-auto mb-1.5 text-emerald-400" />
              <p className="font-display text-2xl sm:text-3xl font-bold text-white">
                {stats.continueWatchingCount}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-white/50 mt-1">In Progress</p>
            </div>
          </div>
        </section>

        {/* Favorites Rail Preview */}
        {favorites.length > 0 && (
          <section aria-label="Favorites Preview">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart size={18} className="text-rose-500" />
                <h2 className="section-title">My Favorites</h2>
              </div>
              <Link
                href="/favorites"
                className="inline-flex items-center gap-1 text-xs font-bold text-rose-500 hover:text-white transition-colors"
              >
                <span>View All ({favorites.length})</span>
                <ChevronRight size={13} />
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {favorites.slice(0, 8).map((item) => (
                <MediaCard
                  key={item.id}
                  item={{
                    ...item,
                    media_type: item.media_type as MediaType,
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Watchlist Rail Preview */}
        {watchlist.length > 0 && (
          <section aria-label="Watchlist Preview">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bookmark size={18} className="text-primary" />
                <h2 className="section-title">Watchlist</h2>
              </div>
              <Link
                href="/my-list"
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-white transition-colors"
              >
                <span>View All ({watchlist.length})</span>
                <ChevronRight size={13} />
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {watchlist.slice(0, 8).map((item) => (
                <MediaCard
                  key={item.id}
                  item={{
                    ...item,
                    media_type: item.media_type as MediaType,
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Recently Watched Activity Feed */}
        {history.length > 0 && (
          <section aria-label="Recent Activity">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History size={18} className="text-cyan" />
                <h2 className="section-title">Recent Stream Activity</h2>
              </div>
              <Link
                href="/history"
                className="inline-flex items-center gap-1 text-xs font-bold text-cyan hover:text-white transition-colors"
              >
                <span>Full History ({history.length})</span>
                <ChevronRight size={13} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {history.slice(0, 6).map((item) => {
                const watchHref = item.media_type === 'tv'
                  ? `/watch/tv/${item.id}/${item.season || 1}/${item.episode || 1}`
                  : `/watch/movie/${item.id}`

                return (
                  <div
                    key={`${item.id}-${item.season}-${item.episode}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-[#0A0D14] p-3 hover:border-white/20 transition-all"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-white truncate">{item.title}</p>
                      {item.season && item.episode ? (
                        <p className="text-[11px] font-mono text-cyan">
                          S{item.season} E{item.episode}
                        </p>
                      ) : (
                        <p className="text-[11px] text-white/50">Feature Film</p>
                      )}
                    </div>
                    <Link
                      href={watchHref}
                      className="grid size-8 place-items-center rounded-full bg-white/10 text-white hover:bg-primary hover:text-white transition-colors shrink-0"
                    >
                      <Play size={12} fill="currentColor" className="ml-0.5" />
                    </Link>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Data Backup & Cloud Portability Toolbar */}
        <section className="rounded-2xl border border-white/10 bg-[#0A0D14] p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-bold text-base text-white">Data & Library Portability</h3>
              <p className="text-xs text-white/60 mt-0.5">
                Export your personal watchlist, history, and ratings as a JSON file, or restore on another browser.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:border-white/30 hover:bg-white/10 transition-colors"
              >
                <Download size={13} />
                <span>Export Library</span>
              </button>

              <label className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:border-white/30 hover:bg-white/10 transition-colors cursor-pointer">
                <Upload size={13} />
                <span>Import Backup</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </section>
      </div>
    </Shell>
  )
}

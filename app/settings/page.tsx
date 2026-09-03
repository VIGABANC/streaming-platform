'use client'

import { useState, useEffect } from 'react'
import {
  Settings as SettingsIcon,
  Sliders,
  Trash2,
  Download,
  AlertTriangle,
  Shield,
  Info,
} from 'lucide-react'
import { Shell } from '@/components/layout/Shell'
import { store, type UserSettings, showToast } from '@/lib/store'
import { PROVIDERS } from '@/lib/player'

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setSettings(store.getSettings())
  }, [])

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    if (!settings) return
    const updated = store.updateSettings({ [key]: value })
    setSettings(updated)
    showToast({
      title: 'Setting saved',
      type: 'success',
      durationMs: 2000,
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
      title: 'Settings and library exported',
      type: 'success',
    })
  }

  const handleClearHistory = () => {
    store.clearHistory()
    showToast({
      title: 'Watch history cleared',
      type: 'info',
    })
  }

  const handleResetAll = () => {
    store.clearAll()
    setSettings(store.getSettings())
    setShowResetConfirm(false)
    showToast({
      title: 'All personal data has been reset',
      type: 'warning',
    })
  }

  if (!mounted || !settings) {
    return (
      <Shell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="size-9 animate-spin rounded-full border-2 border-white/20 border-t-primary" />
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="mx-auto max-w-4xl px-5 py-8 lg:px-12 space-y-8">
        {/* Header */}
        <div className="border-b border-white/10 pb-6">
          <div className="flex items-center gap-2 text-primary mb-2">
            <SettingsIcon size={18} />
            <p className="eyebrow text-primary">Preferences</p>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white">
            App Settings
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-white/60">
            Configure player behaviors, default embed providers, and local storage data.
          </p>
        </div>

        {/* Playback Preferences */}
        <section className="rounded-2xl border border-white/10 bg-[#0A0D14] p-6 space-y-6">
          <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
            <Sliders size={18} className="text-primary" />
            <h2 className="font-display text-lg font-bold text-white">Playback & Player</h2>
          </div>

          {/* Autoplay toggle */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white">Autoplay Next Episode</p>
              <p className="text-xs text-white/50">
                Automatically transition to the next episode when watching television series.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.autoplayNext}
              onClick={() => updateSetting('autoplayNext', !settings.autoplayNext)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.autoplayNext ? 'bg-primary' : 'bg-white/10'
              }`}
            >
              <span
                className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.autoplayNext ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Default Server */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Default Video Server</p>
                <p className="text-xs text-white/50">
                  Select which stream provider to initialize first in the player.
                </p>
              </div>
            </div>
            <select
              value={settings.defaultServer}
              onChange={(e) => updateSetting('defaultServer', e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/60 p-3 text-xs font-semibold text-white focus:border-primary focus:outline-none"
            >
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.badge}
                </option>
              ))}
            </select>
          </div>

          {/* Ambient Lighting */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white">Ambient Cinema Lighting</p>
              <p className="text-xs text-white/50">
                Display a subtle reactive glow surrounding the video frame during playback.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.ambientLighting}
              onClick={() => updateSetting('ambientLighting', !settings.ambientLighting)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.ambientLighting ? 'bg-primary' : 'bg-white/10'
              }`}
            >
              <span
                className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.ambientLighting ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </section>

        {/* Data & Privacy */}
        <section className="rounded-2xl border border-white/10 bg-[#0A0D14] p-6 space-y-6">
          <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
            <Shield size={18} className="text-cyan" />
            <h2 className="font-display text-lg font-bold text-white">Data & Local Storage</h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">Clear Stream History</p>
              <p className="text-xs text-white/50">Wipe the list of recently played titles.</p>
            </div>
            <button
              type="button"
              onClick={handleClearHistory}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:border-white/30 transition-colors self-start sm:self-auto"
            >
              <Trash2 size={13} />
              <span>Clear History</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">Export Full Profile & Library</p>
              <p className="text-xs text-white/50">Save your watchlists, favorites, and ratings to a local JSON backup.</p>
            </div>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:border-white/30 transition-colors self-start sm:self-auto"
            >
              <Download size={13} />
              <span>Export JSON</span>
            </button>
          </div>

          <div className="pt-4 border-t border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-rose-400">Danger Zone: Reset All Data</p>
              <p className="text-xs text-white/50">
                Permanently clear watchlists, favorites, ratings, and custom profile details.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500 hover:text-white transition-colors self-start sm:self-auto"
            >
              <AlertTriangle size={13} />
              <span>Reset Everything</span>
            </button>
          </div>

          {showResetConfirm && (
            <div className="rounded-xl border border-rose-500/50 bg-rose-950/40 p-4 space-y-3">
              <p className="text-xs font-bold text-rose-300">
                Are you completely sure? This cannot be undone unless you have a JSON backup.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="rounded-full bg-rose-600 px-4 py-1.5 text-xs font-bold text-white shadow hover:bg-rose-700"
                >
                  Yes, wipe everything
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="rounded-full border border-white/20 px-3 py-1.5 text-xs text-white/70 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>

        {/* System Info */}
        <section className="rounded-2xl border border-white/5 bg-[#0A0D14]/50 p-5 flex items-center justify-between text-xs text-white/40">
          <div className="flex items-center gap-2">
            <Info size={14} />
            <span>VEYRA Web Platform • Version 1.0.0</span>
          </div>
          <span>Obsidian Night Signal Design System</span>
        </section>
      </div>
    </Shell>
  )
}

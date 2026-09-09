'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { CheckCircle2, Flag } from 'lucide-react'
import { MISSING_AVAILABILITY_COPY, parseMissingAvailabilityReport } from '@/lib/missing-availability'
import type { SearchIntent } from '@/lib/search-intent'
import { STORE_KEYS } from '@/lib/store'

const REPORTS_KEY = STORE_KEYS.missingAvailabilityReports

type Props = {
  query: string
  intent?: SearchIntent | null
}

export function MissingAvailabilityReport({ query, intent }: Props) {
  const [open, setOpen] = useState(false)
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [savedRemotely, setSavedRemotely] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    try {
      const report = parseMissingAvailabilityReport({
        source: 'tmdb',
        region: typeof navigator !== 'undefined' ? navigator.language.split('-')[1] : undefined,
        mediaType: intent?.mediaType ?? undefined,
        description: description || `Search returned no results for “${query}”.`,
      })
      try {
        const response = await fetch('/api/missing-availability', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(report),
        })
        if (response.ok) {
          setSavedRemotely(true)
          setSubmitted(true)
          return
        }
      } catch {
        // Signed-out or unavailable Supabase: retain a local report instead.
      }
      const existing = JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]')
      localStorage.setItem(REPORTS_KEY, JSON.stringify([{ ...report, query }, ...existing].slice(0, 25)))
      setSubmitted(true)
    } catch {
      setError('Please keep the description under 500 characters and try again.')
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto mt-5 flex max-w-lg items-center justify-center gap-2 text-sm text-emerald-300" role="status">
        <CheckCircle2 size={16} aria-hidden="true" />
        {savedRemotely ? 'Report submitted securely. Thank you for helping improve coverage.' : 'Report saved on this device. Sign in to submit it securely.'}
      </div>
    )
  }

  return (
    <div className="mx-auto mt-5 max-w-lg">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-surface px-4 py-2 text-xs font-semibold text-white hover:border-primary"
        >
          <Flag size={14} aria-hidden="true" />
          Report missing availability
        </button>
      ) : (
        <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-surface/70 p-5 text-left">
          <h3 className="text-sm font-semibold text-white">Can&apos;t find it?</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{MISSING_AVAILABILITY_COPY}</p>
          <label className="mt-4 block text-xs font-medium text-white" htmlFor="missing-description">
            Optional details
          </label>
          <textarea
            id="missing-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={500}
            rows={3}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white outline-none focus:border-primary"
            placeholder="Tell us what you expected to find…"
          />
          {error && <p className="mt-2 text-xs text-red-300" role="alert">{error}</p>}
          <div className="mt-4 flex gap-2">
            <button type="submit" className="min-h-11 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">Save report</button>
            <button type="button" onClick={() => setOpen(false)} className="min-h-11 rounded-full border border-white/10 px-4 py-2 text-xs text-white/80">Cancel</button>
          </div>
        </form>
      )}
    </div>
  )
}

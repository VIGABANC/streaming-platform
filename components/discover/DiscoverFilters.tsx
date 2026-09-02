'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Filter, X, SlidersHorizontal, RotateCcw } from 'lucide-react'
import { genres, sortOptions, languageOptions, type MediaType } from '@/lib/tmdb'

const YEARS = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i)

const RATING_OPTIONS = [
  { label: 'Any Rating', value: '' },
  { label: '9+ Masterpiece', value: '9' },
  { label: '8+ Outstanding', value: '8' },
  { label: '7+ Great', value: '7' },
  { label: '6+ Good', value: '6' },
]

export function DiscoverFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const activeType = (searchParams.get('type') as MediaType) || 'movie'
  const activeGenre = searchParams.get('genre') || ''
  const activeYear = searchParams.get('year') || ''
  const activeRating = searchParams.get('rating') || ''
  const activeSort = searchParams.get('sort') || 'popularity.desc'
  const activeLang = searchParams.get('language') || ''

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    // If switching media type, reset genre if not matching
    if (key === 'type') {
      params.delete('genre')
    }
    startTransition(() => {
      router.push(`/discover?${params.toString()}`, { scroll: false })
    })
  }

  const resetFilters = () => {
    startTransition(() => {
      router.push(`/discover?type=${activeType}`, { scroll: false })
    })
    setMobileFiltersOpen(false)
  }

  const activeGenreList = activeType === 'tv' ? genres.tv : genres.movie
  const activeSortList = activeType === 'tv' ? sortOptions.tv : sortOptions.movie

  const hasActiveFilters = Boolean(
    activeGenre || activeYear || activeRating || activeLang || (activeSort && activeSort !== 'popularity.desc')
  )

  const FilterControls = () => (
    <div className="space-y-6">
      {/* Media Type Toggle */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Content Type
        </label>
        <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl bg-surface p-1 border border-white/10">
          <button
            type="button"
            onClick={() => updateParam('type', 'movie')}
            className={`rounded-lg py-2 text-xs font-semibold transition-all ${
              activeType === 'movie'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            Movies
          </button>
          <button
            type="button"
            onClick={() => updateParam('type', 'tv')}
            className={`rounded-lg py-2 text-xs font-semibold transition-all ${
              activeType === 'tv'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            TV Series
          </button>
        </div>
      </div>

      {/* Sort By */}
      <div>
        <label htmlFor="filter-sort" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Sort By
        </label>
        <select
          id="filter-sort"
          value={activeSort}
          onChange={(e) => updateParam('sort', e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-surface px-3 py-2.5 text-xs text-white outline-none focus:border-primary"
        >
          {activeSortList.map((s) => (
            <option key={s.value} value={s.value} className="bg-[#0F1020] text-white">
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Genres */}
      <div>
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Genre
          </label>
          {activeGenre && (
            <button
              type="button"
              onClick={() => updateParam('genre', '')}
              className="text-[11px] text-primary hover:underline"
            >
              Clear
            </button>
          )}
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1 no-scrollbar">
          <button
            type="button"
            onClick={() => updateParam('genre', '')}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              !activeGenre
                ? 'bg-primary text-primary-foreground'
                : 'border border-white/10 bg-surface text-white/70 hover:text-white hover:border-white/20'
            }`}
          >
            All Genres
          </button>
          {activeGenreList.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => updateParam('genre', activeGenre === String(g.id) ? '' : String(g.id))}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                activeGenre === String(g.id)
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-white/10 bg-surface text-white/70 hover:text-white hover:border-white/20'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>

      {/* Minimum Rating */}
      <div>
        <label htmlFor="filter-rating" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Minimum Rating
        </label>
        <select
          id="filter-rating"
          value={activeRating}
          onChange={(e) => updateParam('rating', e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-surface px-3 py-2.5 text-xs text-white outline-none focus:border-primary"
        >
          {RATING_OPTIONS.map((r) => (
            <option key={r.value} value={r.value} className="bg-[#0F1020] text-white">
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {/* Release Year */}
      <div>
        <label htmlFor="filter-year" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Release Year
        </label>
        <select
          id="filter-year"
          value={activeYear}
          onChange={(e) => updateParam('year', e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-surface px-3 py-2.5 text-xs text-white outline-none focus:border-primary"
        >
          <option value="" className="bg-[#0F1020] text-white">
            All Years
          </option>
          {YEARS.map((y) => (
            <option key={y} value={String(y)} className="bg-[#0F1020] text-white">
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Language */}
      <div>
        <label htmlFor="filter-lang" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Original Language
        </label>
        <select
          id="filter-lang"
          value={activeLang}
          onChange={(e) => updateParam('language', e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-surface px-3 py-2.5 text-xs text-white outline-none focus:border-primary"
        >
          {languageOptions.map((l) => (
            <option key={l.code} value={l.code} className="bg-[#0F1020] text-white">
              {l.name}
            </option>
          ))}
        </select>
      </div>

      {/* Reset All Filters */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={resetFilters}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-white transition-colors"
        >
          <RotateCcw size={14} />
          Reset all filters
        </button>
      )}
    </div>
  )

  return (
    <>
      {/* Mobile Filter Toggle Button */}
      <div className="flex items-center justify-between lg:hidden mb-6">
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-surface px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:border-primary"
        >
          <SlidersHorizontal size={14} className="text-primary" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="size-2 rounded-full bg-accent animate-pulse" />
          )}
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs text-muted-foreground hover:text-white"
          >
            Reset
          </button>
        )}
      </div>

      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:block w-64 shrink-0 rounded-2xl border border-white/10 bg-[#121324]/80 p-5 backdrop-blur-md h-fit sticky top-24"
        aria-label="Filter Catalog"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Filter size={16} className="text-primary" />
            <span>Filters</span>
          </div>
          {isPending && (
            <div className="size-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          )}
        </div>
        <FilterControls />
      </aside>

      {/* Mobile Slide-out Drawer / Sheet */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileFiltersOpen(false)}
          />
          {/* Sheet */}
          <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-[#0F1020] p-6 shadow-2xl overflow-y-auto border-l border-white/10 z-10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                <div className="flex items-center gap-2 font-semibold text-white">
                  <Filter size={18} className="text-primary" />
                  <span>Filters</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="rounded-full p-2 text-muted-foreground hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
              <FilterControls />
            </div>

            <div className="mt-8 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full rounded-xl bg-primary py-3 text-center text-xs font-semibold text-primary-foreground"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

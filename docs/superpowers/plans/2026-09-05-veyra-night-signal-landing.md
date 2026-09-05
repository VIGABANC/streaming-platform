# VEYRA Night Signal Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/` a polished, cinematic VEYRA landing page powered by real TMDB data while moving the existing discovery feed to `/browse` and preserving the application’s working routes and features.

**Architecture:** Keep `/` and `/browse` as separate Server Component entry points. Extract the existing browse feed into a reusable server-rendered component for `/browse`, then compose the landing page from focused server/client sections under `components/landing`. Keep TMDB access server-side, pass serializable data to client islands, and use scoped GSAP contexts for motion.

**Tech Stack:** Next.js 16.3.3 App Router, React 19, TypeScript 5.7, Tailwind CSS 4, `next/image`, GSAP 3.15 with ScrollTrigger, Lucide icons, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-05-veyra-night-signal-landing-design.md`

## Global Constraints

- The public landing experience is `/`; the full catalog experience is `/browse`.
- `TMDB_API_KEY` remains server-only; browser components may receive only serializable media/detail data.
- Reuse existing TMDB, store, player, poster, fallback, PWA, and route utilities where they fit.
- GSAP is already installed; do not add another animation library or premium GSAP plugin.
- Every GSAP component scopes animations to a root, cleans up with `gsap.context()`/`matchMedia().revert()`, and supports `prefers-reduced-motion`.
- Existing user edits in `app/my-list/page.tsx`, `app/profile/page.tsx`, and `components/player/PlayerFrame.tsx` must remain intact.
- No fake testimonials, metrics, awards, social accounts, hosted-media claims, or non-existent legal pages.
- Use `next/image`, stable aspect ratios, explicit `sizes`, and `priority` only for the hero artwork.
- Maintain semantic landmarks, one H1, visible focus, keyboard access, 44px touch targets, and native touch scrolling.
- Existing unrelated typecheck failures must be isolated from landing changes or fixed only when a safe, direct fix is available.

## File map

### Create

- `components/browse/HomeFeed.tsx` — existing catalog home data loading and rendering extracted from `app/page.tsx`.
- `components/landing/LandingMotion.tsx` — scoped shared reveal/parallax helper for landing sections.
- `components/landing/LandingSection.tsx` — shared section wrapper, eyebrow, heading, and signal-spine marker.
- `components/landing/MediaPosterCard.tsx` — stable, accessible landing poster card.
- `components/landing/landing-types.ts` — serializable landing data shapes shared by server and client sections.
- `tests/unit/landing-data.test.ts` — safe landing-data selection and normalization tests.

### Modify

- `app/page.tsx` — render the landing route with server-side parallel data loading.
- `app/browse/page.tsx` — render the extracted browse feed inside `Shell`.
- `app/landing/page.tsx` — redirect legacy landing route to `/` or delegate without duplicating content.
- `components/layout/Header.tsx` — make application Home point to `/browse` and keep active states correct.
- `components/layout/MobileNav.tsx` — support application and landing variants without breaking the small-screen navigation contract.
- `components/landing/LandingNav.tsx` — complete semantic desktop/mobile navigation and clean GSAP/menu behavior.
- `components/landing/CinematicHero.tsx` — live metadata, stable fallback, and restrained hero motion.
- `components/landing/MediaRailSection.tsx` — real links, stable cards, fallbacks, and scoped reveal.
- `components/landing/HomeCatalog.tsx` — replace the old ad-hoc rail block with the landing narrative sections.
- `components/landing/DiscoveryShowcase.tsx` — data-driven category artwork composition.
- `components/landing/SearchShowcase.tsx` — real `/api/search` interactive demo and state handling.
- `components/landing/DetailShowcase.tsx` — real representative detail data and detail/trailer links.
- `components/landing/EpisodeShowcase.tsx` — real season/episode data and accessible season interaction.
- `components/landing/LibraryShowcase.tsx` — actual browser library state and empty states.
- `components/landing/PlayerShowcase.tsx` — honest illustrative player frame with provider disclaimer.
- `components/landing/DeviceShowcase.tsx` — CSS-based responsive device composition.
- `components/landing/FinalCTA.tsx` — atmospheric close and real browse/trending links.
- `components/landing/LandingFooter.tsx` — complete real-link footer and attribution copy.
- `app/globals.css` — VEYRA tokens, landing primitives, spine, card/rail states, responsive polish, and reduced-motion defaults.
- `app/layout.tsx` — root metadata/canonical refinement only if the landing route requires it.
- `tests/e2e/home.spec.ts` — root landing assertions and `/browse` feed assertion.
- `tests/e2e/navigation.spec.ts` — landing/app navigation expectations where route split changes URLs.

## Implementation tasks

### Task 1: Establish the route split without changing the visual system

**Files:**
- Create: `components/browse/HomeFeed.tsx`
- Modify: `app/page.tsx`
- Modify: `app/browse/page.tsx`
- Modify: `app/landing/page.tsx`
- Test: `tests/e2e/home.spec.ts`

**Interfaces:**
- `HomeFeed` accepts no props, performs the current parallel catalog loading, and returns the current browse feed states.
- `/` becomes the landing page entry point in a later task; `/browse` must be a working catalog route after this task.

- [ ] **Step 1: Record the current route contracts.**

  Inspect `app/page.tsx`, `app/browse/page.tsx`, `components/layout/Shell.tsx`, and `tests/e2e/home.spec.ts`. Preserve the current `HomeFeed` logic exactly while moving it.

- [ ] **Step 2: Extract the existing feed into a server component.**

  Move the current `Feed`, `loadMediaList`, and `HomeFeed` definitions into `components/browse/HomeFeed.tsx`, retaining the same `Suspense`, catalog, hero, rail, provider, empty, and failure behavior. Keep the module server-safe by importing only server-compatible catalog/TMDB helpers and shared components.

- [ ] **Step 3: Render the extracted feed at `/browse`.**

  Replace the redirect in `app/browse/page.tsx` with:

  ```tsx
  import { Suspense } from 'react'
  import { Shell } from '@/components/layout/Shell'
  import { HomeFeed } from '@/components/browse/HomeFeed'
  import { SkeletonHero, SkeletonRail } from '@/components/feedback/Skeletons'

  export default function BrowsePage() {
    return (
      <Shell>
        <Suspense fallback={<><SkeletonHero /><SkeletonRail /><SkeletonRail /></>}>
          <HomeFeed />
        </Suspense>
      </Shell>
    )
  }
  ```

- [ ] **Step 4: Temporarily point `/` at the landing entry shape.**

  Update `app/page.tsx` only after `/browse` serves the feed, leaving a server page boundary ready to receive the landing data loader in Task 3. Keep the legacy `/landing` route from producing a second canonical landing page.

- [ ] **Step 5: Add a route regression assertion.**

  Extend `tests/e2e/home.spec.ts` with a `/browse` visit that asserts the application header and a catalog landmark are present. Keep root assertions for header/footer/skip link so the landing implementation must satisfy the existing accessibility contract.

- [ ] **Step 6: Run the focused checks.**

  Run `npm run test:e2e -- tests/e2e/home.spec.ts` and `npm run typecheck`. The e2e test should pass for `/browse`; typecheck may still report the known unrelated `my-list`/`profile` failures.

- [ ] **Step 7: Commit the route split.**

  ```bash
  git add app/page.tsx app/browse/page.tsx app/landing/page.tsx components/browse/HomeFeed.tsx tests/e2e/home.spec.ts
  git commit -m "refactor: separate Veyra landing and browse routes"
  ```

### Task 2: Add the landing visual foundation and typed data contracts

**Files:**
- Create: `components/landing/landing-types.ts`
- Create: `components/landing/LandingSection.tsx`
- Create: `components/landing/LandingMotion.tsx`
- Create: `components/landing/MediaPosterCard.tsx`
- Modify: `app/globals.css`
- Test: `tests/unit/landing-data.test.ts`

**Interfaces:**
- `LandingData` contains serializable lists and optional detail/season data; it must not contain promises, functions, `Response` objects, or API secrets.
- `LandingSection` accepts `id`, `eyebrow`, `title`, optional `description`, and children.
- `MediaPosterCard` accepts `{ item: Media; priority?: boolean; size?: 'rail' | 'feature' }` and links to `/${mediaType}/${id}`.
- `LandingMotion` accepts children plus `className` and provides a root for scoped client animation.

- [ ] **Step 1: Define serializable landing types and normalization helpers.**

  Add types for `LandingLists`, `LandingDetail`, and `LandingData` using existing `Media`, `MovieDetail`, `TVDetail`, `SeasonDetail`, and `WatchProvider` types. Add pure functions with exact behavior:

  ```ts
  export function mediaTypeOf(item: Media): MediaType
  export function mediaHref(item: Media): string
  export function usableMedia(items: Media[], limit?: number): Media[]
  export function firstWithBackdrop(items: Media[]): Media | undefined
  ```

  `usableMedia` excludes people, requires an id, keeps missing-art fallback items only when the caller has no better item, and respects the limit.

- [ ] **Step 2: Write normalization tests first.**

  In `tests/unit/landing-data.test.ts`, cover movie vs TV hrefs, exclusion of people, first usable backdrop selection, missing fields, and stable list limits. Use small in-file fixtures typed as `Media`.

- [ ] **Step 3: Run the new unit test to verify it fails.**

  Run `npm test -- tests/unit/landing-data.test.ts`. It should fail until the helpers exist.

- [ ] **Step 4: Implement the minimal typed helpers.**

  Use `titleOf`, `yearOf`, and existing media-type conventions from `lib/tmdb.ts`; do not introduce a second TMDB URL builder.

- [ ] **Step 5: Run the new unit test to verify it passes.**

  Run `npm test -- tests/unit/landing-data.test.ts` and then `npm test`.

- [ ] **Step 6: Add the shared section and poster primitives.**

  `LandingSection` must render a semantic `<section>` with stable heading ids and the signal-spine marker. `MediaPosterCard` must render `next/image` with fixed aspect ratio, explicit `sizes`, poster fallback behavior, rating/year/type metadata, and a keyboard-visible focus state without layout-expanding hover content.

- [ ] **Step 7: Add the motion helper with reduced-motion branches.**

  Use a client component with `useLayoutEffect`, `gsap.context`, `gsap.matchMedia`, `ScrollTrigger`, and a root ref. The reduced-motion branch must clear transforms and leave content visible. The helper must revert all match-media listeners and triggers on unmount.

- [ ] **Step 8: Add the VEYRA visual tokens.**

  Update `app/globals.css` with the spec palette, display/body utilities, `.landing-section`, `.signal-spine`, `.landing-rail`, `.landing-poster`, and reduced-motion behavior. Keep existing application tokens compatible; do not remove utility classes used outside landing.

- [ ] **Step 9: Run checks and commit the foundation.**

  Run `npm run lint`, `npm test`, and `git diff --check`, then commit:

  ```bash
  git add components/landing/landing-types.ts components/landing/LandingSection.tsx components/landing/LandingMotion.tsx components/landing/MediaPosterCard.tsx app/globals.css tests/unit/landing-data.test.ts
  git commit -m "feat: add Veyra landing visual foundation"
  ```

### Task 3: Build the server landing data loader and cinematic hero/navigation

**Files:**
- Modify: `app/page.tsx`
- Modify: `components/landing/CinematicHero.tsx`
- Modify: `components/landing/LandingNav.tsx`
- Modify: `components/layout/MobileNav.tsx`
- Modify: `components/layout/Header.tsx`
- Modify: `components/brand/Logo.tsx` only if the logo needs an accessible landing size variant
- Test: `tests/e2e/home.spec.ts`
- Test: `tests/e2e/navigation.spec.ts`

**Interfaces:**
- `LandingPage` loads `LandingData` in a Server Component and passes plain props to client sections.
- `CinematicHero` accepts `{ item?: Media }` and renders a fully usable fallback when absent.
- `LandingNav` accepts no secret or server-only props; it owns scroll background and mobile-menu state.
- `MobileNav` accepts `{ variant?: 'app' | 'landing' }`, defaults to `'app'`, and renders the existing five labels for both variants with variant-specific Home/Discover hrefs.

- [ ] **Step 1: Select the representative detail candidates before fetching.**

  Fetch the primary lists in parallel, then choose the first TV item with an id for season/detail enrichment and the first movie with a backdrop for detail fallback. Make at most one movie detail request and one TV detail/season path; catch each enrichment independently.

- [ ] **Step 2: Add a server-safe result wrapper.**

  Implement a local helper in `app/page.tsx` or `lib/landing-data.ts` with this shape:

  ```ts
  async function safe<T>(loader: () => Promise<T>, fallback: T): Promise<T> {
    try { return await loader() } catch { return fallback }
  }
  ```

  Use it per list so one TMDB failure does not blank the whole page.

- [ ] **Step 3: Render the landing shell and data-driven sections scaffold.**

  Return the skip link, `LandingNav`, a `<main id="main-content">`, signal spine, and landing sections. Keep narrative headings in the server-rendered HTML. Do not import a client component that forces the entire page into the client graph.

- [ ] **Step 4: Complete the landing navigation.**

  Add `Home`, `Discover`, `Movies`, `TV Shows`, `Search`, `Watchlist`, and the Explore VEYRA CTA to `nav[aria-label="Main navigation"]`. Add immediate keyboard access, Escape-to-close, `aria-expanded`, `aria-controls`, focus-visible styles, and a controlled CSS/GSAP menu reveal that does not gate navigation.

- [ ] **Step 5: Fix application shell route semantics.**

  In `Header.tsx`, change application Home to `/browse` and use `/browse` for the active application home. In `MobileNav.tsx`, keep root landing Home at `/` for the landing variant and `/browse` for the application variant. Ensure the root still exposes visible Home, Movies, TV, Discover, and My List labels at 390px.

- [ ] **Step 6: Rebuild the hero with stable live data.**

  Use `backdrop(item.backdrop_path, 'w1280')`, `next/image`, `priority`, and `sizes="100vw"`. Render title metadata, year, rating, media type, up to three genres, overview, Start Exploring (`/browse`), Trending Tonight (`#trending-tonight`), and the `/` search hint. If artwork is missing, render a dark signal composition with the same copy and no broken image.

- [ ] **Step 7: Add the hero GSAP timeline.**

  Use a root-scoped context and match media. Animate only backdrop transform/opacity, atmosphere opacity, and content y/opacity. Add desktop-only parallax and skip it for mobile/reduced motion. Leave the H1/CTA visible when motion is reduced or initialization fails.

- [ ] **Step 8: Run focused navigation checks.**

  Run `npm run lint`, `npm run typecheck`, and `npm run test:e2e -- tests/e2e/home.spec.ts tests/e2e/navigation.spec.ts`. Record only the known unrelated type errors if they remain.

- [ ] **Step 9: Commit the route-aware hero.**

  ```bash
  git add app/page.tsx components/landing/CinematicHero.tsx components/landing/LandingNav.tsx components/layout/MobileNav.tsx components/layout/Header.tsx tests/e2e/home.spec.ts tests/e2e/navigation.spec.ts
  git commit -m "feat: add Veyra cinematic landing hero"
  ```

### Task 4: Add real discovery rails and the category discovery story

**Files:**
- Modify: `components/landing/MediaRailSection.tsx`
- Modify: `components/landing/HomeCatalog.tsx`
- Modify: `components/landing/DiscoveryShowcase.tsx`
- Modify: `components/landing/landing-types.ts` if category props need extension
- Test: `tests/e2e/home.spec.ts`

**Interfaces:**
- `MediaRailSection` accepts `{ id: string; title: string; subtitle?: string; items: Media[]; href?: string }`.
- `HomeCatalog` accepts `LandingData` and renders the section order after the hero.
- `DiscoveryShowcase` accepts `{ categories: Array<{ label: string; href: string; items: Media[] }>; }` and renders real artwork links.

- [ ] **Step 1: Define the rail contract.**

  Replace direct selector assumptions with a root ref and stable data attributes. Each rail renders a semantic heading, optional Browse link, native overflow container, 6–10 real cards, and a quiet empty/error state when its list is empty.

- [ ] **Step 2: Implement stable poster-card interactions.**

  Use `MediaPosterCard` for title/year/rating/type metadata. Hover/focus may scale the image by 1–3% and reveal an overlay without changing card dimensions. Keep touch scrolling native and avoid hover-only actions.

- [ ] **Step 3: Add one parent-level ScrollTrigger.**

  Animate the rail heading and cards from opacity/y/scale with one context-scoped timeline. Use a reduced-motion branch that sets final state. Do not create a trigger for every card.

- [ ] **Step 4: Build the live “Trending Tonight” rail.**

  Use the filtered trending list first and include the `id="trending-tonight"` anchor. The rail must appear immediately after the hero/provider cue so the product is proven above the fold.

- [ ] **Step 5: Replace generic discovery cards with artwork-led categories.**

  Use Popular, Top Rated, Now Playing, Airing Today/On The Air with real poster/backdrop items. Use an asymmetric lead artwork plus smaller stacked artwork; category labels link to `/movies`, `/tv`, `/discover`, or `/new` as appropriate. Keep decorative numbering out unless it represents a real category order.

- [ ] **Step 6: Add missing-data and mobile treatments.**

  Render a useful copy-only category state when a list fails. At mobile widths, stack the composition and preserve readable text, native rails, and no horizontal page overflow.

- [ ] **Step 7: Run and commit the discovery slice.**

  Run `npm run lint`, `npm test`, and the root e2e test. Commit:

  ```bash
  git add components/landing/MediaRailSection.tsx components/landing/HomeCatalog.tsx components/landing/DiscoveryShowcase.tsx components/landing/landing-types.ts tests/e2e/home.spec.ts
  git commit -m "feat: add live discovery rails to Veyra landing"
  ```

### Task 5: Build the Universal Finder and detail experience showcases

**Files:**
- Modify: `components/landing/SearchShowcase.tsx`
- Modify: `components/landing/DetailShowcase.tsx`
- Modify: `app/api/search/route.ts` only if the existing response shape cannot support the demo
- Test: `tests/unit/landing-data.test.ts`
- Test: `tests/e2e/search.spec.ts`

**Interfaces:**
- `SearchShowcase` accepts `{ initialItems: Media[] }`, calls `/api/search?q=...`, and has loading/empty/error/results states.
- `DetailShowcase` accepts `{ detail?: MovieDetail | TVDetail }` and links to the actual detail route.

- [ ] **Step 1: Verify the existing search response before coding.**

  Inspect `app/api/search/route.ts` and `app/search/page.tsx`. Preserve their query, URL, debounce, and filter semantics. Do not create a second search endpoint.

- [ ] **Step 2: Write search showcase state tests.**

  Add pure tests for media-result normalization and empty/error label selection. Keep browser debounce behavior covered by the existing Playwright search flow.

- [ ] **Step 3: Implement the interactive finder.**

  Render a real labeled search input with immediate focus, a `/` keyboard hint, fetch results after a short debounce, poster thumbnails, title, media type, year, rating, and links. Abort or ignore stale requests, cap displayed results, and expose a direct “Open full search” link.

- [ ] **Step 4: Add accessible states.**

  Use `aria-live="polite"` for result-count/status text, preserve input value on errors, show “No signals found” with a browse link for empty results, and show a retry/full-search action for errors. Reduced motion must not change availability.

- [ ] **Step 5: Implement the detail showcase from real data.**

  Use the server-provided detail backdrop/poster, title, tagline/overview, year, rating, runtime when available, genres, cast names when available, a real detail link, and `TrailerModal` only when a YouTube trailer exists. Keep copy and metadata readable over artwork with a dark gradient.

- [ ] **Step 6: Add scoped motion.**

  Use one reveal timeline for the finder shell and one for the detail composition. Animate scale/opacity/y only; do not animate input focus or each keystroke.

- [ ] **Step 7: Run and commit.**

  Run `npm test -- tests/unit/landing-data.test.ts`, `npm run test:e2e -- tests/e2e/search.spec.ts`, and `npm run lint`, then commit:

  ```bash
  git add components/landing/SearchShowcase.tsx components/landing/DetailShowcase.tsx app/api/search/route.ts tests/unit/landing-data.test.ts tests/e2e/search.spec.ts
  git commit -m "feat: add live finder and detail showcases"
  ```

### Task 6: Build TV seasons, library, player, device, CTA, and footer sections

**Files:**
- Modify: `components/landing/EpisodeShowcase.tsx`
- Modify: `components/landing/LibraryShowcase.tsx`
- Modify: `components/landing/PlayerShowcase.tsx`
- Modify: `components/landing/DeviceShowcase.tsx`
- Modify: `components/landing/FinalCTA.tsx`
- Modify: `components/landing/LandingFooter.tsx`
- Modify: `components/landing/HomeCatalog.tsx`
- Test: `tests/e2e/navigation.spec.ts`

**Interfaces:**
- `EpisodeShowcase` accepts `{ detail?: TVDetail; season?: SeasonDetail }` and renders real episode fields or an explicit unavailable state.
- `LibraryShowcase` accepts no server-only state and hydrates browser state from the existing store.
- `PlayerShowcase` accepts `{ item?: Media }` only for display labels and never claims ownership/hosting.
- `FinalCTA` accepts `{ item?: Media }` for a real trending link.

- [ ] **Step 1: Inspect existing store and player interfaces.**

  Read `lib/store.ts`, `components/player/PlayerFrame.tsx`, and library components before editing. Use the existing watchlist/favorites/continue-watching keys and merge logic; do not duplicate persistence.

- [ ] **Step 2: Implement the season selector as a real control.**

  Use buttons or a native select with `aria-pressed`/`aria-selected`, stable episode row dimensions, real still images when present, episode number/title/runtime/air date/overview, and a no-season state with a link to TV discovery. Use short crossfade/directional transitions only after state changes.

- [ ] **Step 3: Implement live library hydration.**

  On mount, read existing store state, subscribe to its cross-tab update mechanism if available, and render Continue Watching progress, Watchlist, and Favorites. A new visitor sees helpful empty-state copy and `/browse`/`/my-list` links. Progress values render correctly without animation under reduced motion.

- [ ] **Step 4: Implement the player showcase honestly.**

  Render a responsive 16:9 frame with play/progress/loading/timeout/recovery affordances as static illustrative UI. Include the exact third-party provider disclaimer and a link to actual playback only when a real item is available. Do not use a video background.

- [ ] **Step 5: Add device composition and final CTA/footer.**

  Use CSS-only desktop/tablet/mobile frames and copy about responsive navigation, installable PWA, persistent library, keyboard, and touch support. Final CTA links to `/browse` and a real trending title if available. Footer links only to existing routes and includes both TMDB and no-hosting disclaimers.

- [ ] **Step 6: Add scoped reveal/progress motion.**

  Progress bars animate once when visible; all section content remains server/client-rendered and visible if GSAP fails. Disable parallax and large transforms on mobile/reduced motion.

- [ ] **Step 7: Run route checks and commit.**

  Run `npm run test:e2e -- tests/e2e/navigation.spec.ts`, `npm run lint`, and `npm test`, then commit:

  ```bash
  git add components/landing/EpisodeShowcase.tsx components/landing/LibraryShowcase.tsx components/landing/PlayerShowcase.tsx components/landing/DeviceShowcase.tsx components/landing/FinalCTA.tsx components/landing/LandingFooter.tsx components/landing/HomeCatalog.tsx tests/e2e/navigation.spec.ts
  git commit -m "feat: complete Veyra landing product story"
  ```

### Task 7: Responsive, accessibility, SEO, performance, and visual QA pass

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`
- Modify: `app/robots.ts` and `app/sitemap.ts` only if route/canonical coverage is incomplete
- Modify: `tests/e2e/home.spec.ts`
- Modify: `tests/e2e/navigation.spec.ts`
- Create: `tests/e2e/landing.spec.ts` if focused landing behavior is not covered by existing tests

**Interfaces:**
- The final route graph has `/` as landing and `/browse` as catalog.
- Browser-visible content works with normal motion, reduced motion, failed artwork, failed partial TMDB requests, no library state, and no search results.

- [ ] **Step 1: Add focused landing e2e assertions.**

  Assert the single H1, hero CTA links, trending anchor, semantic main/footer, desktop nav at 1440px, five-item mobile nav at 390px, mobile menu open/close with `aria-expanded`, and `/browse` navigation.

- [ ] **Step 2: Validate responsive layouts.**

  Run Playwright or browser checks at 375, 390, 430, 768, 1024, 1280, and 1440px. Inspect hero wrapping, rail overflow, footer spacing, device compositions, and absence of page-level horizontal overflow. Fix only targeted CSS/layout issues.

- [ ] **Step 3: Validate accessibility.**

  Keyboard-tab through nav, hero CTAs, rails, search, season controls, trailer, footer, and mobile menu. Confirm focus rings, landmarks, heading order, image alt strategy, touch target sizes, and no focus trap.

- [ ] **Step 4: Validate reduced motion and failure states.**

  Emulate `prefers-reduced-motion: reduce`; verify all content is immediately readable and no parallax/pinning/autoplay runs. Exercise missing artwork and empty list paths using safe local fixtures or temporarily blocked image requests in the browser; do not leave debug code enabled.

- [ ] **Step 5: Validate performance/SEO invariants.**

  Inspect rendered HTML for server-visible H1/section copy, confirm hero is the only priority image, check `sizes` on landing images, verify no TMDB key appears in client chunks, and check canonical/OG metadata plus TMDB/provider disclaimers.

- [ ] **Step 6: Run the full verification suite.**

  ```bash
  npm run typecheck
  npm run lint
  npm test
  npm run test:e2e
  npm run build
  ```

  Typecheck must either pass or have only the pre-existing unrelated errors precisely documented. Fix all failures caused by the landing route split, navigation, or client components.

- [ ] **Step 7: Inspect the production-like render and animation cleanup.**

  Run the app with `npm run dev` or `npm run start` after a successful build. Review desktop and mobile screenshots, browser console, scroll-trigger behavior, rapid route changes, image failures, mobile menu open/close, and reduced-motion behavior. Confirm no duplicate ScrollTrigger warnings or stale triggers remain.

- [ ] **Step 8: Commit the QA fixes and record the final state.**

  ```bash
  git add app/globals.css app/layout.tsx app/robots.ts app/sitemap.ts tests/e2e/home.spec.ts tests/e2e/navigation.spec.ts tests/e2e/landing.spec.ts
  git commit -m "chore: verify Veyra landing experience"
  ```

  Re-run `git status --short --branch` and ensure the three pre-existing user-modified files remain uncommitted unless explicitly included for a direct compatibility fix.

## Completion checklist

- [ ] `/` is the cinematic VEYRA landing page and `/browse` is the existing discovery application.
- [ ] Real TMDB artwork powers the hero, rails, discovery story, detail showcase, and episodes where data exists.
- [ ] Search showcase uses the existing universal search system and has loading/empty/error states.
- [ ] Navigation, CTAs, cards, movie/TV links, mobile nav, and existing routes work.
- [ ] GSAP is used with scoped cleanup, responsive behavior, reduced motion, and no layout-shifting transforms.
- [ ] Loading, missing-artwork, API failure, empty-library, no-results, player, keyboard, and focus states are usable.
- [ ] Typecheck, lint, unit tests, e2e tests, and production build are run with landing-caused failures fixed.
- [ ] Desktop, tablet, mobile, reduced-motion, and browser-console visual QA is complete.

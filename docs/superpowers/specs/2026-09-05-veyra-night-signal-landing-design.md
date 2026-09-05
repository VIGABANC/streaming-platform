# VEYRA — The Night Signal Landing Experience

## Status

Design specification for the public landing-page redesign. The existing streaming discovery application remains available at `/browse`; the public entry experience becomes `/`.

## Product intent

VEYRA is a cinematic discovery layer for finding the next movie or television story worth watching. The landing page should make that proposition legible within five seconds, prove it with real TMDB artwork and product interactions, and move visitors into the working discovery application without implying that VEYRA hosts video media.

The page should feel like cinema after midnight: quiet, editorial, atmospheric, and confident. It should not resemble a generic SaaS marketing page, a Netflix clone, or a collection of decorative feature cards.

## Existing-system constraints

- Next.js 16.3.3 App Router is already in use. Server Components remain the default for data loading; Client Components are limited to browser interaction, animation, and local state.
- `lib/tmdb.ts` is the server-side TMDB boundary. `TMDB_API_KEY` must not cross into browser code.
- The current `/` route renders the full browse feed and `/browse` redirects to `/`. The browse feed will move to `/browse`; the landing route will own `/`.
- Existing detail, search, provider, library, player, PWA, SEO, and authentication routes remain intact.
- GSAP 3.15 is already installed. No additional animation library is required.
- Existing uncommitted edits in `app/my-list/page.tsx`, `app/profile/page.tsx`, and `components/player/PlayerFrame.tsx` belong to the user and must be preserved. They are not part of this redesign unless a direct integration change is required.

## Design direction

### Palette

| Token | Value | Use |
| --- | --- | --- |
| Obsidian | `#050507` | Page base and deepest fades |
| Deep navy | `#0B111A` | Raised sections and player surfaces |
| Ink | `#121923` | Interactive panels and controls |
| Signal mint | `#B8F7D4` | Primary luminous accent and active signal |
| Ember | `#FFB86B` | Ratings, live cues, and warm artwork-adjacent emphasis |
| Mist | `#E8EDF2` | Primary text and high-contrast utility copy |

Artwork provides most of the page's color. The interface remains restrained: no purple SaaS gradients, no ubiquitous glass panels, no ornamental neon borders, and no repeated giant rounded rectangles.

### Typography

Keep the optimized `Space Grotesk` display face and `Manrope` body face already loaded by the root layout. Use Space Grotesk for the H1 and section statements with tighter tracking and fluid `clamp()` sizing. Use Manrope for readable body copy and controls. Reserve the existing monospace treatment for small status labels, years, media types, and signal markers. Use sentence case by default.

### Layout and signature

The page uses a wide editorial grid with left-weighted copy and full-bleed artwork. Sections alternate between rails and asymmetric feature compositions so the page reads as one narrative rather than a sequence of identical cards.

The memorable VEYRA-specific device is a restrained vertical signal spine: a thin mint trace with small section markers that visually connects the landing story on desktop. It collapses to a small signal/status dot on mobile and is decorative only, never a source of meaning or interaction.

## Information architecture

### `/`

The public landing page renders:

1. Floating landing navigation.
2. Cinematic hero — “The Night Signal”.
3. Trending Tonight rail.
4. Discovery story using live category artwork.
5. Universal Finder showcase.
6. Detail experience showcase.
7. TV seasons and episodes showcase.
8. Personal library showcase.
9. Player experience showcase.
10. Responsive device experience showcase.
11. Final cinematic CTA.
12. Premium footer and attribution.

### `/browse`

The existing full catalog feed moves here with its existing catalog loaders, hero carousel, rails, provider rail, continue-watching rail, shell, and fallback states. Links from the landing page that mean “start browsing” point to `/browse`.

### Existing routes

Movie/TV details, `/search`, `/watch/*`, `/my-list`, `/favorites`, `/history`, `/discover`, provider routes, auth, PWA, sitemap, robots, and API routes continue to work. Internal shell navigation is updated so the application home points to `/browse`, while the landing navigation's Home link returns to `/`.

## Content and data flow

The landing Server Component fetches independent TMDB lists in parallel with the existing server helpers:

- trending all, filtered to movie/TV items with usable artwork;
- popular movies and popular TV;
- top-rated movies and TV;
- now playing;
- airing today and/or on the air;
- providers for the provider signal rail;
- one detail payload for a representative movie or TV item;
- one season payload when the representative TV item provides a usable season.

The implementation should prefer one representative detail/season path selected from available trending data and degrade gracefully when that extra data is unavailable. It should not issue a large number of detail requests for decorative content.

All server failures are converted into safe, serializable empty/error data. Missing posters, backdrops, overviews, ratings, and episode stills use the repository's existing fallback helpers and accessible text rather than broken image boxes. Search remains backed by the existing `/api/search` handler and never receives the TMDB key in client code.

## Component architecture

Use the existing `components/landing` directory as the focused landing module. Rework existing placeholder components rather than creating duplicate feature implementations.

- `LandingNav` — fixed transparent-to-solid navigation, desktop links, mobile menu, focus management, and active state.
- `CinematicHero` — server-provided featured media, layered backdrop, content, metadata, and CTA links.
- `MediaRailSection` / shared media poster card — stable dimensions, real links, touch scrolling, keyboard focus, fallback artwork, and hover metadata.
- `DiscoveryShowcase` — category-driven editorial artwork composition with route links.
- `SearchShowcase` — client-side debounced demo using `/api/search`, result/error/empty states, and a direct link to `/search`.
- `DetailShowcase` — representative real detail data with backdrop, overview, metadata, trailer/detail links, and graceful fallback.
- `EpisodeShowcase` — season selector, actual episode data when available, accessible replacement state when not.
- `LibraryShowcase` — browser-hydrated watchlist/favorites/continue-watching presentation using the existing store and honest empty states.
- `PlayerShowcase` — non-playing 16:9 product frame that communicates playback resilience and provider boundaries.
- `DeviceShowcase` — CSS-based responsive device compositions and benefit copy.
- `FinalCTA` — atmospheric close and links into `/browse` and trending content.
- `LandingFooter` — real navigation links, TMDB attribution, and third-party playback disclaimer.
- `LandingMotion` or small scoped motion helpers — shared GSAP cleanup and responsive/reduced-motion behavior without a monolithic client page.

The page itself remains a Server Component. Client subtrees receive only serializable data and are limited to the interactions above.

## Interaction and accessibility requirements

- Include a skip link and one logical H1.
- Use semantic headings, sections, nav landmarks, real links/buttons, and descriptive image alt text.
- Preserve the current automated navigation contract: a semantic header, `nav[aria-label="Main navigation"]`, footer, and a visible mobile navigation landmark with Home, Movies, TV, Discover, and My List labels at small viewports.
- Landing mobile navigation must not duplicate or trap keyboard focus. Open/close state uses `aria-expanded` and `aria-controls`; Escape closes the menu; links close it after navigation.
- Touch targets are at least approximately 44×44px. Rails use native horizontal scrolling and never hijack touch scrolling.
- Focus rings stay visible over transformed cards and nav surfaces.
- Search input focus is immediate and not gated by an animation. Search results expose their media type, title, year, and rating where available.
- Season switching is a real button/select interaction; all episode content remains available without animation.
- Empty/error/loading states are readable and actionable even if JavaScript or GSAP fails.
- Honor `prefers-reduced-motion`: disable parallax, autoplay, pinned storytelling, and large transforms; use short opacity-only transitions and show all content immediately.

## Motion system

GSAP is used where sequencing, scroll-linked reveals, or staggered distribution materially improves hierarchy. CSS handles simple hover and focus transitions.

- Register `ScrollTrigger` once per client module boundary.
- Scope every animation to a component root with `gsap.context()` and revert on unmount.
- Use `gsap.matchMedia()` for desktop/mobile/reduced-motion branches.
- Hero entrance: backdrop settles from a mild scale/softness, gradient layers fade, eyebrow/title/body/metadata/CTAs enter in a short controlled sequence.
- Desktop hero: one gentle scroll-linked backdrop/parallax treatment; mobile: no parallax.
- Section reveals: parent-level ScrollTriggers with restrained y/opacity transitions; rails use a single staggered reveal rather than one trigger per tiny child.
- Search/detail/episode/library/player sections use short reveals and crossfades only where state changes need explanation.
- Progress bars animate once when entering the viewport and preserve actual values; reduced motion renders the final value immediately.
- The signal spine may draw/reveal once as sections enter but must not run continuously offscreen.
- Animate transforms and opacity, not layout properties. Avoid large animated blurs, heavy 3D, cursor followers, and scroll-jacking.
- Do not call React state setters from high-frequency scroll updates. Do not create duplicate triggers during rerenders.

## Performance and SEO

- Use `next/image` with explicit `sizes`, stable aspect-ratio containers, and `priority` only for the true hero artwork.
- Lazy-load below-fold artwork and keep the number of initial TMDB requests bounded.
- Use server rendering for crawlable narrative content and data-driven artwork; do not hide essential content behind client animation.
- Preserve root metadata and refine landing metadata to `VEYRA — Discover Movies & TV After Dark` with a natural cinematic discovery description, Open Graph/Twitter fields, canonical metadata, and existing robots/sitemap behavior.
- Keep the TMDB key server-only and maintain the existing attribution/disclaimer language.
- Avoid new dependencies and heavy decorative video assets.

## Failure and state design

Landing sections tolerate partial TMDB failure independently. A failed rail is replaced with a quiet, actionable state rather than removing the whole page. The hero falls back to a non-image composition with clear copy. Search has loading, no-results, and error states. Detail and episode showcases render their structural copy even when the payload is missing. Library showcases render actual empty states for new visitors. The player showcase is clearly illustrative and does not claim media ownership.

## Verification plan

Before implementation, the repository baseline is recorded: lint passes, 87 Vitest tests pass, and typecheck currently fails on unrelated pre-existing `my-list`/`profile` issues including a missing `LibraryMediaCard` module. After implementation:

1. Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.
2. Run `npm run test:e2e` and fix failures caused by route/navigation changes.
3. Smoke-test `/`, `/browse`, `/search`, a movie detail, a TV detail, a season/episode route, `/my-list`, `/favorites`, and `/watch/*`.
4. Validate the landing page at 375, 390, 430, 768, 1024, 1280, and 1440+ widths.
5. Validate mobile menu, native rails, keyboard navigation, focus visibility, missing artwork, API failure, no-results search, and reduced-motion rendering.
6. Inspect the rendered page and browser console for overflow, CLS, broken links, console errors, duplicate ScrollTriggers, stale triggers, and content that appears only after animation.

## Out of scope

- Rebuilding the application shell or detail pages from scratch.
- Introducing authentication requirements for the public landing page.
- Claiming that VEYRA hosts, stores, or owns the media it links to.
- Adding fake testimonials, usage metrics, awards, social profiles, or legal pages that do not exist.
- Adding premium GSAP plugins or another animation framework.

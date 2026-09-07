# Task 4 review-fix report

## Changes

- Kept `Now Playing` and `Airing Today` populated by their global TMDB loaders when a provider is selected; provider filtering remains on provider-specific lists.
- Made the discovery category-link assertions exact so Playwright strict mode does not also match the corresponding `Explore` links.
- Reduced `MediaPosterCard` hover scale from `1.04` to `1.02`.

## Verification

- Passed: `npx eslint app/page.tsx components/landing/MediaPosterCard.tsx tests/e2e/home.spec.ts`
- Passed: `git diff --check`
- Blocked: `npm run typecheck` and `npm run build` fail in protected `app/my-list/page.tsx` because `@/components/media/LibraryMediaCard` is missing. Typecheck also reports protected-file errors in `app/my-list/page.tsx` and `app/profile/page.tsx`.
- Blocked: `npx playwright test tests/e2e/home.spec.ts` cannot render the app because the Next development-server error overlay reports that same missing protected import. All eight checks stop before any landing assertion is evaluated.

## Commit

`fix: address Task 4 discovery review findings`

## Protected state

No protected files were modified, staged, or committed: `app/my-list/page.tsx`, `app/profile/page.tsx`, `components/player/PlayerFrame.tsx`, `next-env.d.ts`, and `supabase/migrations/20260905000200_telegram_feedback_sessions.sql` remain outside this fix.

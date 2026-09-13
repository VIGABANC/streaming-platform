# VEYRA Release-Readiness Report — 2026-09-13

## Recommendation: NO-GO

The local production build and automated suites are green, but the configured public origin (`https://veyra.stream`) has no address record and cannot be opened. Required live-provider, deployed performance, offline, Supabase, and Telegram verification are therefore unproven. The navigation also does not expose the required Anime product area.

## Verified

- `npm run lint` and `npm run typecheck` exit successfully.
- `npm test`: 25 files / 122 tests pass.
- `npm run test:e2e`: 94 desktop and mobile cases pass.
- `npm run build` succeeds; 29 app routes are generated, including the truthful
  unavailable anime watch route.
- `npm audit --omit=dev --audit-level=high` reports no vulnerabilities.
- JSON-LD serialization escapes script-context characters; route tests cover malformed watch routes; API routes validate payloads and expose bounded cache/rate-limit responses.
- PWA registration, versioned shell cache, update messaging, offline route, and valid 192/512 icons exist.
- Library snapshots have user-scoped Supabase RLS migrations and local-to-cloud merge code.

## Release blockers

1. `veyra.stream` returns only an SOA record in DNS and browser navigation fails with `ERR_NAME_NOT_RESOLVED`.
2. Required IA is incomplete: the header exposes Home, Movies, TV Shows, New, Top 10, Discover, and Audit, but no Anime catalog route or nav entry. Watchlist/Favorites are icon-only in the header; History is buried in the profile menu.
3. `sitemap.ts` lists only static routes; it does not generate the required movie, TV, anime, genre, person, collection, provider, or discover entries.
4. No deployed evidence exists for TMDB/Jikan/provider availability, Supabase migrations/RLS, Telegram webhook authentication, offline navigation, installability, or Core Web Vitals.

## Material risks

- The in-memory rate-limit map is per process and trusts forwarded client IP headers; it is not a distributed production control.
- Telegram webhook authentication is optional when `TELEGRAM_WEBHOOK_SECRET` is unset. Deployment must fail closed when it is missing.
- Library sync handles sign-in/refresh but has no explicit signed-out behavior. Switching to a different account clears local state, so anonymous-library preservation/merge must be acceptance-tested.
- Profile menu and destructive-reset confirmation are not implemented as focus-managed dialogs/menus. The Discover mobile filter dialog is focus-trapped and tested.
- Web Vitals are observed client-side, but no backend collection/dashboard or measured LCP/CLS/INP evidence is available.

## Required deployment configuration

- Publish an A/AAAA or CNAME record for the chosen production hostname and set `NEXT_PUBLIC_SITE_URL` to that exact HTTPS origin.
- Configure server-only `TMDB_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, GitHub credentials, and only the selected AI provider credentials. Do not expose them as `NEXT_PUBLIC_*` values.
- Configure `NEXT_PUBLIC_SUPABASE_URL` and the project publishable browser key, apply all checked-in Supabase migrations, and verify RLS as anonymous, user A, and user B.
- Register Telegram using the configured secret-token header; reject deployment if the secret/admin chat allowlist is absent.
- Preserve the CSP headers in `next.config.mjs`, with only explicitly allowlisted provider origins, and deploy behind HTTPS.

## Unsupported / unverified capabilities

- Anime has a truthful unavailable watch-route boundary and tests, but no verified public catalog/detail/navigation route.
- Iframe provider quality, audio, subtitle, completion, and progress signals are provider-controlled; no live provider capability confirmation was possible.
- Cross-device library persistence and conflict resolution are implemented but unverified against a live Supabase project.
- No performance measurements are available because the public origin is unreachable.

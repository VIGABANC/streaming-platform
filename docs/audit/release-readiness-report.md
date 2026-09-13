# VEYRA Release-Readiness Report — 2026-09-13

## Recommendation: NO-GO

The local production build and complete E2E suite are green. This release uses the Vercel production URL `https://streaming-platform-beryl.vercel.app`; a custom domain is not required.

## Navigation unification checkpoint

- Landing and catalog shells now consume the same `PUBLIC_NAV_ITEMS` configuration.
- Anime, Movies, Series, Watchlist, Favorites, and History are text-labelled primary destinations with route-aware `aria-current`.
- Focused landing/navigation/shared-navigation coverage: 32/32 passed, including Anime detail/watch routes and mobile Escape/focus return.
- The supplied direct-browser observations confirm the deployed Anime routes render the expected catalog, metadata, and truthful unavailable playback states; they are deployment evidence only and do not prove the local branch is deployed.

## Verified

- `npm run lint` and `npm run typecheck` exit successfully.
- `npm test -- --run`: 30 files / 140 tests pass.
- Focused library/offline E2E: 5/5 pass. Shared landing/navigation coverage: 32/32 pass.
- Full `npm run test:e2e`: 122/122 pass across Chromium and Mobile Chrome; no retries or skips.
- `npm run build` succeeds; 29 app routes are generated, including the truthful
  unavailable anime watch route.
- `npm audit --omit=dev --audit-level=high` reports no vulnerabilities.
- JSON-LD serialization escapes script-context characters; route tests cover malformed watch routes; API routes validate payloads and expose bounded cache/rate-limit responses.
- PWA registration, versioned shell cache, update messaging, offline route, and valid 192/512 icons exist.
- Library snapshots have user-scoped Supabase RLS migrations and local-to-cloud merge code; signed-out and anonymous merge-preservation tests pass.
- Read-only Supabase inspection confirms RLS enabled on all four application tables. No test-user credentials are configured, so authenticated sync and cross-account isolation remain unverified. Data API grants currently include TRUNCATE/TRIGGER for `anon`/`authenticated`; a narrowing migration is prepared locally but unapplied.
- Authenticated Vercel CLI inspection confirms the project link (`prj_3zhloui14fDSHLAYBCNtPDAG9Kpw`) and a READY production deployment (`dpl_7vfYeeF7FHdqLJsMWKTwKwq4L7Nc`) created at 2026-09-13 14:43:50Z; its commit SHA is not exposed by the CLI response.
- Vercel production route checks: `/`, `/browse`, `/movies`, `/tv`, `/anime`, `/search`, `/my-list`, `/favorites`, `/history`, `/settings`, `/anime/21`, and `/watch/anime/21/1` all returned HTTP 200 with titles; `robots.txt` and `sitemap.xml` returned HTTP 200.

## Release blockers

1. Custom domain: `NOT APPLICABLE — no custom domain is required for this release`; production is served through the Vercel `.vercel.app` domain.
2. Full local `npm run test:e2e` passes 122/122; intermittent Next stream-closed messages were non-fatal.
3. Live provider smoke is not green: movie Server 1 control timed out and TV iframe did not match the configured provider.
4. Supabase authenticated sync/RLS user-flow verification is blocked by unavailable test credentials/access; the grant review also found excessive table privileges pending migration.
5. Local Core Web Vitals collection emitted no numeric LCP/CLS/INP sample, so performance evidence is unavailable.

## Material risks

- The in-memory rate-limit map is per process; identity uses the platform-controlled `x-vercel-forwarded-for` header and still requires a distributed production control for multi-instance guarantees.
- Telegram webhook authentication now fails closed when `TELEGRAM_WEBHOOK_SECRET` is absent or mismatched.
- Library signed-out behavior and anonymous-to-account merge are covered locally; live cross-device behavior remains blocked.
- Profile menu and destructive-reset confirmation are focus-managed and regression-tested.
- Web Vitals are observed client-side, but no backend collection/dashboard or measured LCP/CLS/INP evidence is available.

## Required deployment configuration

- `NEXT_PUBLIC_SITE_URL` should use `https://streaming-platform-beryl.vercel.app` for this release. Custom-domain DNS is not applicable.
- Configure server-only `TMDB_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, GitHub credentials, and only the selected AI provider credentials. Do not expose them as `NEXT_PUBLIC_*` values.
- Configure `NEXT_PUBLIC_SUPABASE_URL` and the project publishable browser key, apply all checked-in Supabase migrations, and verify RLS as anonymous, user A, and user B.
- Register Telegram using the configured secret-token header; reject deployment if the secret/admin chat allowlist is absent.
- Preserve the CSP headers in `next.config.mjs`, with only explicitly allowlisted provider origins, and deploy behind HTTPS.

## Unsupported / unverified capabilities

- Anime has a Jikan-backed catalog route and truthful unavailable watch-route boundary; provider playback remains unavailable by design.
- Iframe provider quality, audio, subtitle, completion, and progress signals are provider-controlled; no live provider capability confirmation was possible.
- Cross-device library persistence and conflict resolution are implemented but unverified against a live Supabase project.
- No numeric local production LCP/CLS/INP sample was captured; this remains unverified rather than a fabricated pass.

## Commit and deployment identity

Local `HEAD` is `771f4e951d3f315cdbe789792fb3d7f1301499e3` plus the final release verification changes, authored and
committed as `Your Name <your-gitlab-email@example.com>`. The referenced GitHub
commit `1c9918d645fa7b5f2368d8bb31cf512f9a2cd576` is authored by
`VIGABANC <151966437+VIGABANC@users.noreply.github.com>`. The local placeholder
identity is not evidence of association with the GitHub or Vercel account and
must be corrected by the project owner before relying on automatic deployment.

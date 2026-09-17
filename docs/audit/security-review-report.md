# VEYRA Security Review

**Scope:** provider playback boundary, search API, route validation, telemetry,
service worker, secrets, and dependency surface.
**Method:** repository inspection, local tool inventory, `npm audit --omit=dev`,
unit/E2E/live verification. No active exploitation or public-target scanning was
performed.

## Executive summary

No Critical or High findings were confirmed in the reviewed paths. The strongest
controls are the fixed provider registry, strict positive-integer route parsing,
exact CSP frame origins, restrictive iframe sandbox, privacy-safe telemetry, API
rate limiting, and server-only secret usage.

Remaining hardening items are low/informational: validate deployed CSP behavior and
permissions that are not required after runtime validation, reconcile the global
and watch-route frame headers, and replace deprecated `X-XSS-Protection` with
modern CSP-focused policy. These require deployment/runtime confirmation before
changing behavior.

## Attack-surface map

| Entry point | Auth | Input | Sink/control |
|---|---|---|---|
| `GET /api/search` | public | bounded query string | TMDB query, rate limit, intent parser, ranked JSON |
| `GET /api/tv/[id]/season/[season]` | public | positive integer route params | TMDB request, strict route validation |
| `POST /api/telegram/webhook` | shared secret when configured | Telegram JSON | feedback workflow, secret/header validation |
| Watch routes | public | movie/TV IDs and season/episode params | fixed provider URL builders, iframe sandbox |
| Browser storage | local browser | health/settings/library values | defensive JSON parsing and bounded local state |

## Confirmed findings

None at Critical, High, or Medium severity were confirmed.

## Informational hardening findings

| ID | Status | Severity | Evidence | Recommendation | Residual risk |
|---|---|---|---|---|---|
| SEC-01 | Verified Fixed | Low | Production CSP previously included `script-src 'unsafe-eval'`. | Removed from `next.config.mjs`; production build passes. | Deployment headers should still be rechecked after promotion. |
| SEC-02 | Needs validation | Informational | Global `frame-ancestors 'none'` and watch-route `X-Frame-Options: SAMEORIGIN` express different embedding policies. | Verify intended route policy in deployed headers and consolidate to one explicit policy. | Header precedence may surprise future maintainers. |
| SEC-03 | Verified Fixed | Informational | `X-XSS-Protection` was deprecated in modern browsers. | Removed; CSP remains the active script/content control. | Modern browsers rely on CSP and built-in mitigations. |

## Positive controls

- Provider origins and URL builders are fixed in `lib/player.ts`; arbitrary
  production embed origins are not accepted.
- CSP `frame-src` is exact-origin allowlisted and covered by a regression test.
- Iframes use `allow-scripts allow-same-origin allow-presentation` only; no top
  navigation, camera, microphone, or geolocation privileges are granted.
- Route IDs, seasons, and episodes require strict positive integers.
- Search input is length-bounded and rate-limited; external API errors are
  categorized without returning credentials or raw upstream details.
- Telemetry omits iframe URLs and personal data.
- Service worker bypasses private/auth/watch/API routes and does not cache third-
  party media.
- Service-worker cache names include explicit service-worker and build versions;
  activation removes prior shell caches to limit stale-client recovery issues.
- `npm audit --omit=dev` reported zero vulnerabilities.

## Secrets and sensitive data

No committed production credential was confirmed by repository inspection. TMDB,
GitHub, Telegram, AI, and optional provider keys are read from server-side
environment variables. The available dedicated secret scanners (gitleaks,
ggshield, TruffleHog) were not installed in this environment, so git-history
secret scanning remains a limitation.

## Verification and limitations

- Unit, typecheck, lint, and production build are passing.
- Full deterministic E2E passed after scoping an existing duplicate-navigation
  selector; player tests pass on desktop and mobile projects.
- Live movie and TV smoke tests passed, but opaque providers cannot be declared
  visibly playable from frame-level evidence.
- No authenticated Codex Security plugin or external deployment connector was
  available, and no active testing was performed.

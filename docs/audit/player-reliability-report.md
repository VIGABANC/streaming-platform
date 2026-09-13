# VEYRA player reliability report

**Updated:** 2026-09-13
**Status:** Architecture partially verified; browser and external deployment verification pending

## Current architecture

VEYRA separates opaque `ExternalEmbedEngine` behavior from the gated
`NativeMediaEngine` contract. The external providers in the registry are
cross-origin and unverified. They now carry explicit
`PlaybackProviderVerification` records with `enabled: false`, so they are not
eligible for playback resolution. Anime remains unavailable because no
verified Anime playback source exists.

The player shell still owns loading/error/retry presentation, provider health
state, attempt identity guards, offline/reconnect handling, theater mode,
lights-off overlay, and VEYRA-container fullscreen. An opaque iframe can only
produce `frame loaded; not independently verified`; it cannot produce a
verified playback, quality, audio, caption, or bitrate claim.

## Fresh verification

| Check | Result | Evidence |
|---|---|---|
| Typecheck | PASS | `npm run typecheck` exit 0 |
| Lint | PASS | `npm run lint` exit 0 |
| Unit tests | PASS | 30 files / 142 tests before current changes; targeted current suite 4 files / 38 tests passed |
| Production build | PASS | `npm run build` exit 0; expected `TMDB_API_KEY_MISSING` fallback warning in no-secret environment |
| Security audit | PASS | `npm audit --omit=dev --audit-level=high`: 0 vulnerabilities |
| Full E2E | BLOCKED | 44 tests failed before browser launch because Chromium executable is missing |
| Mobile player E2E | BLOCKED | Chromium executable missing; Next also reported `uv_interface_addresses` environment error |
| Live provider smoke | BLOCKED | 2 tests failed before browser launch because Chromium executable is missing |
| Deployed watch pages | NOT VERIFIED | Vercel connector returned `403 Forbidden` for movie, TV, and Anime watch routes |

## Verified code-level guarantees

- Provider verification requires authorization evidence, origin checks, an
  allowed embedding context, an enabled flag, and a fresh verification date.
- All existing third-party embed providers are `unverified` and disabled.
- The resolver returns no movie/TV embed source while those providers remain
  unverified; Anime remains unavailable.
- Native MP4/HLS/DASH sources are accepted only when explicitly authorized,
  allowlisted, HTTPS, and format-valid. No native source is currently enabled.
- IDs, seasons, and episodes are strictly validated before source construction.
- URL validation rejects non-HTTPS, credential-bearing, and mismatched-origin
  playback URLs.
- Attempt callbacks are guarded by provider ID and monotonically increasing
  attempt ID.
- Player observability now includes source-resolution status separately from
  frame-loaded and native-playback-started events.
- Anime continue-watching state stores media type, episode, explicit
  `providerId: null`, external-embed mode, and not-started verification state;
  it does not invent an unavailable provider.
- Mobile mode controls are rendered without desktop-only hiding. Lights-off
  adds a viewport overlay, theater mode is a fixed container mode, and
  fullscreen state is reflected in accessible labels.

## Known gaps before finalization

1. Chromium must be installed successfully in CI and the full E2E matrix must
   run. Local browser execution is not currently possible in this environment.
2. The separate live smoke suite must run against a reachable deployment. It
   may verify frame loading only, never opaque-provider playback.
3. The deployed pages must be re-inspected after an authenticated Vercel
   deployment; the current connector cannot inspect the existing deployment.
4. The native engine remains a gated contract. Subtitles, audio tracks,
   quality choices, PiP, and native playback controls must not be shown until
   an authorized direct source is actually configured.
5. Historical verification claims from earlier runs are intentionally removed;
   only fresh command output in this report is authoritative.

## Final verdict

**NOT READY FOR FINAL PUSH/DEPLOY.**

The security and resolver changes are code-verified, but the completion
criteria require successful browser verification and a reachable deployment.
After Chromium CI and live smoke pass, run the final typecheck, lint, unit
tests, E2E, build, and security audit again. Only then create the final commit,
push GitHub, and trigger or confirm Vercel deployment.

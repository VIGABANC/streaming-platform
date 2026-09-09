# VEYRA Final Acceptance Matrix

| Area | Requirement | Status | Evidence / limitation |
|---|---|---|---|
| P0 | Explicit attempt identity and stale callback protection | VERIFIED | `lib/player-attempt.ts`, player unit tests, player E2E |
| P0 | Warning cannot cancel hard deadline | VERIFIED | Attempt/timer regression tests and implementation |
| P0 | Bounded automatic failover and exhaustion | VERIFIED FOUNDATION | Ranked unattempted cycle and exhausted state; broader deterministic failure fixtures remain limited |
| P0 | Contextual ranking and conservative reliability | VERIFIED FOUNDATION | `lib/player.ts`, ranking tests, EWMA/circuit tests |
| P0 | Trust eligibility before ranking | VERIFIED | Typed registry and eligibility tests |
| P0 | Half-open circuit recovery | VERIFIED | Deterministic availability/trial tests |
| P0 | Manual switching and scoped reload | VERIFIED | Player E2E and reload state tests |
| P0 | Offline/reconnect and visibility handling | VERIFIED LIMITED | Initial offline detection, timer suspension while hidden, fresh visible-tab attempts, reconnect cycle reset, and deterministic browser offline/reconnect E2E are verified; real network-transition behavior remains environment-dependent |
| P0 | Exact CSP origins and restrictive iframe sandbox | VERIFIED | CSP regression test, player E2E sandbox assertions, security report |
| P0 | Strict postMessage validation | NOT APPLICABLE YET | Configured providers expose no documented event channel; no global listener is installed |
| P0 | Movie 1007757 and TV live route smoke | VERIFIED LIMITED | Live suite 2/2; opaque frames do not prove playback |
| P1 | Typed provider capabilities and truthful quality UI | VERIFIED LIMITED | Opaque Tier C capabilities are false/unknown; no fake quality controls |
| P1 | Subtitle/audio preference honoring | VERIFIED LIMITED | Subtitle preference is typed, user-configurable, and forwarded only to documented `vidsrc.wiki`; audio preference and other providers remain unsupported |
| P1 | Accessibility and mobile shell | VERIFIED LIMITED | Keyboard, reduced motion, overflow, sandbox, and player E2E pass; provider-owned UI unverified |
| P1 | Scoped cache/player recovery | VERIFIED | Reload player and versioned service-worker cache |
| P1 | Privacy-safe telemetry | VERIFIED | Provider ID/category/timing only; no raw iframe URLs or PII |
| P1 | Accurate continue-watching semantics | VERIFIED LIMITED | Watch routes no longer write progress on navigation or iframe load; persisted progress remains unavailable until an authorized provider exposes trustworthy progress/completion signals |
| P2 | Deterministic language intent parsing | VERIFIED | `lib/search-intent.ts`, unit/E2E tests |
| P2 | Deterministic relevance ranking and corpus | VERIFIED FOUNDATION | `lib/search-ranking.ts` and evaluation corpus |
| P2 | World Cinema legitimate metadata rails | VERIFIED LIMITED | `/world-cinema` provides language-grouped TMDB discovery rails with explicit metadata provenance; provider availability remains separate and unverified |
| P2 | Missing-availability persistence flow | VERIFIED LIMITED | Search empty state offers validated local fallback plus an authenticated Supabase/RLS API path; the checked-in migrations were applied successfully to the linked project and the CLI reported the remote database up to date. A signed-in application-path submission remains the final runtime confirmation |
| P3 | Licensed direct playback | FUTURE ONLY | No authorized direct source exists; no HLS/DASH extraction implemented |
| Security | Dependency audit | VERIFIED | `npm audit --omit=dev`: zero vulnerabilities |
| Security | Repository security review | VERIFIED LIMITED | Local review complete; dedicated external scanners/plugins unavailable |

## Current verdict

**P0 VERIFIED — P1/P2 PENDING**

This matrix is intentionally conservative: a passing local test cannot upgrade an
external provider capability or legal/product gate to verified status.

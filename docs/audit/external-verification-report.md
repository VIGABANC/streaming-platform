# VEYRA external verification report

**Audit date:** 2026-10-27 (Africa/Casablanca)
**Release classification:** **BLOCKED**
**Current branch:** `fix/veyra-release-verification`
**Verification baseline HEAD:** `93182a8` (`docs: update current release verification state`)
**Manual evidence commit:** `cc6103e` (`docs: record manual playback verification`)
**Pull request:** [#38](https://github.com/VIGABANC/streaming-platform/pull/38), draft
**Remote branch tip observed:** `2f250e07b9080eda1e500fe8a1c8e44729584562`
**Remote `main`:** `e211575a448087d25b6488fe5cfff6de891272ae`

The reviewed release-verification changes were committed and pushed from the
previously dirty worktree. Generated arena/log and browser-evidence artifacts
were excluded from the commits. A repository-wide credential-pattern scan
emitted no credential values; generic matches in auth UI, configuration names,
and reports require normal diff review but are not evidence of committed
secrets.

This report is a current-state blocker audit. It does not promote local tests,
HTTP 200 responses, iframe markup, protected deployment pages, or historical CI
results into external verification.

## Verified local baseline

- Vitest: 38 files / 176 tests passed.
- Chromium E2E: 125/125 passed.
- Mobile Chrome E2E: 125/125 passed.
- Typecheck, lint, production build, high-severity dependency audit, and diff
  checks passed.
- The build records a caught Jikan connection timeout as an external fallback
  condition; it does not fail the build.
- Provider-health controls are covered for manual redirects, bounded response
  bodies, trusted refresh identity, and stale refresh-entry eviction.

## Blocker and resolution matrix

| Requirement | Current evidence | Status | Required resolution |
|---|---|---|---|
| Authorized movie/TV/anime playback | Five opaque external providers remain `unverified`; native origin allowlist is empty; `npm run test:live` skipped both opt-in tests | BLOCKED_EXTERNAL | Provide an authorized/licensed test source and verify real `playing`, `timeupdate`, audio, progress, buffering, and failure events for each released media type |
| Supabase authentication and isolation | Local Docker stack, migrations, two-user session probe, and 8-test pgTAP suite passed; hosted project/browser session-expiry coverage remains unverified | BLOCKED_EXTERNAL | Verify browser refresh/session expiry and all user-owned tables, then repeat against the intended hosted project |
| Protected Preview deployment | New Preview for commit `4a81b34` is reachable at the recorded URL, but API paths returned HTML instead of JSON and deployed E2E began failing | BLOCKED_EXTERNAL | Fix/verify Preview routing and environment configuration, then rerun complete deployed desktop/mobile checks |
| Fresh GitHub CI for current worktree | Commit `4a81b34` is pushed and PR #38 is open; combined status currently reports only Vercel success, with no fresh `Verify VEYRA` result yet | BLOCKED_EXTERNAL | Confirm the workflow runs against exact SHA and record all check URLs/conclusions |
| Maintainer approval | Draft PR #38 exists; no independent approval evidence exists | BLOCKED_EXTERNAL | Independent maintainer reviews the diff, external evidence, and release checklist |

## Playback verification report

The current registry contains `vidfast`, `vidlink`, `2embed`, `videasy`, and
`nontongo`. All are opaque Tier C external embeds with no authorization record,
trusted event channel, or independently verified playback. The resolver and
engine reject unauthorized native sources and do not treat iframe load or
provider markup as playback.

No current evidence proves `playing`, `timeupdate`, audio output, progress,
buffering behavior, subtitles, or playback failure events from an authorized
source. No DRM, provider security, or access restriction was bypassed.

### Manual browser verification (2026-10-27)

The local app was exercised as a real user in a browser against the three
release playback routes:

| Route | Observed result | Classification |
|---|---|---|
| `/watch/movie/550` | Fight Club rendered with a `2Embed UNVERIFIED` iframe, `Connecting to 2Embed…`, and `A frame load does not verify playback`. No native player controls or visible progress were observed. | Not verified |
| `/watch/tv/1399/1/1` | Game of Thrones S1 E1 rendered with a `2Embed UNVERIFIED` iframe, `Connecting to 2Embed…`, and provider-controlled playback. No native player controls or visible progress were observed. | Not verified |
| `/watch/anime/52991/1` | The page showed `Playback unavailable for this media type` and `No iframe or playback claim is presented.` | Correct unavailable state; not verified |

The movie and TV frames exposed third-party content, including an ad-linked
destination, so no suspicious provider control was clicked. The exact Vercel
Preview URL redirected to Vercel login because deployment protection is active;
no credentials were entered and no protection bypass was attempted. This run
adds evidence for guarded unavailable/unverified states but does not establish
authorized playback for any media type.

Required test sequence after an authorized source is supplied:

1. Verify the exact provider origin, authorization record, and allowed embed
   context.
2. Exercise one movie, one TV episode, and anime only if anime is in release
   scope.
3. Capture real player events for start, time progression, buffering, error,
   audio, subtitle behavior, and completion.
4. Verify retry, server switching, progress persistence, and failure states.
5. Update the provider matrix only with evidence tied to the exact source.

## Supabase authentication and isolation report

The disposable local Supabase environment is now running on Docker Desktop.
The official Windows CLI (v2.122.0) initialized the project and applied all six
checked-in migrations. `supabase db reset --local` completed successfully.
`supabase test db` completed with `Files=0, Tests=0, Result: NOTESTS` because the
repository has no pgTAP files under `supabase/tests`; that command is therefore
not RLS evidence by itself.

A direct local Auth/PostgREST probe created two disposable authenticated users
using normal user sessions, not service-role access. User A and User B each
created and read their own snapshot. B's cross-account read returned zero rows;
B's cross-account update/delete matched zero rows and A's subsequent read still
contained A's original payload. A's own update persisted, and B's own read
returned only B's payload. Signed-out access returned HTTP 401 in the earlier
probe. The test rows and identities were disposable and were deleted after the
probe.

A focused pgTAP regression test was then added at
`supabase/tests/rls_isolation_test.sql` and passed locally: `Files=1,
Tests=8, Result: PASS`.

This verifies local snapshot RLS only. It does not yet verify hosted Supabase,
browser account switching, refresh/session expiry, or user-owned tables not
represented by the current schema.

Remaining test cases with disposable users A and B:

- A can create/read/update/delete only A-owned favorites, history, profiles,
  collections, and snapshots.
- B cannot read, update, or delete A-owned rows by direct API or UI flow.
- Logout/session expiry removes access and does not leak the previous account.
- Refresh and second-device login preserve only the correct owner’s data.
- RLS and migration state are checked in the intended target project.

## Deployment verification report

The Vercel CLI remains logged out, but the authenticated GitHub/Vercel
integration created Preview deployment
`https://streaming-platform-git-fix-v-92569e-zahidossama2-1958s-projects.vercel.app`
for commit `4a81b3471a885ab51d3e820af1ade0a27fe5e308`. The deployment root and
page routes returned HTTP 200 HTML. However, direct checks of `/api/search`,
`/api/health/providers`, and the other expected API paths also returned HTML
`text/html` rather than JSON, and the deployed Playwright run began failing on
the anime and discovery flows. The run was stopped after the first failures;
this is deployment evidence, not a passing deployed E2E result.

The historical Preview URL recorded in the older certification report still
returns HTTP 410. The new Preview is therefore reachable but not verified for
production behavior or correct API routing.

Required Preview evidence:

- Exact deployment URL and commit SHA.
- Protected-access method documented without putting secrets in source or chat.
- Production-mode desktop/mobile routes, CSP, console, API responses,
  hydration, responsive behavior, and playback boundary checked.
- Deployment logs and environment configuration checked without exposing secret
  values.

## Fresh CI evidence

Public GitHub metadata shows:

- Local worktree SHA `462f17d` has only a successful Vercel Preview Comments
  check; it does not have fresh full verification for the current uncommitted
  changes.
- Remote branch SHA `2f250e0` has `Verify VEYRA` run `37376378957`, conclusion
  `failure`.
- That run passed lint, typecheck, unit tests, and build, then failed in desktop
  E2E; mobile E2E and dependency audit were skipped.

No passing CI claim is made for the current uncommitted tree.

## Maintainer approval checklist

- [ ] Review the complete uncommitted diff and confirm intended release scope.
- [ ] Review this blocker report and each linked QA/security report.
- [ ] Confirm the authorized provider and legal/embed authorization.
- [ ] Confirm Supabase two-user isolation evidence.
- [ ] Confirm exact Preview deployment and fresh CI SHA.
- [ ] Confirm no iframe-load or HTTP-200 playback overclaim remains.
- [ ] Approve release classification and deployment action.

Until every applicable external row and checklist item has evidence, the final
classification remains **BLOCKED**, not READY or CONDITIONALLY READY.

## Resumed external-state recheck

The third post-resumption recheck found one local-environment improvement but no
release verification:

- `vercel whoami` reports the CLI is logged out.
- Remote `feat/provider-registry-refresh` remains `2f250e0`; remote `main`
  remains `e211575a`.
- The public check API still reports only Vercel Preview Comments success for
  local SHA `462f17d`, while remote SHA `2f250e0` still has `Verify VEYRA`
  completed with failure.
- The configured Supabase Auth settings endpoint remains unreachable.
- Docker Desktop is now running and its Linux/WSL2 server reports successfully.
- The official Windows x64 CLI release v2.122.0 was installed in a temporary
  directory. Local Supabase initialization, database reset, two-user Auth/
  PostgREST isolation probing, and the new 8-test pgTAP suite all completed;
  hosted Supabase and browser/session-expiry verification remain external.

No external requirement is promoted to verified status from this recheck.

## 2026-10-28 Vercel Preview recheck

The latest GitHub-linked Preview is now reachable and renders the VEYRA landing
page. The deployed `/api/health/providers` route now returns JSON rather than
HTML. Its current response classified 2Embed as `healthy`, while VidFast,
VidLink, Videasy, and Nontongo were `embed-unavailable`; Consumet was
`unreachable`.

Manual browser checks on the deployed Preview produced these results:

- Movie `/watch/movie/550`: the page rendered the provider boundary and showed
  `2Embed UNVERIFIED`, `Connecting to 2Embed…`, and no native progress or
  playing evidence.
- TV `/watch/tv/1399/1/1`: the page rendered `VidFast UNVERIFIED`; after
  loading, the nested frame showed `This content is blocked. Contact the site
  owner to fix the issue.` No playback evidence was observed.
- Anime `/watch/anime/52991/1`: the page showed the intentional unavailable
  state and no iframe.

The Preview is therefore reachable and its provider-health API is functioning,
but deployed playback remains unverified and the release classification stays
**BLOCKED**. No provider security, ad link, DRM, or deployment protection was
bypassed.

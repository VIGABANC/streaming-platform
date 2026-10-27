# VEYRA external verification report

**Audit date:** 2026-10-27 (Africa/Casablanca)
**Release classification:** **BLOCKED**
**Local worktree:** `462f17df832efa406b4feda12480f5d102606064` on
`feat/provider-registry-refresh`, uncommitted
**Remote branch tip observed:** `2f250e07b9080eda1e500fe8a1c8e44729584562`
**Remote `main`:** `e211575a448087d25b6488fe5cfff6de891272ae`

Local preparation branch `fix/veyra-release-verification` was created without
discarding or staging the existing dirty worktree. The worktree contains 76
pre-existing modified/untracked entries, including generated arena/log and
browser-evidence artifacts. A repository-wide credential-pattern scan emitted
no credential values; generic matches in auth UI, configuration names, and
reports require normal diff review but are not evidence of committed secrets.

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
| Supabase authentication and isolation | Local Docker stack, migrations, and two-user snapshot isolation probe passed; pgTAP reports `NOTESTS`; hosted project/browser session-expiry coverage remains unverified | BLOCKED_EXTERNAL | Add/execute durable pgTAP coverage, verify browser refresh/session expiry and all user-owned tables, then repeat against the intended hosted project |
| Protected Preview deployment | Vercel CLI exists but reports its token invalid; connector/API access remains unavailable | BLOCKED_EXTERNAL | Provide valid project-scoped Preview access or an approved automation bypass; record exact deployment URL and SHA |
| Fresh GitHub CI for current worktree | Local worktree is uncommitted; remote branch tip is `2f250e0`; its `Verify VEYRA` run `37376378957` failed at desktop E2E and skipped later gates | BLOCKED_EXTERNAL | Push the intended commit or authorize CI for its exact SHA, then record fresh check URLs and conclusions |
| Maintainer approval | No approval evidence exists for the current uncommitted tree | BLOCKED_EXTERNAL | Independent maintainer reviews the diff, external evidence, and release checklist |

## Playback verification report

The current registry contains `vidfast`, `vidlink`, `2embed`, `videasy`, and
`nontongo`. All are opaque Tier C external embeds with no authorization record,
trusted event channel, or independently verified playback. The resolver and
engine reject unauthorized native sources and do not treat iframe load or
provider markup as playback.

No current evidence proves `playing`, `timeupdate`, audio output, progress,
buffering behavior, subtitles, or playback failure events from an authorized
source. No DRM, provider security, or access restriction was bypassed.

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

The Vercel CLI is installed, but the configured token is invalid. A direct
request to the historical Preview URL recorded in the older certification
report returned HTTP 410 on this audit date. The current local worktree has no
deployment identity. Historical or public Vercel/GitHub status metadata is not
treated as verification for this uncommitted tree.

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

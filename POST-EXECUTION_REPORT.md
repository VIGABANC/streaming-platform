# VEYRA Pre-Publish Audit Report

## Verdict

**NO-GO — do not publish**

Blockers:

1. `CONSUMET_BASE_URL` is configured to the app origin (`http://localhost:3000`), so Consumet is self-referential and cannot provide an independent playback service. Fix the deployment configuration to point to a real Consumet instance on a different origin, then verify a real episode source before enabling playback CTAs.
2. The source still contains `Playback available — Episode 1` and `Watch episode 1` in `app/anime/[id]/page.tsx`. These must only render after a real, verified playback probe succeeds. Remove or gate both against confirmed playback availability.
3. Live page and health endpoint evidence could not be collected because the local preview was not listening on port 3000 (`502 SANDBOX_NOT_LISTENING` / curl status 000). Re-run the live audit after the preview is available.
4. The requested thumbnail test name/category is not present in the current test inventory. Add a regression test covering thumbnail or placeholder rendering if thumbnail coverage is required for publish.

## 1. Branch state (raw)

### `git branch --show-current`

```text
v0/decouple-anime-episodes
```

### `git status --short`

```text
 M package-lock.json
```

### `git log --oneline -10`

```text
04d833e Decouple anime episodes from playback health
ca3e087 Merge pull request #35 from VIGABANC/v0/veyra-cinematic-player-implementation-66836c1a
ef29329 Clarify unavailable anime provider status
7f0dba4 Correct final execution report Git state
d8ce63d Refresh execution report with final verification state
ef9e3ba Add honest anime availability and provider fallback
f6cec7a Fix Consumet health probing and unavailable playback states
296fc8b Document anime playback verification blocker
7bea4df feat: update type imports for Next.js dev environment
0a6f634 Merge pull request #34 from VIGABANC/v0/player-reliability
```

### `git log main..HEAD --oneline`

```text
fatal: ambiguous argument 'main..HEAD': unknown revision or path not in the working tree.
```

The local checkout has no `main` ref. Available refs include `main` only in the requested comparison target by name in the audit instructions, but neither `main` nor `origin/main` resolves in this checkout.

### `git rev-parse HEAD`

```text
04d833ed54d1acc362fe3dc38233b0b98811f4a7
```

### `git diff --stat main..HEAD`

```text
fatal: ambiguous argument 'main..HEAD': unknown revision or path not in the working tree.
```

## 2. Gates (raw output, last 20 lines)

### `pnpm lint`

```text
> veyra@0.1.0 lint /vercel/share/v0-project
> eslint .
```

Exit code: 0. No warnings reported.

### `pnpm typecheck`

```text
> veyra@0.1.0 typecheck /vercel/share/v0-project
> tsc --noEmit
```

Exit code: 0.

### `pnpm test`

```text
> veyra@0.1.0 test /vercel/share/v0-project
> vitest run

 RUN  v4.1.11 /vercel/share/v0-project

 Test Files  37 passed (37)
      Tests  181 passed (181)
   Start at  13:36:08
   Duration  3.39s (transform 1.04s, setup 0ms, import 2.52s, tests 1.50s, environment 5ms)
```

Exit code: 0.

Relevant test names found:

- `keeps all metadata episodes when Consumet is unverified` in `tests/unit/anime-detail.test.ts`
- `rejects an unverified provider even when its origin is HTTPS` in `tests/unit/playback-verification.test.ts`
- `keeps the unconfigured state when CONSUMET_BASE_URL is unset and never probes` in `tests/unit/consumet.test.ts`
- `returns a healthy Consumet status when the health probe succeeds` in `tests/unit/consumet.test.ts`
- `returns a DNS failure status when the health probe cannot resolve the host` in `tests/unit/consumet.test.ts`
- `resolves unverified movie embeds only as explicitly unverified sources` in `tests/unit/playback-resolver.test.ts`

No test name containing `thumbnail` or explicitly asserting thumbnail/placeholder rendering was found.

### `pnpm build`

```text
> veyra@0.1.0 build /vercel/share/v0-project
> next build

▲ Next.js 16.3.5 (Turbopack)
✓ Running next.config.mjs took 13ms

  Creating an optimized production build ...
✓ Compiled successfully in 806ms
  Running TypeScript ...
  Finished TypeScript in 2.6s ...
  Collecting page data using 3 workers ...
  Generating static pages using 3 workers (0/29) ...
  Generating static pages using 3 workers (7/29)
  Generating static pages using 3 workers (14/29)
  Generating static pages using 3 workers (21/29)
✓ Generating static pages using 3 workers (29/29) in 777ms
  Finalizing page optimization ...

Route (app)                            Revalidate  Expire
┌ ƒ /
├ ○ /_not-found
├ ○ /anime                                     1d      1y
├ ƒ /anime/[id]
├ ƒ /api/health/providers
├ ƒ /api/missing-availability
├ ƒ /api/player/preference
├ ƒ /api/search
├ ƒ /api/telegram/webhook
├ ƒ /api/tv/[id]/season/[season]
├ ƒ /auth/callback
├ ○ /auth/login
├ ○ /auth/sign-up
├ ○ /browse
├ ƒ /collection/[id]
├ ƒ /discover
├ ○ /favorites
├ ○ /history
├ ○ /landing
├ ƒ /movie/[id]
├ ○ /movies
├ ○ /my-list
├ ○ /new
├ ○ /offline
├ ƒ /person/[id]
├ ƒ /provider/[slug]
├ ○ /providers
├ ○ /robots.txt
├ ○ /search
├ ○ /settings
├ ○ /sitemap.xml
├ ƒ /streaming/[providerId]
├ ○ /top10
├ ○ /tv
├ ƒ /tv/[id]
├ ƒ /watch/anime/[id]/[episode]
└ ○ /world-cinema

ƒ Proxy (Middleware)

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered as dynamic content
```

Exit code: 0.

## 3. Anime state audit

### A. `CONSUMET_BASE_URL`

The variable is set and equals the app origin (`http://localhost:3000`). Its value was not printed.

### B. Provider health

Command:

```text
curl -s http://localhost:3000/api/health/providers | jq
```

Raw result:

```text
curl: (7) Failed to connect to localhost port 3000 after 0 ms: Could not connect to server
HTTP_STATUS=000
HEALTH_BODY=empty
```

The live health status is therefore **not observable in this audit** because the preview was not listening. Configuration evidence independently identifies Consumet as self-referential.

### C. `/anime/52991` (Frieren)

Exact playback copy: **not observable in this audit** because the preview was not listening.

Expected code path for an unverified/self-referential provider: `Playback unavailable`.

Episode count: **not observable in this audit**.

Episode list renders: **not observable in this audit**.

Prior captured evidence in `/tmp/agent-browser/frieren-episodes-28-full.png` showed all 28 clickable rows with `E#` blocks and `Playback unavailable` indicators, but this audit does not treat that stale capture as current live evidence.

### D. `/watch/anime/52991/1`

Exact copy: **not observable in this audit** because the preview was not listening.

`<video>` element present: **not observable in this audit**.

`Watch episode 1` CTA present: **not observable in this audit**.

### E. Cross-check

**Yes — source-level evidence shows a possible contradiction.** `app/anime/[id]/page.tsx` contains both `Playback available — Episode 1` and `Watch episode 1`, while the configured Consumet base URL is the app origin and no live playback verification was possible. These controls must be removed or gated by a confirmed playable source.

## 4. Thumbnail audit

Relevant source evidence:

```text
app/watch/tv/[id]/[season]/[episode]/page.tsx:224: const stillSrc = ep.still_path ? poster(ep.still_path, 'w300') : null
components/tv/EpisodeList.tsx:28: const stillSrc = poster(ep.still_path, 'w300')
components/tv/EpisodeList.tsx:44: className="relative aspect-video w-36 shrink-0 overflow-hidden rounded-lg bg-surface focus-visible:outline-primary"
```

Anime-specific thumbnail implementation was not confirmed by this grep output. The test inventory also contains no thumbnail-specific test name.

Screenshot evidence:

- `/tmp/agent-browser/prepublish-frieren-detail.png` — **preview unavailable**; screenshot shows `502 SANDBOX_NOT_LISTENING`, not the anime page.
- `/tmp/agent-browser/prepublish-frieren-watch.png` — **preview unavailable**; screenshot shows `502 SANDBOX_NOT_LISTENING`, not the watch page.
- Prior capture `/tmp/agent-browser/frieren-episodes-28-full.png` exists from an earlier run and was reported as showing E# placeholders, but it is not a fresh audit capture.

Current thumbnail visibility: **not verified**.

## 5. Honesty audit

### `grep -ri "playback available" app/ components/`

```text
app/anime/[id]/page.tsx:105: {cachedPlayback?.status === 'ready' ? `Playback available — Episode 1` : !consumetHealth.configured || !consumetHealth.reachable ? 'Playback unavailable' : 'Playback availability varies by episode'}
```

### `grep -ri "watch episode" app/ components/`

```text
app/anime/[id]/page.tsx:120: <Link href={`/watch/anime/${id}/1`} ...>Watch episode 1</Link>
```

### `grep -ri "episode list unavailable" app/ components/`

```text
No matches.
```

### `grep -ri "could not be loaded" app/ components/`

```text
No matches.
```

### `grep -ri "sandbox is not allowed" app/ components/`

```text
No matches.
```

## 6. Required fixes before publish

- Configure `CONSUMET_BASE_URL` to a real independent Consumet deployment, not VEYRA's own origin.
- Remove or strictly gate `Playback available — Episode 1` and `Watch episode 1` until a real verified playback source exists.
- Restore the preview and repeat the Frieren detail/watch/health screenshots and exact-copy audit.
- Add an explicit thumbnail/placeholder regression test if thumbnail coverage is part of the publish gate.
- Resolve or explicitly document the modified `package-lock.json` before publishing.

## Final verdict

**NO-GO — do not publish**

The metadata decoupling unit test passes and the old `Episode list unavailable` string is absent, but publish is blocked by the self-referential Consumet configuration, source-level playback CTA risk, missing live preview evidence, and unverified anime thumbnail coverage.

**Audit report generated without changing application code or publishing.**

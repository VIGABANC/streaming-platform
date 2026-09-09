# VEYRA Player Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make opaque external playback bounded, race-safe, truthful, and recoverable without inventing provider capabilities.

**Architecture:** Keep `PlayerFrame` as the UI owner, isolate attempt transitions in `lib/player-attempt.ts`, and make `lib/player.ts` the single typed registry and health/ranking boundary. All callbacks validate attempt identity and provider identity before changing state.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Vitest, Playwright, localStorage-backed client health.

**Spec:** `docs/superpowers/specs/2026-09-09-veyra-player-reliability-design.md`

## Global Constraints

- Never treat iframe load as playback readiness or provider success.
- Never allow an attempt cycle to retry the same provider indefinitely.
- Trust eligibility is a hard gate before health/ranking score.
- Do not extract hidden HLS/DASH manifests or bypass provider protections.
- Preserve existing dirty user-owned changes and do not reset `main`.
- Live provider tests stay separate from deterministic CI.

---

### Task 1: Make attempt identity explicit and stale-callback safe

**Files:**
- Modify: `lib/player-attempt.ts`
- Modify: `components/player/PlayerFrame.tsx`
- Test: `tests/unit/player.test.ts`

**Interfaces:**
- `isCurrentAttempt(state, attemptId, providerId): boolean` is the callback guard.
- `PlayerFrame` captures the attempt ID used to create the iframe and passes it to load/error handlers.

- [ ] **Step 1: Write failing tests** for previous-attempt load/error callbacks and callbacks after exhaustion/offline.
- [ ] **Step 2: Run** `npm test -- --run tests/unit/player.test.ts` and confirm the new assertions fail for the stale-callback reason.
- [ ] **Step 3: Implement** the guard and iframe attempt capture; ensure warning transitions do not clear the hard timer.
- [ ] **Step 4: Run** the focused test and `npm run typecheck`; expect both to pass.
- [ ] **Step 5: Commit** with `git add lib/player-attempt.ts components/player/PlayerFrame.tsx tests/unit/player.test.ts && git commit -m "fix: reject stale player callbacks"`.

### Task 2: Separate frame-load telemetry from playback health

**Files:**
- Modify: `components/player/PlayerFrame.tsx`
- Modify: `lib/observability/client.ts`
- Test: `tests/unit/player.test.ts`

**Interfaces:**
- Frame load emits `player_frame_loaded` only.
- Provider success is reserved for a verified ready/playback signal that opaque providers currently do not expose.

- [ ] **Step 1: Add a regression assertion** that frame-load handling does not increment provider success.
- [ ] **Step 2: Run the focused test and confirm it fails against the current success recording.
- [ ] **Step 3: Remove the false success update and keep the truthful event category.
- [ ] **Step 4: Run focused tests, full unit tests, and lint.
- [ ] **Step 5: Commit** with `git add components/player/PlayerFrame.tsx lib/observability/client.ts tests/unit/player.test.ts && git commit -m "fix: distinguish frame load from playback"`.

### Task 3: Complete typed provider trust and capability registry

**Files:**
- Modify: `lib/player.ts`
- Modify: `next.config.mjs`
- Modify: `components/player/PlayerFrame.tsx`
- Test: `tests/unit/player.test.ts`
- Update: `docs/audit/provider-capability-matrix.md`

**Interfaces:**
- Add typed `capabilities`, `observabilityTier`, `trustEligible`, and optional `trustedMessageOrigin` fields to `StreamProvider`.
- Export a registry-derived origin list for CSP/preconnect checks.

- [ ] **Step 1: Add tests** requiring every configured provider to declare conservative capabilities and requiring ranking to exclude ineligible providers.
- [ ] **Step 2: Run focused tests and confirm failure due to missing fields/gate.
- [ ] **Step 3: Add the typed fields with opaque-provider defaults and apply the eligibility filter before scoring.
- [ ] **Step 4: Make CSP frame origins derive from the registry or add a test that detects drift.
- [ ] **Step 5: Run full unit tests, typecheck, lint, and build.
- [ ] **Step 6: Commit** with `git add lib/player.ts next.config.mjs components/player/PlayerFrame.tsx tests/unit/player.test.ts docs/audit/provider-capability-matrix.md && git commit -m "feat: type provider trust and capabilities"`.

### Task 4: Make health persistence TTL-safe and circuit transitions deterministic

**Files:**
- Modify: `lib/player.ts`
- Test: `tests/unit/player.test.ts`
- Update: `docs/audit/provider-health-model.md`

**Interfaces:**
- Health records persist `updatedAt` and expire after the configured TTL.
- Open circuits cannot be silently closed by a normal attempt record.
- Cooldown expiry permits one explicit half-open trial before closure.

- [ ] **Step 1: Add deterministic tests** for timestamp persistence, expired health, open-circuit exclusion, half-open trial, and cooldown progression.
- [ ] **Step 2: Run the focused tests and confirm the missing timestamp/circuit behavior fails.
- [ ] **Step 3: Implement the smallest pure health transition helpers and use them from localStorage operations.
- [ ] **Step 4: Run all unit tests, typecheck, lint, and build.
- [ ] **Step 5: Commit** with `git add lib/player.ts tests/unit/player.test.ts docs/audit/provider-health-model.md && git commit -m "fix: bound provider health and circuit state"`.

### Task 5: Add deterministic player E2E coverage

**Files:**
- Modify: `tests/e2e/player.spec.ts`
- Modify: `playwright.config.ts` only if test isolation requires it

**Interfaces:**
- Mock or intercept provider frames so timing is deterministic and external uptime cannot fail CI.

- [ ] **Step 1: Add tests** for automatic failover, all-provider exhaustion, offline/reconnect, and manual switching before timeout.
- [ ] **Step 2: Run only the player E2E suite and confirm new tests fail before fixtures/behavior are complete.
- [ ] **Step 3: Add the minimal deterministic fixture/interception behavior.
- [ ] **Step 4: Run player E2E, then the full E2E suite.
- [ ] **Step 5: Commit** with `git add tests/e2e/player.spec.ts playwright.config.ts && git commit -m "test: cover bounded player failover"`.

### Task 6: Fresh verification and audit update

**Files:**
- Update: `docs/audit/player-reliability-report.md`
- Update: `docs/audit/veyra-skill-plugin-ledger.md`
- Update: `docs/audit/internationalization-player-checklist.md`

- [ ] **Step 1: Run** `npm run typecheck`.
- [ ] **Step 2: Run** `npm run lint`.
- [ ] **Step 3: Run** `npm test -- --run`.
- [ ] **Step 4: Run** `npm run build`.
- [ ] **Step 5: Run** `npm audit --omit=dev`.
- [ ] **Step 6: Run** `npm run test:e2e` and the isolated live suite when the environment permits.
- [ ] **Step 7: Record exact results, limitations, and the final verdict without claiming playback confirmation from iframe load.
- [ ] **Step 8: Commit** the audit updates with `git add docs/audit && git commit -m "docs: record player reliability verification"`.

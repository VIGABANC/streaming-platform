# Player optimization live checklist

| Task | Status | Evidence |
|---|---|---|
| Read goal/instructions/current player state | VERIFIED | attached goal, AGENTS, CLAUDE, README, branch/worktree audit |
| Reproduce control ownership | VERIFIED | production browser smoke; controls are inside cross-origin provider iframe |
| Attempt state machine and stale callbacks | VERIFIED | `lib/player-attempt.ts`, unit tests, Playwright failover |
| Warning/hard deadline interaction | VERIFIED | timer lifecycle and regression test |
| Health ranking and circuit breaker | VERIFIED | provider health tests and bounded ranker |
| Manual switching and shell recovery | VERIFIED | desktop/mobile Playwright and production browser smoke |
| Native engine boundary | VERIFIED | `lib/player-engine.ts`; no authorized direct source enabled |
| Provider security/CSP/sandbox | VERIFIED | registry/CSP tests and E2E assertions |
| Accessibility/mobile/reduced motion shell | VERIFIED | 92-test Playwright matrix |
| Observability/performance/privacy | VERIFIED | scoped telemetry and no global probing/raw URLs |
| Production Vercel deployment metadata/logs | BLOCKED_BY_AUTH | no authenticated Vercel account tooling |
| Provider-owned playback success/quality | BLOCKED_EXTERNAL_PROVIDER | no documented provider signal; not claimed |
| Full fresh verification commands | VERIFIED | typecheck, lint, unit, build, audit, E2E all passed |

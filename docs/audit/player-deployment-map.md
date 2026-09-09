# Player deployment map

| Environment | Branch | SHA | Deployment | Player implementation |
|---|---|---|---|---|
| Local audit baseline | `main` | `3741fd1` | local checkout | `components/player/PlayerFrame.tsx` external iframe shell |
| Optimization worktree | `codex/veyra-player-optimization` | current worktree | not deployed | race-safe external embed engine; no direct media source |
| Production URL | unknown from repository | not verified | `https://streaming-platform-beryl.vercel.app` | real browser smoke observed an older/different deployed player build; Vercel account inspection unavailable |

`VERCEL_ACCOUNT_INSPECTION_BLOCKED_BY_AUTH`: deployment metadata and runtime logs were not available through the configured tools. No production result is inferred from the local branch.

Real browser smoke on 2026-09-09 loaded `/watch/movie/1007757`, showed the provider iframe and its provider-owned controls/error state, and switched the VEYRA shell from Server 1 to Server 2 immediately. The visible production labels (`FAST HD`, `ULTRA HD`, etc.) are not present in the current optimization worktree and are not treated as verified quality claims.

# Player deployment map

| Environment | Branch | SHA | Deployment | Player implementation |
|---|---|---|---|---|
| Local audit baseline | `main` | `3741fd1` | local checkout | `components/player/PlayerFrame.tsx` external iframe shell |
| Optimization worktree | `codex/veyra-player-optimization` | current worktree | not deployed | race-safe external embed engine; no direct media source |
| Production URL | unknown from repository | not verified | `https://streaming-platform-beryl.vercel.app` | public browser smoke required; Vercel account inspection unavailable |

`VERCEL_ACCOUNT_INSPECTION_BLOCKED_BY_AUTH`: deployment metadata and runtime logs were not available through the configured tools. No production result is inferred from the local branch.

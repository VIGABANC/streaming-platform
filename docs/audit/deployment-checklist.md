# VEYRA player deployment checklist

The verified worktree is ready for deployment. The local environment does not
have an authenticated Vercel CLI, so deployment must be performed by the
repository's existing Vercel integration or an authorized project owner.

## Before deployment

```powershell
npm run typecheck
npm run lint
npm test -- --run
npm run build
npm audit --omit=dev --audit-level=high
```

## Deploy

Deploy the current branch through the repository's authorized Vercel project.
Do not re-enable `NEXT_PUBLIC_EMBED_PROVIDER`; production iframe URLs must come
from the allowlisted provider registry.

## After deployment

Set the deployed URL and run the isolated live suite:

```powershell
$env:PLAYWRIGHT_LIVE_BASE_URL = 'https://<deployed-host>'
npx playwright test --config=playwright.live.config.ts
```

Confirm on `/watch/movie/1007757` and `/watch/tv/1399/1/1`:

- neutral Server 1–4 labels are visible;
- manual switching changes the iframe source immediately;
- provider failures do not cycle forever;
- frame load is reported as provider-controlled, not as confirmed playback;
- malformed TV routes render the 404 page;
- CSP and iframe origins match the registry;
- console errors are provider-specific and do not indicate a VEYRA race.

Record the final deployment URL, commit SHA, provider matrix, and timestamp in
`docs/audit/player-reliability-report.md`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Base44 Dev Environment

- **Stack**: Next.js 16.3.3 (Turbopack) + Tailwind CSS 4 + TypeScript. Single-origin app, no separate backend or database.
- **Run**: `docker compose -f docker-compose.base44.yml up -d` — uses `node:22` with source bind-mounted at `/app`, runs `npm install && npm run dev`.
- **Secrets**: `TMDB_API_KEY` (required for content; app boots without it showing empty rails). Delivered via `/run/base44/app.env`. Optional: Supabase, AI providers, Telegram, GitHub — all gracefully skipped when absent.
- **Dev origin**: `allowedDevOrigins` in `next.config.mjs` references `BASE44_PUBLIC_HOST_SUFFIX` for the preview origin.
- **Verify**: `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/` should return 200. Check `docker compose -f docker-compose.base44.yml logs --tail 20 web` for dev server status.

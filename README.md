<div align="center">

<img src="./public/icon.svg" alt="VEYRA" height="72" />

# VEYRA — The Night Signal

**A cinematic discovery and streaming frontend for movies and television.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![TMDB](https://img.shields.io/badge/Powered_by-TMDB-01b4e4?style=flat-square)](https://www.themoviedb.org)

[Features](#features) • [Getting Started](#getting-started) • [Project Structure](#project-structure) • [Configuration](#configuration) • [Testing](#testing)

</div>

---

VEYRA is a high-performance, dark-mode-first streaming discovery interface built with **Next.js 16** and **Turbopack**. It integrates with the [TMDB API](https://www.themoviedb.org) to surface trending, popular, top-rated, and newly released movies and TV shows through a polished, cinematic UI.

## Features

- **Cinematic Discovery** — Curated rails for Trending, Popular, Top Rated, Now Playing, Airing Today, and On The Air content.
- **Universal Search** — Debounced multi-search with URL query persistence, recent search history, category filtering, and a `/` hotkey focus shortcut.
- **Dynamic Detail Pages** — Comprehensive movie and TV detail views with backdrops, trailers, cast, production info, recommendations, and ratings.
- **Full TV Navigation** — Multi-season dropdowns, specials handling, and episode cards with runtime, air date, and overview.
- **Personal Library** — Watchlist, Favorites, and Continue Watching lists backed by `localStorage` and synchronized reactively across browser tabs.
- **Embedded Video Player** — Configurable embed provider with tiered load timeout warnings and fallback recovery.
- **PWA & Offline Support** — Web App Manifest with application shell caching and an offline fallback route.
- **Accessibility & SEO** — Semantic HTML5, skip navigation links, OpenGraph metadata, `sitemap.xml`, and `robots.txt`.

## Getting Started

### Prerequisites

- [Node.js 20+](https://nodejs.org/)
- A free [TMDB API key](https://www.themoviedb.org/settings/api)

### 1. Clone & install

```bash
git clone https://github.com/your-username/streaming-platform.git
cd streaming-platform
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Required — get your free key at https://www.themoviedb.org/settings/api
TMDB_API_KEY=your_tmdb_api_key_here

# Optional — defaults to https://v1.vidsrc.wiki
NEXT_PUBLIC_EMBED_PROVIDER=https://v1.vidsrc.wiki
```

> [!IMPORTANT]
> `TMDB_API_KEY` is server-side only and must never be prefixed with `NEXT_PUBLIC_`. It is never exposed to client bundles.

### Telegram feedback and AI enrichment

The Telegram webhook is available at `/api/telegram/webhook`. Apply the SQL migration in `supabase/migrations/20260905000000_feedback_reports.sql`, configure the service-role key only on the server, and register the webhook with Telegram using `TELEGRAM_WEBHOOK_SECRET`. Set `TELEGRAM_ADMIN_CHAT_IDS` to private chat IDs allowed to use `/aistatus` and `/reprocess <ticket>`.

Feedback is inserted into Supabase before any AI call. The router then tries configured providers in the free-first order Groq, Gemini, Cloudflare Workers AI, Mistral, OpenRouter Free, Cohere, Hugging Face, with optional Cerebras/NVIDIA only when zero-cost mode is disabled. Missing keys are skipped. AI failures produce a deterministic engineering ticket, preserve the report, and allow later `/reprocess` enrichment. GitHub issue creation is also best-effort after persistence.

Set `AI_ZERO_COST_ONLY=true` and `ALLOW_PAID_AI=false` to prevent known billable model use. Free-provider availability and quotas can change; the 24/7 guarantee applies to report acceptance and durable storage, not vendor uptime or quota.

See `.env.example` for all supported provider, Telegram, GitHub, Supabase, model, timeout, failover, and circuit-breaker settings.

---

### 2. Installation

Install project dependencies using npm:

```bash
npm install
```

---

### 3. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
streaming-platform/
├── app/                   # Next.js App Router pages & API routes
│   ├── api/               # Server-side route handlers (search, TV)
│   ├── movie/             # Movie detail pages
│   ├── tv/                # TV detail & season/episode pages
│   ├── browse/            # Catalog browse views
│   ├── discover/          # Discovery by genre and filters
│   ├── search/            # Search results page
│   ├── my-list/           # Watchlist management
│   ├── favorites/         # Favorites management
│   ├── history/           # Watch history
│   ├── watch/             # Embedded video player
│   └── profile/           # User settings and profile
├── components/            # Shared React components
│   ├── landing/           # Homepage showcase sections
│   ├── media/             # Media cards, rails, and posters
│   ├── player/            # Video player UI
│   ├── layout/            # Navigation and shell
│   └── ui/                # Primitive UI components (shadcn/ui)
├── lib/
│   ├── tmdb.ts            # TMDB API client (server-side)
│   ├── store.ts           # localStorage-backed user data store
│   ├── player.ts          # Player state and utilities
│   └── utils.ts           # Shared utilities
├── public/                # Static assets and PWA manifest
└── tests/
    ├── unit/              # Vitest unit tests
    ├── integration/       # Vitest integration tests
    └── e2e/               # Playwright end-to-end tests
```

## Configuration

| Variable | Required | Default | Description |
|---|---|---|---|
| `TMDB_API_KEY` | Yes | — | TMDB API key (server-side only) |
| `NEXT_PUBLIC_EMBED_PROVIDER` | No | `https://v1.vidsrc.wiki` | Base URL for the video embed provider |

The player constructs embed URLs in the following format:

- Movies: `{EMBED_PROVIDER}/embed/movie/{tmdb_id}/`
- TV episodes: `{EMBED_PROVIDER}/embed/tv/{tmdb_id}/{season}/{episode}/`

## Testing

```bash
# Unit and integration tests (Vitest)
npm test

# End-to-end tests (Playwright)
npm run test:e2e

# TypeScript type checking
npm run typecheck

# Linting
npm run lint
```

## Deployment

Build the optimized production bundle and start the server:

```bash
npm run build
npm run start
```

VEYRA is designed to deploy on [Vercel](https://vercel.com) with zero configuration. Set the required environment variables in your Vercel project settings before deploying.

> [!NOTE]
> Vercel Analytics is automatically enabled in production via `@vercel/analytics`.

## Attribution

- **TMDB** — This product uses the TMDB API but is not endorsed or certified by TMDB.
- **External Video Providers** — Video streams are served via third-party embed providers. VEYRA does not host, store, or stream any media content directly.

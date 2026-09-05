# VEYRA — The Night Signal

VEYRA is a high-performance cinematic discovery and streaming frontend built with Next.js 16 (Turbopack), Tailwind CSS, TypeScript, and TMDB API.

---

## Features

- **Cinematic Discovery**: Curated rails for Trending, Popular, Top Rated, Now Playing, Airing Today, and On The Air.
- **Universal Finder (Search)**: Debounced multi-search with URL query persistence, recent search history, category filtering, and `/` hotkey focus.
- **Dynamic Detail Pages**: Comprehensive movie and TV details including backdrops, trailers, cast, production info, recommendations, and ratings.
- **Full TV Season & Episode Navigation**: Multi-season dropdown/tabs, specials handling, episode cards with runtime, air date, and overview.
- **Watchlist, Favorites & Continue Watching**: Reactive client-side media storage synchronized across browser tabs with dedicated management views.
- **Video Player Frame**: Embedded playback with configurable provider (`NEXT_PUBLIC_EMBED_PROVIDER`), tiered load timeout warnings, and fallback recovery.
- **PWA & Offline Ready**: Web App Manifest with application shell caching and an offline fallback route.
- **Accessibility & SEO**: Semantic HTML5, skip navigation links, OpenGraph metadata, `sitemap.xml`, and `robots.txt`.

---

## Getting Started

### 1. Environment Setup

Copy the example environment template:

```bash
cp .env.example .env.local
```

Configure your environment variables in `.env.local`:

```env
# TMDB API Key (Required for catalog browsing and search)
# Get your free key at: https://www.themoviedb.org/settings/api
TMDB_API_KEY=your_tmdb_api_key_here

# Embed provider base URL (Default: https://v1.vidsrc.wiki)
NEXT_PUBLIC_EMBED_PROVIDER=https://v1.vidsrc.wiki
```

> **Security Note:** `TMDB_API_KEY` is server-side only and never exposed to client bundles.

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

### 3. Development Server

Start the local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view VEYRA in your browser.

---

### 4. Quality Verification & Testing

Run the test suites:

```bash
# Run unit and integration tests (Vitest)
npm test

# Run end-to-end tests (Playwright)
npm run test:e2e

# Run TypeScript compiler check
npm run typecheck

# Run linter
npm run lint
```

---

### 5. Production Build

Build and launch the optimized production server:

```bash
npm run build
npm run start
```

---

## Attribution & Disclaimers

- **TMDB**: This product uses the TMDB API but is not endorsed or certified by TMDB.
- **External Video Providers**: Video streams are served via external embed providers. VEYRA does not host, store, or stream media content directly.

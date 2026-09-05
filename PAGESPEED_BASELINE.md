# VEYRA PageSpeed and performance evidence

Date: 2026-09-05

This file separates supplied historical PageSpeed reports from fresh local
measurements. Scores are not interchangeable: the historical reports target
the deployed `/audit` page, while the fresh probe targets the local production
build at `/landing`.

## Historical mobile reports

| Metric | Report A (`zva9489ric`) | Report B (`5c06d12j8f`) |
|---|---:|---:|
| Performance | 97 | 75 |
| Accessibility | 96 | 96 |
| Best Practices | 100 | 100 |
| SEO | 66 | 66 |
| Agentic Browsing | 2/2 | 2/2 |
| FCP | 0.9s | 1.0s |
| LCP | 2.6s | 2.9s |
| TBT | 20ms | 840ms |
| CLS | 0 | 0 |
| Speed Index | 1.1s | 2.2s |

Both reports were inspected in PageSpeed Insights on 2026-09-05. Both are
mobile runs using an emulated Moto G Power, slow-4G throttling, and
HeadlessChromium 151. Report A called out render-blocking requests (estimated
580ms), unused JavaScript (94KiB), 24 non-composited animated elements, and
one long task. Report B called out render-blocking requests (330ms), 2.7s of
main-thread work, 1.7s of JavaScript execution, 94KiB of unused JavaScript,
and 11 long tasks. The SEO score is 66 because `/audit` is intentionally
blocked from indexing; that is expected for an audit surface, not a catalog
SEO result.

Supplied reports:

- [Historical mobile report A](https://pagespeed.web.dev/analysis/https-streaming-platform-beryl-vercel-app-audit/zva9489ric?form_factor=mobile&category=performance&category=accessibility&category=best-practices&category=seo&category=agentic-browsing&hl=en-US&utm_source=lh-chrome-ext)
- [Historical mobile report B](https://pagespeed.web.dev/analysis/https-streaming-platform-beryl-vercel-app-audit/5c06d12j8f?hl=en-US&form_factor=mobile)

## Fresh local production-mode probe

Command: `npx playwright test tests/e2e/performance-baseline.spec.ts --reporter=line`

The probe ran against `next build` followed by the Playwright web server. It
records browser navigation and paint timing; it is not a Lighthouse score and
must not be presented as a production Core Web Vitals result.

| Browser project | Viewport | DOMContentLoaded | load | First Paint | FCP | Resources |
|---|---:|---:|---:|---:|---:|---:|
| Chromium | 1280×720 | 173ms | 365ms | 300ms | 300ms | 32 |
| Mobile Chrome | 393×727 | 304ms | 305ms | 212ms | 212ms | 24 |

The test passed in both projects. The local route was `/landing`, with the
normal test environment's unavailable external catalog configuration; these
timings therefore include the app's graceful failure path and are useful for
regression comparison only.

## Fresh local Lighthouse probe

Lighthouse 13.4.1 also produced readable JSON for both local production runs
using the installed Microsoft Edge binary and simulated throttling. The CLI
exited with a Windows temporary-profile cleanup error after writing the JSON;
the scores below were read from those JSON files before they were removed.

| Metric | Local mobile | Local desktop |
|---|---:|---:|
| Performance | 74 | 54 |
| Accessibility | 91 | 91 |
| Best Practices | 96 | 96 |
| SEO | 100 | 100 |
| FCP | 1.1s | 1.1s |
| LCP | 3.7s | 3.6s |
| TBT | 590ms | 460ms |
| CLS | 0 | 0 |

These are local synthetic scores on the graceful catalog-failure path, not
deployed or real-user results. The elevated LCP/TBT is a release follow-up:
profile the landing route with valid catalog data and a production trace before
changing the cinematic hero or its loading budget.

## Measurement limitations

- No trustworthy fresh deployed score was claimed because this worktree has no
  production deployment control or valid production catalog credentials.
- The Lighthouse CLI exited after report generation because temporary-profile
  cleanup failed on Windows (`EPERM`). The resulting JSON was parsed for the
  scores above and then removed from the worktree.
- Real-user data, real-device traces, authenticated sync journeys, and live
  Supabase/RLS behavior remain deployment gates.

# Verified Bugs and Fixes

## Fixed in the working tree

- BUG-001: Landing discovery sections were deferred behind a far-below sentinel, so the first viewport missed the finder and primary discovery controls. Fixed by making the primary landing sections mount on first render.
- BUG-002: Search/finder E2E journeys timed out for the same deferred-section cause. Covered by the route and search suites.
- BUG-003: Anime poster requests from `cdn.myanimelist.net` were blocked by the application CSP. Added the configured poster origin and a release-security regression test.
- BUG-004: Several fallback, footer, provider, player, auth, and collection labels failed WCAG contrast. Raised text colors to readable values and verified with axe.
- BUG-005: Local production runs emitted a Vercel Analytics 404. Analytics is now enabled only for Vercel or explicit opt-in environments.
- BUG-006: Card/action/provider labels overrode visible text and failed `label-content-name-mismatch`. Removed redundant accessible-name overrides and retained labels only for icon-only controls.
- BUG-007: World Cinema and provider catalog pages nested a second `<main>` inside the Shell landmark. Changed inner layout wrappers to `<div>`.
- BUG-008: Collection play links were icon-only without accessible names. Added title-specific play labels.
- BUG-009: TV player controls used accessible labels that did not include their visible text. Removed or aligned redundant labels; third-party iframe content is excluded from host axe checks.
- BUG-010: Anime watch fallback metadata was below contrast threshold. Raised the fallback copy contrast.

- BUG-011 (S3, accessibility): Five serious axe contrast failures were reproduced on `/`, `/landing`, `/streaming/8`, and `/watch/tv/1399/1/1`. Fixed provider helper contrast, invalid-provider link color, and episode-label color. Desktop/mobile route gates now pass.
- BUG-012 (S3, route): Malformed dynamic routes render an owned soft-404 UI with `noindex` but HTTP 200 under documented Next 16 streaming behavior. Added strict detail-page validation and a five-case desktop/mobile regression matrix. Hard status remains a framework/proxy design limitation.
- BUG-013 (S1, security): `npm audit` reproduced 14 high/critical advisories, including Next 16.3.3 and proxy-addr. Upgraded Next to 16.4.3 and ran non-force `npm audit fix`; current audit reports zero vulnerabilities.
- BUG-014 (S2, hydration): The headed development browser reproduced a React hydration mismatch on `/watch/movie/550` when persisted provider-health ranking changed the client provider order relative to the server render. The resolver read browser storage during render. Fixed by passing an explicit provider-health snapshot and loading persisted health after hydration; added resolver and Playwright regression coverage. Clean production E2E now passes 125/125 desktop and 125/125 mobile.
- BUG-015 (S1, search data quality): A historical browser pass showed repeated-character query `zzzzzz` surfacing a weak `Zzzzzzz` result. Current `rankSearchResults` filtering and API behavior return an empty visible result set; the ranking unit regression and live API revalidation pass.
- BUG-016 (S2, search navigation): A historical browser pass did not activate the landing search affordance. The current landing navigation is a direct `/search` link, and the fresh production-server search suite now covers and passes the navigation flow.

## External dependency note

The production build can log a caught Jikan connection timeout during static generation when `api.jikan.moe` is unreachable. The build still completes and anime routes render the intended truthful fallback. This is an external availability condition, not an unhandled application error.

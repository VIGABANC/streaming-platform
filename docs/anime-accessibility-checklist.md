# VEYRA anime accessibility checklist

## Automated and code-level coverage

- [x] Anime pages render within the existing `main` landmark and shell.
- [x] Anime cards and actions use semantic links/buttons with visible focus
      treatment and accessible image alternatives.
- [x] Anime rails expose labelled sections and keyboard-operable scroll
      controls; decorative icons are hidden from assistive technology.
- [x] Trailer iframes have descriptive titles, lazy loading, and bounded
      permissions.
- [x] Airing, unavailable, and empty states are exposed as readable text and
      do not block the rest of the catalog.
- [x] Mobile navigation and anime route smoke tests pass at the 390px class of
      viewport; Playwright passes for Chromium and Mobile Chrome.
- [x] Existing reduced-motion and dialog accessibility behavior remains covered
      by the full unit/E2E suite.

## Manual target-device checks

- [ ] Keyboard-tab through `/anime` and an anime detail page; verify focus is
      visible, ordered, and never trapped in a horizontal rail.
- [ ] Test with a screen reader: headings, rail labels, card titles, poster
      alternatives, airing status, and unavailable states should be announced
      meaningfully.
- [ ] Verify 44px-equivalent touch targets and no horizontal document overflow
      at 390x844 and on a real narrow device.
- [ ] Verify contrast in the cinematic dark theme under the target WCAG 2.1 AA
      contrast checks, including muted metadata and error notices.
- [ ] Enable reduced motion and confirm rail/hero transitions remain calm while
      content and controls stay available.
- [ ] Verify YouTube consent/privacy behavior and focus return around any
      trailer interaction in the deployed browser.

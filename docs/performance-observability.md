# Performance and observability

VEYRA self-hosts its Google fonts through `next/font`, requests the `w1280`
hero backdrop instead of TMDB's original asset, and only marks the first two
grid cards as eager. The remaining catalog images stay lazy through
`next/image`.

`components/observability/WebVitals.tsx` reports LCP, CLS, and INP (or the
first-input fallback) through the existing Vercel Analytics integration. It
also records only the failure category and pathname for uncaught client
errors; no exception message, query string, title, or account data is sent.

These events are field telemetry, not a substitute for a production device
matrix. Re-run Lighthouse or a real-device trace after deployment and compare
the route-level events before changing further loading priorities.

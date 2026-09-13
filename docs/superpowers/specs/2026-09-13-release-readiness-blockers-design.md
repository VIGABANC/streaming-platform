# Release Readiness Blockers Design

The application will expose all core product areas as labeled routes, add a real Anime discovery page backed by Jikan's public top-anime feed, and retain truthful playback-unavailable messaging. Security hardening will fail Telegram closed and use a trusted platform header for rate-limit identity. Library auth transitions will retain anonymous data for same-user sign-in and isolate data on user changes/sign-out.

SEO will publish only stable routes that the application can actually resolve; no fabricated entity IDs or timestamps will be emitted. DNS is an external deployment prerequisite and is out of code scope.

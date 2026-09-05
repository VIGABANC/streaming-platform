# Search rate-limit deployment note

The search route uses a bounded per-process fallback limiter (`30` requests per identity per `60` seconds) and returns `429` with `Retry-After`. This protects local development and a single instance, but memory is not shared across serverless instances.

For multi-instance production deployments, configure the same `checkRateLimit` contract against a shared Vercel/Redis-compatible store at the edge. The route already emits stable public error codes and does not log raw search text; the in-memory fallback must not be described as globally authoritative.

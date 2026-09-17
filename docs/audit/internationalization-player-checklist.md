# Internationalization and Player Checklist

This is the verification checklist for P1 language and accessibility work.

- [ ] Arabic text renders with correct RTL direction where semantically needed.
- [ ] Hebrew text renders with correct RTL direction where semantically needed.
- [ ] Japanese, Korean, Chinese, English, French, and German labels remain
      UTF-8-safe in UI, URLs, provider queries, and telemetry categories.
- [ ] Mixed-script titles preserve BiDi punctuation and readable truncation.
- [ ] Subtitle and audio preferences are shown only when a provider capability
      is verified; fallback behavior is explicit.
- [ ] Server controls are semantic buttons with selected state and labels.
- [ ] Automatic failover uses conservative `aria-live` announcements and does
      not steal focus.
- [ ] Reduced motion disables decorative motion without disabling functionality.
- [ ] Mobile controls meet approximately 44px touch targets at 375x812,
      390x844, and 430x932.

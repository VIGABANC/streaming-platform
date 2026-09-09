# Provider Capability Matrix

The configured providers are opaque cross-origin embeds. Unless a capability is
documented by the provider and verified at runtime, VEYRA represents it as
unsupported or unknown.

| Provider | Movie | TV | Observability tier | Ready/progress/error events | Subtitle preference | Audio preference | Quality control | Trust status |
|---|---:|---:|---|---|---|---|---|---|
| `vidsrc-wiki` | yes | yes | C — opaque iframe | unknown; frame load only | documented `sub` query; runtime playback still unverified | unknown | none / provider-controlled | configured, pending formal review |
| `vidsrc-xyz` | yes | yes | C — opaque iframe | unknown; frame load only | unknown | unknown | none / provider-controlled | configured, pending formal review |
| `2embed` | yes | yes | C — opaque iframe | unknown; frame load only | unknown | unknown | none / provider-controlled | configured, pending formal review |
| `autoembed` | yes | yes | C — opaque iframe | unknown; frame load only | unknown | unknown | none / provider-controlled | configured, pending formal review |

## Product rules

- `iframe.onload` is recorded as `FRAME_LOADED`, never as playback success.
- Quality is displayed as provider-controlled; VEYRA does not manufacture 4K,
  1080p, or 720p controls.
- Audio, subtitle, completion, and progress features remain unavailable until
  documented and verified signals exist.
- Trust eligibility is a hard gate separate from technical health ranking.

## Documentation boundary

The cited VidSrc SBS documentation describes subtitle, autoplay, accent, and
timestamp query parameters, but `vidsrc.sbs` is not one of VEYRA's configured
provider origins. Those claims are therefore not transferred to `vidsrc-wiki`,
`vidsrc-xyz`, or any other configured domain without domain-specific evidence.

export type EmbedReferrerPolicy = 'origin' | 'no-referrer' | 'strict-origin-when-cross-origin'

export interface EmbedProviderConfig {
  id: string
  name: string
  sandbox: string
  allow: string
  referrerPolicy: EmbedReferrerPolicy
}

// NOTE: 'allow-scripts allow-same-origin' is required for third-party video
// players. The combination allows the iframe to escape its sandbox, but only
// within its own origin. VEYRA's origin remains isolated because:
//   - each iframe is loaded from the provider's origin, not VEYRA's
//   - no document.domain relaxation is performed
//   - CSP frame-src is allowlisted to configured provider origins only
// Do NOT add 'allow-top-navigation' — that would let the iframe hijack the tab.
const THIRD_PARTY_SANDBOX = 'allow-scripts allow-same-origin allow-presentation allow-forms allow-popups allow-popups-to-escape-sandbox allow-orientation-lock'
const VIDEO_ALLOW = 'autoplay; fullscreen; encrypted-media; picture-in-picture; clipboard-write'

export const EMBED_PROVIDERS: EmbedProviderConfig[] = [
  'vidsrc-wiki', 'vidsrc-xyz', '2embed', 'autoembed',
].map((id, index) => ({
  id,
  name: `Server ${index + 1}`,
  sandbox: THIRD_PARTY_SANDBOX,
  allow: VIDEO_ALLOW,
  referrerPolicy: 'origin',
}))

export function getEmbedProviderConfig(id: string): EmbedProviderConfig | undefined {
  return EMBED_PROVIDERS.find((provider) => provider.id === id)
}

export const EMBED_SANDBOX_POLICY = THIRD_PARTY_SANDBOX
export const EMBED_ALLOW_POLICY = VIDEO_ALLOW

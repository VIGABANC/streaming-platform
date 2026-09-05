import { createCerebrasProvider } from './providers/cerebras'
import { createCloudflareProvider } from './providers/cloudflare'
import { createCohereProvider } from './providers/cohere'
import { createGeminiProvider } from './providers/gemini'
import { createGroqProvider } from './providers/groq'
import { createHuggingFaceProvider } from './providers/huggingface'
import { createMistralProvider } from './providers/mistral'
import { createNvidiaProvider } from './providers/nvidia'
import { createOpenRouterProvider } from './providers/openrouter'
import { aiProviderIds, type AIConfig, type AIProvider, type AIProviderId } from './types'

const defaultOrder: AIProviderId[] = [...aiProviderIds]
const defaultModels: Record<AIProviderId, string> = {
  groq: 'openai/gpt-oss-20b',
  gemini: 'gemini-2.0-flash-lite',
  cloudflare: '@cf/meta/llama-3.1-8b-instruct',
  mistral: 'mistral-small-latest',
  openrouter: 'openrouter/free',
  cohere: 'command-r7b-12-2024',
  huggingface: 'HuggingFaceTB/SmolLM3-3B',
  cerebras: 'llama-3.3-70b',
  nvidia: 'meta/llama-3.1-8b-instruct',
  deterministic: 'deterministic',
}

type Environment = Record<string, string | undefined>

function bool(env: Environment, key: string, fallback: boolean): boolean {
  const value = env[key]?.toLowerCase()
  return value === undefined ? fallback : value === 'true' || value === '1' || value === 'yes'
}

function positiveInt(env: Environment, key: string, fallback: number): number {
  const value = Number(env[key])
  return Number.isInteger(value) && value > 0 ? value : fallback
}

function freeOpenRouterModel(model: string): boolean {
  return model === 'openrouter/free' || model.endsWith(':free')
}

export function getAIConfig(env: Environment = process.env): AIConfig {
  const models = { ...defaultModels }
  for (const provider of aiProviderIds) {
    const key = `${provider.toUpperCase()}_MODEL`
    if (env[key]) models[provider] = env[key]!
  }
  const allowPaidAi = bool(env, 'ALLOW_PAID_AI', false)
  const zeroCostOnly = bool(env, 'AI_ZERO_COST_ONLY', true)
  if ((zeroCostOnly || !allowPaidAi) && env.OPENROUTER_MODEL && !freeOpenRouterModel(models.openrouter)) {
    throw new Error('OpenRouter model must be a :free model when paid AI is disabled')
  }

  const configuredOrder = env.AI_PROVIDER_ORDER?.split(',').map((value) => value.trim()).filter(Boolean) ?? defaultOrder
  const providerOrder = configuredOrder.filter((value): value is AIProviderId => (aiProviderIds as readonly string[]).includes(value))
  return {
    providerOrder: providerOrder.length ? providerOrder : defaultOrder,
    providerTimeoutMs: Math.min(15_000, Math.max(8_000, positiveInt(env, 'AI_PROVIDER_TIMEOUT_MS', 10_000))),
    syncBudgetMs: Math.min(30_000, Math.max(20_000, positiveInt(env, 'AI_SYNC_BUDGET_MS', 25_000))),
    cooldownMs: positiveInt(env, 'AI_PROVIDER_COOLDOWN_MS', 60_000),
    circuitFailureThreshold: 3,
    allowPaidAi,
    zeroCostOnly,
    models,
    credentials: {
      groq: env.GROQ_API_KEY,
      gemini: env.GEMINI_API_KEY,
      cloudflare: env.CLOUDFLARE_AI_API_TOKEN,
      mistral: env.MISTRAL_API_KEY,
      openrouter: env.OPENROUTER_API_KEY,
      cohere: env.COHERE_API_KEY,
      huggingface: env.HUGGINGFACE_API_KEY,
      cerebras: env.CEREBRAS_API_KEY,
      nvidia: env.NVIDIA_API_KEY,
    },
    cloudflareAccountId: env.CLOUDFLARE_ACCOUNT_ID ?? null,
  }
}

export function createConfiguredProviders(config: AIConfig = getAIConfig(), fetchImpl: typeof fetch = fetch): AIProvider[] {
  const providers: Partial<Record<AIProviderId, AIProvider>> = {}
  const key = (id: AIProviderId) => config.credentials[id]
  if (key('groq')) providers.groq = createGroqProvider({ apiKey: key('groq')!, model: config.models.groq, fetchImpl })
  if (key('gemini')) providers.gemini = createGeminiProvider({ apiKey: key('gemini')!, model: config.models.gemini, fetchImpl })
  if (key('cloudflare') && config.cloudflareAccountId) providers.cloudflare = createCloudflareProvider({ accountId: config.cloudflareAccountId, apiToken: key('cloudflare')!, model: config.models.cloudflare, fetchImpl })
  if (key('mistral')) providers.mistral = createMistralProvider({ apiKey: key('mistral')!, model: config.models.mistral, fetchImpl })
  if (key('openrouter')) providers.openrouter = createOpenRouterProvider({ apiKey: key('openrouter')!, model: config.models.openrouter, fetchImpl })
  if (key('cohere')) providers.cohere = createCohereProvider({ apiKey: key('cohere')!, model: config.models.cohere, fetchImpl })
  if (key('huggingface')) providers.huggingface = createHuggingFaceProvider({ apiKey: key('huggingface')!, model: config.models.huggingface, fetchImpl })
  if (key('cerebras') && config.allowPaidAi && !config.zeroCostOnly) providers.cerebras = createCerebrasProvider({ apiKey: key('cerebras')!, model: config.models.cerebras, fetchImpl })
  if (key('nvidia') && config.allowPaidAi && !config.zeroCostOnly) providers.nvidia = createNvidiaProvider({ apiKey: key('nvidia')!, model: config.models.nvidia, fetchImpl })
  return config.providerOrder.flatMap((id) => providers[id] ? [providers[id]!] : [])
}

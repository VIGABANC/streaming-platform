export class ProviderTimeoutError extends Error {
  constructor(message = 'Provider request timed out') {
    super(message)
    this.name = 'ProviderTimeoutError'
  }
}

export async function fetchWithTimeout(
  fetcher: typeof fetch,
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 8000,
): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetcher(input, { ...init, signal: controller.signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ProviderTimeoutError()
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

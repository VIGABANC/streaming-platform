const SCRIPT_CONTEXT_ESCAPES: Record<string, string> = {
  '<': '\\u003C',
  '>': '\\u003E',
  '&': '\\u0026',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
}

export function serializeJsonLd(value: unknown): string {
  const json = JSON.stringify(value) ?? 'null'
  return json.replace(/[<>&\u2028\u2029]/g, (character) => SCRIPT_CONTEXT_ESCAPES[character])
}

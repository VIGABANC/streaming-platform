export interface IntegerRange {
  min: number
  max: number
}

export function parsePositiveIntSegment(value: string, range: IntegerRange): number | null {
  if (!/^\d+$/.test(value)) return null
  if (value.length > 1 && value.startsWith('0')) return null

  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < range.min || parsed > range.max) return null
  return parsed
}

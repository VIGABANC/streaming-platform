import { describe, expect, it } from 'vitest'
import { parsePositiveIntSegment } from '@/lib/http/validation'

describe('route segment validation', () => {
  it.each(['1abc', '01junk', '-1', '', ' 2'])('rejects malformed numeric segment %s', (value) => {
    expect(parsePositiveIntSegment(value, { min: 1, max: 100 })).toBeNull()
  })

  it('accepts a canonical in-range integer', () => {
    expect(parsePositiveIntSegment('12', { min: 1, max: 100 })).toBe(12)
  })

  it('rejects zero and non-canonical leading-zero route IDs', () => {
    expect(parsePositiveIntSegment('0', { min: 1, max: Number.MAX_SAFE_INTEGER })).toBeNull()
    expect(parsePositiveIntSegment('01', { min: 1, max: Number.MAX_SAFE_INTEGER })).toBeNull()
  })
})

import { describe, expect, it } from 'vitest'
import { serializeJsonLd } from '@/lib/seo/json-ld'

describe('JSON-LD serialization', () => {
  it('keeps hostile values inside the script data context', () => {
    const serialized = serializeJsonLd({
      name: '</script><script>alert(1)</script>',
      description: '<>&\u2028\u2029',
    })

    expect(serialized).not.toContain('</script>')
    expect(serialized).toContain('\\u003C/script\\u003E')
    expect(JSON.parse(serialized).name).toContain('</script>')
  })
})

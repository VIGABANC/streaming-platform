import { describe, expect, it } from 'vitest'
import { checkDeployment } from '../../scripts/check-deployment.mjs'
describe('deployment evidence', () => {
  it('never labels unresolved DNS as verified', async () => {
    const result = await checkDeployment('https://veyra.stream', async () => { throw new Error('ENOTFOUND') })
    expect(result.status).toBe('BLOCKED')
    expect(result.dnsVerified).toBe(false)
  })
  it('rejects non-HTTPS or path-bearing canonical origins', async () => {
    expect((await checkDeployment('http://veyra.stream/path', async () => [{ address: '1.2.3.4', family: 4 }])).status).toBe('FAIL')
  })
  it('does not infer application readiness from DNS resolution', async () => {
    const result = await checkDeployment('https://veyra.stream', async () => [{ address: '1.2.3.4', family: 4 }])
    expect(result.dnsVerified).toBe(true)
    expect(result.applicationVerified).toBe(false)
  })
})

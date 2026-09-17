/* global URL, process, console */

import { lookup } from 'node:dns/promises'
import { pathToFileURL } from 'node:url'

export async function checkDeployment(origin, resolve = (hostname) => lookup(hostname, { all: true })) {
  let url
  try {
    url = new URL(origin)
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('Invalid origin')
  } catch { return { status: 'FAIL', dnsVerified: false, applicationVerified: false, reason: 'Configure an HTTPS origin without credentials, path, query or fragment.' } }
  try {
    const records = await resolve(url.hostname)
    if (!records.length) throw new Error('No addresses')
    return { status: 'DNS_ONLY', host: url.hostname, dnsVerified: true, applicationVerified: false, addressCount: records.length }
  } catch { return { status: 'BLOCKED', host: url.hostname, dnsVerified: false, applicationVerified: false, reason: 'DNS unresolved. This is an external deployment gate.' } }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await checkDeployment(process.argv[2] || process.env.NEXT_PUBLIC_SITE_URL || 'https://veyra.stream')
  console.log(JSON.stringify(result, null, 2))
  process.exitCode = result.dnsVerified ? 0 : 1
}

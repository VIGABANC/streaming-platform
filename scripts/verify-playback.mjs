import { createHash, generateKeyPairSync, sign } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'

const inputPath = process.argv[2] ?? 'tests/fixtures/playback-matrix.json'
const outputPath = process.argv[3] ?? 'artifacts/playback-verification-report.json'
const matrix = JSON.parse(await readFile(inputPath, 'utf8'))
const checkedAt = new Date().toISOString()
const signalNames = new Set(['loadedmetadata', 'canplay', 'playing', 'provider-reported-state'])

async function check(item) {
  const evidence = []
  const record = (stage, passed, detail, extra = {}) => evidence.push({ stage, passed, checkedAt, detail, ...extra })
  record('metadata', Boolean(item.metadataUrl), item.metadataUrl ? 'Metadata route configured' : 'Missing metadata route', { url: item.metadataUrl })
  record('detail', Boolean(item.detailUrl), item.detailUrl ? 'Detail route configured' : 'Missing detail route', { url: item.detailUrl })
  record('watch-route', Boolean(item.watchUrl), item.watchUrl ? 'Watch route configured' : 'Missing watch route', { url: item.watchUrl })
  const signal = item.playbackSignal
  record('playback-signal', signalNames.has(signal), signalNames.has(signal) ? 'Trusted media/provider signal recorded' : 'Iframe load is not playback evidence', { signal })
  return { ...item, passed: evidence.every((entry) => entry.passed), evidence }
}

const records = await Promise.all(matrix.records.map(check))
const payload = { protocol: 'veyra-playback-verification/v1', checkedAt, providerId: matrix.providerId, matrix: matrix.matrix, recordCount: records.length, passed: records.every((record) => record.passed), records }
const canonical = JSON.stringify(payload)
const digest = createHash('sha256').update(canonical).digest('hex')
const { privateKey, publicKey } = generateKeyPairSync('ed25519')
const signature = sign(null, Buffer.from(canonical), privateKey).toString('base64')
const report = { ...payload, digest, signature, publicKey: publicKey.export({ type: 'spki', format: 'pem' }) }
await writeFile(outputPath, JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ outputPath, providerId: report.providerId, matrix: report.matrix, recordCount: report.recordCount, passed: report.passed, digest }))
if (!report.passed) process.exitCode = 1

function _keepTypesVisible() { return signalNames }
void _keepTypesVisible

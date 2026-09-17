/* global process */

import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

const cli = resolve('node_modules/@playwright/test/cli.js')
const args = process.argv.slice(2)
const hasProject = args.some((arg) => arg === '--project' || arg.startsWith('--project='))
const projects = hasProject ? [null] : ['chromium', 'Mobile Chrome']

for (const project of projects) {
  const projectArgs = project ? ['--project', project, ...args] : args
  const explicitProject = args.find((arg) => arg.startsWith('--project='))?.slice('--project='.length)
    ?? (args.includes('--project') ? args[args.indexOf('--project') + 1] : undefined)
  const result = spawnSync(process.execPath, [cli, 'test', ...projectArgs], {
    stdio: 'inherit',
    env: { ...process.env, VEYRA_E2E_PROJECT: project ?? explicitProject ?? 'all' },
  })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}

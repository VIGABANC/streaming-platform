/* global process */

import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

const cli = resolve('node_modules/@playwright/test/cli.js')
const args = process.argv.slice(2)
const hasProject = args.some((arg) => arg === '--project' || arg.startsWith('--project='))
const projects = hasProject ? [null] : ['chromium', 'Mobile Chrome']
const projectIndex = args.findIndex((arg) => arg === '--project' || arg.startsWith('--project='))
const explicitProject = projectIndex >= 0
  ? args[projectIndex].startsWith('--project=')
    ? args[projectIndex].slice('--project='.length)
    : args[projectIndex + 1]
  : undefined
const argsWithoutProject = projectIndex >= 0
  ? args.filter((_, index) => index !== projectIndex && !(args[projectIndex] === '--project' && index === projectIndex + 1))
  : args

for (const project of projects) {
  const projectArgs = [...argsWithoutProject, '--project', project ?? explicitProject]
  const result = spawnSync(process.execPath, [cli, 'test', ...projectArgs], {
    stdio: 'inherit',
    env: { ...process.env, VEYRA_E2E_PROJECT: project ?? explicitProject ?? 'all' },
  })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}

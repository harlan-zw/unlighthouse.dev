/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { it } from 'node:test'

function readBuildSessionPassword(workflow: string) {
  let inBuildStep = false
  let inEnvironment = false

  for (const line of workflow.split('\n')) {
    if (line === '      - run: pnpm build') {
      inBuildStep = true
      continue
    }
    if (inBuildStep && line === '        env:') {
      inEnvironment = true
      continue
    }
    if (inEnvironment && line.startsWith('          NUXT_SESSION_PASSWORD: '))
      return line.slice('          NUXT_SESSION_PASSWORD: '.length)
  }
}

it('keeps the production session password out of PR builds', async () => {
  const sessionPassword = readBuildSessionPassword(await readFile('.github/workflows/ci.yml', 'utf8'))

  assert.equal(sessionPassword, 'pr-build-session-password-placeholder')
  assert.doesNotMatch(sessionPassword ?? '', /secrets\.NUXT_SESSION_PASSWORD/)
})

/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { it } from 'node:test'
import { runExternalChecks } from '@harlan-zw/nuxt-checkin/external'
import ci from '../checks/external/ci.mjs'

it('keeps per-workflow results when the flat run listing is rate limited', async () => {
  const root = mkdtempSync(join(tmpdir(), 'checkin-ci-'))
  mkdirSync(join(root, '.github/workflows'), { recursive: true })
  writeFileSync(join(root, '.github/workflows/deploy.yml'), 'name: Deploy\n')
  writeFileSync(join(root, 'gh'), `#!/usr/bin/env node
const args = process.argv.slice(2)
const workflow = args.indexOf('--workflow')
if (workflow === -1) { console.error('Rate limited'); process.exit(1) }
console.log(JSON.stringify([{ workflowName: args[workflow + 1], status: 'completed', conclusion: 'success' }]))
`)
  chmodSync(join(root, 'gh'), 0o755)
  try {
    const { report, exitCode } = await runExternalChecks([ci], { required: ['repository.ci'] }, {
      rootDir: root,
      env: { ...process.env, PATH: `${root}:${process.env.PATH}` },
    })
    assert.equal(exitCode, 0)
    assert.deepEqual(report.results[0].result.evidence.workflows.map(row => [row.name, row.state._tag]), [['Deploy', 'success']])
  }
  finally {
    rmSync(root, { recursive: true, force: true })
  }
})

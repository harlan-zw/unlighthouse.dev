/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { it } from 'node:test'
import { runExternalChecks } from '@harlan-zw/nuxt-checkin/external'
import workers from '../checks/external/workers.mjs'

it('treats a set-but-empty Cloudflare token as unavailable, not an exception', async () => {
  const root = mkdtempSync(join(tmpdir(), 'checkin-workers-'))
  try {
    const { report } = await runExternalChecks([workers], { required: ['cloudflare.workers'] }, {
      rootDir: root,
      env: { ...process.env, CLOUDFLARE_API_TOKEN: '', CF_API_TOKEN: '' },
    })
    assert.deepEqual(report.results[0].result, { _tag: 'Unavailable', reason: 'Cloudflare read credential is unavailable.' })
  }
  finally {
    rmSync(root, { recursive: true, force: true })
  }
})

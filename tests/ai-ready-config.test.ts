/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('uses the fixed AI Ready release with hourly runtime sync', async () => {
  const [config, workspace] = await Promise.all([
    readFile(new URL('../nuxt.config.ts', import.meta.url), 'utf8'),
    readFile(new URL('../pnpm-workspace.yaml', import.meta.url), 'utf8'),
  ])

  assert.match(workspace, /^ {2}nuxt-ai-ready: \^1\.7\.7$/m)
  assert.match(config, /aiReady:\s*\{[\s\S]*?cron:\s*true/)
  assert.match(config, /runtimeSync:\s*\{\s*ttl:\s*60 \* 60/)
})

/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('pairs neutral 500 homepage text with an AA dark mode color', async () => {
  const source = await readFile(new URL('../app/pages/index.vue', import.meta.url), 'utf8')
  const neutralTextLines = source.split('\n').filter(line => line.includes('text-neutral-500'))

  assert.ok(neutralTextLines.length > 0)
  assert.ok(neutralTextLines.every(line => line.includes('dark:text-neutral-400')))
})

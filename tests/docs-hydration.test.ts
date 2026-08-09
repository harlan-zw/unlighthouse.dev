/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('serializes the current document query through Nuxt async data', async () => {
  const source = await readFile(new URL('../app/composables/data.ts', import.meta.url), 'utf8')

  assert.match(
    source,
    /useAsyncData\(`docs-current:\$\{route\.path\}`/,
    'document data must use the Nuxt payload so hydration does not repeat browser content queries',
  )
})

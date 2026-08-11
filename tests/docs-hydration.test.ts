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

test('preserves document query errors instead of replacing them with a 500', async () => {
  const source = await readFile(new URL('../app/composables/data.ts', import.meta.url), 'utf8')

  assert.match(source, /const \{ data, error \} = await useAsyncData/)
  assert.match(source, /if \(error\.value\)\s+throw error\.value/)
  assert.doesNotMatch(source, /statusCode: 500, statusMessage: `Failed to load page:/)
})

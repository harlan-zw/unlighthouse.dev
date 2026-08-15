/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('sets an honest expectation for the PageSpeed wait', async () => {
  const source = await readFile(new URL('../layers/tools/app/pages/tools/page-size.vue', import.meta.url), 'utf8')

  assert.match(source, /expected="Usually 10 to 30 seconds\."/)
  assert.match(source, /<ToolLoadingPill[^>]+background/)
  assert.doesNotMatch(source, /:progress="loadingProgress"/)
})

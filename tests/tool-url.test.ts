/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import test from 'node:test'
import { replaceToolQuery } from '../layers/tools/app/utils/tool-url.ts'

test('replaces tool query through the router without pre-encoding values', async () => {
  const locations: unknown[] = []
  const router = {
    currentRoute: {
      value: {
        query: { strategy: 'desktop' },
      },
    },
    replace(location: unknown) {
      locations.push(location)
      return Promise.resolve()
    },
  }

  await replaceToolQuery(router, 'url', 'bulkpartner.net/type/penthouse/')

  assert.deepEqual(locations, [{
    query: {
      strategy: 'desktop',
      url: 'bulkpartner.net/type/penthouse/',
    },
  }])
})

test('removes empty and default tool query values', async () => {
  const locations: unknown[] = []
  const router = {
    currentRoute: {
      value: {
        query: { strategy: 'desktop', url: 'example.com' },
      },
    },
    replace(location: unknown) {
      locations.push(location)
      return Promise.resolve()
    },
  }

  await replaceToolQuery(router, 'url', '')
  router.currentRoute.value.query = { strategy: 'desktop', url: 'example.com' }
  await replaceToolQuery(router, 'strategy', 'mobile', 'mobile')

  assert.deepEqual(locations, [
    { query: { strategy: 'desktop' } },
    { query: { url: 'example.com' } },
  ])
})

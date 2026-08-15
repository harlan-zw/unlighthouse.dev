/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { filterKnownClientNoise } from '../shared/sentry.ts'

test('drops errors injected by Android in-app browser bridges', async () => {
  const source = await readFile(new URL('../sentry.client.config.ts', import.meta.url), 'utf8')

  assert.match(source, /denyUrls:\s*\[\s*\/\^iabjs:/)
})

test('drops only stackless Nuxt app manifest network failures', () => {
  const manifestFailure = {
    exception: {
      values: [{
        type: 'TypeError',
        value: 'Failed to fetch',
        mechanism: {
          type: 'auto.browser.global_handlers.onunhandledrejection',
          handled: false,
        },
      }],
    },
    breadcrumbs: [
      {
        category: 'fetch',
        data: { url: '/_nuxt/builds/meta/build-id.json' },
      },
      {
        category: 'console',
        message: '[NUXT_E5002]',
      },
    ],
  }

  assert.equal(filterKnownClientNoise(manifestFailure), null)

  const applicationFetchFailure = structuredClone(manifestFailure)
  applicationFetchFailure.breadcrumbs = []
  assert.equal(filterKnownClientNoise(applicationFetchFailure), applicationFetchFailure)

  const actionableManifestFailure = {
    ...structuredClone(manifestFailure),
    exception: {
      values: [{
        ...manifestFailure.exception.values[0],
        stacktrace: { frames: [{ filename: '/app/api.ts' }] },
      }],
    },
  }
  assert.equal(filterKnownClientNoise(actionableManifestFailure), actionableManifestFailure)
})

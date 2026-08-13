/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import test from 'node:test'
import { filterKnownClientNoise } from '../shared/sentry.ts'

const manifestFetchFailure = {
  exception: {
    values: [{
      type: 'TypeError',
      value: 'Failed to fetch',
      stacktrace: { frames: [] },
      mechanism: {
        type: 'auto.browser.global_handlers.onunhandledrejection',
        handled: false,
      },
    }],
  },
  breadcrumbs: [
    { category: 'fetch', data: { url: '/_nuxt/builds/meta/build-id.json' } },
    { category: 'console', message: '[NUXT_E5002]' },
  ],
}

test('drops a stackless Nuxt manifest fetch failure', () => {
  assert.equal(filterKnownClientNoise(manifestFetchFailure), null)
})

test('keeps other stackless fetch failures', () => {
  const apiFetchFailure = {
    ...manifestFetchFailure,
    breadcrumbs: [{ category: 'fetch', data: { url: '/api/stats.json' } }],
  }

  assert.equal(filterKnownClientNoise(apiFetchFailure), apiFetchFailure)
})

/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import test from 'node:test'
import { EXPECTED_UPSTREAM_FAILURE, filterExpectedUpstreamFailures, filterKnownClientNoise } from '../shared/sentry.ts'

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

const outageEvent = {
  exception: {
    values: [{
      type: 'Error',
      value: 'PageSpeed Insights did not return a result for this URL. This is a Google outage, not a problem with the page.',
    }],
  },
}

test('drops a response this site raised for a known upstream failure', () => {
  const outage = {
    statusCode: 502,
    message: 'PageSpeed Insights did not return a result for this URL.',
    data: { reason: EXPECTED_UPSTREAM_FAILURE, upstreamStatus: 500 },
  }

  assert.equal(filterExpectedUpstreamFailures(outageEvent, { originalException: outage }), null)
})

test('drops an upstream failure that another error wraps', () => {
  const wrapped = new Error('handler failed', {
    cause: { statusCode: 502, data: { reason: EXPECTED_UPSTREAM_FAILURE, upstreamStatus: null } },
  })

  assert.equal(filterExpectedUpstreamFailures(outageEvent, { originalException: wrapped }), null)
})

test('keeps a server error that is not a known upstream failure', () => {
  const bug = Object.assign(new TypeError('Cannot read properties of undefined'), { statusCode: 500 })

  assert.equal(filterExpectedUpstreamFailures(outageEvent, { originalException: bug }), outageEvent)
})

test('keeps an event with no hint', () => {
  assert.equal(filterExpectedUpstreamFailures(outageEvent), outageEvent)
})

test('survives an error whose cause points back at itself', () => {
  const cyclic: { cause?: unknown } = {}
  cyclic.cause = cyclic

  assert.equal(filterExpectedUpstreamFailures(outageEvent, { originalException: cyclic }), outageEvent)
})

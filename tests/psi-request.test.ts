/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import test from 'node:test'
import { buildPsiRequestUrl, describePsiFailure, psiFailureErrorOptions } from '../shared/psi-request.ts'
import { EXPECTED_UPSTREAM_FAILURE } from '../shared/sentry.ts'

test('keeps the api key out of the request url', () => {
  const url = new URL(buildPsiRequestUrl('https://corporate.walmart.com', 'mobile'))

  assert.equal(url.searchParams.get('key'), null)
  assert.equal(url.searchParams.get('url'), 'https://corporate.walmart.com')
  assert.equal(url.searchParams.get('strategy'), 'mobile')
  assert.equal(url.searchParams.get('category'), 'PERFORMANCE')
})

test('maps an upstream 500 to a gateway failure without the upstream message', () => {
  const upstream = Object.assign(
    new Error('[GET] "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=x&key=AIzaSyLEAKED": 500 Internal Server Error'),
    { response: { status: 500 } },
  )

  const failure = describePsiFailure(upstream)

  assert.equal(failure.statusCode, 502)
  assert.equal(failure.upstreamStatus, 500)
  assert.ok(!failure.message.includes('AIzaSyLEAKED'))
})

test('maps an upstream rejection of the target url to an unprocessable request', () => {
  const failure = describePsiFailure(Object.assign(new Error('bad request'), { statusCode: 400 }))

  assert.equal(failure.statusCode, 422)
  assert.equal(failure.upstreamStatus, 400)
})

test('maps upstream rate limiting to a rate limited response', () => {
  const failure = describePsiFailure(Object.assign(new Error('quota'), { status: 429 }))

  assert.equal(failure.statusCode, 429)
})

test('maps a network failure with no status to a gateway failure', () => {
  const failure = describePsiFailure(new Error('fetch failed'))

  assert.equal(failure.statusCode, 502)
  assert.equal(failure.upstreamStatus, null)
})

test('marks a PageSpeed outage response as an expected upstream failure', () => {
  const options = psiFailureErrorOptions(Object.assign(new Error('fetch failed'), { response: { status: 500 } }))

  assert.equal(options.statusCode, 502)
  assert.equal(options.data.reason, EXPECTED_UPSTREAM_FAILURE)
  assert.equal(options.data.upstreamStatus, 500)
  assert.equal(options.message, options.statusMessage)
})

test('marks a rejected target url as an expected upstream failure too', () => {
  const options = psiFailureErrorOptions(Object.assign(new Error('bad request'), { statusCode: 400 }))

  assert.equal(options.statusCode, 422)
  assert.equal(options.data.reason, EXPECTED_UPSTREAM_FAILURE)
})

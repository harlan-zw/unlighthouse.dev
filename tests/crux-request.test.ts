/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import test from 'node:test'
import { buildCruxRequestUrl, describeCruxFailure } from '../shared/crux-request.ts'

test('keeps the api key out of the crux request url', () => {
  const url = buildCruxRequestUrl('current')

  assert.equal(url, 'https://chromeuxreport.googleapis.com/v1/records:queryRecord')
  assert.ok(!url.includes('key='))
})

test('keeps the api key out of the crux history request url', () => {
  const url = buildCruxRequestUrl('history')

  assert.equal(url, 'https://chromeuxreport.googleapis.com/v1/records:queryHistoryRecord')
  assert.ok(!url.includes('key='))
})

test('maps an upstream 500 to the same status without the upstream message', () => {
  const upstream = Object.assign(
    new Error('[POST] "https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=AIzaSyLEAKED": 500 Internal Server Error'),
    { response: { status: 500 } },
  )

  const failure = describeCruxFailure(upstream)

  assert.equal(failure.statusCode, 500)
  assert.ok(!failure.message.includes('AIzaSyLEAKED'))
})

test('maps upstream rate limiting to a rate limited response', () => {
  const failure = describeCruxFailure(Object.assign(new Error('quota'), { status: 429 }))

  assert.equal(failure.statusCode, 429)
})

test('maps a network failure with no status to a gateway failure', () => {
  const failure = describeCruxFailure(new Error('fetch failed'))

  assert.equal(failure.statusCode, 502)
})

test('maps a missing-data 404 to an unprocessable response when it escapes the no-data check', () => {
  const failure = describeCruxFailure(Object.assign(new Error('no data'), { statusCode: 404 }))

  assert.equal(failure.statusCode, 422)
})

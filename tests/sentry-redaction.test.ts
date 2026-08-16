/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import test from 'node:test'
import { redactSecretsInText, redactSentrySecrets } from '../shared/sentry.ts'

test('redacts credential query parameters from free text', () => {
  const text = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https%3A%2F%2Fexample.com&key=AIzaSyLEAKED123&strategy=mobile'

  assert.equal(
    redactSecretsInText(text),
    'https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https%3A%2F%2Fexample.com&key=[REDACTED]&strategy=mobile',
  )
})

test('leaves text without credentials untouched', () => {
  assert.equal(redactSecretsInText('monkey=banana'), 'monkey=banana')
})

test('redacts credentials from every place an event carries a message', () => {
  const event = redactSentrySecrets({
    message: 'failed with key=AIzaSyLEAKED123',
    exception: {
      values: [{ value: '[GET] "https://api.example.com/run?api_key=SECRET1": 500 Internal Server Error' }],
    },
    breadcrumbs: [
      { message: 'called ?access_token=SECRET2', data: { url: 'https://api.example.com/run?key=SECRET3' } },
    ],
    request: { url: 'https://unlighthouse.dev/api/tools/x?token=SECRET4' },
  })

  const serialised = JSON.stringify(event)

  assert.ok(!/SECRET\d/.test(serialised), serialised)
  assert.ok(!serialised.includes('AIzaSyLEAKED123'), serialised)
  assert.equal(event?.exception.values[0].value, '[GET] "https://api.example.com/run?api_key=[REDACTED]": 500 Internal Server Error')
})

test('passes a dropped event through unchanged', () => {
  assert.equal(redactSentrySecrets(null), null)
})

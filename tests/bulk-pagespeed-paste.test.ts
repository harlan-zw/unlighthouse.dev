/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import test from 'node:test'
import { readClipboardText } from '../layers/tools/app/utils/tool-clipboard.ts'

const unhandledRejections: unknown[] = []
process.on('unhandledRejection', (reason) => {
  unhandledRejections.push(reason)
})

function mockClipboardReadText(readText: () => Promise<string>) {
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    value: { readText },
    configurable: true,
  })
}

function flushUnhandledRejections() {
  return new Promise(resolve => setImmediate(resolve))
}

test('clipboard permission denial returns a friendly fallback without an unhandled rejection', async () => {
  mockClipboardReadText(() => Promise.reject(new DOMException('Read permission denied.', 'NotAllowedError')))

  const pending = readClipboardText()
  await flushUnhandledRejections()
  assert.deepEqual(unhandledRejections, [], 'clipboard denial must not raise an unhandled rejection')

  const outcome = await pending
  if (outcome._tag === 'Ok')
    assert.fail(`expected a denial fallback, got ${outcome.text}`)
  assert.match(outcome.message, /denied/)
  assert.match(outcome.message, /Ctrl\+V/)
})

test('successful clipboard read returns the pasted text', async () => {
  mockClipboardReadText(() => Promise.resolve('https://example.com\nhttps://example.com/about'))

  const outcome = await readClipboardText()
  if (outcome._tag === 'Err')
    assert.fail(`expected the pasted text, got ${outcome.message}`)
  assert.equal(outcome.text, 'https://example.com\nhttps://example.com/about')
  assert.deepEqual(unhandledRejections, [])
})
